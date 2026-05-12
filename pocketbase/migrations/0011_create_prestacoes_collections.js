migrate(
  (app) => {
    const prestacoes = app.findCollectionByNameOrId('prestacoes')
    prestacoes.name = 'prestacoes_contas'

    prestacoes.fields.removeByName('status')
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

    const viagensId = app.findCollectionByNameOrId('viagens').id
    prestacoes.fields.add(
      new RelationField({ name: 'viagem_id', collectionId: viagensId, maxSelect: 1 }),
    )

    prestacoes.fields.add(new TextField({ name: 'titulo', required: true }))
    prestacoes.fields.add(new TextField({ name: 'descricao' }))
    prestacoes.fields.add(new NumberField({ name: 'total_despesas' }))
    prestacoes.fields.add(new NumberField({ name: 'total_adiantamento' }))
    prestacoes.fields.add(new NumberField({ name: 'saldo' }))

    const moedasId = app.findCollectionByNameOrId('moedas').id
    prestacoes.fields.add(
      new RelationField({ name: 'moeda_id', collectionId: moedasId, maxSelect: 1 }),
    )

    const workflowsId = app.findCollectionByNameOrId('workflow_runs').id
    prestacoes.fields.add(
      new RelationField({ name: 'workflow_run_id', collectionId: workflowsId, maxSelect: 1 }),
    )

    prestacoes.fields.add(new DateField({ name: 'data_envio' }))
    prestacoes.fields.add(new DateField({ name: 'data_aprovacao_gestor' }))
    prestacoes.fields.add(new DateField({ name: 'data_aprovacao_financeiro' }))
    prestacoes.fields.add(new DateField({ name: 'data_pagamento' }))

    let reembolsos
    try {
      reembolsos = app.findCollectionByNameOrId('reembolsos')
    } catch (_) {
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
            collectionId: app.findCollectionByNameOrId('empresas').id,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(reembolsos)
    }

    prestacoes.fields.add(
      new RelationField({ name: 'reembolso_id', collectionId: reembolsos.id, maxSelect: 1 }),
    )

    app.save(prestacoes)

    const anexos = new Collection({
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
  },
  (app) => {
    const prestacoes = app.findCollectionByNameOrId('prestacoes_contas')
    prestacoes.name = 'prestacoes'
    app.save(prestacoes)
  },
)
