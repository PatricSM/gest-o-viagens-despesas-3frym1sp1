migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      throw new Error("Empresa 'Adapta Corp' (00.000.000/0001-00) não encontrada. Cancele o seed.")
    }

    const getAuthUser = (email, role) => {
      try {
        const rec = app.findAuthRecordByEmail('users', email)
        if (rec && rec.get('empresa_id') === empresa.id) return rec
      } catch (_) {}

      try {
        const recs = app.findRecordsByFilter(
          'users',
          `empresa_id='${empresa.id}' && role='${role}'`,
          '',
          1,
          0,
        )
        if (recs.length > 0) return recs[0]
      } catch (_) {}

      throw new Error(`User with email ${email} or role ${role} not found. Migration aborted.`)
    }

    const admin = getAuthUser('admin@adapta.org', 'admin')
    const financeiro = getAuthUser('financeiro@adapta.org', 'financeiro')
    const gestor = getAuthUser('gestor@adapta.org', 'gestor')
    const viajante = getAuthUser('viajante@adapta.org', 'viajante')
    const auditor = getAuthUser('auditor@adapta.org', 'auditor')

    const getOrCreate = (collectionName, filter, createDataFn) => {
      try {
        const recs = app.findRecordsByFilter(collectionName, filter, '', 1, 0)
        if (recs.length > 0) return recs[0]
      } catch (_) {}

      const col = app.findCollectionByNameOrId(collectionName)
      const rec = new Record(col)
      const data = createDataFn()
      for (const key of Object.keys(data)) {
        rec.set(key, data[key])
      }
      app.save(rec)
      return rec
    }

    const nowStr = new Date().toISOString()
    const future = new Date()
    future.setDate(future.getDate() + 15)
    const futureStr = future.toISOString()

    // Block 1: Master Data
    let moeda
    try {
      const moedas = app.findRecordsByFilter(
        'moedas',
        `empresa_id='${empresa.id}' && codigo='BRL'`,
        '',
        1,
        0,
      )
      if (moedas.length > 0) moeda = moedas[0]
    } catch (_) {}

    if (!moeda) {
      try {
        const padroes = app.findRecordsByFilter(
          'moedas',
          `empresa_id='${empresa.id}' && padrao=true`,
          '',
          100,
          0,
        )
        for (const p of padroes) {
          p.set('padrao', false)
          app.save(p)
        }
      } catch (_) {}
      const col = app.findCollectionByNameOrId('moedas')
      moeda = new Record(col)
      moeda.set('empresa_id', empresa.id)
      moeda.set('codigo', 'BRL')
      moeda.set('nome', 'Real Brasileiro')
      moeda.set('simbolo', 'R$')
      moeda.set('cotacao_atual', 1.0)
      moeda.set('cotacao_data', nowStr)
      moeda.set('padrao', true)
      moeda.set('active', true)
      app.save(moeda)
    }

    const categoria = getOrCreate(
      'categorias_despesa',
      `empresa_id='${empresa.id}' && nome='Alimentação'`,
      () => ({
        empresa_id: empresa.id,
        nome: 'Alimentação',
        descricao: 'Refeições durante a viagem',
        icone: 'Utensils',
        cor: '#FF9900',
        reembolsavel_padrao: true,
        exige_justificativa: false,
        active: true,
      }),
    )

    const centroCusto = getOrCreate(
      'centros_custo',
      `empresa_id='${empresa.id}' && codigo='OP-001'`,
      () => ({
        empresa_id: empresa.id,
        codigo: 'OP-001',
        nome: 'Operacional',
        responsavel_id: gestor.id,
        active: true,
      }),
    )

    const projeto = getOrCreate(
      'projetos',
      `empresa_id='${empresa.id}' && codigo='PROJ-SUL-26'`,
      () => ({
        empresa_id: empresa.id,
        codigo: 'PROJ-SUL-26',
        nome: 'Expansão Sul Q1 2026',
        descricao: 'Projeto de expansão para a região sul',
        centro_custo_padrao_id: centroCusto.id,
        responsavel_id: gestor.id,
        status: 'ativo',
        active: true,
      }),
    )

    // Block 2 & 3: Trip A Lifecycle
    const viagemA = getOrCreate(
      'viagens',
      `empresa_id='${empresa.id}' && codigo='V-DEMO-A'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        codigo: 'V-DEMO-A',
        motivo: 'Visita a clientes e prospecção no Sul',
        projeto_id: projeto.id,
        centro_custo_id: centroCusto.id,
        status: 'aprovada',
        total_estimado: 1800.0,
        data_envio: nowStr,
        data_aprovacao: nowStr,
      }),
    )

    getOrCreate('viagem_trechos', `viagem_id='${viagemA.id}' && origem='SP'`, () => ({
      viagem_id: viagemA.id,
      ordem: 1,
      origem: 'SP',
      destino: 'POA',
      data_ida: futureStr,
      tipo_transporte: 'aereo',
    }))

    getOrCreate('viagem_estimativas', `viagem_id='${viagemA.id}' && tipo='passagem'`, () => ({
      viagem_id: viagemA.id,
      tipo: 'passagem',
      descricao: 'Voo ida e volta',
      valor: 1800.0,
    }))

    const prestacaoA = getOrCreate(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && titulo='PC Viagem Demo A'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        viagem_id: viagemA.id,
        moeda_id: moeda.id,
        codigo: 'PC-DEMO-A',
        titulo: 'PC Viagem Demo A',
        status: 'em_aprovacao_financeiro',
        total_despesas: 700.0,
        total_adiantamento: 1500.0,
        saldo: -800.0,
        data_envio: nowStr,
        data_aprovacao_gestor: nowStr,
      }),
    )

    const adiantamento = getOrCreate(
      'adiantamentos',
      `viagem_id='${viagemA.id}' && justificativa='Adiantamento para despesas no Sul'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        codigo: 'AD-DEMO-A',
        viagem_id: viagemA.id,
        valor: 1500.0,
        moeda_id: moeda.id,
        justificativa: 'Adiantamento para despesas no Sul',
        status: 'pago',
        data_pagamento: nowStr,
        prestacao_id: prestacaoA.id,
      }),
    )

    const despesaD1 = getOrCreate(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Almoço Cliente 1'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        viagem_id: viagemA.id,
        prestacao_id: prestacaoA.id,
        data_despesa: nowStr,
        categoria_id: categoria.id,
        valor: 280.0,
        moeda_id: moeda.id,
        status: 'aprovada',
        descricao: 'Almoço Cliente 1',
        centro_custo_id: centroCusto.id,
        projeto_id: projeto.id,
      }),
    )

    const despesaD2 = getOrCreate(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Jantar Equipe'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        viagem_id: viagemA.id,
        prestacao_id: prestacaoA.id,
        data_despesa: nowStr,
        categoria_id: categoria.id,
        valor: 420.0,
        moeda_id: moeda.id,
        status: 'aprovada',
        descricao: 'Jantar Equipe',
        centro_custo_id: centroCusto.id,
        projeto_id: projeto.id,
      }),
    )

    const despesaD3 = getOrCreate(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Café Aeroporto'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        viagem_id: viagemA.id,
        data_despesa: nowStr,
        categoria_id: categoria.id,
        valor: 95.0,
        moeda_id: moeda.id,
        status: 'em_aprovacao',
        descricao: 'Café Aeroporto',
        centro_custo_id: centroCusto.id,
        projeto_id: projeto.id,
      }),
    )

    // Block 5 & 6: Drafts
    const viagemB = getOrCreate(
      'viagens',
      `empresa_id='${empresa.id}' && codigo='V-DEMO-B'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        codigo: 'V-DEMO-B',
        motivo: 'Reunião de planejamento (Rascunho)',
        centro_custo_id: centroCusto.id,
        status: 'rascunho',
      }),
    )

    const despesaD4 = getOrCreate(
      'despesas',
      `empresa_id='${empresa.id}' && descricao='Uber Reunião (Rascunho)'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        data_despesa: nowStr,
        categoria_id: categoria.id,
        valor: 65.0,
        moeda_id: moeda.id,
        status: 'rascunho',
        descricao: 'Uber Reunião (Rascunho)',
        centro_custo_id: centroCusto.id,
      }),
    )

    // Block 7: Completed Workflow & Refunds
    const prestacaoB = getOrCreate(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && titulo='PC Viagem Demo B'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        moeda_id: moeda.id,
        codigo: 'PC-DEMO-B',
        titulo: 'PC Viagem Demo B',
        status: 'paga',
        total_despesas: 350.0,
        total_adiantamento: 0.0,
        saldo: 350.0,
        data_envio: nowStr,
        data_aprovacao_gestor: nowStr,
        data_aprovacao_financeiro: nowStr,
        data_pagamento: nowStr,
      }),
    )

    const reembolso = getOrCreate(
      'reembolsos',
      `empresa_id='${empresa.id}' && codigo='REEMB-DEMO'`,
      () => ({
        empresa_id: empresa.id,
        usuario_id: viajante.id,
        prestacao_id: prestacaoB.id,
        codigo: 'REEMB-DEMO',
        valor: 350.0,
        moeda_id: moeda.id,
        status: 'a_pagar',
        chave_pix: 'viajante@adapta.org',
      }),
    )

    if (!prestacaoB.get('reembolso_id')) {
      prestacaoB.set('reembolso_id', reembolso.id)
      app.save(prestacaoB)
    }

    // Block 8: Notifications
    getOrCreate(
      'notificacoes',
      `user_id='${gestor.id}' && titulo='Aprovação Pendente: Despesa' && link_url='/despesas/${despesaD3.id}'`,
      () => ({
        user_id: gestor.id,
        empresa_id: empresa.id,
        tipo: 'aprovacao_pendente',
        titulo: 'Aprovação Pendente: Despesa',
        mensagem: `A despesa "Café Aeroporto" de R$ 95,00 aguarda sua aprovação.`,
        link_url: `/despesas/${despesaD3.id}`,
        lida: false,
      }),
    )
  },
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      return
    }

    const deleteByFilter = (col, filter) => {
      try {
        const recs = app.findRecordsByFilter(col, filter, '', 100, 0)
        for (const rec of recs) {
          app.delete(rec)
        }
      } catch (_) {}
    }

    deleteByFilter(
      'notificacoes',
      `empresa_id='${empresa.id}' && titulo='Aprovação Pendente: Despesa'`,
    )

    try {
      const prestacoes = app.findRecordsByFilter(
        'prestacoes_contas',
        `empresa_id='${empresa.id}' && (codigo='PC-DEMO-A' || codigo='PC-DEMO-B')`,
        '',
        100,
        0,
      )
      for (const p of prestacoes) {
        p.set('reembolso_id', null)
        app.save(p)
      }
    } catch (_) {}

    deleteByFilter('reembolsos', `empresa_id='${empresa.id}' && codigo='REEMB-DEMO'`)
    deleteByFilter(
      'despesas',
      `empresa_id='${empresa.id}' && (descricao='Almoço Cliente 1' || descricao='Jantar Equipe' || descricao='Café Aeroporto' || descricao='Uber Reunião (Rascunho)')`,
    )
    deleteByFilter('adiantamentos', `empresa_id='${empresa.id}' && codigo='AD-DEMO-A'`)
    deleteByFilter(
      'prestacoes_contas',
      `empresa_id='${empresa.id}' && (codigo='PC-DEMO-A' || codigo='PC-DEMO-B')`,
    )
    deleteByFilter('viagem_estimativas', `descricao='Voo ida e volta'`)
    deleteByFilter('viagem_trechos', `origem='SP' && destino='POA'`)
    deleteByFilter(
      'viagens',
      `empresa_id='${empresa.id}' && (codigo='V-DEMO-A' || codigo='V-DEMO-B')`,
    )
    deleteByFilter('projetos', `empresa_id='${empresa.id}' && codigo='PROJ-SUL-26'`)
    deleteByFilter('centros_custo', `empresa_id='${empresa.id}' && codigo='OP-001'`)
    deleteByFilter('categorias_despesa', `empresa_id='${empresa.id}' && nome='Alimentação'`)
  },
)
