import React, { Profiler, useCallback, useRef, useState } from 'react'

const number = (value) => new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2,
}).format(value)

export default function RenderProfiler({ children }) {
  const recordingRef = useRef(false)
  const entriesRef = useRef([])
  const [recording, setRecording] = useState(false)
  const [results, setResults] = useState([])

  const handleRender = useCallback((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    if (!recordingRef.current) return
    entriesRef.current.push({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    })
  }, [])

  const startRecording = () => {
    entriesRef.current = []
    setResults([])
    recordingRef.current = true
    setRecording(true)
  }

  const stopRecording = () => {
    recordingRef.current = false
    setRecording(false)
    setResults([...entriesRef.current])
  }

  const exportResults = () => {
    const blob = new Blob([JSON.stringify({
      capturedAt: new Date().toISOString(),
      profiler: 'React.Profiler',
      commits: results,
    }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'enaho-profiler-evidence.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const averageDuration = results.length
    ? results.reduce((sum, entry) => sum + entry.actualDuration, 0) / results.length
    : 0

  return (
    <>
      <Profiler id="ENAHO Dashboard" onRender={handleRender}>
        {children}
      </Profiler>
      <section className="profiler-panel" id="profiler-panel" aria-labelledby="profiler-title">
        <div className="profiler-heading">
          <div>
            <span className="panel-kicker">VALIDACIÓN DE RENDIMIENTO</span>
            <h2 id="profiler-title">React Profiler</h2>
            <p className="panel-subtitle">
              Graba commits del dashboard mientras filtras, ordenas o cambias de periodo.
            </p>
          </div>
          <span className={`profiler-status ${recording ? 'is-recording' : ''}`}>
            <span />{recording ? 'Grabando' : 'Listo'}
          </span>
        </div>
        <div className="profiler-controls">
          {!recording
            ? <button className="button primary" onClick={startRecording}>● Iniciar grabación</button>
            : <button className="button profiler-stop" onClick={stopRecording}>■ Detener y guardar</button>}
          {results.length > 0 && (
            <button className="button secondary" onClick={exportResults}>Descargar evidencia JSON</button>
          )}
          {results.length > 0 && (
            <span className="profiler-summary">
              {results.length} commits · promedio {number(averageDuration)} ms
            </span>
          )}
        </div>
        {recording && (
          <p className="profiler-hint" role="status">
            Interactúa con el dashboard; al detener, se guardarán los commits capturados.
          </p>
        )}
        {results.length > 0 && (
          <div className="profiler-results">
            <div className="profiler-result-header">
              <span>Componente</span><span>Fase</span><span>Render (ms)</span><span>Base (ms)</span>
            </div>
            {results.slice(-8).reverse().map((entry, index) => (
              <div className="profiler-result-row" key={`${entry.commitTime}-${index}`}>
                <span>{entry.id}</span><span>{entry.phase}</span>
                <span>{number(entry.actualDuration)}</span><span>{number(entry.baseDuration)}</span>
              </div>
            ))}
            {results.length > 8 && (
              <p className="profiler-hint">Se muestran los últimos 8; el archivo JSON incluye los {results.length} commits.</p>
            )}
          </div>
        )}
        {!recording && results.length === 0 && (
          <p className="profiler-hint">Pulsa iniciar, realiza varias interacciones y detén la grabación para ver los resultados.</p>
        )}
      </section>
    </>
  )
}
