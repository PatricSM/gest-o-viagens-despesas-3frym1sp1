migrate(
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('prestacoes')
    } catch (_) {
      console.log("Collection 'prestacoes' already deleted or not found, skipping drop.")
      return
    }

    const records = app.findRecordsByFilter('prestacoes', "id != ''", '', 1, 0)
    if (records.length > 0) {
      throw new Error(
        `Coleção 'prestacoes' tem ${records.length}+ registros — abortando drop. Investigue manualmente antes de remover.`,
      )
    }

    app.delete(collection)
    console.log("Collection 'prestacoes' dropped successfully.")
  },
  (app) => {
    try {
      app.findCollectionByNameOrId('prestacoes')
      return // Already exists
    } catch (_) {}

    const empresas = app.findCollectionByNameOrId('empresas')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const prestacoes = new Collection({
      name: 'prestacoes',
      type: 'base',
      listRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      viewRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      createRule:
        "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')",
      updateRule:
        "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')",
      deleteRule:
        "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'em_aprovacao', 'aprovada', 'rejeitada', 'paga'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(prestacoes)
  },
)
