migrate(
  (app) => {
    const collection = new Collection({
      name: 'duplicidade_alertas',
      type: 'base',
      listRule:
        "@request.auth.empresa_id = empresa_id && (@request.auth.role = 'admin' || @request.auth.role = 'auditor' || @request.auth.role = 'financeiro')",
      viewRule:
        "@request.auth.empresa_id = empresa_id && (@request.auth.role = 'admin' || @request.auth.role = 'auditor' || @request.auth.role = 'financeiro')",
      createRule: '@request.auth.empresa_id = empresa_id',
      updateRule:
        "@request.auth.empresa_id = empresa_id && (@request.auth.role = 'admin' || @request.auth.role = 'auditor' || @request.auth.role = 'financeiro')",
      deleteRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('empresas').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'despesa_a_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('despesas').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'despesa_b_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('despesas').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'motivo', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['aberto', 'confirmado', 'falso_positivo'],
          maxSelect: 1,
        },
        { name: 'reviewed_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('duplicidade_alertas')
    app.delete(collection)
  },
)
