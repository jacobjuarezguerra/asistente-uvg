# Registro de entrega y recepción

**Estado:** preparado para evaluación. Recepción y puesta en operación pendientes de confirmación institucional.

Este documento organiza la entrega y las tareas de operación. No registra una aceptación que todavía no haya ocurrido ni sustituye los acuerdos que las partes decidan formalizar.

## Identificación

| Dato | Completar al recibir |
| --- | --- |
| Proyecto | Asistente UVG |
| Entrega técnica preparada | 9 de noviembre de 2026 |
| Repositorio | `https://github.com/jacobjuarezguerra/asistente-uvg` |
| Versión de entrega | `2.0.0`; anotar también etiqueta o SHA recibido |
| Persona que entrega | Jacob Juárez Guerra |
| Unidad receptora | Pendiente |
| Responsable técnico institucional | Pendiente |
| Responsable de contenidos | Pendiente |
| Fecha de recepción | Pendiente |
| Decisión | Aceptada / aceptada con observaciones / pendiente |

## Alcance entregado

- Código fuente de interfaz, servidor y adaptadores.
- Base inicial de 13 temas con fuentes y fechas de consulta.
- Plantilla de variables sin credenciales personales.
- Guías para ejecución, proveedor, contenidos y operación.
- Pruebas automáticas con proveedores simulados y verificación de GitHub Actions.
- Licencia y avisos heredados del código inicial.

## Distribución de tareas propuesta

| Actividad | Responsable después de la recepción |
| --- | --- |
| Recibir, revisar y aprobar el código entregado | Responsable técnico de la universidad |
| Contratar proveedor de IA y aportar cuenta, clave y modelos | Universidad |
| Pagar consumos, configurar presupuesto y resolver problemas de facturación | Universidad |
| Instalar y administrar servidor, dominio, HTTPS, cuentas y acceso | Universidad |
| Verificar y mantener carreras, becas, requisitos, contactos, costos y fechas | Unidades de la universidad, coordinadas por su responsable de contenidos |
| Autorizar el uso del nombre, identidad y presentación institucional | Universidad |
| Revisar privacidad, tratamiento de datos y condiciones del proveedor | Universidad |
| Ejecutar pruebas con la API institucional y aprobar la publicación | Universidad |
| Atender usuarios, corregir incidencias y actualizar versiones | Equipo que designe la universidad |
| Definir si necesita SSO, auditoría, RAG o integración con sistemas internos | Universidad |
| Soporte o desarrollo adicional del autor | Solo si se acuerda expresamente por separado |

La entrega no incluye una obligación de alojamiento, pago de API, atención continua, disponibilidad permanente ni actualización futura por parte del autor. Si se espera alguno de esos servicios, documentar su alcance, fechas y responsable antes de cerrar la recepción.

## Lista de comprobación institucional

Dejar las casillas sin marcar hasta comprobarlas:

- [ ] Se recibió la versión identificada y se puede clonar el repositorio.
- [ ] Una persona de la institución ejecutó `npm ci` y `npm run check` en su entorno.
- [ ] Se revisaron los avisos y la atribución de licencia del material recibido.
- [ ] Se verificaron los 13 temas y las fuentes con sus unidades responsables.
- [ ] Se configuró una cuenta institucional de IA sin usar la clave personal del prototipo.
- [ ] Se probó cada modelo autorizado con preguntas representativas y se revisó el consumo.
- [ ] Se configuraron permisos, presupuesto y alertas del proveedor.
- [ ] Se decidió quién puede acceder y cómo se identificará a los usuarios.
- [ ] Se revisaron privacidad, aviso al usuario y datos que podrán enviarse al proveedor.
- [ ] Se revisaron los requisitos de HTTPS, respaldos, recuperación y mantenimiento.
- [ ] Se designaron responsables de infraestructura, contenidos y soporte.
- [ ] Se confirmó la recepción y se registraron las observaciones pendientes.

## Límites conocidos al entregar

1. La información inicial es una síntesis local, no una consulta en tiempo real.
2. Las respuestas y citas pueden contener errores; no son resoluciones oficiales.
3. No hay acceso a notas, expedientes ni trámites internos.
4. Las pruebas automáticas simulan el proveedor. La compatibilidad con la cuenta pagada de la universidad debe validarse después de elegirla.
5. Las APIs de otros formatos requieren un adaptador y pruebas adicionales.
6. El código de acceso compartido disponible para una instalación protegida no equivale a un sistema institucional de usuarios o SSO.
7. Los límites locales no son una garantía de costo máximo ni de disponibilidad del proveedor.

## Confirmación de recepción

Completar por la unidad receptora, mediante su procedimiento de recepción habitual:

```text
Versión/SHA recibido:
Fecha:
Nombre y cargo de quien recibe:
Unidad:
Responsable técnico designado:
Responsable de contenidos designado:
Resultado de las pruebas:
Observaciones y pendientes:
Confirmación de recepción y aceptación del alcance:
```

Conservar esa confirmación junto con la versión entregada. Crear una etiqueta en GitHub facilita identificar el estado recibido; la etiqueta por sí sola no demuestra aceptación institucional.
