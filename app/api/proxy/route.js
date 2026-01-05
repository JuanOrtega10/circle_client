import { NextResponse } from 'next/server'

// Debug logs (opcional, para desarrollo)
let recentLogs = []
const addLog = (message) => {
  recentLogs.push({ timestamp: new Date().toISOString(), message })
  if (recentLogs.length > 50) recentLogs.shift()
  console.log(message)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { method, url, credentials, body: requestBody } = body

    if (!url || !credentials?.token || !credentials?.host) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          status: 400,
          data: { message: 'Missing required parameters: url, credentials.token, credentials.host' }
        },
        { status: 400 }
      )
    }

    // Get the actual HTTP method from the request body
    const actualMethod = (method || 'GET').toUpperCase()
    let bodyData = requestBody || null

    // Handle null/undefined body
    if (bodyData === null || bodyData === undefined) {
      bodyData = null
    }

    const logMsg1 = `[PROXY] Received request body: ${JSON.stringify(body, null, 2)}`
    addLog(logMsg1)

    const logMsg2 = `[PROXY] Parsed - Method: ${actualMethod}, URL: ${url}, Body: ${JSON.stringify(bodyData)}`
    addLog(logMsg2)

    const headers = {
      'Authorization': `Token ${credentials.token}`,
      'host': credentials.host
    }

    // Only add Content-Type for methods that typically have a body
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(actualMethod) && bodyData !== null &&
      ((typeof bodyData === 'object' && Object.keys(bodyData).length > 0) || typeof bodyData !== 'object')

    if (hasBody) {
      headers['Content-Type'] = 'application/json'
    }

    const options = {
      method: actualMethod,
      headers
    }

    // Add body for methods that support it and when body is not null/empty
    if (hasBody) {
      options.body = JSON.stringify(bodyData)
    }

    const logMsg3 = `[PROXY] Forwarding ${options.method} request to ${url}, hasBody: ${!!options.body}, headers: ${Object.keys(options.headers).join(', ')}`
    addLog(logMsg3)

    const response = await fetch(url, options)

    const data = await response.text()
    let jsonData
    try {
      jsonData = JSON.parse(data)
    } catch {
      jsonData = data
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries()),
      error: response.status >= 400
    }, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        status: 500,
        data: { message: error.message }
      },
      { status: 500 }
    )
  }
}

