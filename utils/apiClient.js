const PROXY_URL = '/api/proxy' // Ruta relativa funciona en dev y prod

export async function makeRequest(method, url, credentials, body = null) {
  console.log(`[CLIENT] Making ${method.toUpperCase()} request to ${url}`, { body })

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ method: method.toUpperCase(), url, credentials, body })
    })

    const responseData = await response.json()

    return {
      status: responseData.status || response.status,
      statusText: responseData.statusText || response.statusText,
      headers: responseData.headers || {},
      data: responseData.data,
      error: responseData.error || response.status >= 400
    }
  } catch (error) {
    return {
      status: 500,
      statusText: 'Error',
      headers: {},
      data: { message: error.message },
      error: true
    }
  }
}
