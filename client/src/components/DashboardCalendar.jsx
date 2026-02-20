import { useState, useMemo } from 'react'

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = first.getDay()
  const daysInMonth = last.getDate()
  const grid = []
  const prevMonth = new Date(year, month, 0)
  const prevDays = prevMonth.getDate()
  for (let i = 0; i < startDow; i++) {
    grid.push({
      date: new Date(year, month - 1, prevDays - startDow + i + 1),
      isCurrentMonth: false,
      key: `prev-${i}`,
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
      key: `curr-${d}`,
    })
  }
  const remain = 42 - grid.length
  for (let i = 0; i < remain; i++) {
    grid.push({
      date: new Date(year, month + 1, i + 1),
      isCurrentMonth: false,
      key: `next-${i}`,
    })
  }
  return grid
}

function toKey(d) {
  return d.toISOString().slice(0, 10)
}

export function DashboardCalendar({ chartData = [], taches = [] }) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const activityByDate = useMemo(() => {
    const map = {}
    chartData.forEach((d) => {
      map[d.date] = { prospects: d.prospects || 0, devis: d.devis || 0 }
    })
    taches.forEach((t) => {
      if (t.echeance) {
        const k = toKey(new Date(t.echeance))
        if (!map[k]) map[k] = { prospects: 0, devis: 0, taches: 0 }
        map[k].taches = (map[k].taches || 0) + 1
      }
    })
    return map
  }, [chartData, taches])

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
  const goToday = () => setViewDate(new Date())

  const todayKey = toKey(new Date())

  return (
    <div className="dashboard-calendar">
      <div className="dashboard-calendar-header">
        <button type="button" className="cal-nav" onClick={goPrev} aria-label="Mois précédent">
          ‹
        </button>
        <h3 className="cal-title">
          {MOIS[month]} {year}
        </h3>
        <button type="button" className="cal-nav" onClick={goNext} aria-label="Mois suivant">
          ›
        </button>
        <button type="button" className="cal-today" onClick={goToday}>
          Aujourd'hui
        </button>
      </div>
      <div className="dashboard-calendar-grid">
        {JOURS.map((j) => (
          <div key={j} className="cal-dow">
            {j}
          </div>
        ))}
        {grid.map(({ date, isCurrentMonth, key }) => {
          const k = toKey(date)
          const act = activityByDate[k] || {}
          const total = (act.prospects || 0) + (act.devis || 0) + (act.taches || 0)
          const isToday = k === todayKey
          return (
            <div
              key={key}
              className={`cal-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${total > 0 ? 'has-activity' : ''}`}
              title={total > 0 ? `${act.prospects || 0} prospect(s), ${act.devis || 0} devis, ${act.taches || 0} tâche(s)` : ''}
            >
              <span className="cal-day-num">{date.getDate()}</span>
              {total > 0 && (
                <span className="cal-dots">
                  {act.prospects > 0 && <span className="dot prospects" />}
                  {act.devis > 0 && <span className="dot devis" />}
                  {act.taches > 0 && <span className="dot taches" />}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="dashboard-calendar-legend">
        <span><span className="dot prospects" /> Prospects</span>
        <span><span className="dot devis" /> Devis</span>
        <span><span className="dot taches" /> Tâches</span>
      </div>
    </div>
  )
}
