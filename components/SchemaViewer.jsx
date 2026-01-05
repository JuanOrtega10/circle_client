import { useState } from 'react'

function SchemaViewer({ schema, title = 'Schema' }) {
  const [expanded, setExpanded] = useState(false)

  if (!schema) {
    return null
  }

  const renderSchema = (schemaObj, level = 0, requiredFields = []) => {
    if (!schemaObj) return null

    const indent = level * 20
    const isRequired = (fieldName) => requiredFields.includes(fieldName)

    if (schemaObj.type === 'object' && schemaObj.properties) {
      return (
        <div className="space-y-1" style={{ marginLeft: `${indent}px` }}>
          <span className="text-gray-600">{'{'}</span>
          {Object.entries(schemaObj.properties).map(([key, value]) => (
            <div key={key} className="ml-4">
              <div className="flex items-start gap-2">
                <span className={`font-mono text-sm ${isRequired(key) ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                  "{key}"
                  {isRequired(key) && <span className="text-red-500 ml-1">*</span>}
                </span>
                <span className="text-gray-500 text-xs">:</span>
                <span className="text-blue-600 text-xs font-mono">
                  {value.type || 'object'}
                  {value.type === 'array' && value.items && (
                    <span className="text-gray-500">
                      {'['}{value.items.type || 'any'}{']'}
                    </span>
                  )}
                </span>
                {value.description && (
                  <span className="text-gray-500 text-xs italic ml-2">
                    // {value.description}
                  </span>
                )}
              </div>
              {value.type === 'object' && value.properties && (
                <div className="mt-1">
                  {renderSchema(value, level + 1, value.required || [])}
                </div>
              )}
              {value.type === 'array' && value.items && value.items.type === 'object' && value.items.properties && (
                <div className="mt-1">
                  {renderSchema(value.items, level + 1, value.items.required || [])}
                </div>
              )}
              {value.enum && (
                <div className="ml-4 text-xs text-purple-600">
                  enum: [{value.enum.map(e => `"${e}"`).join(', ')}]
                </div>
              )}
            </div>
          ))}
          <span className="text-gray-600">{'}'}</span>
        </div>
      )
    }

    if (schemaObj.type === 'array' && schemaObj.items) {
      return (
        <div style={{ marginLeft: `${indent}px` }}>
          <span className="text-gray-600">[</span>
          <div className="ml-4">
            {renderSchema(schemaObj.items, level + 1, schemaObj.items.required || [])}
          </div>
          <span className="text-gray-600">]</span>
        </div>
      )
    }

    return (
      <span className="text-blue-600 text-xs font-mono ml-2">
        {schemaObj.type || 'any'}
        {schemaObj.format && <span className="text-gray-500"> ({schemaObj.format})</span>}
      </span>
    )
  }

  const getSchemaDisplay = () => {
    if (schema.type === 'object' && schema.properties) {
      return renderSchema(schema, 0, schema.required || [])
    }
    return (
      <div className="text-sm font-mono text-gray-800">
        {schema.type || 'any'}
        {schema.format && <span className="text-gray-500"> ({schema.format})</span>}
      </div>
    )
  }

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'transform rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">{title}</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-auto max-h-96">
          <div className="text-xs font-mono">
            {getSchemaDisplay()}
          </div>
          {schema.required && schema.required.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Campos requeridos:</span>{' '}
                {schema.required.map((field, idx) => (
                  <span key={field}>
                    <span className="text-red-600 font-semibold">{field}</span>
                    {idx < schema.required.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SchemaViewer

