const REDIRECT_PARAMETER = 'redirect'

export const redirectedPath = (url: URL, baseUrl: string) => {
  const path = url.searchParams.get(REDIRECT_PARAMETER)
  if (!path) return undefined

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  if (!path.startsWith(normalizedBase) || path.startsWith('//')) return undefined

  return path
}

export const restoreRedirectedPath = () => {
  const path = redirectedPath(new URL(window.location.href), import.meta.env.BASE_URL)
  if (path) window.history.replaceState(null, '', path)
}
