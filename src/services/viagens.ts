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
  workflow_run_id?: string
  politica_id?: string
  politica_violacoes?: any
  created: string
  updated: string
  expand?: any
}

export interface ViagemTrecho {
  id: string
  viagem_id: string
  ordem: number
  origem: string
  destino: string
  data_ida: string
  data_volta?: string
  tipo_transporte: 'aereo' | 'rodoviario' | 'proprio'
}

export interface ViagemEstimativa {
  id: string
  viagem_id: string
  tipo: 'passagem' | 'hospedagem' | 'alimentacao' | 'transporte_local' | 'outros'
  descricao: string
  valor: number
  dias?: number
  valor_diaria?: number
}

export interface ViagemAcompanhante {
  id: string
  viagem_id: string
  nome: string
  cpf: string
  parentesco: string
  contato_emergencial: string
}

export interface ViagemAnexo {
  id: string
  viagem_id: string
  arquivo: string
  descricao: string
  uploaded_by: string
  created: string
}

export const getViagens = async () => {
  return pb.collection('viagens').getFullList<Viagem>({
    sort: '-created',
    expand: 'usuario_id,centro_custo_id,viagem_trechos_via_viagem_id',
  })
}

export const getViagem = async (id: string) => {
  return pb.collection('viagens').getOne<Viagem>(id, {
    expand: 'usuario_id,centro_custo_id,departamento_id,projeto_id',
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

// Trechos
export const getTrechos = (viagemId: string) =>
  pb
    .collection('viagem_trechos')
    .getFullList<ViagemTrecho>({ filter: `viagem_id="${viagemId}"`, sort: 'ordem' })
export const saveTrecho = (data: Partial<ViagemTrecho>) =>
  data.id
    ? pb.collection('viagem_trechos').update<ViagemTrecho>(data.id, data)
    : pb.collection('viagem_trechos').create<ViagemTrecho>(data)
export const deleteTrecho = (id: string) => pb.collection('viagem_trechos').delete(id)

// Estimativas
export const getEstimativas = (viagemId: string) =>
  pb
    .collection('viagem_estimativas')
    .getFullList<ViagemEstimativa>({ filter: `viagem_id="${viagemId}"` })
export const saveEstimativa = (data: Partial<ViagemEstimativa>) =>
  data.id
    ? pb.collection('viagem_estimativas').update<ViagemEstimativa>(data.id, data)
    : pb.collection('viagem_estimativas').create<ViagemEstimativa>(data)
export const deleteEstimativa = (id: string) => pb.collection('viagem_estimativas').delete(id)

// Acompanhantes
export const getAcompanhantes = (viagemId: string) =>
  pb
    .collection('viagem_acompanhantes')
    .getFullList<ViagemAcompanhante>({ filter: `viagem_id="${viagemId}"` })
export const saveAcompanhante = (data: Partial<ViagemAcompanhante>) =>
  data.id
    ? pb.collection('viagem_acompanhantes').update<ViagemAcompanhante>(data.id, data)
    : pb.collection('viagem_acompanhantes').create<ViagemAcompanhante>(data)
export const deleteAcompanhante = (id: string) => pb.collection('viagem_acompanhantes').delete(id)

// Anexos
export const getAnexos = (viagemId: string) =>
  pb
    .collection('viagem_anexos')
    .getFullList<ViagemAnexo>({ filter: `viagem_id="${viagemId}"`, expand: 'uploaded_by' })
export const createAnexo = async (
  viagemId: string,
  file: File,
  descricao: string,
  userId: string,
) => {
  const formData = new FormData()
  formData.append('viagem_id', viagemId)
  formData.append('arquivo', file)
  formData.append('descricao', descricao)
  formData.append('uploaded_by', userId)
  return pb.collection('viagem_anexos').create<ViagemAnexo>(formData)
}
export const deleteAnexo = (id: string) => pb.collection('viagem_anexos').delete(id)

// Workflow Submission
export const submitParaAprovacao = async (viagemId: string, empresaId: string, userId: string) => {
  const wfs = await pb
    .collection('workflows')
    .getFullList({ filter: `empresa_id="${empresaId}" && tipo="viagem" && active=true` })
  const wf = wfs[0]

  if (wf) {
    const run = await pb.collection('workflow_runs').create({
      workflow_id: wf.id,
      target_collection: 'viagens',
      target_id: viagemId,
      empresa_id: empresaId,
      status: 'em_andamento',
      submitted_by: userId,
      submitted_at: new Date().toISOString(),
    })

    const etapas = await pb
      .collection('workflow_etapas')
      .getFullList({ filter: `workflow_id="${wf.id}"`, sort: 'ordem' })
    for (const etapa of etapas) {
      await pb.collection('workflow_run_steps').create({
        run_id: run.id,
        etapa_id: etapa.id,
        ordem: etapa.ordem,
        status: 'pendente',
      })
    }
    await updateViagem(viagemId, {
      status: 'em_aprovacao',
      data_envio: new Date().toISOString(),
      workflow_run_id: run.id,
    })
  } else {
    await updateViagem(viagemId, { status: 'em_aprovacao', data_envio: new Date().toISOString() })
  }
}

export const duplicateViagem = async (id: string, userId: string) => {
  const v = await getViagem(id)
  const newV = await createViagem({
    empresa_id: v.empresa_id,
    usuario_id: userId,
    motivo: `[Cópia] ${v.motivo}`,
    projeto_id: v.projeto_id,
    centro_custo_id: v.centro_custo_id,
    departamento_id: v.departamento_id,
    status: 'rascunho',
  })

  const trechos = await getTrechos(id)
  for (const t of trechos) {
    await saveTrecho({ ...t, id: undefined, viagem_id: newV.id })
  }

  const estimativas = await getEstimativas(id)
  for (const e of estimativas) {
    await saveEstimativa({ ...e, id: undefined, viagem_id: newV.id })
  }
  return newV
}
