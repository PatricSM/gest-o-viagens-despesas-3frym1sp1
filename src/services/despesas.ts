import pb from '@/lib/pocketbase/client'

export const getDespesas = (empresaId: string) =>
  pb.collection('despesas').getFullList({
    filter: `empresa_id="${empresaId}"`,
    sort: '-data_despesa',
    expand: 'categoria_id,viagem_id,moeda_id,fornecedor_id,despesa_comprovantes_via_despesa_id',
  })

export const getDespesa = (id: string) =>
  pb.collection('despesas').getOne(id, {
    expand:
      'categoria_id,viagem_id,moeda_id,fornecedor_id,despesa_comprovantes_via_despesa_id,usuario_id',
  })

export const createDespesa = async (data: any, arquivos?: File[]) => {
  const despesa = await pb.collection('despesas').create(data)

  if (arquivos && arquivos.length > 0) {
    for (const arquivo of arquivos) {
      const comprovanteData = new FormData()
      comprovanteData.append('despesa_id', despesa.id)
      comprovanteData.append('arquivo', arquivo)
      comprovanteData.append('uploaded_by', pb.authStore.record?.id || '')
      await pb.collection('despesa_comprovantes').create(comprovanteData)
    }
  }

  return despesa
}

export const updateDespesa = async (id: string, data: any) => {
  return pb.collection('despesas').update(id, data)
}

export const deleteDespesa = async (id: string) => {
  return pb.collection('despesas').delete(id)
}

export const getCategorias = (empresaId: string) =>
  pb
    .collection('categorias_despesa')
    .getFullList({ filter: `empresa_id="${empresaId}" && active=true`, sort: 'nome' })
export const getMoedas = (empresaId: string) =>
  pb
    .collection('moedas')
    .getFullList({ filter: `empresa_id="${empresaId}" && active=true`, sort: 'codigo' })
export const getViagens = (empresaId: string, usuarioId: string) =>
  pb.collection('viagens').getFullList({
    filter: `empresa_id="${empresaId}" && usuario_id="${usuarioId}"`,
    sort: '-created',
  })
export const getCentrosCusto = (empresaId: string) =>
  pb
    .collection('centros_custo')
    .getFullList({ filter: `empresa_id="${empresaId}" && active=true`, sort: 'nome' })
export const getFornecedores = (empresaId: string) =>
  pb
    .collection('fornecedores')
    .getFullList({ filter: `empresa_id="${empresaId}" && active=true`, sort: 'nome' })
