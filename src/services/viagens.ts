import pb from '@/lib/pocketbase/client'

export interface Viagem {
  id: string
  empresa_id: string
  usuario_id: string
  codigo: string
  motivo: string
  projeto_id?: string
  centro_custo_id: string
  departamento_id?: string
  status:
    | 'rascunho'
    | 'em_aprovacao'
    | 'aprovada'
    | 'em_andamento'
    | 'concluida'
    | 'cancelada'
    | 'rejeitada'
    | 'encerrada'
  data_envio?: string
  data_aprovacao?: string
  total_estimado?: number
  created: string
  updated: string
  expand?: any
}

export const getViagens = async () => {
  return pb.collection('viagens').getFullList<Viagem>({
    sort: '-created',
    expand: 'usuario_id,centro_custo_id',
  })
}

export const createViagem = async (data: Partial<Viagem>) => {
  return pb.collection('viagens').create<Viagem>(data)
}

export const updateViagem = async (id: string, data: Partial<Viagem>) => {
  return pb.collection('viagens').update<Viagem>(id, data)
}

export const deleteViagem = async (id: string) => {
  return pb.collection('viagens').delete(id)
}
