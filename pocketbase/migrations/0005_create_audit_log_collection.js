migrate(
  (app) => {
    const collection = new Collection({
      name: 'audit_log',
      type: 'base',
      listRule:
        "(@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id) || @request.auth.role = 'auditor'",
      viewRule:
        "(@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id) || @request.auth.role = 'auditor'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('empresas').id,
          maxSelect: 1,
        },
        {
          name: 'user_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'action', type: 'text', required: true },
        { name: 'module', type: 'text', required: true },
        { name: 'record_id', type: 'text', required: false },
        { name: 'before_state', type: 'json', required: false },
        { name: 'after_state', type: 'json', required: false },
        { name: 'ip', type: 'text', required: false },
        { name: 'user_agent', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_log_empresa ON audit_log (empresa_id)',
        'CREATE INDEX idx_audit_log_action ON audit_log (action)',
        'CREATE INDEX idx_audit_log_module ON audit_log (module)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('audit_log')
    app.delete(collection)
  },
)
