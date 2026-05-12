import pb from '@/lib/pocketbase/client'

export const getPoliticas = (empresaId: string) =>
  pb.collection('politicas').getFullList({ filter: `empresa_id="${empresaId}"`, sort: '-versao' })
export const getActivePolitica = (empresaId: string) =>
  pb
    .collection('politicas')
    .getFirstListItem(`empresa_id="${empresaId}" && active=true`)
    .catch(() => null)
export const createPolitica = (data: any) => pb.collection('politicas').create(data)
export const updatePolitica = (id: string, data: any) => pb.collection('politicas').update(id, data)

export const getTetos = (politicaId: string) =>
  pb
    .collection('politica_tetos')
    .getFullList({ filter: `politica_id="${politicaId}"`, expand: 'categoria_id,departamento_id' })
export const createTeto = (data: any) => pb.collection('politica_tetos').create(data)
export const deleteTeto = (id: string) => pb.collection('politica_tetos').delete(id)

export const getDiarias = (politicaId: string) =>
  pb.collection('politica_diarias').getFullList({ filter: `politica_id="${politicaId}"` })
export const createDiaria = (data: any) => pb.collection('politica_diarias').create(data)
export const deleteDiaria = (id: string) => pb.collection('politica_diarias').delete(id)

export const getClasses = (politicaId: string) =>
  pb.collection('politica_classes_viagem').getFullList({ filter: `politica_id="${politicaId}"` })
export const createClasse = (data: any) => pb.collection('politica_classes_viagem').create(data)
export const deleteClasse = (id: string) => pb.collection('politica_classes_viagem').delete(id)

export const getBloqueadas = (politicaId: string) =>
  pb
    .collection('politica_categorias_bloqueadas')
    .getFullList({ filter: `politica_id="${politicaId}"`, expand: 'categoria_id' })
export const createBloqueada = (data: any) =>
  pb.collection('politica_categorias_bloqueadas').create(data)
export const deleteBloqueada = (id: string) =>
  pb.collection('politica_categorias_bloqueadas').delete(id)

export const getWorkflows = (empresaId: string) =>
  pb.collection('workflows').getFullList({ filter: `empresa_id="${empresaId}"`, sort: '-versao' })
export const createWorkflow = (data: any) => pb.collection('workflows').create(data)
export const updateWorkflow = (id: string, data: any) => pb.collection('workflows').update(id, data)

export const getEtapas = (workflowId: string) =>
  pb
    .collection('workflow_etapas')
    .getFullList({ filter: `workflow_id="${workflowId}"`, sort: 'ordem', expand: 'custom_user_id' })
export const createEtapa = (data: any) => pb.collection('workflow_etapas').create(data)
export const updateEtapa = (id: string, data: any) =>
  pb.collection('workflow_etapas').update(id, data)
export const deleteEtapa = (id: string) => pb.collection('workflow_etapas').delete(id)

export const getCategorias = (empresaId: string) =>
  pb.collection('categorias_despesa').getFullList({ filter: `empresa_id="${empresaId}"` })
export const getDepartamentos = (empresaId: string) =>
  pb.collection('departamentos').getFullList({ filter: `empresa_id="${empresaId}"` })
export const getUsers = (empresaId: string) =>
  pb.collection('users').getFullList({ filter: `empresa_id="${empresaId}"` })

export const clonePolitica = async (oldId: string, empresaId: string, userId: string) => {
  const old = await pb.collection('politicas').getOne(oldId)
  const newPol = await createPolitica({
    empresa_id: empresaId,
    versao: (old.versao || 1) + 1,
    vigencia_inicio: new Date().toISOString(),
    antecedencia_minima_viagem_dias: old.antecedencia_minima_viagem_dias,
    valor_max_sem_comprovante: old.valor_max_sem_comprovante,
    active: true,
    created_by: userId,
  })

  const cloneFields = (obj: any) => {
    const { id, created, updated, collectionId, collectionName, expand, ...rest } = obj
    return rest
  }

  const tetos = await getTetos(oldId)
  for (const t of tetos) await createTeto({ ...cloneFields(t), politica_id: newPol.id })

  const diarias = await getDiarias(oldId)
  for (const d of diarias) await createDiaria({ ...cloneFields(d), politica_id: newPol.id })

  const classes = await getClasses(oldId)
  for (const c of classes) await createClasse({ ...cloneFields(c), politica_id: newPol.id })

  const bloq = await getBloqueadas(oldId)
  for (const b of bloq) await createBloqueada({ ...cloneFields(b), politica_id: newPol.id })

  await updatePolitica(oldId, { active: false, vigencia_fim: new Date().toISOString() })
  return newPol
}

export const cloneWorkflow = async (oldId: string, empresaId: string, userId: string) => {
  const old = await pb.collection('workflows').getOne(oldId)
  const newWf = await createWorkflow({
    empresa_id: empresaId,
    tipo: old.tipo,
    nome: old.nome,
    versao: (old.versao || 1) + 1,
    vigencia_inicio: new Date().toISOString(),
    active: true,
    created_by: userId,
  })

  const cloneFields = (obj: any) => {
    const { id, created, updated, collectionId, collectionName, expand, ...rest } = obj
    return rest
  }

  const etapas = await getEtapas(oldId)
  for (const e of etapas) await createEtapa({ ...cloneFields(e), workflow_id: newWf.id })

  await updateWorkflow(oldId, { active: false })
  return newWf
}
