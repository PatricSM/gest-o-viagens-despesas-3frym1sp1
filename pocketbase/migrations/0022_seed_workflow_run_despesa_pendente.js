/**
 * FIX: a migration 0018 criou a despesa "Café Aeroporto" com status
 * 'em_aprovacao' E uma notificação para o gestor, mas NÃO criou o
 * workflow_run + workflow_run_step que a Central de Aprovações usa para
 * montar a fila. Resultado visual: o sino mostra "Aprovação Pendente"
 * mas /aprovacoes fica zerada nas 4 abas.
 *
 * Esta migration roda APÓS 0020 (que cria os workflows) e fecha o gap:
 * cria workflow_run vinculando a despesa ao workflow de despesa,
 * cria workflow_run_step pendente apontando para o gestor, e atualiza
 * a despesa.workflow_run_id.
 *
 * Idempotente: verifica existência por filtro de target_id + workflow_id.
 */
migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      console.log('Empresa Adapta Corp não encontrada — skip 0022.')
      return
    }

    // Encontra o gestor (aprovador)
    let gestor = null
    try {
      gestor = app.findAuthRecordByEmail('users', 'gestor@adapta.org')
    } catch (_) {
      console.log('Gestor não encontrado — skip 0022.')
      return
    }

    // Encontra o viajante (submitted_by)
    let viajante = null
    try {
      viajante = app.findAuthRecordByEmail('users', 'viajante@adapta.org')
    } catch (_) {
      console.log('Viajante não encontrado — skip 0022.')
      return
    }

    // Encontra a despesa pendente "Café Aeroporto"
    let despesa = null
    try {
      const recs = app.findRecordsByFilter(
        'despesas',
        `empresa_id='${empresa.id}' && descricao='Café Aeroporto' && status='em_aprovacao'`,
        '',
        1,
        0,
      )
      if (recs.length > 0) despesa = recs[0]
    } catch (_) {}
    if (!despesa) {
      console.log('Despesa Café Aeroporto pendente não encontrada — skip 0022.')
      return
    }

    // Encontra o workflow de despesa (tipo='despesa', versao=1)
    let workflow = null
    try {
      const recs = app.findRecordsByFilter(
        'workflows',
        `empresa_id='${empresa.id}' && tipo='despesa' && versao=1`,
        '',
        1,
        0,
      )
      if (recs.length > 0) workflow = recs[0]
    } catch (_) {}
    if (!workflow) {
      console.log('Workflow de despesa não encontrado — rode 0020 primeiro.')
      return
    }

    // Encontra a etapa 1 desse workflow (gestor_direto)
    let etapa = null
    try {
      const recs = app.findRecordsByFilter(
        'workflow_etapas',
        `workflow_id='${workflow.id}' && ordem=1`,
        '',
        1,
        0,
      )
      if (recs.length > 0) etapa = recs[0]
    } catch (_) {}
    if (!etapa) {
      console.log('Etapa 1 do workflow de despesa não encontrada — skip 0022.')
      return
    }

    // ─── workflow_run (idempotente) ───
    let run = null
    try {
      const recs = app.findRecordsByFilter(
        'workflow_runs',
        `workflow_id='${workflow.id}' && target_collection='despesas' && target_id='${despesa.id}'`,
        '',
        1,
        0,
      )
      if (recs.length > 0) run = recs[0]
    } catch (_) {}

    if (!run) {
      const runCol = app.findCollectionByNameOrId('workflow_runs')
      run = new Record(runCol)
      run.set('workflow_id', workflow.id)
      run.set('target_collection', 'despesas')
      run.set('target_id', despesa.id)
      run.set('empresa_id', empresa.id)
      run.set('status', 'em_andamento')
      run.set('submitted_by', viajante.id)
      run.set('submitted_at', despesa.getString('created') || new Date().toISOString())
      app.save(run)
      console.log(`workflow_run criado: ${run.id}`)
    } else {
      console.log(`workflow_run já existe: ${run.id}`)
    }

    // ─── workflow_run_step (idempotente) ───
    let step = null
    try {
      const recs = app.findRecordsByFilter(
        'workflow_run_steps',
        `run_id='${run.id}' && ordem=1`,
        '',
        1,
        0,
      )
      if (recs.length > 0) step = recs[0]
    } catch (_) {}

    if (!step) {
      const stepCol = app.findCollectionByNameOrId('workflow_run_steps')
      step = new Record(stepCol)
      step.set('run_id', run.id)
      step.set('etapa_id', etapa.id)
      step.set('ordem', 1)
      step.set('aprovador_id', gestor.id)
      step.set('status', 'pendente')
      app.save(step)
      console.log(`workflow_run_step pendente criado para gestor: ${step.id}`)
    } else {
      console.log(`workflow_run_step já existe: ${step.id}`)
    }

    // ─── Atualiza despesa.workflow_run_id ───
    if (despesa.getString('workflow_run_id') !== run.id) {
      despesa.set('workflow_run_id', run.id)
      app.save(despesa)
      console.log('despesa.workflow_run_id vinculado.')
    }

    console.log('=== 0022 SEED WORKFLOW_RUN DESPESA PENDENTE DONE ===')
  },
  (app) => {
    // Down: remove o run específico (cascade apaga os steps via FK)
    try {
      const empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
      const recs = app.findRecordsByFilter(
        'workflow_runs',
        `empresa_id='${empresa.id}' && target_collection='despesas'`,
        '',
        100,
        0,
      )
      for (const r of recs) {
        // Confirma que é da despesa Café Aeroporto antes de apagar
        const targetId = r.getString('target_id')
        try {
          const d = app.findRecordById('despesas', targetId)
          if (d.getString('descricao') === 'Café Aeroporto') {
            try {
              app.delete(r)
            } catch (_) {}
          }
        } catch (_) {}
      }
    } catch (_) {}
  },
)
