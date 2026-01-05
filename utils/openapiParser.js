import yaml from 'js-yaml'

// Simple resolver for $ref references (basic implementation)
function resolveRefs(obj, root = obj, visited = new Set()) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, root, visited))
  }
  
  if (obj.$ref && typeof obj.$ref === 'string') {
    const refPath = obj.$ref.replace('#/', '').split('/')
    let refValue = root
    for (const key of refPath) {
      refValue = refValue?.[key]
    }
    if (refValue && !visited.has(obj.$ref)) {
      visited.add(obj.$ref)
      return resolveRefs(refValue, root, visited)
    }
    return refValue || obj
  }
  
  const resolved = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key !== '$ref') {
      resolved[key] = resolveRefs(value, root, visited)
    }
  }
  return resolved
}

export async function parseOpenAPISpec(specPath) {
  try {
    // Fetch the spec file first, then parse it
    const response = await fetch(specPath)
    const specText = await response.text()
    const specObject = yaml.load(specText)
    
    // Resolve $ref references
    const api = resolveRefs(specObject)
    
    // Organize endpoints by tags
    const endpointsByTag = {}
    const allEndpoints = []
    
    if (api.paths) {
      Object.entries(api.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, operation]) => {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            // Resolver parámetros con sus schemas
            const resolvedParameters = (operation.parameters || []).map(param => {
              let resolvedParam = { ...param }
              if (param.schema) {
                if (param.schema.$ref) {
                  resolvedParam.schema = resolveRefs(param.schema, api)
                } else {
                  // Resolver cualquier $ref dentro del schema
                  resolvedParam.schema = resolveRefs(param.schema, api)
                }
              }
              return resolvedParam
            })
            
            // Resolver requestBody completamente (incluyendo $ref y schemas anidados)
            let resolvedRequestBody = operation.requestBody
            if (resolvedRequestBody?.content?.['application/json']?.schema) {
              resolvedRequestBody = {
                ...resolvedRequestBody,
                content: {
                  ...resolvedRequestBody.content,
                  'application/json': {
                    ...resolvedRequestBody.content['application/json'],
                    schema: resolveRefs(resolvedRequestBody.content['application/json'].schema, api)
                  }
                }
              }
            }
            
            // Resolver responses schemas (incluyendo $ref)
            const resolvedResponses = {}
            if (operation.responses) {
              Object.entries(operation.responses).forEach(([statusCode, response]) => {
                resolvedResponses[statusCode] = { ...response }
                if (response.content?.['application/json']?.schema) {
                  resolvedResponses[statusCode] = {
                    ...response,
                    content: {
                      ...response.content,
                      'application/json': {
                        ...response.content['application/json'],
                        schema: resolveRefs(response.content['application/json'].schema, api)
                      }
                    }
                  }
                }
              })
            }
            
            const endpoint = {
              path,
              method: method.toUpperCase(),
              summary: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
              description: operation.description || '',
              tags: operation.tags || ['Other'],
              parameters: resolvedParameters,
              requestBody: resolvedRequestBody,
              responses: resolvedResponses,
              security: operation.security || api.security || [],
              operationId: operation.operationId,
            }
            
            allEndpoints.push(endpoint)
            
            endpoint.tags.forEach(tag => {
              if (!endpointsByTag[tag]) {
                endpointsByTag[tag] = []
              }
              endpointsByTag[tag].push(endpoint)
            })
          }
        })
      })
    }
    
    return {
      info: api.info,
      servers: api.servers || [],
      securitySchemes: api.components?.securitySchemes || {},
      endpointsByTag,
      allEndpoints,
    }
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI spec: ${error.message}`)
  }
}

export function buildRequestUrl(baseUrl, path, pathParams, queryParams) {
  let url = baseUrl + path
  
  // Replace path parameters
  Object.entries(pathParams || {}).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, encodeURIComponent(value))
  })
  
  // Add query parameters
  const queryString = Object.entries(queryParams || {})
    .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  
  if (queryString) {
    url += '?' + queryString
  }
  
  return url
}

