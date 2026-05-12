import pb from '@/lib/pocketbase/client'

export const getReembolsos = () => {
  return pb.collection('reembolsos').getFullList({
    expand: 'usuario_id,prestacao_id',
    sort: '-created',
  })
}

export const getPrestacoesPendentesFinanceiroCount = async () => {
  const res = await pb.collection('prestacoes_contas').getList(1, 1, {
    filter: "status = 'em_aprovacao_financeiro'",
    fields: 'id',
  })
  return res.totalItems
}

export const updateReembolsoStatus = (
  id: string,
  status: string,
  data_pagamento?: string,
  referencia?: string,
) => {
  const data: any = { status }
  if (data_pagamento) data.data_pagamento = data_pagamento
  if (referencia) data.referencia_pagamento = referencia

  return pb.collection('reembolsos').update(id, data)
}
