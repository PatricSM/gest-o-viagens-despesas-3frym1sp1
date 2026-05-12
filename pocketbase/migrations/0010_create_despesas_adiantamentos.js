migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const categorias = app.findCollectionByNameOrId('categorias_despesa')
    const moedas = app.findCollectionByNameOrId('moedas')
    const viagens = app.findCollectionByNameOrId('viagens')
    const fornecedores = app.findCollectionByNameOrId('fornecedores')
    const centros_custo = app.findCollectionByNameOrId('centros_custo')
    const projetos = app.findCollectionByNameOrId('projetos')

    // 1. Prestacoes (Stub para suportar relacionamento)
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

    // 2. Despesas
    const despesas = new Collection({
      name: 'despesas',
      type: 'base',
      listRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      viewRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      createRule:
        "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')",
      updateRule:
        "empresa_id = @request.auth.empresa_id && ((@request.auth.id = usuario_id && (status = 'rascunho' || status = 'pendente')) || @request.auth.role = 'admin')",
      deleteRule:
        "empresa_id = @request.auth.empresa_id && ((@request.auth.id = usuario_id && (status = 'rascunho' || status = 'pendente')) || @request.auth.role = 'admin')",
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
        { name: 'data_despesa', type: 'date', required: true },
        {
          name: 'categoria_id',
          type: 'relation',
          required: true,
          collectionId: categorias.id,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'moeda_id',
          type: 'relation',
          required: true,
          collectionId: moedas.id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'pendente', 'em_aprovacao', 'aprovada', 'rejeitada', 'reembolsada'],
          maxSelect: 1,
        },
        {
          name: 'viagem_id',
          type: 'relation',
          required: false,
          collectionId: viagens.id,
          maxSelect: 1,
        },
        {
          name: 'fornecedor_id',
          type: 'relation',
          required: false,
          collectionId: fornecedores.id,
          maxSelect: 1,
        },
        {
          name: 'centro_custo_id',
          type: 'relation',
          required: false,
          collectionId: centros_custo.id,
          maxSelect: 1,
        },
        {
          name: 'projeto_id',
          type: 'relation',
          required: false,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        {
          name: 'prestacao_id',
          type: 'relation',
          required: false,
          collectionId: prestacoes.id,
          maxSelect: 1,
        },
        { name: 'workflow_run_id', type: 'text', required: false },
        { name: 'descricao', type: 'text', required: false },
        { name: 'splits', type: 'json', required: false },
        { name: 'modo_km', type: 'bool', required: false },
        { name: 'km_origem', type: 'text', required: false },
        { name: 'km_destino', type: 'text', required: false },
        { name: 'km_percorridos', type: 'number', required: false },
        { name: 'km_valor_por_km', type: 'number', required: false },
        { name: 'valor_convertido', type: 'number', required: false },
        { name: 'cotacao_aplicada', type: 'number', required: false },
        { name: 'possivel_duplicidade', type: 'bool', required: false },
        {
          name: 'forma_pagamento',
          type: 'select',
          required: false,
          values: ['cartao_pessoal', 'cartao_corporativo', 'dinheiro', 'transferencia'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(despesas)

    // 3. Comprovantes
    const comprovantes = new Collection({
      name: 'despesa_comprovantes',
      type: 'base',
      listRule:
        "despesa_id.empresa_id = @request.auth.empresa_id && (despesa_id.usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && despesa_id.usuario_id.gestor_id = @request.auth.id))",
      viewRule:
        "despesa_id.empresa_id = @request.auth.empresa_id && (despesa_id.usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && despesa_id.usuario_id.gestor_id = @request.auth.id))",
      createRule:
        "despesa_id.empresa_id = @request.auth.empresa_id && (@request.auth.id = despesa_id.usuario_id || @request.auth.role = 'admin')",
      updateRule:
        "despesa_id.empresa_id = @request.auth.empresa_id && ((@request.auth.id = despesa_id.usuario_id && (despesa_id.status = 'rascunho' || despesa_id.status = 'pendente')) || @request.auth.role = 'admin')",
      deleteRule:
        "despesa_id.empresa_id = @request.auth.empresa_id && ((@request.auth.id = despesa_id.usuario_id && (despesa_id.status = 'rascunho' || despesa_id.status = 'pendente')) || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'despesa_id',
          type: 'relation',
          required: true,
          collectionId: despesas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          thumbs: ['200x200'],
        },
        {
          name: 'uploaded_by',
          type: 'relation',
          required: false,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(comprovantes)

    // 4. Adiantamentos
    const adiantamentos = new Collection({
      name: 'adiantamentos',
      type: 'base',
      listRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      viewRule:
        "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))",
      createRule:
        "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')",
      updateRule:
        "empresa_id = @request.auth.empresa_id && ((@request.auth.id = usuario_id && status = 'solicitado') || @request.auth.role = 'admin' || @request.auth.role = 'financeiro')",
      deleteRule:
        "empresa_id = @request.auth.empresa_id && ((@request.auth.id = usuario_id && status = 'solicitado') || @request.auth.role = 'admin')",
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
          name: 'viagem_id',
          type: 'relation',
          required: false,
          collectionId: viagens.id,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'moeda_id',
          type: 'relation',
          required: true,
          collectionId: moedas.id,
          maxSelect: 1,
        },
        { name: 'justificativa', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['solicitado', 'aprovado', 'rejeitado', 'pago', 'acertado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'data_pagamento', type: 'date', required: false },
        { name: 'valor_utilizado', type: 'number', required: false },
        { name: 'valor_devolver', type: 'number', required: false },
        {
          name: 'prestacao_id',
          type: 'relation',
          required: false,
          collectionId: prestacoes.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(adiantamentos)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('adiantamentos'))
    app.delete(app.findCollectionByNameOrId('despesa_comprovantes'))
    app.delete(app.findCollectionByNameOrId('despesas'))
    app.delete(app.findCollectionByNameOrId('prestacoes'))
  },
)
