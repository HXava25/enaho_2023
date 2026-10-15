# Evidencia de validación

Fecha de captura: 15 de octubre de 2026.

## React Profiler

La imagen [react-profiler.png](./react-profiler.png) registra una sesión de prueba del panel integrado, basado en `React.Profiler`. Durante la grabación se cambió el periodo, se filtró por departamento y se ordenó la tabla.

En esa sesión se observaron **4 commits** del componente `ENAHO Dashboard`; la duración media fue **35.17 ms**. Las duraciones individuales visibles fueron aproximadamente **30.7 ms, 37.8 ms, 72.2 ms y 0 ms**. Son mediciones de una sola ejecución en el entorno local y pueden variar con el equipo, el navegador y el estado inicial; no son una garantía ni una comparación controlada de rendimiento.

Para cumplir con la captura que pide literalmente la guía, falta obtener también la grabación desde **React DevTools → Profiler**. Esta imagen corresponde al panel integrado del proyecto, no a DevTools. Repite allí las interacciones de la guía y añade las capturas de DevTools junto con tu propia explicación antes de entregar.

## Cleanup del diálogo

En una comprobación de navegador se abrió y cerró el diálogo dos veces. Se midió el listener `keydown` añadido al montar y retirado al desmontar:

| Estado | Listeners del diálogo |
| --- | ---: |
| Diálogo cerrado | 0 |
| Diálogo abierto | 1 |
| Tras cerrar con `Escape` | 0 |
| Reapertura | 1 |
| Segundo cierre | 0 |

Después del primer cierre se envió otro evento `Escape` con el diálogo cerrado y no se volvió a abrir. Esto comprueba que el listener no queda acumulado tras el desmontaje.

## Comprobaciones de proyecto

- `npm run lint` — correcto.
- `npm test` — 3 pruebas correctas (importación CSV, validación de filas y acciones del reducer).
- `npm run build` — correcto.
- Navegador — carga del CSV de plantilla, filtro, selección de indicador, grabación de commits y apertura/cierre del diálogo comprobados.

Las tasas y montos de la muestra son ficticios. No se deben presentar como resultados oficiales ENAHO.
