import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'


function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function DashboardChart({ data, loading }) {
  if (loading) {
    return (
      <div className="dashboard-chart-skeleton" />
    )
  }
  if (!data?.length) {
    return (
      <div className="dashboard-chart-empty">
        Aucune donnée sur la période sélectionnée.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDateLabel(d.date),
  }))

  return (
    <div className="dashboard-chart">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            stroke="#64748b"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.97)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            labelFormatter={(label, payload) => {
              const date = payload?.[0]?.payload?.date
              return date ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : label
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="prospects"
            name="Prospects"
            stroke="#2563eb"
            fill="#93c5fd"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="devis"
            name="Devis"
            stroke="#059669"
            fill="#6ee7b7"
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
