// src/types/index.ts
export interface Factura {
    numero: string;
    numeroControl: string;
    fecha: Date;
    proveedor: {
      nombre: string;
      rif: string;
      direccion: string;
    };
    cliente: {
      nombre: string;
      rif: string;
      direccion: string;
    };
    subTotal: number;      // Monto antes de impuestos (base imponible + exento)
    montoExento: number;   // Monto exento de IVA
    baseImponible: number; // Monto gravable con IVA
    alicuotaIVA: number;   // Porcentaje de IVA (normalmente 16%)
    iva: number;           // Monto de IVA
    total: number;         // Monto total de la factura
    tasaCambio: number;    // Tasa de cambio BCV
    montoUSD: number;      // Monto equivalente en USD
    porcentajeRetencion: number; // Porcentaje de retención de IVA
    retencionIVA: number;  // Monto de retención de IVA
  }
  
  export interface NotaCredito {
    numero: string;
    numeroControl: string;
    fecha: Date;
    facturaAfectada: string;
    subTotal: number;      
    montoExento: number;   
    baseImponible: number; 
    alicuotaIVA: number;   
    iva: number;           
    total: number;         
    tasaCambio: number;    
    montoUSD: number;      
    porcentajeRetencion: number;
    retencionIVA: number;  
  }
  
  export interface NotaDebito {
    numero: string;
    fecha: Date;
    factura: Factura;
    notasCredito?: NotaCredito[]; // Cambiado de notaCredito a notasCredito (array)
    tasaCambioOriginal: number;
    tasaCambioPago: number;
    montoUSDNeto: number;
    diferencialCambiarioConIVA: number; // Diferencial cambiario con IVA incluido
    baseImponibleDiferencial: number;   // Base imponible extraída del diferencial
    ivaDiferencial: number;             // IVA extraído del diferencial
    retencionIVADiferencial: number;    // Retención de IVA sobre el diferencial
    montoNetoPagarNotaDebito: number;   // Monto neto a pagar después de retención
  }