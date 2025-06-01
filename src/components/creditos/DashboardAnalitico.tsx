// src/components/creditos/DashboardAnalitico.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { creditoService } from '@/lib/services/creditoService'
import { notificationService } from '@/lib/services/notificationService'
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
  Area,
  AreaChart
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { format, subDays } from 'date-fns'

// const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'] // Not used

export default function DashboardAnalitico() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [creditosData, setCreditosData] = useState<any[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [tendencias, setTendencias] = useState<any[]>([])
  const [alertStats, setAlertStats] = useState<any>(null)
  const [clientesTop, setClientesTop] = useState<any[]>([])

  const isMaster = user?.role === 'master'
  const companyId = isMaster ? undefined : user?.company_id || undefined

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    
    try {
      await Promise.all([
        loadEstadisticas(),
        loadTendencias(),
        loadAlertStats(),
        loadClientesTop()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
    
    setLoading(false)
  }

  const loadEstadisticas = async () => {
    const { data: resumen } = await creditoService.getResumenCreditos(companyId)
    if (resumen) {
      setEstadisticas(resumen)
      
      // Datos para gráfico de pie
      const pieData = [
        { name: 'Pagados', value: resumen.creditosPagados, color: '#10B981' },
        { name: 'Pendientes', value: resumen.creditosPendientes, color: '#F59E0B' },
        { name: 'Vencidos', value: resumen.creditosVencidos, color: '#EF4444' }
      ]
      setCreditosData(pieData)
    }
  }

  const loadTendencias = async () => {
    // Obtener créditos de los últimos 30 días
    const hoy = new Date()
    const hace30Dias = subDays(hoy, 30)
    
    const { data: creditos } = await creditoService.getCreditos({
      fechaDesde: hace30Dias,
      fechaHasta: hoy,
      companyId
    })

    if (creditos) {
      // Agrupar por día
      const creditosPorDia = new Map()
      
      for (let i = 0; i < 30; i++) {
        const fecha = subDays(hoy, i)
        const fechaKey = format(fecha, 'yyyy-MM-dd')
        creditosPorDia.set(fechaKey, {
          fecha: fechaKey,
          fechaDisplay: format(fecha, 'dd/MM'),
          creditos: 0,
          monto: 0,
          abonos: 0
        })
      }

      creditos.forEach(credito => {
        const fechaKey = format(credito.fechaHora, 'yyyy-MM-dd')
        if (creditosPorDia.has(fechaKey)) {
          const dia = creditosPorDia.get(fechaKey)
          dia.creditos += 1
          dia.monto += credito.montoBs
          dia.abonos += credito.montoAbonado
        }
      })

      const tendenciasArray = Array.from(creditosPorDia.values())
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-14) // Últimos 14 días
      
      setTendencias(tendenciasArray)
    }
  }

  const loadAlertStats = async () => {
    const { data } = await notificationService.getAlertStats(companyId)
    if (data) {
      setAlertStats(data)
    }
  }

  const loadClientesTop = async () => {
    const { data: clientesMultiples } = await notificationService.getClientesConMultiplesCreditos(companyId)
    if (clientesMultiples) {
      setClientesTop(clientesMultiples.slice(0, 5))
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
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
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Créditos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas?.totalCreditos || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{alertStats?.creditosVencidos || 0}</p>
              <p className="text-xs text-gray-500">Bs {formatMoney(alertStats?.montoTotalVencido || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-yellow-600">{alertStats?.creditosProximosAVencer || 0}</p>
              <p className="text-xs text-gray-500">Bs {formatMoney(alertStats?.montoTotalProximoAVencer || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
              <p className="text-2xl font-bold text-green-600">Bs {formatMoney(estadisticas?.montoPendienteTotal || 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de créditos */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Créditos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={creditosData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {creditosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Créditos']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Tendencia últimos 14 días */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia de Créditos (14 días)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={tendencias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fechaDisplay" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any) => [value, 'Créditos']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="creditos"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Montos por día */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Montos por Día (Últimos 14 días)</h3>
        <ResponsiveContainer width="100%" height={300}>
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
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `Bs ${formatMoney(value)}`}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                `Bs ${formatMoney(value)}`, 
                name === 'monto' ? 'Créditos Otorgados' : 'Abonos Recibidos'
              ]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend />
            <Bar dataKey="monto" fill="#3B82F6" name="monto" />
            <Bar dataKey="abonos" fill="#10B981" name="abonos" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top clientes con múltiples créditos */}
      {clientesTop.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clientes con Múltiples Créditos</h3>
          <div className="space-y-3">
            {clientesTop.map((clienteData, index) => (
              <div key={clienteData.cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{clienteData.cliente.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {clienteData.cliente.tipo_documento}-{clienteData.cliente.numero_documento}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {clienteData.cantidadCreditos} créditos
                  </p>
                  <p className="text-xs text-red-600">
                    Bs {formatMoney(clienteData.totalPendiente)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}