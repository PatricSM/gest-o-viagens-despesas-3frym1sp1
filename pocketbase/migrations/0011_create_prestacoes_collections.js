migrate(
  (app) => {
    let prestacoes
    try {
      prestacoes = app.findCollectionByNameOrId('prestacoes_contas')
    } catch (_) {
      try {
        prestacoes = app.findCollectionByNameOrId('prestacoes')
        prestacoes.name = 'prestacoes_contas'
        app.save(prestacoes)
      } catch (_) {
        const empresasId = app.findCollectionByNameOrId('empresas').id
        prestacoes = new Collection({
          name: 'prestacoes_contas',
          type: 'base',
          listRule: 'empresa_id = @request.auth.empresa_id',
          viewRule: 'empresa_id = @request.auth.empresa_id',
          createRule: "@request.auth.id != ''",
          updateRule: 'empresa_id = @request.auth.empresa_id',
          deleteRule: 'empresa_id = @request.auth.empresa_id',
          fields: [
            {
              name: 'empresa_id',
              type: 'relation',
              required: true,
              collectionId: empresasId,
              maxSelect: 1,
            },
            {
              name: 'usuario_id',
              type: 'relation',
              required: true,
              collectionId: '_pb_users_auth_',
              maxSelect: 1,
            },
            { name: 'codigo', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        })
        app.save(prestacoes)
      }
    }

    if (prestacoes.fields.getByName('status')) {
      prestacoes.fields.removeByName('status')
    }
    prestacoes.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        values: [
          'rascunho',
          'enviada',
          'em_aprovacao_gestor',
          'em_aprovacao_financeiro',
          'aprovada',
          'paga',
          'rejeitada',
          'devolvida',
        ],
        maxSelect: 1,
      }),
    )

    const addFieldIfMissing = (field) => {
      if (!prestacoes.fields.getByName(field.name)) {
        prestacoes.fields.add(field)
      }
    }

    try {
      const empresasId = app.findCollectionByNameOrId('empresas').id
      addFieldIfMissing(
        new RelationField({
          name: 'empresa_id',
          collectionId: empresasId,
          required: true,
          maxSelect: 1,
        }),
      )
    } catch (_) {}

    addFieldIfMissing(
      new RelationField({
        name: 'usuario_id',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addFieldIfMissing(new TextField({ name: 'codigo' }))

    addFieldIfMissing(new TextField({ name: 'titulo', required: true }))
    addFieldIfMissing(new TextField({ name: 'descricao' }))
    addFieldIfMissing(new NumberField({ name: 'total_despesas' }))
    addFieldIfMissing(new NumberField({ name: 'total_adiantamento' }))
    addFieldIfMissing(new NumberField({ name: 'saldo' }))

    addFieldIfMissing(new DateField({ name: 'data_envio' }))
    addFieldIfMissing(new DateField({ name: 'data_aprovacao_gestor' }))
    addFieldIfMissing(new DateField({ name: 'data_aprovacao_financeiro' }))
    addFieldIfMissing(new DateField({ name: 'data_pagamento' }))

    try {
      const viagensId = app.findCollectionByNameOrId('viagens').id
      addFieldIfMissing(
        new RelationField({ name: 'viagem_id', collectionId: viagensId, maxSelect: 1 }),
      )
    } catch (_) {}

    try {
      const moedasId = app.findCollectionByNameOrId('moedas').id
      addFieldIfMissing(
        new RelationField({ name: 'moeda_id', collectionId: moedasId, maxSelect: 1 }),
      )
    } catch (_) {}

    try {
      const workflowsId = app.findCollectionByNameOrId('workflow_runs').id
      addFieldIfMissing(
        new RelationField({ name: 'workflow_run_id', collectionId: workflowsId, maxSelect: 1 }),
      )
    } catch (_) {}

    let reembolsos
    try {
      reembolsos = app.findCollectionByNameOrId('reembolsos')
    } catch (_) {
      const empresasId = app.findCollectionByNameOrId('empresas').id
      reembolsos = new Collection({
        name: 'reembolsos',
        type: 'base',
        listRule: 'empresa_id = @request.auth.empresa_id',
        viewRule: 'empresa_id = @request.auth.empresa_id',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'empresa_id',
            type: 'relation',
            required: true,
            collectionId: empresasId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(reembolsos)
    }

    addFieldIfMissing(
      new RelationField({ name: 'reembolso_id', collectionId: reembolsos.id, maxSelect: 1 }),
    )

    app.save(prestacoes)

    let anexos
    try {
      anexos = app.findCollectionByNameOrId('prestacao_anexos')
    } catch (_) {
      anexos = new Collection({
        name: 'prestacao_anexos',
        type: 'base',
        listRule: 'prestacao_id.empresa_id = @request.auth.empresa_id',
        viewRule: 'prestacao_id.empresa_id = @request.auth.empresa_id',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'prestacao_id',
            type: 'relation',
            required: true,
            collectionId: prestacoes.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'arquivo', type: 'file', maxSelect: 1, maxSize: 10485760 },
          { name: 'descricao', type: 'text' },
          { name: 'uploaded_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(anexos)
    }

    try {
      const despesas = app.findCollectionByNameOrId('despesas')
      if (!despesas.fields.getByName('prestacao_id')) {
        despesas.fields.add(
          new RelationField({ name: 'prestacao_id', collectionId: prestacoes.id, maxSelect: 1 }),
        )
        app.save(despesas)
      }
    } catch (_) {}

    try {
      const adiantamentos = app.findCollectionByNameOrId('adiantamentos')
      if (!adiantamentos.fields.getByName('prestacao_id')) {
        adiantamentos.fields.add(
          new RelationField({ name: 'prestacao_id', collectionId: prestacoes.id, maxSelect: 1 }),
        )
        app.save(adiantamentos)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const anexos = app.findCollectionByNameOrId('prestacao_anexos')
      app.delete(anexos)
    } catch (_) {}

    try {
      const prestacoes = app.findCollectionByNameOrId('prestacoes_contas')
      prestacoes.name = 'prestacoes'
      app.save(prestacoes)
    } catch (_) {}
  },
)
