# Sistema de Gestión Empresarial con Notas de Débito

Aplicación web integral desarrollada con Next.js 15 para gestión empresarial completa, especializada en notas de débito por diferencial cambiario en Venezuela, con dashboard master avanzado y gestión multi-compañía.

## ✨ Características Principales

### 🏢 **Gestión Multi-Compañía**
- Sistema de roles: Master, Admin, Usuario
- Gestión centralizada de múltiples empresas
- Políticas de seguridad RLS (Row Level Security)
- Dashboard master con selector de compañía

### 💰 **Gestión de Caja**
- Control de cajas diarias con apertura/cierre
- Registro de pagos móviles y Zelle
- Notas de crédito de caja
- Ventas a crédito con seguimiento
- Análisis de discrepancias y precisión de cierres

### 📊 **Dashboard Master Avanzado**
- **Vista Global**: Estadísticas consolidadas de todas las compañías
- **Vista por Compañía**: Análisis detallado por empresa
- **KPIs en Tiempo Real**: Ventas, cajas, créditos, alertas
- **Métricas de Rendimiento**: Precisión de cajeros, discrepancias
- **Sistema de Alertas**: Categorizado por severidad (leve, media, alta)
- **Rankings**: Top cajeros y compañías por volumen

### 💳 **Gestión de Créditos**
- Cartera de clientes con créditos
- Estados de vencimiento (vigente, por vencer, vencido, pagado)
- Registro de abonos por múltiples métodos
- Estados de cuenta detallados
- Dashboard analítico con métricas avanzadas

### 📄 **Notas de Débito por Diferencial Cambiario**
- Registro de facturas con montos exentos y gravables
- Soporte para notas de crédito
- Cálculo automático del diferencial cambiario
- Generación de notas de débito en formato PDF
- Cálculo del monto final a pagar considerando retenciones de IVA

### 🔧 **Gestión de Cierres de Caja**
- Análisis detallado de cierres diarios
- Comparación sistema vs reporte Z
- Alertas automáticas por discrepancias
- Reportes en PDF y Excel
- Dashboard con métricas de precisión

### 📋 **Gestión de Proveedores**
- Catálogo de proveedores por compañía
- Asociación con bancos
- Configuración de retenciones
- Estados activos/inactivos

## 🎯 **Widgets del Dashboard Master**

1. **KPIs Principales** - Métricas clave en tiempo real
2. **Rendimiento de Cajas** - Precisión vs discrepancias
3. **Distribución de Ventas** - Por método de pago
4. **Top 5 Cajeros** - Ranking por precisión
5. **Estado de Créditos** - Análisis de cartera
6. **Ranking de Compañías** - Por volumen de ventas
7. **Sistema de Alertas** - Monitoreo de salud del sistema
8. **Actividad Reciente** - Últimas transacciones

## 🛠️ **Tecnologías Utilizadas**

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Tailwind CSS** - Framework de estilos
- **Heroicons** - Iconografía

### Backend & Base de Datos
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Real-time subscriptions** - Actualizaciones en tiempo real

### Generación de Documentos
- **@react-pdf/renderer** - Generación de PDFs
- **jsPDF** - PDFs adicionales
- **ExcelJS** - Exportación a Excel

### Utilidades
- **date-fns** - Manipulación de fechas
- **React Context** - Gestión de estado global
- **Custom Hooks** - Lógica reutilizable

## 🚀 **Instalación y Configuración**

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta en Supabase

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/Fanfaster01/nota-debito-app.git
cd nota-debito-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Ejecutar migraciones de base de datos**
```bash
npx supabase db reset
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

6. **Abrir en navegador**
```
http://localhost:3000
```

## 📁 **Estructura del Proyecto**

```
src/
├── app/                          # App Router de Next.js 15
│   ├── admin/                   # Páginas de administración
│   │   ├── companies/          # Gestión de compañías
│   │   ├── users/              # Gestión de usuarios
│   │   └── settings/           # Configuraciones globales
│   ├── cajas/                   # Gestión de cajas
│   ├── cierres-caja/           # Análisis de cierres
│   ├── ventas-credito/         # Gestión de créditos
│   ├── notas-debito/           # Notas de débito
│   ├── proveedores/            # Gestión de proveedores
│   └── dashboard/              # Dashboard principal
├── components/
│   ├── dashboard/              # Widgets del dashboard master
│   ├── cajas/                  # Componentes de caja
│   ├── cierres-caja/          # Componentes de cierres
│   ├── creditos/              # Componentes de créditos
│   ├── forms/                 # Formularios reutilizables
│   ├── layout/                # Layouts de la aplicación
│   └── ui/                    # Componentes base
├── lib/
│   └── services/              # Servicios de API
├── types/                     # Definiciones de TypeScript
├── utils/                     # Utilidades y helpers
└── contexts/                  # Contextos de React
```

## 👥 **Roles y Permisos**

### 🔱 **Master**
- Acceso total al sistema
- Gestión de compañías y usuarios
- Dashboard master con vista global
- Configuraciones del sistema
- Análisis comparativo entre compañías

### 👨‍💼 **Admin**
- Gestión de usuarios de su compañía
- Acceso a todas las funciones operativas
- Reportes avanzados de su empresa
- Configuraciones de compañía

### 👤 **Usuario**
- Gestión de caja diaria
- Registro de transacciones
- Gestión de créditos
- Generación de notas de débito
- Reportes básicos

## 📊 **Métricas y Analytics**

### Dashboard Master incluye:
- **Métricas de Caja**: Ventas totales, precisión de cierres, discrepancias
- **Análisis de Créditos**: Cartera activa, vencimientos, cobros
- **Sistema de Alertas**: Monitoreo en tiempo real con categorización
- **Comparativas**: Rankings de cajeros y compañías
- **Tendencias**: Análisis histórico y proyecciones

## 🔒 **Seguridad**

- **Autenticación** con Supabase Auth
- **Autorización** basada en roles
- **RLS (Row Level Security)** para aislamiento de datos
- **Políticas de acceso** granulares por compañía
- **Validación** client-side y server-side
- **Sanitización** de entradas de usuario

## 🚀 **Despliegue**

### Vercel (Recomendado)
1. Conectar repositorio de GitHub a Vercel
2. Configurar variables de entorno de Supabase
3. Deploy automático en cada push

### Docker
```bash
docker build -t nota-debito-app .
docker run -p 3000:3000 nota-debito-app
```

## 🧪 **Testing**

```bash
# Ejecutar tests
npm run test

# Tests con coverage
npm run test:coverage

# Linting
npm run lint

# Type checking
npm run type-check
```

## 📈 **Rendimiento**

- **First Load JS**: < 500kb
- **Optimización de imágenes** con Next.js Image
- **Code splitting** automático
- **Lazy loading** de componentes
- **Caching** inteligente con SWR

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 **Soporte**

Para soporte y consultas:
- Crear un [issue](https://github.com/Fanfaster01/nota-debito-app/issues)
- Email: soporte@empresa.com

## 🎯 **Roadmap**

- [ ] Integración con APIs bancarias
- [ ] Módulo de inventario
- [ ] Dashboard móvil
- [ ] Integraciones con ERPs
- [ ] Reportes avanzados con BI
- [ ] Notificaciones push
- [ ] API pública

---

**Desarrollado con ❤️ para la gestión empresarial en Venezuela**