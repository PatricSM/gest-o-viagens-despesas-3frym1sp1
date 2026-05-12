migrate(
  (app) => {
    const adminOrAuditorRule =
      "@request.auth.empresa_id = empresa_id && (@request.auth.role = 'admin' || @request.auth.role = 'auditor')"
    const adminRule = "@request.auth.role = 'admin' && @request.auth.empresa_id = empresa_id"

    const empresasCol = app.findCollectionByNameOrId('empresas')
    const usersId = '_pb_users_auth_'
    const empresasId = empresasCol.id

    // 1. filiais
    const filiais = new Collection({
      name: 'filiais',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'codigo', type: 'text' },
        { name: 'endereco_logradouro', type: 'text' },
        { name: 'endereco_numero', type: 'text' },
        { name: 'endereco_complemento', type: 'text' },
        { name: 'endereco_cidade', type: 'text' },
        { name: 'endereco_estado', type: 'text' },
        { name: 'endereco_cep', type: 'text' },
        { name: 'gestor_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(filiais)

    // 2. departamentos
    const departamentos = new Collection({
      name: 'departamentos',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'codigo', type: 'text' },
        { name: 'responsavel_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'filial_id', type: 'relation', collectionId: filiais.id, maxSelect: 1 },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(departamentos)

    departamentos.fields.add(
      new RelationField({
        name: 'departamento_pai_id',
        collectionId: departamentos.id,
        maxSelect: 1,
      }),
    )
    app.save(departamentos)

    // 3. centros_custo
    const centrosCusto = new Collection({
      name: 'centros_custo',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'responsavel_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'orcamento_mensal', type: 'number' },
        { name: 'departamento_id', type: 'relation', collectionId: departamentos.id, maxSelect: 1 },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(centrosCusto)

    // 4. projetos
    const projetos = new Collection({
      name: 'projetos',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'orcamento_total', type: 'number' },
        {
          name: 'centro_custo_padrao_id',
          type: 'relation',
          collectionId: centrosCusto.id,
          maxSelect: 1,
        },
        { name: 'status', type: 'select', values: ['ativo', 'encerrado', 'pausado'], maxSelect: 1 },
        { name: 'responsavel_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(projetos)

    // 5. categorias_despesa
    const categoriasDespesa = new Collection({
      name: 'categorias_despesa',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'icone', type: 'text' },
        { name: 'cor', type: 'text' },
        { name: 'reembolsavel_padrao', type: 'bool' },
        { name: 'exige_justificativa', type: 'bool' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(categoriasDespesa)

    categoriasDespesa.fields.add(
      new RelationField({
        name: 'categoria_pai_id',
        collectionId: categoriasDespesa.id,
        maxSelect: 1,
      }),
    )
    app.save(categoriasDespesa)

    // 6. fornecedores
    const fornecedores = new Collection({
      name: 'fornecedores',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cnpj', type: 'text' },
        {
          name: 'categoria_id',
          type: 'relation',
          collectionId: categoriasDespesa.id,
          maxSelect: 1,
        },
        { name: 'contato_email', type: 'email' },
        { name: 'contato_telefone', type: 'text' },
        { name: 'preferencial', type: 'bool' },
        { name: 'observacoes', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(fornecedores)

    // 7. moedas
    const moedas = new Collection({
      name: 'moedas',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'simbolo', type: 'text' },
        { name: 'cotacao_atual', type: 'number' },
        { name: 'cotacao_data', type: 'date' },
        { name: 'padrao', type: 'bool' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_moedas_empresa_codigo ON moedas (empresa_id, codigo)',
        'CREATE UNIQUE INDEX idx_moedas_empresa_padrao ON moedas (empresa_id) WHERE padrao = true',
      ],
    })
    app.save(moedas)

    // 8. cotacao_historico
    const cotacaoHistorico = new Collection({
      name: 'cotacao_historico',
      type: 'base',
      listRule: adminOrAuditorRule,
      viewRule: adminOrAuditorRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'moeda_id',
          type: 'relation',
          required: true,
          collectionId: moedas.id,
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        { name: 'data', type: 'date', required: true },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(cotacaoHistorico)
  },
  (app) => {
    const collections = [
      'cotacao_historico',
      'moedas',
      'fornecedores',
      'categorias_despesa',
      'projetos',
      'centros_custo',
      'departamentos',
      'filiais',
    ]

    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
