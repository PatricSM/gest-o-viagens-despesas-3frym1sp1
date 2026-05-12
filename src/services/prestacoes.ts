import pb from '@/lib/pocketbase/client'

export const getPrestacoes = (
  empresaId: string,
  filters?: {
    status?: string[]
    usuario_id?: string
    viagem_id?: string
    dataInicio?: string
    dataFim?: string
  },
) => {
  let filterStr = `empresa_id="${empresaId}"`

  if (filters?.status && filters.status.length > 0) {
    const statusFilters = filters.status.map((s) => `status="${s}"`).join(' || ')
    filterStr += ` && (${statusFilters})`
  }
  if (filters?.usuario_id) {
    filterStr += ` && usuario_id="${filters.usuario_id}"`
  }
  if (filters?.viagem_id) {
    filterStr += ` && viagem_id="${filters.viagem_id}"`
  }
  if (filters?.dataInicio) {
    filterStr += ` && data_envio>="${filters.dataInicio} 00:00:00"`
  }
  if (filters?.dataFim) {
    filterStr += ` && data_envio<="${filters.dataFim} 23:59:59"`
  }

  return pb.collection('prestacoes_contas').getFullList({
    filter: filterStr,
    sort: '-created',
    expand: 'usuario_id,viagem_id,moeda_id',
  })
}

export const getUsuariosPorEmpresa = (empresaId: string) =>
  pb.collection('users').getFullList({
    filter: `empresa_id="${empresaId}"`,
  })

export const getViagensPorEmpresa = (empresaId: string) =>
  pb.collection('viagens').getFullList({
    filter: `empresa_id="${empresaId}"`,
    sort: '-created',
  })

export const getPrestacao = (id: string) =>
  pb.collection('prestacoes_contas').getOne(id, {
    expand: 'usuario_id,viagem_id,moeda_id',
  })

export const createPrestacao = async (data: any) => {
  return pb.collection('prestacoes_contas').create(data)
}

export const updatePrestacao = async (id: string, data: any) => {
  return pb.collection('prestacoes_contas').update(id, data)
}

export const deletePrestacao = async (id: string) => {
  return pb.collection('prestacoes_contas').delete(id)
}

export const uploadPrestacaoAnexo = async (
  prestacaoId: string,
  arquivo: File,
  descricao: string,
  userId: string,
) => {
  const formData = new FormData()
  formData.append('prestacao_id', prestacaoId)
  formData.append('arquivo', arquivo)
  formData.append('descricao', descricao)
  formData.append('uploaded_by', userId)
  return pb.collection('prestacao_anexos').create(formData)
}

export const getPrestacaoAnexos = (prestacaoId: string) =>
  pb.collection('prestacao_anexos').getFullList({
    filter: `prestacao_id="${prestacaoId}"`,
    sort: '-created',
    expand: 'uploaded_by',
  })

export const deletePrestacaoAnexo = async (id: string) => {
  return pb.collection('prestacao_anexos').delete(id)
}

export const getDespesasPorPrestacao = (prestacaoId: string) =>
  pb.collection('despesas').getFullList({
    filter: `prestacao_id="${prestacaoId}"`,
    expand: 'categoria_id,moeda_id',
  })

export const getAdiantamentosPorPrestacao = (prestacaoId: string) =>
  pb.collection('adiantamentos').getFullList({
    filter: `prestacao_id="${prestacaoId}"`,
    expand: 'moeda_id',
  })

export const getDespesasDisponiveis = (empresaId: string, usuarioId: string) =>
  pb.collection('despesas').getFullList({
    filter: `empresa_id="${empresaId}" && usuario_id="${usuarioId}" && prestacao_id="" && status!="rejeitada"`,
    expand: 'categoria_id,moeda_id',
  })

export const getAdiantamentosDisponiveis = (
  empresaId: string,
  usuarioId: string,
  viagemId?: string,
) => {
  let filter = `empresa_id="${empresaId}" && usuario_id="${usuarioId}" && prestacao_id="" && status="pago"`
  if (viagemId) {
    filter += ` && viagem_id="${viagemId}"`
  }
  return pb.collection('adiantamentos').getFullList({
    filter,
    expand: 'moeda_id',
  })
}

export const getDespesaComprovantes = (despesaId: string) =>
  pb.collection('despesa_comprovantes').getFullList({
    filter: `despesa_id="${despesaId}"`,
  })

export const vincularDespesa = async (despesaId: string, prestacaoId: string) => {
  return pb.collection('despesas').update(despesaId, { prestacao_id: prestacaoId })
}

export const desvincularDespesa = async (despesaId: string) => {
  return pb.collection('despesas').update(despesaId, { prestacao_id: null })
}

export const vincularAdiantamento = async (adiantamentoId: string, prestacaoId: string) => {
  return pb.collection('adiantamentos').update(adiantamentoId, { prestacao_id: prestacaoId })
}

export const desvincularAdiantamento = async (adiantamentoId: string) => {
  return pb.collection('adiantamentos').update(adiantamentoId, { prestacao_id: null })
}
