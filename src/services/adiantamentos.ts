import pb from '@/lib/pocketbase/client'

export const getAdiantamentos = (empresaId: string) =>
  pb.collection('adiantamentos').getFullList({
    filter: `empresa_id="${empresaId}"`,
    sort: '-created',
    expand: 'usuario_id,viagem_id,moeda_id',
  })

export const getAdiantamento = (id: string) =>
  pb.collection('adiantamentos').getOne(id, {
    expand: 'usuario_id,viagem_id,moeda_id',
  })

export const createAdiantamento = async (data: any) => {
  return pb.collection('adiantamentos').create(data)
}

export const updateAdiantamento = async (id: string, data: any) => {
  return pb.collection('adiantamentos').update(id, data)
}

export const deleteAdiantamento = async (id: string) => {
  return pb.collection('adiantamentos').delete(id)
}
