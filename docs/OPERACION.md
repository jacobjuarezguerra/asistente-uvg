# Operación institucional

## Instalación local

Seguir el README. El servidor usa `127.0.0.1:8765` por defecto. Para cambiar el puerto, modificar `PORT` en `.env` y reiniciar. Si aparece un conflicto de puerto, detener la instalación anterior o elegir otro.

El servidor se detiene con `Ctrl+C`. Para atención continua, la universidad debe instalarlo como servicio mediante las herramientas de su infraestructura y designar quién lo reinicia, supervisa y actualiza.

## Instalación accesible en red

Antes de escuchar en todas las interfaces, configurar:

```dotenv
HOST=0.0.0.0
PORT=8765
PUBLIC_ORIGIN=https://chat.DOMA-INSTITUCIONAL.edu.gt
APP_ACCESS_TOKEN=CODIGO-LARGO-ALEATORIO-DE-AL-MENOS-24-CARACTERES
```

El valor de dominio es una plantilla: reemplazarlo por el real, sin barra final. Generar un código aleatorio, por ejemplo con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Esta orden genera un código de acceso al servicio; no una clave del proveedor. No subir ninguno a GitHub.

Colocar el servicio detrás del proxy institucional con **HTTPS** y las restricciones de red correspondientes. La configuración `PUBLIC_ORIGIN` debe coincidir con la URL que utiliza el navegador. La aplicación acepta ese origen y las direcciones locales; no habilita CORS universal.

La barrera incluida es un código compartido, que el visitante introduce en Preferencias y que se conserva en la pestaña. No hay usuarios, roles, recuperación de cuenta, SSO ni auditoría de identidad. Para público amplio o uso con datos sensibles, la institución debe implementar y validar su esquema de identidad antes de publicar.

El límite por minuto utiliza la IP de la conexión, no cabeceras reenviadas. Detrás de un proxy varias personas pueden compartir ese límite. El administrador debe ajustar o complementar los controles en su proxy; no debe confiar ciegamente en `X-Forwarded-For` enviado por el cliente.

## Docker (opcional)

Crear la imagen:

```bash
docker build -t asistente-uvg:2.0.0 .
```

Para una prueba accesible solo desde el mismo equipo, completar `.env` con `HOST=0.0.0.0`, `PUBLIC_ORIGIN=http://127.0.0.1:8765` y un `APP_ACCESS_TOKEN` aleatorio. Después:

```bash
docker run --rm --name asistente-uvg --env-file .env -p 127.0.0.1:8765:8765 asistente-uvg:2.0.0
```

El archivo `.env` no se copia a la imagen. En producción, usar el gestor de secretos y la política de reinicio de la plataforma institucional. No exponer directamente el puerto del contenedor a Internet.

## Supervisión y solución de problemas

`GET /api/health` informa si el proceso está activo y si hay una configuración básica de API. No revela la clave y no comprueba saldo, permisos ni conectividad con el proveedor.

| Síntoma | Revisar |
| --- | --- |
| Servicio pendiente de configuración | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` y reinicio. |
| Código de acceso incorrecto | Código institucional en Preferencias; no pegar la clave de la API allí. |
| Modelo no autorizado | Lista `AI_ALLOWED_MODELS` del servidor. |
| Proveedor rechazó la solicitud | Clave, saldo, permisos, identificador y formato de parámetros en el panel del proveedor. |
| Respuesta vacía | Modelo elegido, límite de tokens y parámetros específicos. |
| Error de contexto | Sintetizar la base, usar modelo con contexto suficiente o iniciar conversación nueva. |
| Archivo HTML sin conexión | Ejecutar el servidor y usar su URL HTTP, no abrir el archivo directamente. |
| Cambio de contenido no visible | Regenerar base, subir ambos archivos, actualizar instalación y reiniciar. |

No copiar claves ni conversaciones privadas en issues o logs de diagnóstico. Esta versión no registra contenido de mensajes; revisar también lo que registren el proxy y el proveedor.

## Actualización, respaldo y recuperación

1. Guardar el código en el repositorio y proteger los secretos mediante el mecanismo institucional.
2. Probar cambios en un entorno de prueba, ejecutar `npm run check` y revisar las diferencias.
3. Registrar el SHA o etiqueta desplegado y conservar la versión anterior para volver a ella.
4. Actualizar la instalación y reiniciar; comprobar interfaz, salud y una pregunta autorizada.
5. Ante un fallo, restaurar la versión anterior y su configuración compatible.

No hay una base de datos de conversaciones que respaldar. El contenido institucional está versionado en Git. Las claves deben rotarse según la política de la institución; cambiarlas en `.env` o en su gestor de secretos y reiniciar el proceso.

La CI de GitHub verifica el código, pero no despliega el servicio ni prueba una API pagada. El administrador debe supervisar el estado y los costos del proveedor.
