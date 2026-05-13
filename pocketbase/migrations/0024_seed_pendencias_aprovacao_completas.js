/**
 * Cria itens pendentes em TODAS as abas da Central de Aprovações
 * (viagem, despesa, adiantamento, prestação), cada um com
 * workflow_run + workflow_run_step apontando para o gestor.
 *
 * Também cria:
 * - Audit log entries (10 entradas históricas)
 * - 1 duplicidade_alerta (par de despesas com mesmo valor+data+fornecedor)
 * - Notificações extras para diferentes roles
 *
 * Pré-requisitos: 0018 (demo data) + 0020 (workflows) + 0022 (run despesa).
 * Idempotente: cada bloco usa upsert por filtro único.
 */
migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      console.log('Empresa Adapta Corp não encontrada — skip 0024.')
      return
    }

    const getUser = (email) => {
      try {
        return app.findAuthRecordByEmail('users', email)
      } catch (_) {
        return null
      }
    }
    const admin = getUser('admin@adapta.org')
    const financeiro = getUser('financeiro@adapta.org')
    const gestor = getUser('gestor@adapta.org')
    const viajante = getUser('viajante@adapta.org')

    if (!gestor || !viajante || !financeiro) {
      console.log('Roles obrigatórios não encontrados — skip 0024.')
      return
    }

    const upsert = (colName, filter, builder) => {
      try {
        const recs = app.findRecordsByFilter(colName, filter, '', 1, 0)
        if (recs.length > 0) return recs[0]
      } catch (_) {}
      const col = app.findCollectionByNameOrId(colName)
      const rec = new Record(col)
      builder(rec)
      app.save(rec)
      return rec
    }

    const findOne = (colName, filter) => {
      try {
        const recs = app.findRecordsByFilter(colName, filter, '', 1, 0)
        if (recs.length > 0) return recs[0]
      } catch (_) {}
      return null
    }

    const daysAgo = (n) => {
      const d = new Date()
      d.setDate(d.getDate() - n)
      return d.toISOString()
    }

    const brl = findOne('moedas', `empresa_id='${empresa.id}' && codigo='BRL'`)
    const cc = findOne('centros_custo', `empresa_id='${empresa.id}' && codigo='OP-001'`)
    const catAlim = findOne('categorias_despesa', `empresa_id='${empresa.id}' && nome='Alimentação'`)
    if (!brl || !cc) {
      console.log('Cadastros mínimos faltando (BRL/CC) — rode 0018 antes.')
      return
    }

    const wfViagem = findOne(
      'workflows',
      `empresa_id='${empresa.id}' && tipo='viagem' && versao=1`,
    )
    const wfDespesa = findOne(
      'workflows',
      `empresa_id='${empresa.id}' && tipo='despesa' && versao=1`,
    )
    const wfAdiantamento = findOne(
      'workflows',
      `empresa_id='${empresa.id}' && tipo='adiantamento' && versao=1`,
    )
    const wfPrestacao = findOne(
      'workflows',
      `empresa_id='${empresa.id}' && tipo='prestacao' && versao=1`,
    )

    if (!wfViagem || !wfDespesa || !wfAdiantamento || !wfPrestacao) {
      console.log('Workflows não encontrados — rode 0020 antes.')
      return
    }

    const findEtapa = (wfId, ordem) =>
      findOne('workflow_etapas', `workflow_id='${wfId}' && ordem=${ordem}`)

    // Helper para criar run + step pendente
    const createPendingRun = (workflow, etapa1, targetCollection, targetId, submittedBy, aprovador) => {
      let run = findOne(
        'workflow_runs',
        `workflow_id='${workflow.id}' && target_collection='${targetCollection}' && target_id='${targetId}'`,
      )
      if (!run) {
        const runCol = app.findCollectionByNameOrId('workflow_runs')
        run = new Record(runCol)
        run.set('workflow_id', workflow.id)
        run.set('target_collection', targetCollection)
        run.set('target_id', targetId)
        run.set('empresa_id', empresa.id)
        run.set('status', 'em_andamento')
        run.set('submitted_by', submittedBy.id)
        run.set('submitted_at', daysAgo(1))
        app.save(run)
      }
      let step = findOne('workflow_run_steps', `run_id='${run.id}' && ordem=1`)
      if (!step) {
        const stepCol = app.findCollectionByNameOrId('workflow_run_steps')
        step = new Record(stepCol)
        step.set('run_id', run.id)
        step.set('etapa_id', etapa1.id)
        step.set('ordem', 1)
        step.set('aprovador_id', aprovador.id)
        step.set('status', 'pendente')
        app.save(step)
      }
      return run
    }

    // ─── BLOCO 1: VIAGEM PENDENTE (em_aprovacao, aguardando gestor) ───
    const viagemPend = upsert(
      'viagens',
      `empresa_id='${empresa.id}' && codigo='V-DEMO-PEND'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('usuario_id', viajante.id)
        r.set('codigo', 'V-DEMO-PEND')
        r.set('motivo', 'Visita técnica cliente — Belo Horizonte')
        r.set('centro_custo_id', cc.id)
        r.set('status', 'em_aprovacao')
        r.set('data_envio', daysAgo(1))
        r.set('total_estimado', 2400)
      },
    )
    upsert(
      'viagem_trechos',
      `viagem_id='${viagemPend.id}' && origem='São Paulo' && destino='Belo Horizonte'`,
      (r) => {
        r.set('viagem_id', viagemPend.id)
        r.set('ordem', 1)
        r.set('origem', 'São Paulo')
        r.set('destino', 'Belo Horizonte')
        r.set('data_ida', daysAgo(-7))
        r.set('data_volta', daysAgo(-5))
        r.set('tipo_transporte', 'aereo')
      },
    )
    const etapaV = findEtapa(wfViagem.id, 1)
    if (etapaV) {
      const runV = createPendingRun(wfViagem, etapaV, 'viagens', viagemPend.id, viajante, gestor)
      if (viagemPend.getString('workflow_run_id') !== runV.id) {
        viagemPend.set('workflow_run_id', runV.id)
        app.save(viagemPend)
      }
    }

    // ─── BLOCO 2: ADIANTAMENTO PENDENTE (solicitado, aguardando gestor) ───
    const adiPend = upsert(
      'adiantamentos',
      `empresa_id='${empresa.id}' && codigo='AD-DEMO-PEND'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('usuario_id', viajante.id)
        r.set('codigo', 'AD-DEMO-PEND')
        r.set('viagem_id', viagemPend.id)
        r.set('valor', 1800)
        r.set('moeda_id', brl.id)
        r.set('justificativa', 'Cobertura prévia de hospedagem e alimentação para BH')
        r.set('data_prevista_uso', daysAgo(-7))
        r.set('forma_recebimento', 'PIX')
        r.set('status', 'solicitado')
      },
    )
    const etapaA = findEtapa(wfAdiantamento.id, 1)
    if (etapaA) {
      const runA = createPendingRun(wfAdiantamento, etapaA, 'adiantamentos', adiPend.id, viajante, gestor)
      if (adiPend.getString('workflow_run_id') !== runA.id) {
        adiPend.set('workflow_run_id', runA.id)
        app.save(adiPend)
      }
    }

    // ─── BLOCO 3: PRESTAÇÃO PENDENTE (em_aprovacao_gestor) ───
    // Cria uma viagem concluída para dar contexto
    const viagemPrest = upsert(
      'viagens',
      `empresa_id='${empresa.id}' && codigo='V-DEMO-PREST'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('usuario_id', viajante.id)
        r.set('codigo', 'V-DEMO-PREST')
        r.set('motivo', 'Imersão design system — Curitiba')
        r.set('centro_custo_id', cc.id)
        r.set('status', 'concluida')
        r.set('data_envio', daysAgo(20))
        r.set('data_aprovacao', daysAgo(18))
        r.set('total_estimado', 900)
      },
    )
    // Despesa vinculada à prestação
    const despPrest = upsert(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Hospedagem Curitiba'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('usuario_id', viajante.id)
        r.set('viagem_id', viagemPrest.id)
        r.set('data_despesa', daysAgo(15))
        if (catAlim) r.set('categoria_id', catAlim.id)
        r.set('valor', 850)
        r.set('moeda_id', brl.id)
        r.set('valor_convertido', 850)
        r.set('cotacao_aplicada', 1)
        r.set('forma_pagamento', 'cartao_pessoal')
        r.set('reembolsavel', true)
        r.set('descricao', 'Hospedagem Curitiba')
        r.set('status', 'aprovada')
      },
    )
    const prestPend = upsert(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && titulo='PC Viagem Curitiba (Pendente Gestor)'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('usuario_id', viajante.id)
        r.set('viagem_id', viagemPrest.id)
        r.set('titulo', 'PC Viagem Curitiba (Pendente Gestor)')
        r.set('descricao', 'Prestação enviada, aguardando aprovação do gestor.')
        r.set('total_despesas', 850)
        r.set('total_adiantamento', 0)
        r.set('saldo', 850)
        r.set('moeda_id', brl.id)
        r.set('status', 'em_aprovacao_gestor')
        r.set('data_envio', daysAgo(2))
      },
    )
    // Vincula despesa à prestação
    if (despPrest.getString('prestacao_id') !== prestPend.id) {
      despPrest.set('prestacao_id', prestPend.id)
      app.save(despPrest)
    }
    const etapaP = findEtapa(wfPrestacao.id, 1)
    if (etapaP) {
      const runP = createPendingRun(wfPrestacao, etapaP, 'prestacoes_contas', prestPend.id, viajante, gestor)
      if (prestPend.getString('workflow_run_id') !== runP.id) {
        prestPend.set('workflow_run_id', runP.id)
        app.save(prestPend)
      }
    }

    // ─── BLOCO 4: PRESTAÇÃO PENDENTE NO FINANCEIRO (já passou pelo gestor) ───
    // Reaproveita a Prestação A do seed 0018 que já está em
    // em_aprovacao_financeiro. Precisamos garantir que ela tem
    // workflow_run + step pendente apontando para FINANCEIRO.
    const prestA = findOne(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && codigo='PC-DEMO-A'`,
    )
    if (prestA && etapaP) {
      let runA = findOne(
        'workflow_runs',
        `workflow_id='${wfPrestacao.id}' && target_collection='prestacoes_contas' && target_id='${prestA.id}'`,
      )
      if (!runA) {
        const runCol = app.findCollectionByNameOrId('workflow_runs')
        runA = new Record(runCol)
        runA.set('workflow_id', wfPrestacao.id)
        runA.set('target_collection', 'prestacoes_contas')
        runA.set('target_id', prestA.id)
        runA.set('empresa_id', empresa.id)
        runA.set('status', 'em_andamento')
        runA.set('submitted_by', viajante.id)
        runA.set('submitted_at', daysAgo(2))
        app.save(runA)
      }
      // Step 1: gestor — já aprovado
      let stepG = findOne('workflow_run_steps', `run_id='${runA.id}' && ordem=1`)
      if (!stepG) {
        const stepCol = app.findCollectionByNameOrId('workflow_run_steps')
        stepG = new Record(stepCol)
        stepG.set('run_id', runA.id)
        stepG.set('etapa_id', etapaP.id)
        stepG.set('ordem', 1)
        stepG.set('aprovador_id', gestor.id)
        stepG.set('status', 'aprovado')
        stepG.set('decided_at', daysAgo(1))
        stepG.set('comentario', 'Aprovado conforme política.')
        app.save(stepG)
      }
      // Step 2: financeiro — pendente
      const etapaPFin = findEtapa(wfPrestacao.id, 2)
      if (etapaPFin) {
        let stepF = findOne('workflow_run_steps', `run_id='${runA.id}' && ordem=2`)
        if (!stepF) {
          const stepCol = app.findCollectionByNameOrId('workflow_run_steps')
          stepF = new Record(stepCol)
          stepF.set('run_id', runA.id)
          stepF.set('etapa_id', etapaPFin.id)
          stepF.set('ordem', 2)
          stepF.set('aprovador_id', financeiro.id)
          stepF.set('status', 'pendente')
          app.save(stepF)
        }
      }
      if (prestA.getString('workflow_run_id') !== runA.id) {
        prestA.set('workflow_run_id', runA.id)
        app.save(prestA)
      }
    }

    // ─── BLOCO 5: DUPLICIDADE_ALERTAS ───
    // Marca D1 (Almoço Cliente 1) e D2 (Jantar Equipe) como possível
    // duplicidade simulada (mesmo viajante + valores próximos).
    const d1 = findOne('despesas', `empresa_id='${empresa.id}' && descricao='Almoço Cliente 1'`)
    const d2 = findOne('despesas', `empresa_id='${empresa.id}' && descricao='Jantar Equipe'`)
    if (d1 && d2) {
      upsert(
        'duplicidade_alertas',
        `despesa_a_id='${d1.id}' && despesa_b_id='${d2.id}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('despesa_a_id', d1.id)
          r.set('despesa_b_id', d2.id)
          r.set(
            'motivo',
            'Despesas próximas no tempo, mesmo viajante e categoria — revisar se não há lançamento duplicado.',
          )
          r.set('status', 'aberto')
        },
      )
    }

    // ─── BLOCO 6: AUDIT_LOG HISTÓRICO (10 entries) ───
    const auditEntries = [
      { user: admin, action: 'login', module: 'auth', daysAgoN: 5 },
      { user: gestor, action: 'login', module: 'auth', daysAgoN: 4 },
      { user: viajante, action: 'login', module: 'auth', daysAgoN: 3 },
      { user: financeiro, action: 'login', module: 'auth', daysAgoN: 2 },
      { user: viajante, action: 'create', module: 'viagens', daysAgoN: 10, recordRef: viagemPrest },
      { user: viajante, action: 'submit', module: 'viagens', daysAgoN: 9, recordRef: viagemPrest },
      { user: gestor, action: 'approve', module: 'viagens', daysAgoN: 8, recordRef: viagemPrest },
      { user: viajante, action: 'create', module: 'prestacoes_contas', daysAgoN: 2, recordRef: prestPend },
      { user: viajante, action: 'submit', module: 'prestacoes_contas', daysAgoN: 2, recordRef: prestPend },
      { user: admin, action: 'export', module: 'relatorios', daysAgoN: 1 },
    ]
    for (let i = 0; i < auditEntries.length; i++) {
      const e = auditEntries[i]
      if (!e.user) continue
      const filter = `user_id='${e.user.id}' && action='${e.action}' && module='${e.module}' && created >= '${daysAgo(e.daysAgoN + 1).substring(0, 10)}' && created <= '${daysAgo(e.daysAgoN - 1 < 0 ? 0 : e.daysAgoN - 1).substring(0, 10)}'`
      try {
        const exists = app.findRecordsByFilter('audit_log', filter, '', 1, 0)
        if (exists.length > 0) continue
      } catch (_) {}
      const auditCol = app.findCollectionByNameOrId('audit_log')
      const rec = new Record(auditCol)
      rec.set('empresa_id', empresa.id)
      rec.set('user_id', e.user.id)
      rec.set('action', e.action)
      rec.set('module', e.module)
      if (e.recordRef) rec.set('record_id', e.recordRef.id)
      rec.set('ip', '127.0.0.1')
      rec.set('user_agent', 'SeedAgent/0024')
      app.save(rec)
    }

    // ─── BLOCO 7: NOTIFICAÇÕES EXTRAS PARA OS ROLES ───
    const notifs = [
      {
        user_id: gestor.id,
        tipo: 'aprovacao_pendente',
        titulo: 'Nova viagem aguardando aprovação',
        mensagem: `Vitor Viajante enviou a viagem ${viagemPend.getString('codigo')} (R$ 2.400,00) para sua aprovação.`,
        link_url: `/viagens/${viagemPend.id}`,
      },
      {
        user_id: gestor.id,
        tipo: 'aprovacao_pendente',
        titulo: 'Adiantamento aguardando aprovação',
        mensagem: `Adiantamento de R$ 1.800,00 (Belo Horizonte) aguardando aprovação.`,
        link_url: `/adiantamentos/${adiPend.id}`,
      },
      {
        user_id: gestor.id,
        tipo: 'aprovacao_pendente',
        titulo: 'Prestação aguardando aprovação',
        mensagem: `Prestação "PC Viagem Curitiba" (R$ 850,00) aguardando sua aprovação.`,
        link_url: `/prestacoes/${prestPend.id}`,
      },
      {
        user_id: financeiro.id,
        tipo: 'aprovacao_pendente',
        titulo: 'Prestação aguardando aprovação financeira',
        mensagem: `Prestação Viagem POA (R$ 700,00) aprovada pelo gestor — aguardando validação financeira.`,
        link_url: prestA ? `/prestacoes/${prestA.id}` : '/aprovacoes',
      },
      {
        user_id: viajante.id,
        tipo: 'solicitacao_aprovada',
        titulo: 'Sua viagem foi aprovada',
        mensagem: 'A viagem para Porto Alegre foi aprovada pelo gestor.',
        link_url: '/viagens',
      },
      {
        user_id: viajante.id,
        tipo: 'reembolso_processado',
        titulo: 'Reembolso disponível',
        mensagem: 'Reembolso de R$ 350,00 da Prestação Recife aprovado — financeiro irá processar o pagamento.',
        link_url: '/prestacoes',
      },
    ]
    for (const n of notifs) {
      upsert(
        'notificacoes',
        `user_id='${n.user_id}' && titulo='${n.titulo.replace(/'/g, "''")}'`,
        (r) => {
          r.set('user_id', n.user_id)
          r.set('empresa_id', empresa.id)
          r.set('tipo', n.tipo)
          r.set('titulo', n.titulo)
          r.set('mensagem', n.mensagem)
          r.set('link_url', n.link_url)
          r.set('lida', false)
        },
      )
    }

    console.log('=== 0024 SEED PENDENCIAS APROVACAO COMPLETAS DONE ===')
  },
  (app) => {
    const safeDelete = (col, filter) => {
      try {
        const recs = app.findRecordsByFilter(col, filter, '', 200, 0)
        for (const r of recs) {
          try {
            app.delete(r)
          } catch (_) {}
        }
      } catch (_) {}
    }

    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      return
    }

    // Ordem inversa de criação
    safeDelete('notificacoes', `empresa_id='${empresa.id}' && (titulo='Nova viagem aguardando aprovação' || titulo='Adiantamento aguardando aprovação' || titulo='Prestação aguardando aprovação' || titulo='Prestação aguardando aprovação financeira' || titulo='Sua viagem foi aprovada' || titulo='Reembolso disponível')`)
    safeDelete('audit_log', `empresa_id='${empresa.id}' && user_agent='SeedAgent/0024'`)
    safeDelete('duplicidade_alertas', `empresa_id='${empresa.id}' && motivo ~ 'lançamento duplicado'`)

    // Apaga workflow_runs e steps relacionados (cascade dos steps via FK)
    try {
      const runs = app.findRecordsByFilter(
        'workflow_runs',
        `empresa_id='${empresa.id}'`,
        '',
        500,
        0,
      )
      for (const run of runs) {
        const targetId = run.getString('target_id')
        const targetCol = run.getString('target_collection')
        // Só apaga se target é dos seeds 0024
        try {
          if (targetCol === 'viagens') {
            const t = app.findRecordById('viagens', targetId)
            const cod = t.getString('codigo')
            if (cod === 'V-DEMO-PEND' || cod === 'V-DEMO-PREST') {
              app.delete(run)
              continue
            }
          }
          if (targetCol === 'adiantamentos') {
            const t = app.findRecordById('adiantamentos', targetId)
            if (t.getString('codigo') === 'AD-DEMO-PEND') {
              app.delete(run)
              continue
            }
          }
          if (targetCol === 'prestacoes_contas') {
            const t = app.findRecordById('prestacoes_contas', targetId)
            const tit = t.getString('titulo')
            if (tit === 'PC Viagem Curitiba (Pendente Gestor)') {
              app.delete(run)
              continue
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    safeDelete(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Hospedagem Curitiba'`,
    )
    safeDelete(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && titulo='PC Viagem Curitiba (Pendente Gestor)'`,
    )
    safeDelete(
      'adiantamentos',
      `empresa_id='${empresa.id}' && codigo='AD-DEMO-PEND'`,
    )
    safeDelete(
      'viagem_trechos',
      `viagem_id IN (SELECT id FROM viagens WHERE empresa_id='${empresa.id}' AND (codigo='V-DEMO-PEND' OR codigo='V-DEMO-PREST'))`,
    )
    safeDelete(
      'viagens',
      `empresa_id='${empresa.id}' && (codigo='V-DEMO-PEND' || codigo='V-DEMO-PREST')`,
    )
  },
)
