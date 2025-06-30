// src/components/cierres-caja/AlertasCierresPanel.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cierresCajaService, CierreDetalladoUI } from '@/lib/services/cierresCajaService'
import { alertasLeidasService } from '@/lib/services/alertasLeidasService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AlertaCierre {
  id: string
  cierre: CierreDetalladoUI
  tipoAlerta: 'discrepancia_alta' | 'discrepancia_reporte_z' | 'sin_detalles' | 'patron_sospechoso' | 'tendencia_negativa'
  severidad: 'leve' | 'media' | 'alta' | 'critica'
  mensaje: string
  fechaCreacion: Date
  leida: boolean
  acciones?: string[]
}

interface ConfiguracionAlertas {
  umbraldiscrepanciaLeve: number
  umbraldiscrepanciaMedia: number
  umbraldiscrepanciaAlta: number
  alertasPatrones: boolean
  alertasTendencias: boolean
  notificacionesEmail: boolean
  diasAnalisisTendencia: number
}

interface AlertasCierresPanelProps {
  onVerDetalle?: (cierre: CierreDetalladoUI) => void
}

export default function AlertasCierresPanel({ onVerDetalle }: AlertasCierresPanelProps) {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState<AlertaCierre[]>([])
  const [alertasFiltradas, setAlertasFiltradas] = useState<AlertaCierre[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)
  const [configuracion, setConfiguracion] = useState<ConfiguracionAlertas>({
    umbraldiscrepanciaLeve: 5,    // 0-5$ USD = leve
    umbraldiscrepanciaMedia: 15,  // 5-15$ USD = media
    umbraldiscrepanciaAlta: 15,   // 15+ USD = alta
    alertasPatrones: true,
    alertasTendencias: true,
    notificacionesEmail: false,
    diasAnalisisTendencia: 7
  })
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  const isMaster = user?.role === 'master'
  const companyId = isMaster ? undefined : user?.company_id || undefined
  
  // Estado para almacenar las alertas leídas
  const [alertasLeidas, setAlertasLeidas] = useState<Set<string>>(new Set())
  const [alertasLeidasLoaded, setAlertasLeidasLoaded] = useState(false)

  // Cargar alertas leídas desde la base de datos PRIMERO
  useEffect(() => {
    if (user) {
      loadAlertasLeidasFromDB()
    }
  }, [user, companyId])

  // Luego cargar las alertas DESPUÉS de tener las alertas leídas
  useEffect(() => {
    if (user && alertasLeidasLoaded) {
      loadAlertas()
    }
  }, [user, alertasLeidasLoaded])

  useEffect(() => {
    aplicarFiltros()
  }, [alertas, filtroSeveridad, filtroTipo, soloNoLeidas])

  const loadAlertasLeidasFromDB = async () => {
    if (!user) return
    
    try {
      const { data: alertasLeidasArray, error } = await alertasLeidasService.getAlertasLeidas(
        user.id, 
        companyId
      )
      
      if (error) {
        console.error('Error loading read alerts from database:', error)
        return
      }
      
      if (alertasLeidasArray) {
        setAlertasLeidas(new Set(alertasLeidasArray))
      }
      setAlertasLeidasLoaded(true)
    } catch (error) {
      console.error('Error loading read alerts from database:', error)
      setAlertasLeidasLoaded(true) // Marcar como cargado incluso si hay error
    }
  }

  const saveAlertaLeidaToDB = async (alertaId: string) => {
    if (!user) return
    
    try {
      const { error } = await alertasLeidasService.marcarAlertaLeida(
        user.id,
        alertaId,
        companyId
      )
      
      if (error) {
        console.error('Error saving read alert to database:', error)
      }
    } catch (error) {
      console.error('Error saving read alert to database:', error)
    }
  }

  const saveMultiplesAlertasLeidasToDB = async (alertasIds: string[]) => {
    if (!user) return
    
    try {
      const { error } = await alertasLeidasService.marcarMultiplesAlertasLeidas(
        user.id,
        alertasIds,
        companyId
      )
      
      if (error) {
        console.error('Error saving multiple read alerts to database:', error)
      }
    } catch (error) {
      console.error('Error saving multiple read alerts to database:', error)
    }
  }

  const loadAlertas = async () => {
    setLoading(true)
    
    try {
      // Cargar alertas básicas del servicio (umbral en USD para discrepancias leves)
      const { data: alertasBasicas } = await cierresCajaService.getAlertasDiscrepancias(
        companyId, 
        0 // Obtener todas las alertas, el filtrado por severidad se hace en el servicio
      )

      if (alertasBasicas) {
        let todasLasAlertas: AlertaCierre[] = alertasBasicas
          .filter(alerta => alerta.cierre.id) // Filtrar cierres sin ID
          .map((alerta, index) => {
            // Usar el ID del cierre para hacer la alerta única, con fallback
            const cierreId = alerta.cierre.id || `temp-${index}`
            const alertaId = `${cierreId}-${alerta.tipoAlerta}`
            // Verificar si la alerta está marcada como leída
            const isRead = alertasLeidas.has(alertaId)
            if (process.env.NODE_ENV === 'development') {
              console.log('Alert ID generated:', alertaId, 'Is read:', isRead)
            }
            return {
              id: alertaId,
              cierre: alerta.cierre,
              tipoAlerta: alerta.tipoAlerta,
              severidad: alerta.severidad,
              mensaje: alerta.mensaje,
              fechaCreacion: alerta.cierre.caja.horaCierre || alerta.cierre.caja.horaApertura,
              leida: isRead,
              acciones: generarAcciones(alerta.tipoAlerta, alerta.severidad)
            }
          })

        // Agregar alertas de patrones si está habilitado
        if (configuracion.alertasPatrones) {
          const alertasPatrones = await detectarPatronesSospechosos()
          todasLasAlertas = [...todasLasAlertas, ...alertasPatrones]
        }

        // Agregar alertas de tendencias si está habilitado
        if (configuracion.alertasTendencias) {
          const alertasTendencias = await detectarTendenciasNegativas()
          todasLasAlertas = [...todasLasAlertas, ...alertasTendencias]
        }

        // Actualizar estado de lectura basado en alertasLeidas actual
        todasLasAlertas = todasLasAlertas.map(alerta => ({
          ...alerta,
          leida: alertasLeidas.has(alerta.id)
        }))

        // Ordenar por severidad y fecha
        todasLasAlertas.sort((a, b) => {
          const severidadOrden = { critica: 4, alta: 3, media: 2, leve: 1 }
          const ordenA = severidadOrden[a.severidad]
          const ordenB = severidadOrden[b.severidad]
          
          if (ordenA !== ordenB) return ordenB - ordenA
          return b.fechaCreacion.getTime() - a.fechaCreacion.getTime()
        })

        setAlertas(todasLasAlertas)
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
    }
    
    setLoading(false)
  }

  const detectarPatronesSospechosos = async (): Promise<AlertaCierre[]> => {
    const { data: cierres } = await cierresCajaService.getCierresDetallados({
      companyId,
      fechaDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
    })

    if (!cierres) return []

    const alertasPatrones: AlertaCierre[] = []

    // Agrupar por cajero para detectar patrones
    const cierresPorCajero = new Map<string, CierreDetalladoUI[]>()
    cierres.forEach(cierre => {
      const cajeroId = cierre.caja.usuario?.id || 'sin-cajero'
      if (!cierresPorCajero.has(cajeroId)) {
        cierresPorCajero.set(cajeroId, [])
      }
      cierresPorCajero.get(cajeroId)!.push(cierre)
    })

    // Analizar patrones por cajero
    cierresPorCajero.forEach((cierresCajero, _cajeroId) => {
      if (cierresCajero.length < 3) return // Necesitamos al menos 3 cierres para detectar patrones

      // Patrón 1: Discrepancias consistentemente altas (usar discrepancia reporte Z en USD)
      const discrepanciasAltas = cierresCajero.filter(c => c.resumen.discrepanciaReporteZUsd > configuracion.umbraldiscrepanciaMedia)
      if (discrepanciasAltas.length / cierresCajero.length > 0.6) {
        const ultimoCierre = cierresCajero[cierresCajero.length - 1]
        if (ultimoCierre.id) { // Solo procesar si tiene ID
          const alertaId = `${ultimoCierre.id}-patron-discrepancias`
          alertasPatrones.push({
            id: alertaId,
            cierre: ultimoCierre,
            tipoAlerta: 'patron_sospechoso',
            severidad: 'alta',
            mensaje: `Patrón de discrepancias altas detectado: ${discrepanciasAltas.length} de ${cierresCajero.length} cierres`,
            fechaCreacion: new Date(),
            leida: alertasLeidas.has(alertaId),
            acciones: ['revisar_capacitacion', 'supervision_directa', 'auditoria_cierres']
          })
        }
      }

      // Patrón 2: Siempre faltante o sobrante (usar discrepancia reporte Z)
      const faltantes = cierresCajero.filter(c => c.resumen.discrepanciaReporteZ > 0 && c.resumen.discrepanciaReporteZUsd > 1)
      const sobrantes = cierresCajero.filter(c => c.resumen.discrepanciaReporteZ < 0 && c.resumen.discrepanciaReporteZUsd > 1)
      
      if (faltantes.length / cierresCajero.length > 0.8 || sobrantes.length / cierresCajero.length > 0.8) {
        const ultimoCierre = cierresCajero[cierresCajero.length - 1]
        if (ultimoCierre.id) { // Solo procesar si tiene ID
          const tipo = faltantes.length > sobrantes.length ? 'faltantes' : 'sobrantes'
          const alertaId = `${ultimoCierre.id}-patron-${tipo}`
          alertasPatrones.push({
            id: alertaId,
            cierre: ultimoCierre,
            tipoAlerta: 'patron_sospechoso',
            severidad: 'media',
            mensaje: `Patrón de ${tipo} consistentes detectado en los últimos cierres`,
            fechaCreacion: new Date(),
            leida: alertasLeidas.has(alertaId),
            acciones: ['verificar_procedimientos', 'capacitacion_conteo']
          })
        }
      }

      // Patrón 3: Incremento progresivo de discrepancias
      if (cierresCajero.length >= 5) {
        const ultimos5 = cierresCajero.slice(-5)
        let tendenciaAscendente = true
        
        for (let i = 1; i < ultimos5.length; i++) {
          if (ultimos5[i].resumen.discrepanciaReporteZUsd <= ultimos5[i-1].resumen.discrepanciaReporteZUsd) {
            tendenciaAscendente = false
            break
          }
        }

        if (tendenciaAscendente) {
          const ultimoCierre = ultimos5[ultimos5.length - 1]
          if (ultimoCierre.id) { // Solo procesar si tiene ID
            const alertaId = `${ultimoCierre.id}-tendencia-ascendente`
            alertasPatrones.push({
              id: alertaId,
              cierre: ultimoCierre,
              tipoAlerta: 'tendencia_negativa',
              severidad: 'alta',
              mensaje: 'Tendencia ascendente en discrepancias detectada en los últimos 5 cierres',
              fechaCreacion: new Date(),
              leida: alertasLeidas.has(alertaId),
              acciones: ['intervencion_inmediata', 'revision_procedimientos']
            })
          }
        }
      }
    })

    return alertasPatrones
  }

  const detectarTendenciasNegativas = async (): Promise<AlertaCierre[]> => {
    const { data: cierres } = await cierresCajaService.getCierresDetallados({
      companyId,
      fechaDesde: new Date(Date.now() - configuracion.diasAnalisisTendencia * 24 * 60 * 60 * 1000)
    })

    if (!cierres || cierres.length < 5) return []

    const alertasTendencias: AlertaCierre[] = []

    // Analizar tendencia general de la empresa/compañía
    const promedioPorDia = new Map<string, { total: number, count: number }>()
    
    cierres.forEach(cierre => {
      const dia = format(cierre.caja.fecha, 'yyyy-MM-dd')
      if (!promedioPorDia.has(dia)) {
        promedioPorDia.set(dia, { total: 0, count: 0 })
      }
      const stats = promedioPorDia.get(dia)!
      stats.total += cierre.resumen.discrepanciaReporteZUsd
      stats.count++
    })

    const promediosDiarios = Array.from(promedioPorDia.entries())
      .map(([dia, stats]) => ({
        dia,
        promedio: stats.total / stats.count
      }))
      .sort((a, b) => a.dia.localeCompare(b.dia))

    // Detectar tendencia ascendente en los últimos días
    if (promediosDiarios.length >= 3) {
      const ultimos3 = promediosDiarios.slice(-3)
      let tendenciaAscendente = true
      
      for (let i = 1; i < ultimos3.length; i++) {
        if (ultimos3[i].promedio <= ultimos3[i-1].promedio) {
          tendenciaAscendente = false
          break
        }
      }

      if (tendenciaAscendente && ultimos3[ultimos3.length - 1].promedio > configuracion.umbraldiscrepanciaLeve) {
        const ultimoCierre = cierres[cierres.length - 1]
        if (ultimoCierre.id) { // Solo procesar si tiene ID
          const alertaId = `${ultimoCierre.id}-tendencia-general-negativa`
          alertasTendencias.push({
            id: alertaId,
            cierre: ultimoCierre,
            tipoAlerta: 'tendencia_negativa',
            severidad: 'alta',
            mensaje: 'Tendencia general negativa detectada: incremento progresivo de discrepancias',
            fechaCreacion: new Date(),
            leida: alertasLeidas.has(alertaId),
            acciones: ['revision_procesos', 'capacitacion_general', 'auditoria_sistemas']
          })
        }
      }
    }

    return alertasTendencias
  }

  const generarAcciones = (tipo: string, severidad: string): string[] => {
    const acciones: string[] = []

    switch (tipo) {
      case 'discrepancia_alta':
        acciones.push('revisar_conteo', 'verificar_transacciones')
        if (severidad === 'alta' || severidad === 'critica') {
          acciones.push('supervision_directa', 'auditoria_inmediata')
        }
        break
      case 'discrepancia_reporte_z':
        acciones.push('verificar_reporte_z', 'revisar_sistema_fiscal')
        break
      case 'sin_detalles':
        acciones.push('completar_detalles', 'capacitacion_procedimientos')
        break
      case 'patron_sospechoso':
        acciones.push('investigacion_detallada', 'supervision_continua')
        break
      case 'tendencia_negativa':
        acciones.push('intervencion_inmediata', 'revision_procesos')
        break
    }

    return acciones
  }

  const aplicarFiltros = () => {
    let filtradas = [...alertas]

    if (filtroSeveridad !== 'todas') {
      filtradas = filtradas.filter(alerta => alerta.severidad === filtroSeveridad)
    }

    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter(alerta => alerta.tipoAlerta === filtroTipo)
    }

    if (soloNoLeidas) {
      filtradas = filtradas.filter(alerta => !alerta.leida)
    }

    setAlertasFiltradas(filtradas)
  }

  const marcarComoLeida = async (alertaId: string) => {
    const nuevasAlertasLeidas = new Set(alertasLeidas)
    nuevasAlertasLeidas.add(alertaId)
    setAlertasLeidas(nuevasAlertasLeidas)
    
    // Guardar en base de datos
    await saveAlertaLeidaToDB(alertaId)
    
    setAlertas(prev => prev.map(alerta => 
      alerta.id === alertaId ? { ...alerta, leida: true } : alerta
    ))
  }

  const marcarTodasComoLeidas = async () => {
    const todasLasAlertasIds = alertas.map(alerta => alerta.id)
    const nuevasAlertasLeidas = new Set([...alertasLeidas, ...todasLasAlertasIds])
    setAlertasLeidas(nuevasAlertasLeidas)
    
    // Guardar en base de datos
    await saveMultiplesAlertasLeidasToDB(todasLasAlertasIds)
    
    setAlertas(prev => prev.map(alerta => ({ ...alerta, leida: true })))
  }

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-200'
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'leve': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeveridadIcon = (severidad: string) => {
    switch (severidad) {
      case 'critica': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'alta': return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
      case 'media': return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'leve': return <BellIcon className="h-5 w-5 text-blue-600" />
      default: return <BellIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTipoAlertaLabel = (tipo: string) => {
    switch (tipo) {
      case 'discrepancia_alta': return 'Discrepancia Alta'
      case 'discrepancia_reporte_z': return 'Discrepancia Report Z'
      case 'sin_detalles': return 'Sin Detalles'
      case 'patron_sospechoso': return 'Patrón Sospechoso'
      case 'tendencia_negativa': return 'Tendencia Negativa'
      default: return 'Alerta General'
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const alertasNoLeidas = alertas.filter(a => !a.leida).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">
            Sistema de Alertas
            {alertasNoLeidas > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {alertasNoLeidas} nuevas
              </span>
            )}
          </h2>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
          >
            Configurar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={marcarTodasComoLeidas}
            disabled={alertasNoLeidas === 0}
          >
            Marcar todas leídas
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              setAlertasLeidasLoaded(false)
              await loadAlertasLeidasFromDB()
              // loadAlertas se ejecutará automáticamente cuando alertasLeidasLoaded sea true
            }}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Configuración */}
      {mostrarConfiguracion && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Alertas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral Discrepancia Leve (USD)
              </label>
              <input
                type="number"
                value={configuracion.umbraldiscrepanciaLeve}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, umbraldiscrepanciaLeve: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">0-5$ USD = Leve</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral Discrepancia Media (USD)
              </label>
              <input
                type="number"
                value={configuracion.umbraldiscrepanciaMedia}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, umbraldiscrepanciaMedia: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="15"
              />
              <p className="text-xs text-gray-500 mt-1">5-15$ USD = Media</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral Discrepancia Alta (USD)
              </label>
              <input
                type="number"
                value={configuracion.umbraldiscrepanciaAlta}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, umbraldiscrepanciaAlta: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="15"
              />
              <p className="text-xs text-gray-500 mt-1">15+ USD = Alta</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={configuracion.alertasPatrones}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, alertasPatrones: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Detectar Patrones Sospechosos
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={configuracion.alertasTendencias}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, alertasTendencias: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Detectar Tendencias Negativas
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todas">Todas las severidades</option>
            <option value="critica">Críticas</option>
            <option value="alta">Altas</option>
            <option value="media">Medias</option>
            <option value="leve">Leves</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los tipos</option>
            <option value="discrepancia_alta">Discrepancias Altas</option>
            <option value="discrepancia_reporte_z">Discrepancias Report Z</option>
            <option value="sin_detalles">Sin Detalles</option>
            <option value="patron_sospechoso">Patrones Sospechosos</option>
            <option value="tendencia_negativa">Tendencias Negativas</option>
          </select>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={soloNoLeidas}
              onChange={(e) => setSoloNoLeidas(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Solo no leídas
            </label>
          </div>
        </div>
      </Card>

      {/* Lista de alertas */}
      <Card className="p-6">
        {alertasFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {alertas.length === 0 ? 'No hay alertas' : 'No hay alertas que coincidan con los filtros'}
            </h3>
            <p className="text-gray-600">
              {alertas.length === 0 
                ? 'Todos los cierres están funcionando correctamente.' 
                : 'Intenta ajustar los filtros para ver más alertas.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertasFiltradas.map((alerta) => (
              <div
                key={alerta.id}
                className={`border rounded-lg p-4 ${alerta.leida ? 'bg-gray-50 opacity-75' : 'bg-white'} ${getSeveridadColor(alerta.severidad)} border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getSeveridadIcon(alerta.severidad)}
                      <h4 className="text-lg font-semibold text-gray-900">
                        {getTipoAlertaLabel(alerta.tipoAlerta)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeveridadColor(alerta.severidad)}`}>
                        {alerta.severidad.toUpperCase()}
                      </span>
                      {!alerta.leida && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3">{alerta.mensaje}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{format(alerta.cierre.caja.fecha, 'dd/MM/yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{alerta.cierre.caja.usuario?.full_name || 'Sin cajero'}</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Discrepancia: Bs {formatMoney(Math.abs(alerta.cierre.resumen.discrepanciaTotal))}</span>
                      </div>
                    </div>

                    {alerta.acciones && alerta.acciones.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Acciones recomendadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {alerta.acciones.map((accion, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {accion.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {onVerDetalle && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onVerDetalle(alerta.cierre)}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Ver Detalle
                      </Button>
                    )}
                    
                    {!alerta.leida && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => marcarComoLeida(alerta.id)}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Marcar leída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}