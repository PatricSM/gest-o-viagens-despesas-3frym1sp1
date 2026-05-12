export interface ApprovalItem {
  id: string
  runId: string
  targetCollection: string
  targetId: string
  codigo: string
  requesterName: string
  requesterAvatar: string
  value: number
  currencyId?: string
  date: string
  policyViolations: boolean
  slaHours: number
  rawTarget: any
  rawStep: any
}

export interface ApprovalFiltersState {
  maxValue: number
  requesterId: string
  urgencyOnly: boolean
  sortBy: string
}

export interface ModalState {
  isOpen: boolean
  type: 'aprovar_batch' | 'rejeitar' | 'devolver' | null
  targetId: string | null
}

export interface BatchSummary {
  count: number
  totalsByCurrency: Record<string, number>
}

export const isEmAtraso = (item: ApprovalItem) => {
  if (!item.slaHours) return false
  const deadline = new Date(new Date(item.date).getTime() + item.slaHours * 3600000)
  return new Date() > deadline
}

export const formatCurrency = (value: number, currencyCode: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(value)
}
