# 🔄 Migración a Notas de Débito Automáticas

## 📋 Resumen del Cambio

Se ha migrado completamente el sistema de notas de débito de **creación manual** a **generación automática** basada en el flujo de cuentas por pagar y diferencial cambiario.

## ✅ Cambios Implementados

### 1. **Sistema Automático Mejorado**
- ✅ **Considera notas de crédito asociadas**: El sistema ahora obtiene y descuenta las notas de crédito asociadas a cada factura antes de calcular el diferencial cambiario.
- ✅ **Cálculo preciso**: `montoUSDNeto = montoUSDFactura - totalUSDNotasCredito`
- ✅ **Integración con tipos de cambio**: Soporte para USD, EUR y PAR (manual)

### 2. **Interfaz de Usuario Actualizada**
- ✅ **Navegación reorganizada**: Movido "Consulta Notas de Débito" al menú de administración
- ✅ **Página de solo consulta**: `/notas-debito` ahora es exclusivamente para consultar el historial
- ✅ **Mensajes informativos**: Explicación clara del nuevo flujo automático
- ✅ **Deshabilitación de edición/eliminación manual** con mensajes explicativos

### 3. **Servicios Centralizados**
- ✅ **`cuentasPorPagarService.getNotasDebitoAutomaticas()`**: Nuevo método para consultar solo notas automáticas
- ✅ **Filtrado por origen**: Solo muestra notas marcadas como `origen: 'automatica'`
- ✅ **Deprecación de métodos manuales**: Métodos de creación manual marcados como `@deprecated`

### 4. **Archivos Eliminados**
- ❌ `src/components/forms/NotaDebitoForm.tsx` (creación manual)
- ❌ `src/components/notas-debito/NotaDebitoEditModal.tsx` (edición manual)

### 5. **Archivos Modificados**
- 🔄 `src/app/notas-debito/page.tsx` - Página de solo consulta
- 🔄 `src/components/layout/MainLayout.tsx` - Navegación reorganizada
- 🔄 `src/components/notas-debito/NotasDebitoContent.tsx` - Solo modo consulta
- 🔄 `src/lib/services/notasDebitoAutomaticasService.ts` - Consideración de notas de crédito
- 🔄 `src/lib/services/cuentasPorPagarService.ts` - Método de consulta centralizado
- 🔄 `src/lib/services.ts` - Métodos deprecados
- 🔄 `src/types/index.ts` - Tipos marcados como deprecated

## 🔄 Flujo Actualizado

### **Antes (Manual)**
1. Usuario creaba factura manualmente
2. Agregaba notas de crédito opcionales
3. Calculaba diferencial cambiario manualmente
4. Generaba nota de débito

### **Ahora (Automático)**
1. Se procesan pagos en **Cuentas por Pagar**
2. Sistema verifica diferencial cambiario automáticamente
3. Obtiene notas de crédito asociadas a la factura
4. Calcula monto USD neto después de descontar notas de crédito
5. **Si hay diferencial significativo**, genera nota de débito automáticamente
6. Se integra en el flujo del recibo de pago

## 🔍 Consulta de Notas de Débito

### **Ubicación**: `/notas-debito`
- **Acceso**: Menú Administración → "Consulta Notas de Débito"
- **Funcionalidad**: Solo lectura y consulta
- **Filtros**: Por fecha, proveedor, número de nota/factura
- **Exportación**: Excel disponible
- **Historial**: Muestra todas las notas (históricas manuales + nuevas automáticas)

## 🎯 Beneficios del Cambio

1. **✅ Precisión**: Considera automáticamente todas las notas de crédito asociadas
2. **✅ Consistencia**: Proceso estandarizado sin intervención manual
3. **✅ Integración**: Parte del flujo completo de cuentas por pagar
4. **✅ Auditoría**: Trazabilidad completa desde el pago hasta la nota de débito
5. **✅ Eficiencia**: Eliminación de pasos manuales propensos a errores

## 📊 Campos Considerados en el Cálculo

```typescript
// Paso 1: Obtener notas de crédito asociadas
const notasCredito = await obtenerNotasCreditoAsociadas(factura.id)

// Paso 2: Calcular monto USD neto
const montoUSDFactura = factura.montoUSD
const totalUSDNotasCredito = notasCredito.reduce(...)
const montoUSDNeto = Math.max(0, montoUSDFactura - totalUSDNotasCredito)

// Paso 3: Calcular diferencial cambiario
const diferencialBruto = montoUSDNeto * (tasaPago - tasaOriginal)
```

## 🔐 Tipos de Cambio Soportados

- **USD**: Tasa BCV automática
- **EUR**: Tasa BCV automática  
- **PAR**: Tasa manual ingresada por el usuario

## 📋 Migración de Datos

Las notas de débito existentes (creadas manualmente) se mantienen en el sistema para consulta histórica. Las nuevas notas se marcan con `origen: 'automatica'` para distinguirlas.

## 🚀 Próximos Pasos

1. ✅ **Pruebas del sistema automático** con facturas reales
2. ✅ **Capacitación de usuarios** en el nuevo flujo
3. ✅ **Monitoreo** de la generación automática
4. 📅 **Revisión en 30 días** para optimizaciones adicionales

---

**Implementado el**: 2025-01-26
**Estado**: ✅ Completado
**Versión**: Sistema de Notas de Débito Automáticas v2.0