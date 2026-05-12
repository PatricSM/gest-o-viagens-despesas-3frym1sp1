import pb from '@/lib/pocketbase/client'

export const triggerWorkflow = async (
  empresaId: string,
  tipo: string,
  targetCollection: string,
  targetId: string,
  userId: string,
) => {
  const workflows = await pb.collection('workflows').getFullList({
    filter: `empresa_id="${empresaId}" && tipo="${tipo}" && active=true`,
    sort: '-versao',
  })

  if (workflows.length === 0) return null

  const workflow = workflows[0]

  const run = await pb.collection('workflow_runs').create({
    workflow_id: workflow.id,
    target_collection: targetCollection,
    target_id: targetId,
    empresa_id: empresaId,
    status: 'em_andamento',
    submitted_by: userId,
    submitted_at: new Date().toISOString(),
  })

  const etapas = await pb.collection('workflow_etapas').getFullList({
    filter: `workflow_id="${workflow.id}"`,
    sort: 'ordem',
  })

  for (const etapa of etapas) {
    await pb.collection('workflow_run_steps').create({
      run_id: run.id,
      etapa_id: etapa.id,
      ordem: etapa.ordem,
      status: 'pendente',
    })
  }

  return run
}

export const getWorkflowRunSteps = async (runId: string) => {
  return pb.collection('workflow_run_steps').getFullList({
    filter: `run_id="${runId}"`,
    sort: 'ordem',
    expand: 'aprovador_id,etapa_id',
  })
}
