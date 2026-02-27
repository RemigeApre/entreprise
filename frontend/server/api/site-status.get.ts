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

  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(parsedUrl.href, {
      method: 'HEAD',
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
    const responseTime = Date.now() - start

    // HEAD might not be supported, try GET
    if (err.name !== 'AbortError') {
      try {
        const controller2 = new AbortController()
        const timeout2 = setTimeout(() => controller2.abort(), 10000)
        const start2 = Date.now()

        const response = await fetch(parsedUrl.href, {
          method: 'GET',
          signal: controller2.signal,
          redirect: 'follow'
        })

        clearTimeout(timeout2)
        const responseTime2 = Date.now() - start2

        return {
          up: response.ok,
          statusCode: response.status,
          responseTime: responseTime2
        }
      } catch {
        // Fall through to return down
      }
    }

    return {
      up: false,
      statusCode: 0,
      responseTime
    }
  }
})
