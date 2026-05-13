import pb from '@/lib/pocketbase/client'

export interface PendingApprovalData {
  step: any
  run: any
  target: any
}

export const getPendingApprovals = async (
  userId: string,
  role?: string | null,
  empresaId?: string,
): Promise<PendingApprovalData[]> => {
  // Admin e auditor têm visão global da empresa.
  // Gestor e financeiro só veem itens onde são aprovadores diretos.
  const isGlobalView = (role === 'admin' || role === 'auditor') && !!empresaId
  const filter = isGlobalView
    ? `status="pendente" && run_id.empresa_id="${empresaId}"`
    : `aprovador_id="${userId}" && status="pendente"`

  const steps = await pb.collection('workflow_run_steps').getFullList({
    filter,
    expand: 'run_id,run_id.submitted_by,etapa_id,aprovador_id',
    sort: 'created',
  })

  const byCollection: Record<string, string[]> = {}
  steps.forEach((s) => {
    const col = s.expand?.run_id?.target_collection
    const tId = s.expand?.run_id?.target_id
    if (col && tId) {
      if (!byCollection[col]) byCollection[col] = []
      byCollection[col].push(tId)
    }
  })

  const targetData: Record<string, any> = {}

  for (const [col, ids] of Object.entries(byCollection)) {
    if (ids.length === 0) continue
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50)
      const filter = chunk.map((id) => `id="${id}"`).join(' || ')
      try {
        const records = await pb.collection(col).getFullList({ filter })
        records.forEach((r) => {
          targetData[`${col}_${r.id}`] = r
        })
      } catch (e) {
        console.error(`Error fetching target collection ${col}:`, e)
      }
    }
  }

  return steps
    .map((s) => {
      const run = s.expand?.run_id
      const target = targetData[`${run?.target_collection}_${run?.target_id}`]
      return { step: s, run, target }
    })
    .filter((item) => item.target)
}

export const getApprovalStats = async (userId: string) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const completedSteps = await pb.collection('workflow_run_steps').getFullList({
    filter: `aprovador_id="${userId}" && status!="pendente" && decided_at>="${startOfMonth}"`,
  })

  const aprovadas = completedSteps.filter((s) => s.status === 'aprovado').length

  let totalDias = 0
  let countTempos = 0
  completedSteps.forEach((s) => {
    if (s.decided_at && s.created) {
      const d1 = new Date(s.created).getTime()
      const d2 = new Date(s.decided_at).getTime()
      totalDias += (d2 - d1) / (1000 * 60 * 60 * 24)
      countTempos++
    }
  })

  return {
    aprovadasMes: aprovadas,
    tempoMedioDias: countTempos > 0 ? totalDias / countTempos : 0,
  }
}

export const processApprovalAction = async (
  stepId: string,
  action: 'aprovar' | 'rejeitar' | 'devolver',
  comment?: string,
) => {
  const step = await pb.collection('workflow_run_steps').getOne(stepId, { expand: 'run_id' })
  const run = step.expand?.run_id
  if (!run) throw new Error('Run not found')

  const now = new Date().toISOString()
  const stepStatus =
    action === 'aprovar' ? 'aprovado' : action === 'rejeitar' ? 'rejeitado' : 'devolvido'

  await pb.collection('workflow_run_steps').update(stepId, {
    status: stepStatus,
    comentario: comment || '',
    decided_at: now,
  })

  if (action !== 'aprovar') {
    await pb.collection('workflow_runs').update(run.id, {
      status: stepStatus,
      finished_at: now,
    })

    let targetStatus = action === 'rejeitar' ? 'rejeitada' : 'rascunho'
    if (run.target_collection === 'adiantamentos') {
      targetStatus = action === 'rejeitar' ? 'rejeitado' : 'solicitado'
    }

    try {
      await pb.collection(run.target_collection).update(run.target_id, { status: targetStatus })
    } catch (e) {
      console.error(e)
    }
  } else {
    const remainingSteps = await pb.collection('workflow_run_steps').getFullList({
      filter: `run_id="${run.id}" && status="pendente"`,
    })

    if (remainingSteps.length === 0) {
      await pb.collection('workflow_runs').update(run.id, {
        status: 'aprovado',
        finished_at: now,
      })

      let targetStatus = 'aprovada'
      if (run.target_collection === 'adiantamentos') targetStatus = 'aprovado'

      try {
        await pb.collection(run.target_collection).update(run.target_id, { status: targetStatus })
      } catch (e) {
        console.error(e)
      }
    }
  }
}
