# Circle.so Admin API Client

Cliente visual para interactuar con la API Admin V2 de Circle.so. Permite explorar y ejecutar todas las operaciones definidas en la especificación OpenAPI.

## Características

- 🔐 **Gestión de credenciales**: Configuración segura de token y host
- ✅ **Test de conexión**: Verifica las credenciales antes de usar
- 🔍 **Explorador de API**: Navegación por todos los endpoints organizados por tags
- 🚀 **Ejecución de requests**: Interfaz intuitiva para ejecutar cualquier operación
- 📊 **Feedback visual**: Respuestas formateadas con código de estado y datos
- 🎨 **Diseño minimalista**: Interfaz limpia y moderna

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

1. **Configurar credenciales**:
   - Ingresa tu token de autenticación de Circle.so
   - Ingresa la URL base de tu instancia (ej: `https://your-circle-instance.com`)

2. **Probar conexión**:
   - Haz clic en "Probar Conexión" para verificar que las credenciales funcionan

3. **Explorar endpoints**:
   - Navega por los endpoints organizados por tags
   - Usa la búsqueda para encontrar endpoints específicos

4. **Ejecutar requests**:
   - Expande cualquier endpoint haciendo clic en él
   - Completa los parámetros requeridos
   - Haz clic en "Ejecutar Request" para enviar la petición
   - Visualiza la respuesta con código de estado y datos

## Build para producción

```bash
npm run build
npm start
```

Los archivos compilados estarán en la carpeta `.next/`

## Tecnologías

- Next.js 15
- React 18
- Tailwind CSS
- js-yaml

