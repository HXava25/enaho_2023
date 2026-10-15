const fieldAliases = {
  department: ['department', 'departamento', 'region', 'ubigeo_nombre'],
  year: ['year', 'anio', 'ano', 'periodo'],
  povertyRate: ['povertyrate', 'pobreza', 'pobreza_monetaria', 'pobreza_monetaria_pct'],
  monthlyIncome: ['monthlyincome', 'ingreso', 'ingreso_mensual', 'ingreso_promedio'],
  employmentRate: ['employmentrate', 'empleo', 'tasa_empleo', 'ocupacion'],
  educationYears: ['educationyears', 'educacion', 'anos_educacion', 'anios_educacion'],
  waterAccess: ['wateraccess', 'agua', 'agua_red', 'acceso_agua'],
  electricityAccess: ['electricityaccess', 'electricidad', 'luz', 'acceso_electricidad'],
  internetAccess: ['internetaccess', 'internet', 'acceso_internet'],
}

function normalizeHeader(header) {
  return header
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseRows(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i]
    if (character === '"' && quoted && text[i + 1] === '"') {
      cell += '"'
      i += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  if (quoted) throw new Error('El CSV contiene una comilla sin cerrar.')
  return rows
}

export function parseEnahoCsv(text) {
  const rows = parseRows(text.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('El archivo debe tener encabezados y al menos una fila de datos.')

  const headers = rows[0].map(normalizeHeader)
  const indexes = Object.fromEntries(
    Object.entries(fieldAliases).map(([field, aliases]) => [
      field,
      headers.findIndex((header) => aliases.includes(header)),
    ]),
  )
  const required = [
    'department', 'year', 'povertyRate', 'monthlyIncome', 'employmentRate',
    'educationYears', 'waterAccess', 'electricityAccess', 'internetAccess',
  ]
  const missing = required.filter((field) => indexes[field] < 0)
  if (missing.length) {
    throw new Error(
      `Faltan columnas obligatorias: ${missing.map((field) => fieldAliases[field][0]).join(', ')}.`,
    )
  }

  const seenObservations = new Set()
  return rows.slice(1).map((cells, index) => {
    const department = cells[indexes.department]?.trim()
    const year = Number(cells[indexes.year])
    if (!department || !Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new Error(`Fila ${index + 2}: departamento o año inválido.`)
    }
    const recordKey = `${year}-${department.toLocaleLowerCase('es')}`
    if (seenObservations.has(recordKey)) {
      throw new Error(`Fila ${index + 2}: ya existe una observación para ${department} en ${year}.`)
    }
    seenObservations.add(recordKey)

    const observation = { id: `csv-${Date.now()}-${index}`, department, year }
    for (const [field, columnIndex] of Object.entries(indexes)) {
      if (field === 'department' || field === 'year') continue
      if (columnIndex < 0 || !cells[columnIndex]?.trim()) {
        throw new Error(`Fila ${index + 2}: falta el valor de ${fieldAliases[field][0]}.`)
      }
      const value = Number(cells[columnIndex])
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Fila ${index + 2}: el valor de ${fieldAliases[field][0]} debe ser un número positivo.`)
      }
      if (['povertyRate', 'employmentRate', 'waterAccess', 'electricityAccess', 'internetAccess'].includes(field) && value > 100) {
        throw new Error(`Fila ${index + 2}: ${fieldAliases[field][0]} debe estar entre 0 y 100.`)
      }
      observation[field] = value
    }
    return observation
  })
}
