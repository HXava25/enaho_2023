import { useReducer } from 'react'
import { sampleData } from '../data/sampleData.js'

export const initialState = {
  observations: sampleData,
  source: 'demo',
  filter: 'all',
  metric: 'povertyRate',
  sort: { key: 'povertyRate', direction: 'desc' },
}

export function observationsReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { ...state, observations: [action.observation, ...state.observations] }
    case 'REMOVE':
      return {
        ...state,
        observations: state.observations.filter((item) => item.id !== action.id),
      }
    case 'REPLACE_DATA':
      return { ...state, observations: action.observations, source: 'csv' }
    case 'FILTER':
      return { ...state, filter: action.value }
    case 'SET_METRIC':
      return { ...state, metric: action.key }
    case 'SORT':
      return {
        ...state,
        sort: {
          key: action.key,
          direction:
            state.sort.key === action.key && state.sort.direction === 'asc' ? 'desc' : 'asc',
        },
      }
    default:
      throw new Error(`Acción del reducer desconocida: ${action.type}`)
  }
}

export function useObservationsReducer() {
  return useReducer(observationsReducer, initialState)
}
