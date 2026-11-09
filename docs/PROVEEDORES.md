# Configurar el proveedor de IA

La universidad debe obtener de su proveedor: formato de API, URL base, credencial, modelo habilitado, condiciones de uso y presupuesto. La aplicación no obtiene ni paga estos servicios.

La configuración se hace en `.env` o en las variables del servicio de alojamiento. No subir `.env` a GitHub. No poner claves en HTML, JavaScript del navegador ni capturas de pantalla.

## API compatible con Chat Completions

```dotenv
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://SERVIDOR/v1
AI_API_KEY=CLAVE-INSTITUCIONAL
AI_MODEL=MODELO-HABILITADO
AI_AUTH_HEADER=Authorization
AI_TOKEN_PARAMETER=max_tokens
AI_SEND_TEMPERATURE=true
```

El adaptador envía `POST {AI_BASE_URL}/chat/completions`, autentica mediante `Authorization: Bearer ...` y espera texto en `choices[0].message.content`. Incluye el contexto de la universidad como mensaje de sistema.

Ejemplos de URL base (confirmar siempre con el proveedor):

| Servicio | URL base | Particularidad |
| --- | --- | --- |
| NVIDIA NIM alojado | `https://integrate.api.nvidia.com/v1` | Elegir un modelo que la cuenta tenga habilitado; no se incorpora la clave personal del prototipo. |
| OpenRouter | `https://openrouter.ai/api/v1` | Usar el identificador exacto del modelo. |
| API de OpenAI compatible con Chat Completions | `https://api.openai.com/v1` | Algunos modelos necesitan `max_completion_tokens` y no admiten temperatura. |
| Azure OpenAI con API v1 | `https://RECURSO.openai.azure.com/openai/v1` | `AI_AUTH_HEADER=api-key`; modelo = nombre de deployment. Verificar que el recurso ofrezca esta API. |

No agregar `/chat/completions` a la base. No se admiten bases HTTP, credenciales embebidas, query strings ni redirecciones.

### Modelos con parámetros diferentes

```dotenv
AI_TOKEN_PARAMETER=max_completion_tokens
AI_SEND_TEMPERATURE=false
```

Para opciones específicas no cubiertas por los campos anteriores, el administrador puede añadir un objeto JSON de una línea:

```dotenv
AI_EXTRA_BODY_JSON='{"chat_template_kwargs":{"enable_thinking":false}}'
```

El ejemplo solo se debe usar si el modelo admite ese campo. El objeto no puede sobrescribir `model`, `messages`, `system`, `stream`, `temperature` ni los límites de tokens.

## Anthropic Messages

```dotenv
AI_PROVIDER=anthropic
AI_BASE_URL=https://api.anthropic.com/v1
AI_API_KEY=CLAVE-INSTITUCIONAL
AI_MODEL=IDENTIFICADOR-ACTUAL-DEL-MODELO
AI_AUTH_HEADER=x-api-key
AI_API_VERSION=2023-06-01
AI_SEND_TEMPERATURE=true
```

Este adaptador envía `POST /messages`, usa el campo superior `system` y concatena los bloques de respuesta de tipo `text`. La versión es configurable: confirmar las versiones admitidas por la cuenta y el modelo antes de activarlo. No interpreta bloques de herramientas, imágenes ni razonamiento como respuesta pública.

## Proveedores no cubiertos

Las APIs de Gemini nativa, Bedrock firmado, servicios con OAuth o APIs que solo aceptan Responses no se vuelven compatibles cambiando el nombre del proveedor. Si ofrecen una pasarela compatible con Chat Completions, puede usarse esa pasarela; de lo contrario, hace falta un adaptador nuevo con sus pruebas. El punto de extensión es `lib/providers.cjs` y la validación se encuentra en `lib/config.cjs`.

## Prueba de recepción con la cuenta institucional

1. Completar `.env`, definir presupuesto y habilitar el modelo en la cuenta del proveedor.
2. Reiniciar el servidor y comprobar que la cabecera ya no diga «pendiente de configuración».
3. Enviar una pregunta sencilla sobre admisiones.
4. Verificar respuesta, cita, modelo elegido y registro de uso en el panel del proveedor.
5. Repetir con cada modelo autorizado y registrar el resultado en `docs/ENTREGA.md`.

Una respuesta de prueba puede generar cobro. Las pruebas de `npm test` no usan la cuenta institucional.

## Referencias

- [NVIDIA: API de LLM](https://docs.api.nvidia.com/nim/reference/llm-apis).
- [Anthropic: Messages](https://platform.claude.com/docs/en/api/messages/create).
- [Azure OpenAI: modelos de chat](https://learn.microsoft.com/azure/ai-services/openai/how-to/chatgpt).

La documentación del proveedor es la referencia para precios, disponibilidad, versiones y parámetros; esta guía no fija precios ni garantiza un modelo específico.
