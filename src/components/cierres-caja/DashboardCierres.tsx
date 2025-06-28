// src/components/cierres-caja/DashboardCierres.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cierresCajaService, ResumenCierres } from '@/lib/services/cierresCajaService'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { format, subDays, eachDayOfInterval } from 'date-fns'

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']

interface TendenciaData {
  fecha: string
  fechaDisplay: string
  totalCierres: number
  cierresConDiscrepancias: number
  promedioDiscrepancia: number
  montoTotal: number
  eficiencia: number
}

interface CajeroStats {
  cajero: string
  cierres: number
  discrepanciasTotal: number
  promedioDiscrepancia: number
  eficiencia: number
  tendencia: 'mejorando' | 'estable' | 'empeorando'
}

interface DistribucionDiscrepancia {
  rango: string
  cantidad: number
  porcentaje: number
}

interface AlertaDiscrepancia {
  id: string
  tipo: string
  descripcion: string
  urgencia: 'alta' | 'media' | 'baja'
  fecha: string
  cajero?: string
  monto?: number
}

export default function DashboardCierres() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenCierres | null>(null)
  const [tendencias, setTendencias] = useState<TendenciaData[]>([])
  const [cajeroStats, setCajeroStats] = useState<CajeroStats[]>([])
  const [distribucionDiscrepancias, setDistribucionDiscrepancias] = useState<DistribucionDiscrepancia[]>([])
  const [alertas, setAlertas] = useState<AlertaDiscrepancia[]>([])
  const [periodoAnalisis, setPeriodoAnalisis] = useState<30 | 60 | 90>(30)

  const isMaster = user?.role === 'master'
  const companyId = isMaster ? undefined : user?.company_id || undefined

  useEffect(() => {
    loadDashboardData()
  }, [user, periodoAnalisis])

  const loadDashboardData = async () => {
    setLoading(true)
    
    try {
      await Promise.all([
        loadResumenGeneral(),
        loadTendencias(),
        loadEstadisticasCajeros(),
        loadDistribucionDiscrepancias(),
        loadAlertas()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
    
    setLoading(false)
  }

  const loadResumenGeneral = async () => {
    const { data } = await cierresCajaService.getResumenCierres(companyId, periodoAnalisis)
    if (data) {
      setResumen(data)
    }
  }

  const loadTendencias = async () => {
    const hoy = new Date()
    const fechaInicio = subDays(hoy, periodoAnalisis)
    
    const { data: cierres } = await cierresCajaService.getCierresDetallados({
      fechaDesde: fechaInicio,
      fechaHasta: hoy,
      companyId
    })

    if (cierres) {
      // Crear un mapa de días para el período
      const dias = eachDayOfInterval({ start: fechaInicio, end: hoy })
      const tendenciasMap = new Map()

      // Inicializar todos los días
      dias.forEach(dia => {
        const fechaKey = format(dia, 'yyyy-MM-dd')
        tendenciasMap.set(fechaKey, {
          fecha: fechaKey,
          fechaDisplay: format(dia, 'dd/MM'),
          totalCierres: 0,
          cierresConDiscrepancias: 0,
          promedioDiscrepancia: 0,
          montoTotal: 0,
          sumaDiscrepancias: 0
        })
      })

      // Procesar cierres por día
      cierres.forEach(cierre => {
        const fechaKey = format(cierre.caja.fecha, 'yyyy-MM-dd')
        if (tendenciasMap.has(fechaKey)) {
          const dia = tendenciasMap.get(fechaKey)
          dia.totalCierres++
          dia.montoTotal += cierre.resumen.totalSistemico
          dia.sumaDiscrepancias += cierre.resumen.discrepanciaReporteZUsd || 0
          
          if ((cierre.resumen.discrepanciaReporteZUsd || 0) >= 1) {
            dia.cierresConDiscrepancias++
          }
        }
      })

      // Calcular promedios y eficiencia
      const tendenciasArray: TendenciaData[] = Array.from(tendenciasMap.values())
        .map(dia => ({
          ...dia,
          promedioDiscrepancia: dia.totalCierres > 0 ? dia.sumaDiscrepancias / dia.totalCierres : 0,
          eficiencia: dia.totalCierres > 0 ? ((dia.totalCierres - dia.cierresConDiscrepancias) / dia.totalCierres) * 100 : 100
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))

      setTendencias(tendenciasArray)
    }
  }

  const loadEstadisticasCajeros = async () => {
    const hoy = new Date()
    const fechaInicio = subDays(hoy, periodoAnalisis)
    const fechaAnterior = subDays(fechaInicio, periodoAnalisis) // Período anterior para comparar tendencia
    
    const { data: cierresActuales } = await cierresCajaService.getCierresDetallados({
      fechaDesde: fechaInicio,
      fechaHasta: hoy,
      companyId
    })

    const { data: cierresAnteriores } = await cierresCajaService.getCierresDetallados({
      fechaDesde: fechaAnterior,
      fechaHasta: fechaInicio,
      companyId
    })

    if (cierresActuales) {
      // Estadísticas del período actual
      const cajeroMap = new Map()
      
      cierresActuales.forEach(cierre => {
        const cajero = cierre.caja.usuario?.full_name || 'Sin nombre'
        if (!cajeroMap.has(cajero)) {
          cajeroMap.set(cajero, {
            cierres: 0,
            discrepanciasTotal: 0,
            sumaDiscrepancias: 0
          })
        }
        
        const stats = cajeroMap.get(cajero)
        stats.cierres++
        stats.sumaDiscrepancias += cierre.resumen.discrepanciaReporteZUsd || 0
        
        if ((cierre.resumen.discrepanciaReporteZUsd || 0) >= 1) {
          stats.discrepanciasTotal++
        }
      })

      // Estadísticas del período anterior para calcular tendencia
      const cajeroMapAnterior = new Map()
      if (cierresAnteriores) {
        cierresAnteriores.forEach(cierre => {
          const cajero = cierre.caja.usuario?.full_name || 'Sin nombre'
          if (!cajeroMapAnterior.has(cajero)) {
            cajeroMapAnterior.set(cajero, {
              promedioDiscrepancia: 0,
              sumaDiscrepancias: 0,
              cierres: 0
            })
          }
          
          const stats = cajeroMapAnterior.get(cajero)
          stats.cierres++
          stats.sumaDiscrepancias += cierre.resumen.discrepanciaReporteZUsd || 0
        })

        // Calcular promedios anteriores
        cajeroMapAnterior.forEach((stats) => {
          stats.promedioDiscrepancia = stats.cierres > 0 ? stats.sumaDiscrepancias / stats.cierres : 0
        })
      }

      // Procesar estadísticas finales
      const cajeroStatsArray: CajeroStats[] = Array.from(cajeroMap.entries())
        .map(([cajero, stats]) => {
          const promedioDiscrepancia = stats.cierres > 0 ? stats.sumaDiscrepancias / stats.cierres : 0
          const eficiencia = stats.cierres > 0 ? ((stats.cierres - stats.discrepanciasTotal) / stats.cierres) * 100 : 100
          
          // Calcular tendencia
          let tendencia: 'mejorando' | 'estable' | 'empeorando' = 'estable'
          const statsAnterior = cajeroMapAnterior.get(cajero)
          if (statsAnterior && statsAnterior.cierres > 0) {
            const diferencia = promedioDiscrepancia - statsAnterior.promedioDiscrepancia
            if (diferencia < -1) tendencia = 'mejorando'   // Mejor si discrepancia baja más de 1 USD
            else if (diferencia > 1) tendencia = 'empeorando'  // Peor si discrepancia sube más de 1 USD
          }

          return {
            cajero,
            cierres: stats.cierres,
            discrepanciasTotal: stats.discrepanciasTotal,
            promedioDiscrepancia,
            eficiencia,
            tendencia
          }
        })
        .sort((a, b) => b.eficiencia - a.eficiencia)

      setCajeroStats(cajeroStatsArray)
    }
  }

  const loadDistribucionDiscrepancias = async () => {
    const hoy = new Date()
    const fechaInicio = subDays(hoy, periodoAnalisis)
    
    const { data: cierres } = await cierresCajaService.getCierresDetallados({
      fechaDesde: fechaInicio,
      fechaHasta: hoy,
      companyId
    })

    if (cierres) {
      const rangos = {
        'Cuadrados (< $1)': 0,
        'Leves ($1-5)': 0,
        'Medias ($5-15)': 0,
        'Altas (> $15)': 0
      }

      cierres.forEach(cierre => {
        const discrepanciaUsd = cierre.resumen.discrepanciaReporteZUsd || 0
        
        if (discrepanciaUsd < 1) rangos['Cuadrados (< $1)']++
        else if (discrepanciaUsd < 5) rangos['Leves ($1-5)']++
        else if (discrepanciaUsd < 15) rangos['Medias ($5-15)']++
        else rangos['Altas (> $15)']++
      })

      const distribucion = Object.entries(rangos).map(([rango, cantidad]) => ({
        rango,
        cantidad,
        porcentaje: cierres.length > 0 ? (cantidad / cierres.length) * 100 : 0
      }))

      setDistribucionDiscrepancias(distribucion)
    }
  }

  const loadAlertas = async () => {
    const { data } = await cierresCajaService.getAlertasDiscrepancias(companyId, 0) // Obtener todas las alertas
    if (data) {
      // Mapear las alertas al formato esperado
      const alertasMapeadas: AlertaDiscrepancia[] = data.slice(0, 10).map((alerta, index) => ({
        id: `alerta-${index}-${alerta.cierre.id}`,
        tipo: alerta.tipoAlerta,
        descripcion: alerta.mensaje,
        urgencia: alerta.severidad === 'alta' ? 'alta' : alerta.severidad === 'media' ? 'media' : 'baja',
        fecha: alerta.cierre.caja.fecha.toString(),
        cajero: alerta.cierre.caja.usuario?.full_name || undefined,
        monto: alerta.cierre.resumen.discrepanciaTotal
      }))
      setAlertas(alertasMapeadas)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTendenciaIcon = (tendencia: 'mejorando' | 'estable' | 'empeorando') => {
    switch (tendencia) {
      case 'mejorando': return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
      case 'empeorando': return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Analítico de Cierres</h2>
          <p className="text-gray-600">Análisis detallado de rendimiento y tendencias</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periodoAnalisis}
            onChange={(e) => setPeriodoAnalisis(Number(e.target.value) as 30 | 60 | 90)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <Button onClick={loadDashboardData} size="sm">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas principales mejoradas */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cierres</p>
                <p className="text-2xl font-bold text-gray-900">{resumen.totalCierres}</p>
                <p className="text-xs text-gray-500">Últimos {periodoAnalisis} días</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                <p className="text-2xl font-bold text-green-600">
                  {resumen.totalCierres > 0 ? 
                    `${(((resumen.totalCierres - resumen.cierresConDiscrepancias) / resumen.totalCierres) * 100).toFixed(1)}%` : 
                    '100%'
                  }
                </p>
                <p className="text-xs text-gray-500">Cierres cuadrados</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Discrepancias</p>
                <p className="text-2xl font-bold text-red-600">{resumen.cierresConDiscrepancias}</p>
                <p className="text-xs text-gray-500">Promedio: Bs {formatMoney(resumen.promedioDiscrepancia)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Volumen Total</p>
                <p className="text-2xl font-bold text-purple-600">Bs {formatMoney(resumen.montoTotalCierres)}</p>
                <p className="text-xs text-gray-500">En cierres procesados</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de eficiencia */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia de Eficiencia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tendencias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fechaDisplay" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Eficiencia']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="eficiencia"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribución de discrepancias */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Discrepancias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribucionDiscrepancias}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="cantidad"
              >
                {distribucionDiscrepancias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Cierres']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tendencia de cierres y montos */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Volumen de Cierres y Montos</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={tendencias}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fechaDisplay" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="cierres"
              orientation="left"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="montos"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `Bs ${formatMoney(value)}`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'totalCierres' ? value : `Bs ${formatMoney(value)}`,
                name === 'totalCierres' ? 'Cierres' : 'Monto Total'
              ]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend />
            <Bar yAxisId="cierres" dataKey="totalCierres" fill="#3B82F6" name="totalCierres" />
            <Bar yAxisId="cierres" dataKey="cierresConDiscrepancias" fill="#EF4444" name="cierresConDiscrepancias" />
            <Line yAxisId="montos" type="monotone" dataKey="montoTotal" stroke="#10B981" strokeWidth={3} name="montoTotal" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Estadísticas por cajero */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
          Rendimiento por Cajero
        </h3>
        
        {cajeroStats.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay datos de cajeros para el período seleccionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cajeroStats.map((cajero, index) => (
              <div key={cajero.cajero} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      {cajero.cajero}
                      {getTendenciaIcon(cajero.tendencia)}
                    </p>
                    <p className="text-xs text-gray-500">{cajero.cierres} cierres realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cajero.eficiencia.toFixed(1)}% eficiencia
                      </p>
                      <p className="text-xs text-gray-500">
                        Promedio disc: Bs {formatMoney(cajero.promedioDiscrepancia)}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      cajero.eficiencia >= 90 ? 'bg-green-500' :
                      cajero.eficiencia >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Panel de alertas */}
      {alertas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            Alertas Recientes
          </h3>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  alerta.urgencia === 'alta' ? 'bg-red-50 border-red-200' :
                  alerta.urgencia === 'media' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(alerta.fecha), 'dd/MM/yyyy')} - {alerta.cajero || 'Sin cajero'}
                    </p>
                    <p className="text-sm text-gray-600">{alerta.descripcion}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alerta.urgencia === 'alta' ? 'bg-red-100 text-red-800' :
                    alerta.urgencia === 'media' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alerta.urgencia}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}