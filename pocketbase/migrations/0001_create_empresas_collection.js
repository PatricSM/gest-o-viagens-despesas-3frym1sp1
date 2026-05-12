migrate(
  (app) => {
    const collection = new Collection({
      name: 'empresas',
      type: 'base',
      listRule:
        "(@request.auth.role = 'admin' && @request.auth.empresa_id = id) || @request.auth.role = 'auditor'",
      viewRule:
        "(@request.auth.role = 'admin' && @request.auth.empresa_id = id) || @request.auth.role = 'auditor'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'razao_social', type: 'text', required: true },
        { name: 'nome_fantasia', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'logo', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'cor_primaria', type: 'text' },
        { name: 'fuso_horario', type: 'text' },
        { name: 'idioma_padrao', type: 'text' },
        { name: 'moeda_padrao', type: 'text' },
        { name: 'endereco', type: 'json' },
        { name: 'smtp_config', type: 'json' },
        { name: 'dpo_nome', type: 'text' },
        { name: 'dpo_email', type: 'text' },
        { name: 'politica_privacidade', type: 'editor' },
        { name: 'termos_uso', type: 'editor' },
        { name: 'retencao_dias', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('empresas')
    app.delete(collection)
  },
)
