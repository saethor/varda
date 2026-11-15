/** A path within Varða, safe to send a person to after signing in. Only `safeRedirect` makes one. */
export type SafePath = string & { readonly __brand: 'SafePath' };

const home = '/' as SafePath;

/**
 * Where to go after signing in. Only a path within Varða is kept (starting with `/`,
 * but not `//` or `/\`, which browsers read as another site); anything else, or no
 * redirect at all, goes home, so a link can't send a person to a look-alike site.
 */
export function safeRedirect(redirect: string | undefined): SafePath {
  if (!redirect?.startsWith('/')) return home;
  if (redirect.startsWith('//') || redirect.startsWith('/\\')) return home;
  return redirect as SafePath;
}
