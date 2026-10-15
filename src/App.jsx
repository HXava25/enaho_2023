import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from './contexts/ThemeContext.jsx'
import { useObservationsReducer } from './hooks/useObservationsReducer.js'
import { kpiDefinitions, metricOptions } from './data/sampleData.js'
import { AccessBars, RegionBars, TrendChart } from './components/Charts.jsx'
import RenderProfiler from './components/RenderProfiler.jsx'
import { parseEnahoCsv } from './utils/csv.js'

const format = (value, decimals = 1) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)

const SidebarIcon = memo(function SidebarIcon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    regions: <><path d="M3 6.5 8 4l8 2 5-2.5v14L16 20l-8-2-5 2.5z" /><path d="M8 4v14m8-12v14" /></>,
    trends: <><path d="M3 17 9 11l4 4 8-9" /><path d="M15 6h6v6" /></>,
    services: <><path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" /><path d="m9 12 2 2 4-4" /></>,
    profile: <><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 6-7" /><path d="M16 6h4v4" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
})

const KpiCard = memo(function KpiCard({ metric, value, change }) {
  const positive = metric.key === 'povertyRate' ? change < 0 : change > 0
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${metric.tint}`}>{metric.icon}</div>
      <div className="kpi-label">{metric.label}<span className="info-dot" title={metric.description}>i</span></div>
      <div className="kpi-value">{metric.unit === 'S/' && <span className="currency">S/ </span>}{format(value, metric.decimals)}{metric.unit === '%' && <span className="percent">%</span>}</div>
      <div className={`kpi-change ${positive ? 'good' : 'bad'}`}>
        <span>{change > 0 ? '↑' : change < 0 ? '↓' : '–'} {format(Math.abs(change), 1)}{metric.unit === '%' ? ' pp' : metric.unit === 'S/' ? '' : '%'}</span>
        <span className="change-caption">frente al año anterior</span>
      </div>
    </article>
  )
})

const ObservationRow = memo(function ObservationRow({ item, onRemove }) {
  return (
    <tr>
      <td><span className="region-cell"><span className="region-indicator" />{item.department}</span></td>
      <td>{format(item.povertyRate)}%</td>
      <td>S/ {format(item.monthlyIncome, 0)}</td>
      <td>{format(item.employmentRate)}%</td>
      <td>{format(item.internetAccess)}%</td>
      <td><button className="icon-button remove-button" onClick={() => onRemove(item.id)} aria-label={`Eliminar ${item.department}`} title="Eliminar fila">×</button></td>
    </tr>
  )
})

function Modal({ onClose, onAdd, year, observations }) {
  const [department, setDepartment] = useState('')
  const [povertyRate, setPovertyRate] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [employmentRate, setEmploymentRate] = useState('')
  const [educationYears, setEducationYears] = useState('')
  const [waterAccess, setWaterAccess] = useState('')
  const [electricityAccess, setElectricityAccess] = useState('')
  const [internetAccess, setInternetAccess] = useState('')
  const [error, setError] = useState('')
  const firstInputRef = useRef(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event) => {
    event.preventDefault()
    if (observations.some((item) => item.department.trim().toLocaleLowerCase('es') === department.trim().toLocaleLowerCase('es'))) {
      setError('Ya existe una observación para este departamento y periodo.')
      return
    }
    const rawValues = [
      povertyRate, monthlyIncome, employmentRate, educationYears,
      waterAccess, electricityAccess, internetAccess,
    ]
    const values = rawValues.map(Number)
    if (!department.trim() || rawValues.some((value) => value.trim() === '') ||
      values.some((value) => !Number.isFinite(value) || value < 0) ||
      [values[0], values[2], values[4], values[5], values[6]].some((value) => value > 100)) {
      setError('Completa la región; usa valores entre cero y 100 para las tasas.')
      return
    }
    onAdd({
      id: `manual-${Date.now()}`,
      department: department.trim(),
      year,
      povertyRate: values[0],
      monthlyIncome: values[1],
      employmentRate: values[2],
      educationYears: values[3],
      waterAccess: values[4],
      electricityAccess: values[5],
      internetAccess: values[6],
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><span className="eyebrow">NUEVA OBSERVACIÓN</span><h2 id="modal-title">Agregar departamento</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar">×</button></div>
        <p className="modal-copy">Agrega una fila para el año {year}. Puedes eliminarla después desde la tabla.</p>
        <form onSubmit={submit}>
          <label>Departamento<input ref={firstInputRef} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Ej. Junín" /></label>
          <div className="form-grid">
            <label>Pobreza (%)<input type="number" min="0" max="100" step="0.1" value={povertyRate} onChange={(event) => setPovertyRate(event.target.value)} placeholder="18.5" /></label>
            <label>Ingreso (S/)<input type="number" min="0" step="1" value={monthlyIncome} onChange={(event) => setMonthlyIncome(event.target.value)} placeholder="1450" /></label>
            <label>Empleo (%)<input type="number" min="0" max="100" step="0.1" value={employmentRate} onChange={(event) => setEmploymentRate(event.target.value)} placeholder="72.4" /></label>
            <label>Años de educación<input type="number" min="0" step="0.1" value={educationYears} onChange={(event) => setEducationYears(event.target.value)} placeholder="9.2" /></label>
            <label>Acceso a agua (%)<input type="number" min="0" max="100" step="0.1" value={waterAccess} onChange={(event) => setWaterAccess(event.target.value)} placeholder="82" /></label>
            <label>Acceso a electricidad (%)<input type="number" min="0" max="100" step="0.1" value={electricityAccess} onChange={(event) => setElectricityAccess(event.target.value)} placeholder="94" /></label>
            <label>Acceso a internet (%)<input type="number" min="0" max="100" step="0.1" value={internetAccess} onChange={(event) => setInternetAccess(event.target.value)} placeholder="48" /></label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">Agregar dato <span>＋</span></button></div>
        </form>
      </section>
    </div>
  )
}

function Dashboard() {
  const [state, dispatch] = useObservationsReducer()
  const { theme, toggleTheme } = useTheme()
  const [selectedYear, setSelectedYear] = useState(2024)
  const selectedDepartment = state.filter === 'all' ? 'Todos los departamentos' : state.filter
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [notice, setNotice] = useState({ type: 'info', text: '' })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const years = useMemo(
    () => [...new Set(state.observations.map((item) => item.year))].sort((a, b) => b - a),
    [state.observations],
  )
  const departments = useMemo(
    () => [...new Set(state.observations.map((item) => item.department))].sort((a, b) => a.localeCompare(b, 'es')),
    [state.observations],
  )
  const currentRows = useMemo(
    () => state.observations.filter((item) => item.year === selectedYear),
    [state.observations, selectedYear],
  )
  const scopedRows = useMemo(
    () => selectedDepartment === 'Todos los departamentos'
      ? currentRows
      : currentRows.filter((item) => item.department === selectedDepartment),
    [currentRows, selectedDepartment],
  )
  const previousRows = useMemo(
    () => state.observations.filter((item) => item.year === selectedYear - 1 && (
      selectedDepartment === 'Todos los departamentos' || item.department === selectedDepartment
    )),
    [state.observations, selectedYear, selectedDepartment],
  )
  const averages = useMemo(() => {
    const result = {}
    kpiDefinitions.forEach(({ key }) => {
      result[key] = scopedRows.length
        ? scopedRows.reduce((sum, item) => sum + (item[key] ?? 0), 0) / scopedRows.length
        : 0
    })
    return result
  }, [scopedRows])
  const changes = useMemo(() => Object.fromEntries(kpiDefinitions.map(({ key }) => {
    if (!previousRows.length || !scopedRows.length) return [key, 0]
    const previousAverage = previousRows.reduce((sum, item) => sum + (item[key] ?? 0), 0) / previousRows.length
    return [key, averages[key] - previousAverage]
  })), [averages, previousRows, scopedRows.length])
  const activeMetricInfo = metricOptions.find((metric) => metric.key === state.metric) ?? metricOptions[0]
  const trendRows = useMemo(
    () => selectedDepartment === 'Todos los departamentos'
      ? state.observations
      : state.observations.filter((item) => item.department === selectedDepartment),
    [state.observations, selectedDepartment],
  )
  const tableRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return [...currentRows]
      .filter((item) => (
        (state.filter === 'all' || item.department === state.filter) &&
        item.department.toLocaleLowerCase('es').includes(query)
      ))
      .sort((a, b) => {
        const { key, direction } = state.sort
        const left = a[key] ?? ''
        const right = b[key] ?? ''
        const comparison = typeof left === 'string' ? left.localeCompare(right, 'es') : left - right
        return direction === 'asc' ? comparison : -comparison
      })
  }, [currentRows, search, state.filter, state.sort])

  const handleRemove = useCallback((id) => {
    dispatch({ type: 'REMOVE', id })
  }, [dispatch])
  const handleAdd = useCallback((observation) => {
    dispatch({ type: 'ADD', observation })
    dispatch({ type: 'FILTER', value: observation.department })
    setModalOpen(false)
    setNotice({ type: 'success', text: `${observation.department} se agregó a la tabla.` })
  }, [dispatch])
  const closeModal = useCallback(() => setModalOpen(false), [])

  useEffect(() => {
    if (selectedYear !== years[0] && !years.includes(selectedYear)) {
      setSelectedYear(years[0] ?? new Date().getFullYear())
    }
  }, [selectedYear, years])

  const handleCsvUpload = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const text = await file.text()
      const observations = parseEnahoCsv(text)
      dispatch({ type: 'REPLACE_DATA', observations })
      const latestYear = Math.max(...observations.map((item) => item.year))
      setSelectedYear(latestYear)
      dispatch({ type: 'FILTER', value: 'all' })
      setNotice({ type: 'success', text: `Se importaron ${observations.length} filas desde ${file.name}.` })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo leer el archivo CSV.' })
    } finally {
      setUploading(false)
    }
  }, [dispatch])

  const handleSort = useCallback((key) => dispatch({ type: 'SORT', key }), [dispatch])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#inicio" className="brand" aria-label="ENAHO Observatorio social, inicio">
          <span className="brand-mark"><span>e</span></span>
          <span className="brand-name">enaho<span>OBSERVATORIO SOCIAL</span></span>
        </a>
        <div className="workspace-label">ANÁLISIS DE DATOS</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="nav-link active" href="#resumen"><SidebarIcon name="overview" /><span>Resumen general</span><i /></a>
          <a className="nav-link" href="#regiones"><SidebarIcon name="regions" /><span>Departamentos</span></a>
          <a className="nav-link" href="#tendencias"><SidebarIcon name="trends" /><span>Tendencias</span></a>
          <a className="nav-link" href="#servicios"><SidebarIcon name="services" /><span>Servicios básicos</span></a>
          <a className="nav-link" href="#profiler-panel"><SidebarIcon name="profile" /><span>React Profiler</span></a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-source">
          <span className="source-icon"><SidebarIcon name="upload" /></span>
          <div><strong>Tu información</strong><p>Carga los datos de tu encuesta</p></div>
          <button className="source-action" onClick={() => fileInputRef.current?.click()} aria-label="Cargar un archivo CSV">↗</button>
        </div>
        <div className="sidebar-footer"><span className="status-pulse" /> Plataforma de análisis <span className="version">v1.0</span></div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="breadcrumb"><span>Inicio</span><span className="crumb-divider">/</span><strong>Resumen general</strong></div>
          <div className="topbar-actions">
            <span className="update-label"><span className="status-pulse" /> Datos al día</span>
            <button className="icon-button theme-button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'} title="Cambiar tema">{theme === 'light' ? '☾' : '☀'}</button>
            <div className="avatar" title="Panel de análisis">EN</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading" id="resumen">
            <div>
              <div className="eyebrow"><span className="eyebrow-mark" /> OBSERVATORIO DE HOGARES</div>
              <h1>Panorama social del Perú<span>.</span></h1>
              <p className="page-subtitle">Indicadores clave de bienestar, empleo y acceso a servicios en los hogares peruanos.</p>
            </div>
            <div className="heading-controls">
              <label className="select-label" htmlFor="year-select">PERIODO</label>
              <select id="year-select" className="control-select year-select" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <button className="button primary upload-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <SidebarIcon name="upload" />{uploading ? 'Importando…' : 'Importar datos'}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="visually-hidden" onChange={handleCsvUpload} aria-label="Seleccionar archivo CSV ENAHO" />
            </div>
          </section>

          <section className="data-banner" aria-label="Estado de la fuente de datos">
            <span className={`data-banner-icon ${notice.type === 'error' ? 'error' : ''}`}>{notice.type === 'error' ? '!' : 'i'}</span>
            <p><strong>{notice.text ? (notice.type === 'error' ? 'No se importaron los datos.' : 'Datos actualizados.') : 'Vista previa demostrativa.'}</strong> {notice.text || 'Las cifras iniciales son referenciales. Importa un CSV con microdatos ENAHO procesados para ver tus resultados.'}</p>
            <button className="banner-link" onClick={() => fileInputRef.current?.click()}>Cargar CSV <span>→</span></button>
            {notice.text && <button className="banner-dismiss" onClick={() => setNotice({ type: 'info', text: '' })} aria-label="Cerrar aviso">×</button>}
          </section>

          <section className="kpi-grid" aria-label="Indicadores principales">
            {kpiDefinitions.map((metric) => <KpiCard key={metric.key} metric={metric} value={averages[metric.key]} change={changes[metric.key]} />)}
          </section>
          <p className="aggregation-note">{selectedDepartment === 'Todos los departamentos' ? 'Promedio simple de los departamentos disponibles; no ponderado por población.' : `Indicadores de ${selectedDepartment}.`} La comparación usa el año anterior si está disponible.</p>

          <section className="charts-grid" id="tendencias">
            <article className="panel trend-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">EVOLUCIÓN HISTÓRICA</span><h2>Tendencia de indicadores</h2><p className="panel-subtitle">{selectedDepartment === 'Todos los departamentos' ? 'Promedio departamental' : selectedDepartment} · {years.length} periodos disponibles</p></div>
                <label className="select-wrap"><span className="visually-hidden">Indicador de tendencia</span><select className="control-select metric-select" value={state.metric} onChange={(event) => dispatch({ type: 'SET_METRIC', key: event.target.value })}>{metricOptions.map((metric) => <option key={metric.key} value={metric.key}>{metric.label}</option>)}</select><span className="select-caret">⌄</span></label>
              </div>
              <TrendChart observations={trendRows} metric={activeMetricInfo.key} unit={activeMetricInfo.unit} />
              <div className="chart-footnote"><span className="chart-legend-dot" />{activeMetricInfo.label}<span className="footnote-right">Fuente: {state.source === 'csv' ? 'CSV importado' : 'Muestra demostrativa'}</span></div>
            </article>

            <article className="panel regions-panel" id="regiones">
              <div className="panel-heading">
                <div><span className="panel-kicker">COMPARATIVO TERRITORIAL</span><h2>Departamentos</h2><p className="panel-subtitle">Mayor {activeMetricInfo.label.toLocaleLowerCase('es')} · {selectedYear}</p></div>
                <a className="text-link" href="#tabla">Ver tabla <span>→</span></a>
              </div>
              <RegionBars observations={currentRows} metric={activeMetricInfo.key} color={activeMetricInfo.color} unit={activeMetricInfo.unit} />
            </article>
          </section>

          <section className="lower-grid" id="servicios">
            <article className="panel access-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">CONDICIONES DEL HOGAR</span><h2>Acceso a servicios</h2><p className="panel-subtitle">Porcentaje de hogares · {selectedYear}</p></div>
                <span className="panel-menu" aria-hidden="true">···</span>
              </div>
              <AccessBars observations={scopedRows} />
              <div className="access-note"><span className="info-dot">i</span> Indicadores independientes; no representan segmentos de una sola población.</div>
            </article>
            <article className="panel insight-panel">
              <div className="insight-top"><span className="insight-spark">✳</span><span className="panel-kicker">LECTURA DESTACADA</span></div>
              <h2>{averages.povertyRate < 20 ? 'La pobreza monetaria se mantiene por debajo del 20%.' : `La pobreza monetaria alcanza ${format(averages.povertyRate)}% en la selección actual.`}</h2>
              <p>{selectedDepartment === 'Todos los departamentos' ? `En ${selectedYear}, el ingreso mensual promedio registrado es de S/ ${format(averages.monthlyIncome, 0)}. Usa los filtros para explorar las diferencias entre departamentos.` : `En ${selectedDepartment}, el acceso a internet alcanza ${format(averages.internetAccess)}% y el empleo ${format(averages.employmentRate)}%.`}</p>
              <a href="#tabla" className="insight-link">Explorar datos regionales <span>→</span></a>
              <div className="insight-decoration">ENAHO</div>
            </article>
          </section>

          <section className="panel table-panel" id="tabla">
            <div className="table-heading">
              <div><span className="panel-kicker">DETALLE POR TERRITORIO</span><h2>Indicadores por departamento</h2><p className="panel-subtitle">{tableRows.length} registros para el periodo seleccionado</p></div>
              <div className="table-tools">
                <label className="select-wrap department-select-wrap"><span className="visually-hidden">Filtrar por departamento</span><select className="control-select department-select" value={selectedDepartment} onChange={(event) => dispatch({ type: 'FILTER', value: event.target.value === 'Todos los departamentos' ? 'all' : event.target.value })}><option>Todos los departamentos</option>{departments.map((department) => <option key={department}>{department}</option>)}</select><span className="select-caret">⌄</span></label>
                <label className="search-box"><span>⌕</span><input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar…" aria-label="Buscar departamento" /><kbd>Ctrl K</kbd></label>
                <button className="button secondary add-button" onClick={() => setModalOpen(true)}>＋ <span>Agregar</span></button>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr>
                  <th><button onClick={() => handleSort('department')}>Departamento <span className="sort-mark">{state.sort.key === 'department' ? (state.sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th><button onClick={() => handleSort('povertyRate')}>Pobreza <span className="sort-mark">{state.sort.key === 'povertyRate' ? (state.sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th><button onClick={() => handleSort('monthlyIncome')}>Ingreso mensual <span className="sort-mark">{state.sort.key === 'monthlyIncome' ? (state.sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th><button onClick={() => handleSort('employmentRate')}>Empleo <span className="sort-mark">{state.sort.key === 'employmentRate' ? (state.sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th><button onClick={() => handleSort('internetAccess')}>Acceso a internet <span className="sort-mark">{state.sort.key === 'internetAccess' ? (state.sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th><span className="visually-hidden">Acciones</span></th>
                </tr></thead>
                <tbody>{tableRows.length ? tableRows.map((item) => <ObservationRow key={item.id} item={item} onRemove={handleRemove} />) : <tr><td colSpan="6" className="empty-row">No hay departamentos que coincidan con la búsqueda.</td></tr>}</tbody>
              </table>
            </div>
            <div className="table-footer"><span>Mostrando <strong>{tableRows.length}</strong> de <strong>{currentRows.length}</strong> departamentos</span><span>Promedios departamentales · {selectedYear}</span></div>
          </section>

          <footer className="page-footer"><span>ENAHO <span className="footer-divider">·</span> Observatorio de hogares</span><span>Panel demostrativo para análisis exploratorio <span className="footer-divider">·</span> React</span></footer>
        </div>
      </main>

      {modalOpen && <Modal onClose={closeModal} onAdd={handleAdd} year={selectedYear} observations={currentRows} />}
    </div>
  )
}

export default function App() {
  return (
    <RenderProfiler>
      <Dashboard />
    </RenderProfiler>
  )
}
