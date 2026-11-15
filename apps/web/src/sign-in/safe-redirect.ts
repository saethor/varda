/**
 * Where to go after signing in. Only a path within Varða is kept (starting with `/`,
 * but not `//` or `/\`, which browsers read as another site); anything else goes home,
 * so a link can't send a person to a look-alike site.
 */
export function safeRedirect(redirect: string | undefined): string {
  if (!redirect?.startsWith('/')) return '/';
  if (redirect.startsWith('//') || redirect.startsWith('/\\')) return '/';
  return redirect;
}
