# Kanban Sener

Una aplicación web completa de tablero Kanban con análisis de productividad, seguimiento de tiempo, características de motivación y análisis de patrones de trabajo, desarrollada en español.

## Características

- ✅ **Autenticación de Usuarios**: Registro e inicio de sesión con email/contraseña
- 📋 **Gestión de Tableros**: Múltiples tableros con columnas personalizables
- 🎯 **Gestión de Tareas**: Crear, editar y eliminar tareas con tipos de trabajo, prioridades y fechas límite
- 🎨 **Interfaz Kanban**: Drag-and-drop para mover tareas entre columnas
- ⏱️ **Seguimiento de Tiempo**: Seguimiento automático del tiempo de creación, inicio y finalización de tareas
- 📊 **Dashboard Analítico**: Métricas de productividad, análisis de patrones de trabajo y visualizaciones
- 🔥 **Características de Motivación**: 
  - Seguimiento de rachas diarias
  - Sistema de logros y badges
  - Metas semanales
  - Mensajes motivacionales
- 🚨 **Sistema de Alertas**: 
  - Tareas vencidas
  - Tareas próximas a vencer
  - Trabajo tardío
  - Cuellos de botella
  - Puntos débiles
- 🌍 **Internacionalización**: Completamente en español

## Stack Tecnológico

- **Framework**: Next.js 14+ (App Router) con TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui
- **Internacionalización**: next-intl
- **Gráficos**: Recharts
- **Drag & Drop**: @dnd-kit
- **Despliegue**: Vercel

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL (local o Vercel Postgres/Supabase)
- npm o yarn

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd Kanban_sener
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` y configura:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kanban_sener?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NODE_ENV="development"
```

4. Configura la base de datos:
```bash
npx prisma generate
npx prisma db push
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel:
   - `DATABASE_URL`: URL de tu base de datos PostgreSQL (puedes usar Vercel Postgres)
   - `NEXTAUTH_URL`: URL de tu aplicación desplegada
   - `NEXTAUTH_SECRET`: Genera un secreto seguro (puedes usar `openssl rand -base64 32`)
   - `NODE_ENV`: `production`

3. Vercel detectará automáticamente Next.js y desplegará la aplicación

## Estructura del Proyecto

```
kanban_sener/
├── app/
│   ├── [locale]/          # Rutas con internacionalización
│   │   ├── (auth)/        # Páginas de autenticación
│   │   └── (dashboard)/  # Páginas del dashboard
│   ├── api/              # API routes
│   └── layout.tsx        # Layout raíz
├── components/
│   ├── ui/               # Componentes UI base
│   ├── board/            # Componentes del tablero
│   ├── task/             # Componentes de tareas
│   ├── dashboard/        # Componentes del dashboard
│   ├── analytics/        # Componentes de análisis
│   ├── motivation/       # Componentes de motivación
│   └── alerts/           # Componentes de alertas
├── lib/
│   ├── db.ts            # Cliente de Prisma
│   ├── auth.ts          # Configuración de NextAuth
│   ├── analytics.ts     # Funciones de análisis
│   ├── achievements.ts  # Sistema de logros
│   └── i18n.ts          # Configuración de i18n
├── messages/
│   └── es.json          # Traducciones en español
├── prisma/
│   └── schema.prisma    # Esquema de la base de datos
└── public/              # Archivos estáticos
```

## Características Principales

### Gestión de Tareas
- Tipos de trabajo: Funcionalidad, Error, Tarea, Investigación
- Prioridades: Baja, Media, Alta, Crítica
- Asignación de tareas
- Fechas límite
- Etiquetas

### Análisis de Productividad
- Tareas completadas (hoy, semana, mes)
- Tasa de finalización
- Tiempo promedio de finalización
- Distribución por estado
- Análisis de patrones de trabajo

### Motivación y Logros
- Sistema de rachas diarias
- Logros desbloqueables
- Metas semanales
- Mensajes motivacionales contextuales

### Alertas Inteligentes
- Tareas vencidas
- Tareas próximas a vencer
- Trabajo tardío
- Cuellos de botella
- Puntos débiles identificados

## Licencia

MIT
