# Mantener la información institucional

Responsable propuesto: una persona designada por la universidad que pueda validar información con las unidades de Admisiones, Ayudas Financieras, Registro, Bienestar y demás áreas.

## Dónde se edita

`data/institucion.json` es la fuente editable. `js/knowledge.js` es una copia generada para mostrarla en el navegador. No editar esta última a mano.

Cada tema incluye:

| Campo | Uso |
| --- | --- |
| `id` | Entero positivo único que el chat cita como `[id]`. No reutilizarlo para otro tema. |
| `slug` | Nombre único en minúsculas, sin espacios, como `transporte`. |
| `title` | Título legible para el explorador de fuentes. |
| `reviewed` | Fecha real de consulta, en formato `AAAA-MM-DD`. |
| `content` | Resumen factual, breve y con el campus o programa correspondiente. |
| `sources` | Uno o más títulos y enlaces HTTPS de fuentes autorizadas. |
| `note` | Limitaciones, vigencia, excepciones o indicación de confirmar información. |

## Ejemplo para agregar un tema

Dentro del arreglo `documents`, agrega un objeto con un `id` y `slug` nuevos. Este ejemplo es una plantilla; reemplaza el texto con información verificada:

```json
{
  "id": 14,
  "slug": "nuevo-tema",
  "title": "Título del tema",
  "reviewed": "2026-11-09",
  "content": "Escribe aquí un resumen validado por la unidad responsable. Identifica campus, programa y condiciones cuando corresponda.",
  "sources": [
    {
      "title": "Página oficial consultada",
      "url": "https://www.uvg.edu.gt/"
    }
  ],
  "note": "Indica qué debe confirmarse antes de realizar el trámite."
}
```

No pegar instrucciones para el modelo dentro de los datos, ni información privada de estudiantes, contraseñas, claves, teléfonos personales o documentos familiares. No presentar un beneficio de una convocatoria antigua como si continuara disponible.

## Generar, revisar y publicar el cambio

```bash
npm run build:knowledge
npm run check
git diff
```

Comprueba en el navegador que el tema aparece en **Fuentes** y que su enlace abre la página correcta. Si el tema tiene una cita `[14]`, verifica que corresponde al contenido.

```bash
git add data/institucion.json js/knowledge.js
git commit -m "Actualizar información institucional validada"
git push
```

Después, actualiza la instalación del servidor y **reiníciala**. Subir cambios a GitHub no actualiza automáticamente un servidor: esta entrega incluye verificación automática, pero no despliegue automático.

El servidor vuelve a cargar `data/institucion.json` al iniciarse. El navegador muestra `js/knowledge.js`. Ambos deben entregarse sincronizados. Las conversaciones anteriores conservan lo que el modelo ya respondió; inicia una conversación nueva después de actualizar información relevante.

## Archivos Word, PDF y páginas externas

La aplicación no extrae documentos ni recorre sitios web automáticamente. Para incorporar un documento, una persona autorizada debe leerlo, resumir los datos útiles, verificar el permiso para publicarlos y registrar su fuente en el JSON. No subir el documento original si contiene datos personales o si no corresponde distribuirlo.

La base completa se envía al proveedor en cada consulta. El validador permite hasta 96 KB de JSON y falla si se supera. Este límite no garantiza que todos los modelos tengan contexto suficiente. Mantener resúmenes pequeños; para centenares de documentos se necesita desarrollar recuperación por búsqueda/RAG.

## Caducidad, conflictos y retiro de temas

- Antes de cada ciclo, revisar costos, requisitos, convocatorias, becas y calendarios con la unidad responsable.
- Mantener `reviewed` como la fecha real en que se comprobó la fuente; no cambiarla solo para que parezca reciente.
- Si dos páginas oficiales difieren, registrar la contradicción y pedir confirmación; no escoger un precio por intuición.
- Si se retira un tema, eliminarlo de `documents`, regenerar la base y revisar enlaces internos. No reasignar su `id` a otro asunto.
- Las preguntas rápidas de la portada y los accesos laterales usan slugs como `admisiones`, `carreras` y `becas`. Si cambian, actualizar también esos accesos en `index.html`.

El conjunto inicial se investigó el 5 de noviembre de 2026. La entrega técnica no sustituye la aprobación académica o administrativa del contenido.
