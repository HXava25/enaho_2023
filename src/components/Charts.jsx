import React, { useMemo } from 'react'

const number = (value) =>
  new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(value)

export function TrendChart({ observations, metric, unit }) {
  const points = useMemo(() => {
    const grouped = new Map()
    observations.forEach((item) => {
      const values = grouped.get(item.year) ?? []
      values.push(item[metric] ?? 0)
      grouped.set(item.year, values)
    })
    return [...grouped.entries()]
      .map(([year, values]) => ({
        year: Number(year),
        value: values.reduce((sum, item) => sum + item, 0) / values.length,
      }))
      .sort((a, b) => a.year - b.year)
  }, [observations, metric])

  if (!points.length) return <div className="chart-empty">No hay datos para este filtro.</div>

  const width = 620
  const height = 226
  const pad = { top: 18, right: 16, bottom: 32, left: 42 }
  const values = points.map((point) => point.value)
  const min = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10)
  const max = Math.ceil(Math.max(...values) / 10) * 10 + 10
  const x = (index) => pad.left + (index / Math.max(1, points.length - 1)) * (width - pad.left - pad.right)
  const y = (value) => height - pad.bottom - ((value - min) / (max - min || 1)) * (height - pad.top - pad.bottom)
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ')
  const area = `${path} L ${x(points.length - 1)} ${height - pad.bottom} L ${x(0)} ${height - pad.bottom} Z`

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Evolución de ${metric} por año`}>
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7357e8" stopOpacity=".2" />
            <stop offset="100%" stopColor="#7357e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const value = min + ((max - min) * index) / 3
          const cy = y(value)
          return (
            <g key={index}>
              <line x1={pad.left} x2={width - pad.right} y1={cy} y2={cy} className="chart-gridline" />
              <text x={pad.left - 9} y={cy + 4} textAnchor="end" className="chart-label">
                {number(value)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="url(#trend-fill)" />
        <path d={path} fill="none" stroke="#7357e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={point.year}>
            <circle cx={x(index)} cy={y(point.value)} r="5" fill="#fff" stroke="#7357e8" strokeWidth="3" />
            <text x={x(index)} y={height - 8} textAnchor="middle" className="chart-label">{point.year}</text>
            <title>{point.year}: {unit === 'S/' ? 'S/ ' : ''}{number(point.value)}{unit === '%' ? '%' : ''}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function RegionBars({ observations, metric, color, unit, limit = 8 }) {
  const regions = useMemo(
    () => [...observations]
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
      .slice(0, limit),
    [observations, metric, limit],
  )
  const max = Math.max(1, ...regions.map((region) => region[metric] ?? 0))
  if (!regions.length) return <div className="chart-empty">No hay datos para este año.</div>

  return (
    <div className="region-bars">
      {regions.map((region) => (
        <div className="bar-row" key={region.id}>
          <span className="bar-name" title={region.department}>{region.department}</span>
          <div className="bar-track"><span style={{ width: `${((region[metric] ?? 0) / max) * 100}%`, backgroundColor: color }} /></div>
          <span className="bar-value">{unit === 'S/' ? `S/ ${number(region[metric] ?? 0)}` : `${number(region[metric] ?? 0)}%`}</span>
        </div>
      ))}
    </div>
  )
}

export function AccessBars({ observations }) {
  const averages = useMemo(() => {
    const metrics = [
      ['Agua', 'waterAccess', '#7357e8'],
      ['Electricidad', 'electricityAccess', '#168c76'],
      ['Internet', 'internetAccess', '#e69a36'],
    ]
    return metrics.map(([label, key, color]) => ({
      label,
      color,
      value: observations.length
        ? observations.reduce((sum, item) => sum + (item[key] ?? 0), 0) / observations.length
        : 0,
    }))
  }, [observations])

  return (
    <div className="access-bars">
      {averages.map((item) => (
        <div className="access-bar" key={item.label}>
          <div className="access-bar-label">
            <span className="legend-dot" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{number(item.value)}%</strong>
          </div>
          <div className="access-track"><span style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.color }} /></div>
        </div>
      ))}
    </div>
  )
}
