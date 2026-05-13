migrate(
  (app) => {
    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: '@request.auth.id = user_id && empresa_id = @request.auth.empresa_id',
      viewRule: '@request.auth.id = user_id && empresa_id = @request.auth.empresa_id',
      createRule: null,
      updateRule: '@request.auth.id = user_id && empresa_id = @request.auth.empresa_id',
      deleteRule: '@request.auth.id = user_id && empresa_id = @request.auth.empresa_id',
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
          collectionId: app.findCollectionByNameOrId('empresas').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'aprovacao_pendente',
            'solicitacao_aprovada',
            'solicitacao_rejeitada',
            'reembolso_processado',
            'lembrete_prestacao_atraso',
          ],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'link_url', type: 'text', required: false },
        { name: 'lida', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notificacoes_user ON notificacoes (user_id)',
        'CREATE INDEX idx_notificacoes_lida ON notificacoes (lida)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notificacoes')
    app.delete(collection)
  },
)
