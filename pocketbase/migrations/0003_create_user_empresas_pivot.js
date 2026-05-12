migrate(
  (app) => {
    const empresaCol = app.findCollectionByNameOrId('empresas')
    const collection = new Collection({
      name: 'user_empresas',
      type: 'base',
      listRule:
        "user_id = @request.auth.id || (@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id)",
      viewRule:
        "user_id = @request.auth.id || (@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id)",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresaCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['admin', 'financeiro', 'gestor', 'viajante', 'auditor'],
          maxSelect: 1,
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_user_empresas_unique ON user_empresas (user_id, empresa_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('user_empresas')
    app.delete(collection)
  },
)
