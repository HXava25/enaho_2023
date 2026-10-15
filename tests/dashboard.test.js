import assert from 'node:assert/strict'
import test from 'node:test'
import { initialState, observationsReducer } from '../src/hooks/useObservationsReducer.js'
import { parseEnahoCsv } from '../src/utils/csv.js'

const validCsv = [
  'department,year,povertyRate,monthlyIncome,employmentRate,educationYears,waterAccess,electricityAccess,internetAccess',
  'Lima,2024,17.1,2050,69.8,11.5,93,99,82',
  'Junín,2023,22.6,1490,73.5,9.7,80,92,49',
].join('\r\n')

test('imports English and Spanish CSV headers, quoted commas and numeric fields', () => {
  const rows = parseEnahoCsv(validCsv)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].department, 'Lima')
  assert.equal(rows[0].povertyRate, 17.1)
  assert.equal(rows[0].year, 2024)

  const spanishCsv = [
    'departamento,año,pobreza_monetaria,ingreso_mensual,tasa_empleo,años_educacion,agua_red,acceso_electricidad,acceso_internet',
    '"Lima, Metropolitana",2024,17.1,2050,69.8,11.5,93,99,82',
  ].join('\n')
  assert.equal(parseEnahoCsv(spanishCsv)[0].department, 'Lima, Metropolitana')
})

test('rejects duplicate records, missing required values and out-of-range percentages', () => {
  assert.throws(
    () => parseEnahoCsv(`${validCsv}\nLima,2024,18,2000,70,10,90,90,80`),
    /ya existe/,
  )
  assert.throws(
    () => parseEnahoCsv(validCsv.replace('Lima,2024,17.1', 'Lima,2024,')),
    /falta el valor/,
  )
  assert.throws(
    () => parseEnahoCsv(validCsv.replace(',17.1,', ',101,')),
    /entre 0 y 100/,
  )
})

test('reducer updates records immutably and supports add, remove, filter and sort', () => {
  const original = initialState
  const added = {
    id: 'test-observation',
    department: 'Prueba',
    year: 2024,
    povertyRate: 10,
  }

  const withAdded = observationsReducer(original, { type: 'ADD', observation: added })
  assert.equal(withAdded.observations.length, original.observations.length + 1)
  assert.equal(original.observations.some((item) => item.id === added.id), false)

  const filtered = observationsReducer(withAdded, { type: 'FILTER', value: 'Prueba' })
  assert.equal(filtered.filter, 'Prueba')
  const selectedMetric = observationsReducer(filtered, { type: 'SET_METRIC', key: 'internetAccess' })
  assert.equal(selectedMetric.metric, 'internetAccess')

  const sortedAscending = observationsReducer(original, { type: 'SORT', key: 'department' })
  assert.deepEqual(sortedAscending.sort, { key: 'department', direction: 'asc' })
  const sortedDescending = observationsReducer(sortedAscending, { type: 'SORT', key: 'department' })
  assert.deepEqual(sortedDescending.sort, { key: 'department', direction: 'desc' })

  const removed = observationsReducer(withAdded, { type: 'REMOVE', id: added.id })
  assert.equal(removed.observations.some((item) => item.id === added.id), false)
  assert.throws(() => observationsReducer(original, { type: 'UNKNOWN' }), /desconocida/)
})
