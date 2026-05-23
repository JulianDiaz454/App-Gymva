# GVM — Gym Tracking

App móvil de seguimiento de gimnasio. **Personal, sin servidor, sin nube.** Toda la información vive en el dispositivo (SQLite).

## Stack

- **Expo SDK 54** + **React Native 0.76** + TypeScript estricto
- **Expo Router** (file-based)
- **expo-sqlite** + **Drizzle ORM**
- **expo-file-system** para fotos
- **react-native-reanimated** para animaciones
- **zod** para validación
- Gestor: **pnpm** con `node-linker=hoisted` (obligatorio)

## Arranque

```bash
pnpm install
pnpm start
```

Abrir con Expo Go (Android) o `pnpm android` para build nativa.

## Estructura

```
app/                    # Rutas Expo Router
├── (tabs)/             # Hoy · Progreso · Calendario · Ejercicios
├── create-exercise.tsx # modal
├── session.tsx         # overlay sesión
├── routine-editor.tsx  # editor rutina
├── measurements.tsx    # peso y medidas
└── exercise/[id].tsx   # detalle progreso

src/
├── db/                 # Drizzle schema + bootstrap + client
├── theme/              # tokens (colores, radios, tipografía)
├── validation/         # esquemas zod
├── utils/              # formatNumber (es-CO), fechas
├── components/         # UI base reutilizable
└── hooks/              # hooks compartidos
```

## Principios

- **Apariencia y flujo:** prototipo `Gymv` (web React, en `~/Downloads/Gymv`).
- **Implementación:** `ESPECIFICACION.md`.
- **Planeado vs realizado:** separación estricta — la rutina es plantilla, la sesión es lo real. Las gráficas usan solo lo realizado.
- **Validación:** zod en frontera, mensajes en español, nada inválido llega a SQLite.
- **Números:** todo número visible pasa por `formatNumber()` (es-CO: punto miles, coma decimales).
- **Fotos:** archivo en disco con `expo-file-system`; en BD solo la ruta.
