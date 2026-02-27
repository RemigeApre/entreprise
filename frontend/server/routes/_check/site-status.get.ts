export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({ statusCode: 400, message: 'Missing url parameter' })
  }

  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; LeGeai-Monitor/1.0)',
    'Accept': '*/*'
  }

  // Try HEAD first, then GET fallback
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const start = Date.now()

      const response = await fetch(parsedUrl.href, {
        method,
        headers,
        signal: controller.signal,
        redirect: 'follow'
      })

      clearTimeout(timeout)
      const responseTime = Date.now() - start

      return {
        up: response.ok,
        statusCode: response.status,
        responseTime
      }
    } catch (err: any) {
      if (method === 'GET' || err.name === 'AbortError') {
        return {
          up: false,
          statusCode: 0,
          responseTime: 0,
          error: err.name === 'AbortError' ? 'timeout' : 'network'
        }
      }
      // HEAD failed with non-abort error, try GET
    }
  }

  return { up: false, statusCode: 0, responseTime: 0, error: 'network' }
})
