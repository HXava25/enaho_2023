const departments = [
  ['Amazonas', 38.2, 1120, 72.4, 8.1, 68, 78, 22],
  ['Áncash', 24.8, 1380, 74.2, 9.2, 82, 91, 43],
  ['Apurímac', 36.5, 1080, 70.1, 8.4, 71, 83, 25],
  ['Arequipa', 12.4, 1980, 71.8, 11.2, 91, 97, 72],
  ['Ayacucho', 33.1, 1160, 69.7, 8.6, 72, 84, 31],
  ['Cajamarca', 40.5, 1030, 76.2, 7.8, 64, 76, 19],
  ['Callao', 13.8, 1940, 69.2, 11.1, 90, 98, 79],
  ['Cusco', 25.4, 1430, 72.8, 9.5, 77, 90, 47],
  ['Huancavelica', 39.7, 990, 68.5, 7.9, 61, 73, 17],
  ['Huánuco', 34.6, 1110, 74.1, 8.2, 69, 81, 26],
  ['Ica', 10.8, 1780, 71.5, 10.4, 88, 97, 61],
  ['Junín', 22.6, 1490, 73.5, 9.7, 80, 92, 49],
  ['La Libertad', 22.9, 1450, 72.6, 9.4, 83, 94, 48],
  ['Lambayeque', 20.8, 1510, 70.8, 9.6, 86, 95, 54],
  ['Lima', 17.1, 2050, 69.8, 11.5, 93, 99, 82],
  ['Loreto', 40.1, 1120, 73.4, 8.3, 55, 69, 18],
  ['Madre de Dios', 17.6, 1680, 76.8, 9.8, 69, 87, 38],
  ['Moquegua', 11.2, 1870, 70.2, 10.8, 89, 97, 67],
  ['Pasco', 25.9, 1390, 72.1, 9.1, 72, 88, 37],
  ['Piura', 29.4, 1290, 72.7, 8.9, 79, 91, 40],
  ['Puno', 34.7, 1050, 72.5, 8.7, 65, 80, 23],
  ['San Martín', 27.2, 1320, 75.1, 8.8, 76, 88, 32],
  ['Tacna', 13.9, 1840, 70.1, 10.7, 90, 97, 70],
  ['Tumbes', 19.6, 1550, 72.3, 9.3, 83, 94, 49],
  ['Ucayali', 29.3, 1300, 74.2, 8.6, 63, 78, 27],
]

const years = [2020, 2021, 2022, 2023, 2024]

export const sampleData = years.flatMap((year, yearIndex) =>
  departments.map(([department, povertyRate, monthlyIncome, employmentRate, educationYears, waterAccess, electricityAccess, internetAccess], index) => {
    const change = years.length - yearIndex - 1
    const regionalOffset = ((index % 5) - 2) * 0.14
    return {
      id: `${year}-${department}`,
      department,
      year,
      povertyRate: Number((povertyRate + change * 1.35 + regionalOffset).toFixed(1)),
      monthlyIncome: Math.round(monthlyIncome * (1 - change * 0.018)),
      employmentRate: Number((employmentRate - change * 0.45 + regionalOffset).toFixed(1)),
      educationYears: Number((educationYears - change * 0.04).toFixed(1)),
      waterAccess: Number((waterAccess - change * 0.5).toFixed(1)),
      electricityAccess: Number((electricityAccess - change * 0.25).toFixed(1)),
      internetAccess: Number((internetAccess - change * 1.4).toFixed(1)),
    }
  }),
)

export const metricOptions = [
  { key: 'povertyRate', label: 'Pobreza monetaria', unit: '%', color: '#7357e8' },
  { key: 'monthlyIncome', label: 'Ingreso mensual', unit: 'S/', color: '#168c76' },
  { key: 'employmentRate', label: 'Empleo', unit: '%', color: '#e69a36' },
  { key: 'internetAccess', label: 'Acceso a internet', unit: '%', color: '#4385e8' },
]

export const kpiDefinitions = [
  { key: 'povertyRate', label: 'Pobreza monetaria', unit: '%', decimals: 1, icon: '◒', tint: 'violet', description: 'Población en situación de pobreza' },
  { key: 'monthlyIncome', label: 'Ingreso mensual', unit: 'S/', decimals: 0, icon: 'S/', tint: 'green', description: 'Ingreso promedio por hogar' },
  { key: 'employmentRate', label: 'Empleo', unit: '%', decimals: 1, icon: '↗', tint: 'amber', description: 'Población ocupada' },
  { key: 'internetAccess', label: 'Acceso a internet', unit: '%', decimals: 1, icon: '⌁', tint: 'blue', description: 'Hogares con conexión a internet' },
]
