migrate(
  (app) => {
    const rel_salvos = new Collection({
      name: 'relatorios_salvos',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'filtros', type: 'json' },
        { name: 'tipo_relatorio', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(rel_salvos)

    const rel_agendados = new Collection({
      name: 'relatorios_agendados',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'relatorio_tipo', type: 'text', required: true },
        { name: 'filtros', type: 'json' },
        {
          name: 'frequencia',
          type: 'select',
          required: true,
          values: ['weekly', 'monthly'],
          maxSelect: 1,
        },
        { name: 'proximo_envio', type: 'date', required: true },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(rel_agendados)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('relatorios_agendados'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('relatorios_salvos'))
    } catch (_) {}
  },
)
