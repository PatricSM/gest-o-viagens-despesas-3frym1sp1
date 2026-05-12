import pb from '@/lib/pocketbase/client'

export const getDespesas = () =>
  pb
    .collection('despesas')
    .getFullList({ sort: '-data_despesa', expand: 'categoria_id,viagem_id,moeda_id,fornecedor_id' })

export const createDespesa = async (data: any, arquivo?: File) => {
  const despesa = await pb.collection('despesas').create(data)

  if (arquivo) {
    const comprovanteData = new FormData()
    comprovanteData.append('despesa_id', despesa.id)
    comprovanteData.append('arquivo', arquivo)
    comprovanteData.append('uploaded_by', pb.authStore.record?.id || '')
    await pb.collection('despesa_comprovantes').create(comprovanteData)
  }

  return despesa
}

export const getCategorias = () => pb.collection('categorias_despesa').getFullList({ sort: 'nome' })
export const getMoedas = () => pb.collection('moedas').getFullList({ sort: 'codigo' })
