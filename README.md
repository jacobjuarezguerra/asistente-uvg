# Asistente UVG

Asistente universitario de consulta con una interfaz inspirada en Material Design 3. Responde a partir de resúmenes de información pública de la Universidad del Valle de Guatemala y muestra las fuentes para comprobarlos.

Esta es una **entrega técnica para evaluación y operación institucional**. La universidad debe aportar su propia cuenta de IA, configurar el servicio, revisar los contenidos y aceptar la recepción. No se incluyen claves personales ni una suscripción pagada.

## Qué recibe la institución

- Interfaz adaptable a computadora y celular, con modo oscuro.
- Bienvenida con Jack, el dragón de la UVG, y decoración local adaptable a ambos temas. [Procedencia del recurso visual](docs/RECURSOS_VISUALES.md).
- Chat con fuentes, historial de la sesión y descarga de conversaciones.
- Explorador de información institucional que funciona sin consumir la API.
- Conexión de IA configurable en el servidor: API compatible con Chat Completions o Anthropic Messages.
- Modelos autorizados y límites de respuesta controlados por la institución.
- Base inicial de 13 temas, con fuentes y fechas de consulta del **5 de noviembre de 2026**. La universidad debe validarla antes de publicarla como información vigente.
- Pruebas automáticas, comprobación de contenidos y flujo de verificación en GitHub Actions.

La clave del proveedor permanece en el servidor. Los visitantes no tienen que pegarla en el navegador.

## Inicio rápido

Necesitas **Node.js 22 o posterior** y Git. No se requiere Python, GPU ni instalar un modelo en el equipo. Las pruebas no consumen una API real.

```bash
git clone https://github.com/jacobjuarezguerra/asistente-uvg.git
cd asistente-uvg
npm ci
```

En PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Abre `.env` en un editor y completa estos cuatro campos con los datos de la cuenta **institucional**:

```dotenv
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://SERVIDOR-DEL-PROVEEDOR/v1
AI_API_KEY=CLAVE-INSTITUCIONAL
AI_MODEL=IDENTIFICADOR-DEL-MODELO
```

La URL y el nombre del modelo deben coincidir con la documentación del proveedor. No basta con tener una clave si todavía no se conoce qué API utiliza. [Consulta los ejemplos y formatos compatibles](docs/PROVEEDORES.md).

```bash
npm start
```

Abre **http://127.0.0.1:8765**. En Windows también puedes ejecutar `Abrir chatbot.cmd`, manteniendo abierta su ventana. No abras `index.html` directamente para conversar.

Si todavía no completaste `.env`, podrás explorar las fuentes; el chat mostrará que falta la configuración institucional. Después de cambiar `.env`, detén el servidor con `Ctrl+C` y vuelve a ejecutar `npm start`.

## Elegir modelos y controlar el uso

`AI_MODEL` es el modelo inicial. Para permitir otros en el selector del chat:

```dotenv
AI_MODEL=modelo-principal
AI_ALLOWED_MODELS=modelo-secundario,otro-modelo-autorizado
AI_MAX_TOKENS=2048
RATE_LIMIT_PER_MINUTE=20
MAX_CONCURRENT_REQUESTS=4
```

Usa identificadores reales de tu proveedor. El navegador no puede habilitar modelos fuera de esa lista ni superar `AI_MAX_TOKENS`. Los límites locales reducen abuso, pero **no son un tope de facturación**: la institución debe definir presupuesto, alertas y límites en su cuenta del proveedor.

## Agregar o corregir información de la universidad

1. Edita `data/institucion.json` y agrega o corrige el tema con su fuente oficial y fecha de consulta.
2. Ejecuta `npm run build:knowledge`.
3. Ejecuta `npm run check`.
4. Revisa el cambio, guárdalo en Git y reinicia el servidor que lo esté usando.

La guía [ACTUALIZAR_INFORMACION.md](docs/ACTUALIZAR_INFORMACION.md) incluye un ejemplo completo, criterios de revisión y cómo retirar información antigua. Subir un PDF o un archivo a una carpeta **no hace que el chatbot lo lea automáticamente**.

## Verificar la entrega

```bash
npm run check
```

Comprueba la sincronización de la base, pruebas de los adaptadores y del servidor, y patrones habituales de credenciales. La integración con una API pagada debe probarse después con la cuenta institucional; las pruebas automáticas usan respuestas simuladas.

## Operación y publicación

Por defecto el servidor escucha solo en el equipo local. **GitHub guarda el código; GitHub Pages no ejecuta este servidor Node ni protege una clave de API.**

Para instalarlo en infraestructura institucional, sigue [OPERACION.md](docs/OPERACION.md). Incluye ejecución con Docker, acceso al servicio, HTTPS, respaldo, actualización y atención de fallos. El servicio no incluye SSO, un panel de administración ni un sistema de matriculación.

## Entrega y responsabilidades

La distribución de tareas y la lista de recepción están en [ENTREGA.md](docs/ENTREGA.md). La universidad deberá designar responsables de infraestructura, cuenta de IA, datos institucionales, privacidad y soporte.

La entrega del código no demuestra por sí sola que la institución haya aceptado esas tareas. Completen el registro de recepción y acuerden por escrito cualquier soporte adicional antes de cerrar la entrega.

## Estructura

```text
index.html                 Interfaz
assets/chat.css            Diseño y accesibilidad
js/chat.js                 Conversación y preferencias del usuario
js/knowledge.js            Copia generada para el explorador de fuentes
data/institucion.json      Base institucional editable
lib/config.cjs             Variables y validación del servidor
lib/providers.cjs          Adaptadores de proveedores
lib/knowledge.cjs          Validación y contexto institucional
server.cjs                 Servidor y conexión con IA
tools/                     Generación y comprobaciones
tests/                     Pruebas sin credenciales reales
docs/                      Guías de administración y recepción
.env.example               Plantilla sin secretos
```

## Límites del proyecto

- Consulta una base local de resúmenes; no navega en vivo ni ofrece un buscador RAG sobre documentos extensos.
- No accede a expedientes, notas, pagos ni cuentas de estudiantes.
- Las respuestas y citas las genera un modelo y pueden equivocarse. Los trámites, requisitos y fechas deben confirmarse por canales oficiales.
- Las conversaciones se mantienen en memoria de la pestaña y se envían al proveedor para responder. El servidor de esta entrega no guarda el contenido en una base de datos ni lo registra en logs propios.
- El contrato, retención y tratamiento de datos del proveedor elegido deben ser revisados por la institución.
- Un proveedor con otro protocolo requiere adaptar `lib/providers.cjs`; no se garantiza compatibilidad con cualquier API solamente pegando una clave.

## Acceso al repositorio y licencia

El repositorio está público para facilitar su revisión. Su propietario puede cambiar la visibilidad a privado desde **Settings** e invitar cuentas concretas desde **Collaborators → Add people**. La universidad puede solicitar la transferencia a su propia organización de GitHub cuando esté lista para administrarlo.

Se conserva la licencia MIT del código recibido. Véanse [LICENSE](LICENSE) y [NOTICE.md](NOTICE.md). No se incluye una autorización institucional para presentar el prototipo como un servicio oficial.
