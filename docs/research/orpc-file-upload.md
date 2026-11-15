# How oRPC takes a file upload and caps its size

Research for [#38](https://github.com/saethor/varda/issues/38), part of map [#35](https://github.com/saethor/varda/issues/35) (Place a stone from a watch file).

**Versions checked:** `@orpc/*` 1.16.2, `hono` 4.13.18, `@hono/node-server` 2.1.8, `zod` 4.6.6 (from `apps/api`, `apps/web` package.json). The API serves oRPC through `RPCHandler` from `@orpc/server/fetch` mounted on `/rpc/*` in Hono (`apps/api/src/app.ts`). The web app calls it with `RPCLink` and `createTanstackQueryUtils` (`apps/web/src/lib/orpc.ts`).

**Sources:** the installed package source under `node_modules/.pnpm` (cited by file below), the oRPC docs at orpc.dev, the Hono docs, and an end-to-end experiment. The experiment was a throwaway script, not committed. It ran a real `@hono/node-server` with our `RPCHandler`, a contract with typed errors, and an `RPCLink` client, all on the versions above.

> **Version drift warning.** orpc.dev now documents a newer oRPC than 1.16.2. It describes a `RequestLimitHandlerPlugin`, a "Tmp File Upload Plugin" and error-factory classes (`instanceof RateLimitedError`). **None of these exist in 1.16.2.** 1.16.2 has `BodyLimitPlugin` instead (exported from `@orpc/server/fetch`). Its server plugins are only Batch, CORS, RequestHeaders, ResponseHeaders, SimpleCsrfProtection and StrictGetMethod. Trust the installed source over the live docs until we upgrade.

## Short answer

1. **Accepting a file:** put a `File` in the procedure input, e.g. `oc.input(z.object({ file: z.file() }))`, and call `client.record.stones.place({ file })` or `useMutation(orpc.record.stones.place.mutationOptions())`. Nothing else is needed. `RPCLink` sees the `Blob` and sends the request as `multipart/form-data`. The server rebuilds a real `File` (name, type, size kept) before validation.
2. **Capping at 25 MB before the body is read:** put Hono's `bodyLimit` middleware in front of the oRPC mount. It rejects on `Content-Length` without reading the body. Browsers and undici send `Content-Length` for `FormData` bodies. Without that header, it stops reading as soon as the limit is passed. oRPC itself buffers the whole multipart body (`request.formData()`) before your handler runs, so the cap has to sit in front of it. Give the body limit a little headroom for multipart overhead, and check the exact 25 MB against `file.size` in the handler.
3. **Typed errors:** declare `FILE_TOO_LARGE` and `NOT_A_FIT_FILE` (etc.) with `.errors()` on the contract. Throw them with `errors.X()` in the handler. Make `bodyLimit`'s `onError` return the same error in oRPC's wire format. The client then gets `isDefinedError(error) === true` with a typed `code` and `data` in every case. If you skip that, an over-limit body comes back as an untyped `PAYLOAD_TOO_LARGE`, and a zod `.max()` failure comes back as an untyped `BAD_REQUEST`.

## 1. How a `File` travels from the TanStack Query client to the procedure

### Built-in support

The oRPC docs say that "File, Blob, and `ReadableStream<Uint8Array>` are supported by the RPC Serializer and OpenAPI Serializer", and that "`File` and `Blob` are buffered in memory by default" ([orpc.dev/docs/file-upload-download](https://orpc.dev/docs/file-upload-download)). Their example uses `.input(z.file())`.

### Wire encoding (RPC protocol, what we use)

Client side (`@orpc/client/dist/shared/client.BmCiDGqJ.mjs`):

- `StandardRPCJsonSerializer.serialize` walks the input. Each `Blob`/`File` it finds is pulled out into a `blobs` list, and its path goes into `maps`.
- `StandardRPCSerializer.#serialize`: if there are no blobs, the body is plain JSON `{ json, meta }`. If there are any, it builds a `FormData` with field `data` = `JSON.stringify({ json, meta, maps })`, and fields `"0"`, `"1"`, … holding the blobs.
- `StandardRPCLinkCodec.encode` never sends `FormData` as GET, so an upload is always a POST.

Server side:

- `toStandardBody` (`@orpc/standard-server-fetch/dist/index.mjs`) branches on `content-type`. For `multipart/form-data` it calls `await re.formData()`, which reads **the whole body into memory**.
- `StandardRPCSerializer.#deserialize` then puts each blob back at its path, so the handler gets `input.file` as a `File`.

The experiment confirmed it: the client sent `content-type: multipart/form-data; boundary=…` and the server saw `content-length` set. The handler got `{ name: "a.fit", size: 100, type: "application/octet-stream" }` back intact. `input.file.slice(8, 12).arrayBuffer()` worked for reading the FIT header.

### TanStack Query

The client is just the oRPC client wrapped in `createTanstackQueryUtils`, so a mutation is:

```ts
const place = useMutation(orpc.record.stones.place.mutationOptions());
place.mutate({ file }); // file: File from <input type="file">
```

The serializer handles the `File`, so no special options are needed.

### OpenAPI handler (for comparison only)

We use `RPCHandler`, and nothing here needs `OpenAPIHandler`. The same `toStandardBody` also accepts a raw body with `content-disposition` (it turns into a single `File`) or other content types (`re.blob()`). Those matter only if we ever expose a REST/OpenAPI endpoint for uploads. The buffering is the same either way.

## 2. Enforcing 25 MB before the whole body is read

oRPC buffers the full multipart body before input validation, so a zod `.max(25 MB)` alone runs **after** the server has already read the whole upload. It only rejects the request. It doesn't protect memory.

### Option A: Hono `bodyLimit` (recommended)

Source: `hono/dist/middleware/body-limit/index.js`. Docs: [hono.dev/docs/middleware/builtin/body-limit](https://hono.dev/docs/middleware/builtin/body-limit).

- If `Content-Length` is present (and there's no `Transfer-Encoding`), it compares and calls `onError` **without reading the body**.
- Otherwise it reads the stream, buffering at most `maxSize` bytes, and calls `onError` as soon as the size goes over `maxSize`. Under the limit, it rebuilds `c.req.raw` from the buffer.
- By default `onError` throws `HTTPException(413)` with a plain-text "Payload Too Large" body. You can pass your own `onError(c)` that returns a `Response`.
- Bun note from the docs: Bun's own 128 MiB default cap kicks in before Hono. That doesn't affect us on Node with a 25 MB limit.

You can scope it to the one procedure, so other RPC calls keep a small default. RPC paths are `/rpc/<path joined by />`, e.g. `/rpc/record/stones/place`:

```ts
app.use('/rpc/record/stones/place', bodyLimit({ maxSize: MAX_FIT_BYTES + 64 * 1024, onError: fileTooLarge }));
```

### Option B: oRPC `BodyLimitPlugin` (1.16.2)

Source: `@orpc/server/dist/adapters/fetch/index.mjs`.

```ts
new RPCHandler(router, { plugins: [new BodyLimitPlugin({ maxBodySize })] });
```

It checks `content-length` first, then counts streamed bytes and errors the stream with `new ORPCError('PAYLOAD_TOO_LARGE')`. The experiment showed the client gets `code: 'PAYLOAD_TOO_LARGE', status: 413, defined: false`. It works, but the error is not a contract-defined error, and the limit applies to every procedure on that handler.

### Headroom and the exact check

The multipart body is slightly bigger than the file: the boundaries, part headers and the small `data` JSON field. So set the body limit to the file limit plus a small allowance (say 64 KiB). Then check `input.file.size > MAX_FIT_BYTES` in the handler (or in the schema, see below) for the exact rule. Also decide whether "25 MB" means `25 * 1000 * 1000` or `25 * 1024 * 1024`, and use one constant everywhere. The web app can check `file.size` before uploading for instant feedback. The server stays the authority.

## 3. Too-large or wrong files as typed contract errors

### Defining and throwing

Errors are declared on the contract with `.errors()`, as `signedInProcedure` already does in `packages/shared/src/contract.ts`. They're thrown in the handler through the `errors` argument (`throw errors.NOT_A_FIT_FILE()`). Each entry can have a `status`, a `message` and a `data` schema ([orpc.dev/docs/error-handling](https://orpc.dev/docs/error-handling)). The docs warn that `message` and `data` are sent to the client.

```ts
const placeStone = signedInProcedure
  .errors({
    FILE_TOO_LARGE: { status: 413, data: z.object({ maxBytes: z.number() }) },
    NOT_A_FIT_FILE: { status: 422 },
    // NOT_A_SESSION, BROKEN_FILE, ALREADY_PLACED (with data: { stoneId }) ... per map #35
  })
  .input(z.object({ file: z.file() }))
  .output(StoneSchema);
```

### Checking on the client

`isDefinedError(error)` and `safe(...)` are exported from `@orpc/client` 1.16.2 (`dist/index.d.ts`). See also [orpc.dev/docs/client/error-handling](https://orpc.dev/docs/client/error-handling). `isDefinedError` narrows the error to the contract's error union, so `error.code` and `error.data` are typed. `useMutation`'s `error` works the same way.

### What each failure looks like (experiment, 1.16.2)

| Failure | How it's caught | What the client gets |
| --- | --- | --- |
| Not a FIT file (handler checks the header bytes) | `throw errors.NOT_A_FIT_FILE()` | `NOT_A_FIT_FILE`, 422, **defined** |
| File over the limit, schema `z.file().max(n)` | oRPC input validation | `BAD_REQUEST`, 400, *not defined*, `data.issues[0].code === 'too_big'` |
| Body over the limit, `BodyLimitPlugin` | oRPC adapter interceptor | `PAYLOAD_TOO_LARGE`, 413, *not defined* |
| Body over the limit, Hono `bodyLimit` default | Hono middleware, plain-text 413 | `PAYLOAD_TOO_LARGE`, 413, *not defined*. The client maps the status via `getMalformedResponseErrorCode`. `data` holds the raw response. |
| Body over the limit, Hono `bodyLimit` with oRPC-shaped `onError` | Hono middleware | `FILE_TOO_LARGE`, 413, **defined**, `data: { maxBytes }` |

### Making every failure a defined error

- **Size over the body limit:** return the contract error in RPC wire format from `bodyLimit`'s `onError`. The RPC client accepts any non-2xx JSON body `{ json: { defined, code, status, message, data } }` as an `ORPCError` (`isORPCErrorJson` / `createORPCErrorFromJson` in `@orpc/client`). `ORPCError#toJSON()` produces exactly that inner object, so you don't have to write the shape by hand:

  ```ts
  const fileTooLarge = (c: Context) =>
    c.json({ json: new ORPCError('FILE_TOO_LARGE', { defined: true, status: 413, data: { maxBytes: MAX_FIT_BYTES } }).toJSON() }, 413);
  ```

  The downside: this ties a Hono middleware to the RPC wire format. Keep it in one small helper beside the router, and cover it with one API test that asserts `isDefinedError` on the client.
- **Size within the body limit but over 25 MB:** prefer checking `input.file.size` in the handler and throwing `errors.FILE_TOO_LARGE(...)` over using zod `.max()`. A zod failure becomes an undefined `BAD_REQUEST`. To convert one, you'd need a client interceptor or a middleware placed before `.input`. Plain interceptors can't produce defined errors. The docs say so explicitly ([orpc.dev/docs/advanced/validation-errors](https://orpc.dev/docs/advanced/validation-errors)).
- **Wrong file:** don't trust `file.type`. Browsers usually send `application/octet-stream` or an empty type for `.fit`. Check the FIT header (bytes 8–11 are `.FIT`) or let the FIT parser fail, and map the result to `NOT_A_FIT_FILE` / `BROKEN_FILE` in the handler. Which parser to use is a separate ticket.

## Open points for the spec

- Use MB or MiB for "25 MB", and put the constant in one shared place (the contract package is the natural home, so web and API agree).
- Scope `bodyLimit` to the upload path only. Possibly add a small default limit on the rest of `/rpc/*` as hardening, but that's out of scope for #35.
- Memory: up to about 25 MB per in-flight upload is held in memory (twice briefly if Hono re-buffers a chunked body). That's acceptable for one file per request. Streaming to disk would need the newer oRPC plugin or a non-oRPC Hono route.
