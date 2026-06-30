export const VehicleType = {
  CAR: 'CAR',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
  SPECIAL: 'SPECIAL'
} as const

export type VehicleType = typeof VehicleType[keyof typeof VehicleType]

export const VehicleStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
} as const

export type VehicleStatus = typeof VehicleStatus[keyof typeof VehicleStatus]

export const FuelType = {
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID'
} as const

export type FuelType = typeof FuelType[keyof typeof FuelType]

export const DocumentType = {
  REGISTRATION: 'REGISTRATION',
  INSURANCE: 'INSURANCE',
  TECHNICAL_INSPECTION: 'TECHNICAL_INSPECTION',
  OTHER: 'OTHER'
} as const

export type DocumentType = typeof DocumentType[keyof typeof DocumentType]

export const DocumentStatus = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  EXPIRING_SOON: 'EXPIRING_SOON'
} as const

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus]

export interface VehicleDocument {
  id: string
  type: DocumentType
  number: string
  issuedAt: Date
  expiresAt: Date
  status: DocumentStatus
}

export interface Vehicle {
  id: string
  registrationNumber: string
  brand: string
  model: string
  year: number
  type: VehicleType
  status: VehicleStatus
  lastMaintenance?: Date
  nextMaintenance?: Date
  mileage: number
  fuelType: FuelType
  documents: VehicleDocument[]
} 