migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const empresasId = app.findCollectionByNameOrId('empresas').id
    const projetosId = app.findCollectionByNameOrId('projetos').id
    const centrosCustoId = app.findCollectionByNameOrId('centros_custo').id
    const departamentosId = app.findCollectionByNameOrId('departamentos').id
    const workflowsId = app.findCollectionByNameOrId('workflows').id
    const politicasId = app.findCollectionByNameOrId('politicas').id

    const authCondition =
      "empresa_id = @request.auth.empresa_id && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && usuario_id.gestor_id = @request.auth.id))"
    const createCondition =
      "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')"
    const updateCondition =
      "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'admin')"
    const viagensDeleteCondition =
      "empresa_id = @request.auth.empresa_id && ((@request.auth.id = usuario_id && status = 'rascunho') || @request.auth.role = 'admin')"

    const viagens = new Collection({
      name: 'viagens',
      type: 'base',
      listRule: authCondition,
      viewRule: authCondition,
      createRule: createCondition,
      updateRule: updateCondition,
      deleteRule: viagensDeleteCondition,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text' },
        { name: 'motivo', type: 'text', required: true },
        { name: 'projeto_id', type: 'relation', collectionId: projetosId, maxSelect: 1 },
        {
          name: 'centro_custo_id',
          type: 'relation',
          required: true,
          collectionId: centrosCustoId,
          maxSelect: 1,
        },
        { name: 'departamento_id', type: 'relation', collectionId: departamentosId, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'rascunho',
            'em_aprovacao',
            'aprovada',
            'em_andamento',
            'concluida',
            'cancelada',
            'rejeitada',
            'encerrada',
          ],
          maxSelect: 1,
        },
        { name: 'data_envio', type: 'date' },
        { name: 'data_aprovacao', type: 'date' },
        { name: 'workflow_run_id', type: 'text' },
        { name: 'politica_id', type: 'relation', collectionId: politicasId, maxSelect: 1 },
        { name: 'politica_violacoes', type: 'json' },
        { name: 'total_estimado', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_viagens_codigo ON viagens (empresa_id, codigo) WHERE codigo != ''",
      ],
    })
    app.save(viagens)

    const viagensId = app.findCollectionByNameOrId('viagens').id

    const childAuthCondition =
      "viagem_id.empresa_id = @request.auth.empresa_id && (viagem_id.usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor' || (@request.auth.role = 'gestor' && viagem_id.usuario_id.gestor_id = @request.auth.id))"
    const childUpdateCondition =
      "viagem_id.empresa_id = @request.auth.empresa_id && ((@request.auth.id = viagem_id.usuario_id && viagem_id.status = 'rascunho') || @request.auth.role = 'admin')"

    const trechos = new Collection({
      name: 'viagem_trechos',
      type: 'base',
      listRule: childAuthCondition,
      viewRule: childAuthCondition,
      createRule: childUpdateCondition,
      updateRule: childUpdateCondition,
      deleteRule: childUpdateCondition,
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: viagensId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number', required: true },
        { name: 'origem', type: 'text' },
        { name: 'destino', type: 'text' },
        { name: 'data_ida', type: 'date' },
        { name: 'data_volta', type: 'date' },
        {
          name: 'tipo_transporte',
          type: 'select',
          values: ['aereo', 'rodoviario', 'proprio'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(trechos)

    const estimativas = new Collection({
      name: 'viagem_estimativas',
      type: 'base',
      listRule: childAuthCondition,
      viewRule: childAuthCondition,
      createRule: childUpdateCondition,
      updateRule: childUpdateCondition,
      deleteRule: childUpdateCondition,
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: viagensId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['passagem', 'hospedagem', 'alimentacao', 'transporte_local', 'outros'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number' },
        { name: 'dias', type: 'number' },
        { name: 'valor_diaria', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(estimativas)

    const acompanhantes = new Collection({
      name: 'viagem_acompanhantes',
      type: 'base',
      listRule: childAuthCondition,
      viewRule: childAuthCondition,
      createRule: childUpdateCondition,
      updateRule: childUpdateCondition,
      deleteRule: childUpdateCondition,
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: viagensId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text' },
        { name: 'cpf', type: 'text' },
        { name: 'parentesco', type: 'text' },
        { name: 'contato_emergencial', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(acompanhantes)

    const anexos = new Collection({
      name: 'viagem_anexos',
      type: 'base',
      listRule: childAuthCondition,
      viewRule: childAuthCondition,
      createRule: childUpdateCondition,
      updateRule: childUpdateCondition,
      deleteRule: childUpdateCondition,
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: viagensId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        { name: 'descricao', type: 'text' },
        { name: 'uploaded_by', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(anexos)
  },
  (app) => {
    const anexos = app.findCollectionByNameOrId('viagem_anexos')
    app.delete(anexos)
    const acompanhantes = app.findCollectionByNameOrId('viagem_acompanhantes')
    app.delete(acompanhantes)
    const estimativas = app.findCollectionByNameOrId('viagem_estimativas')
    app.delete(estimativas)
    const trechos = app.findCollectionByNameOrId('viagem_trechos')
    app.delete(trechos)
    const viagens = app.findCollectionByNameOrId('viagens')
    app.delete(viagens)
  },
)
