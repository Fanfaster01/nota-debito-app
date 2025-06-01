// src/lib/services/index.ts
// Re-exportar todos los servicios desde un punto central

// Servicios de administración
export {
    CompanyService,
    AdminUserService,
    DashboardService,
    companyService,
    adminUserService,
    dashboardService
  } from './adminServices'
  
  // Servicio de configuraciones
  export {
    SettingsService,
    settingsService
  } from './settingsService'
  
  // Servicio de proveedores
  export {
    ProveedorService,
    proveedorService,
    type ProveedorWithBanco
  } from './proveedorService'
  
  // Servicio de bancos
  export {
    BancoService,
    bancoService
  } from './bancoService'
  
  // Servicio de cajas
  export {
    CajaService,
    cajaService
  } from './cajaService'
  
  // Servicios originales del sistema de facturación
  export {
    FacturaService,
    NotaCreditoService,
    NotaDebitoService,
    UserService,
    facturaService,
    notaCreditoService,
    notaDebitoService,
    userService
  } from '../services'