migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      throw new Error('Empresa Adapta Corp não encontrada. Rode 0004 primeiro.')
    }

    let admin = null
    try {
      admin = app.findAuthRecordByEmail('users', 'admin@adapta.org')
    } catch (_) {
      const adms = app.findRecordsByFilter(
        'users',
        `empresa_id='${empresa.id}' && role='admin'`,
        '',
        1,
        0,
      )
      if (adms.length > 0) admin = adms[0]
    }
    if (!admin) {
      throw new Error('Admin não encontrado para criar política/workflows.')
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

    const today = new Date().toISOString()

    // ─── POLÍTICA VIGENTE (versão 1, sem restrições) ───
    upsert('politicas', `empresa_id='${empresa.id}' && versao=1`, (r) => {
      r.set('empresa_id', empresa.id)
      r.set('versao', 1)
      r.set('vigencia_inicio', today)
      // vigencia_fim null = vigente
      r.set('antecedencia_minima_viagem_dias', 7)
      r.set('valor_max_sem_comprovante', 50)
      r.set('active', true)
      r.set('created_by', admin.id)
    })

    // ─── 4 WORKFLOWS (viagem, despesa, adiantamento, prestação) ───
    const tipos = [
      { tipo: 'viagem', nome: 'Aprovação de Viagem' },
      { tipo: 'despesa', nome: 'Aprovação de Despesa' },
      { tipo: 'adiantamento', nome: 'Aprovação de Adiantamento' },
      { tipo: 'prestacao', nome: 'Aprovação de Prestação' },
    ]

    for (const t of tipos) {
      const wf = upsert(
        'workflows',
        `empresa_id='${empresa.id}' && tipo='${t.tipo}' && versao=1`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('tipo', t.tipo)
          r.set('nome', t.nome)
          r.set('versao', 1)
          r.set('active', true)
          r.set('vigencia_inicio', today)
          r.set('created_by', admin.id)
        },
      )

      // Etapa 1: Gestor direto (sem alçada de valor)
      upsert('workflow_etapas', `workflow_id='${wf.id}' && ordem=1`, (r) => {
        r.set('workflow_id', wf.id)
        r.set('ordem', 1)
        r.set('tipo_aprovador', 'gestor_direto')
        r.set('alcada_valor_min', 0)
        // alcada_valor_max null = sem teto
        r.set('paralela', false)
        r.set('sla_horas', 48)
      })

      // Etapa 2: Financeiro (só pra prestação e adiantamento — validação final)
      if (t.tipo === 'prestacao' || t.tipo === 'adiantamento') {
        upsert('workflow_etapas', `workflow_id='${wf.id}' && ordem=2`, (r) => {
          r.set('workflow_id', wf.id)
          r.set('ordem', 2)
          r.set('tipo_aprovador', 'financeiro')
          r.set('alcada_valor_min', 0)
          r.set('paralela', false)
          r.set('sla_horas', 72)
        })
      }
    }

    console.log('=== 0020 SEED POLITICA + WORKFLOWS DONE ===')
  },
  (app) => {
    const safeDelete = (col, filter) => {
      try {
        const recs = app.findRecordsByFilter(col, filter, '', 100, 0)
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

    try {
      const wfs = app.findRecordsByFilter(
        'workflows',
        `empresa_id='${empresa.id}' && versao=1`,
        '',
        20,
        0,
      )
      for (const wf of wfs) {
        safeDelete('workflow_etapas', `workflow_id='${wf.id}'`)
        try {
          app.delete(wf)
        } catch (_) {}
      }
    } catch (_) {}
    safeDelete('politicas', `empresa_id='${empresa.id}' && versao=1`)
  },
)
