migrate(
  (app) => {
    const empresasId = app.findCollectionByNameOrId('empresas').id
    const usersId = '_pb_users_auth_'
    const categoriasId = app.findCollectionByNameOrId('categorias_despesa').id
    const departamentosId = app.findCollectionByNameOrId('departamentos').id

    const politicas = new Collection({
      name: 'politicas',
      type: 'base',
      listRule: '@request.auth.empresa_id = empresa_id',
      viewRule: '@request.auth.empresa_id = empresa_id',
      createRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      updateRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'versao', type: 'number' },
        { name: 'vigencia_inicio', type: 'date', required: true },
        { name: 'vigencia_fim', type: 'date' },
        { name: 'antecedencia_minima_viagem_dias', type: 'number' },
        { name: 'valor_max_sem_comprovante', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created_by', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(politicas)

    const politicaTetos = new Collection({
      name: 'politica_tetos',
      type: 'base',
      listRule: '@request.auth.empresa_id = politica_id.empresa_id',
      viewRule: '@request.auth.empresa_id = politica_id.empresa_id',
      createRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      updateRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      deleteRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'politica_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: politicas.id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['categoria', 'cargo', 'departamento'],
          maxSelect: 1,
        },
        { name: 'categoria_id', type: 'relation', collectionId: categoriasId, maxSelect: 1 },
        { name: 'cargo', type: 'text' },
        { name: 'departamento_id', type: 'relation', collectionId: departamentosId, maxSelect: 1 },
        { name: 'valor_max', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(politicaTetos)

    const politicaDiarias = new Collection({
      name: 'politica_diarias',
      type: 'base',
      listRule: '@request.auth.empresa_id = politica_id.empresa_id',
      viewRule: '@request.auth.empresa_id = politica_id.empresa_id',
      createRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      updateRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      deleteRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'politica_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: politicas.id,
          maxSelect: 1,
        },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'regiao', type: 'text' },
        { name: 'valor_diaria', type: 'number' },
        { name: 'hospedagem_max', type: 'number' },
        { name: 'alimentacao_max', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(politicaDiarias)

    const politicaClassesViagem = new Collection({
      name: 'politica_classes_viagem',
      type: 'base',
      listRule: '@request.auth.empresa_id = politica_id.empresa_id',
      viewRule: '@request.auth.empresa_id = politica_id.empresa_id',
      createRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      updateRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      deleteRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'politica_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: politicas.id,
          maxSelect: 1,
        },
        { name: 'nivel_hierarquico', type: 'text' },
        {
          name: 'classe_aerea',
          type: 'select',
          values: ['econômica', 'executiva', 'primeira'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(politicaClassesViagem)

    const politicaCatBloqueadas = new Collection({
      name: 'politica_categorias_bloqueadas',
      type: 'base',
      listRule: '@request.auth.empresa_id = politica_id.empresa_id',
      viewRule: '@request.auth.empresa_id = politica_id.empresa_id',
      createRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      updateRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      deleteRule:
        "@request.auth.empresa_id = politica_id.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'politica_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: politicas.id,
          maxSelect: 1,
        },
        { name: 'role', type: 'text' },
        { name: 'categoria_id', type: 'relation', collectionId: categoriasId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(politicaCatBloqueadas)

    const workflows = new Collection({
      name: 'workflows',
      type: 'base',
      listRule: '@request.auth.empresa_id = empresa_id',
      viewRule: '@request.auth.empresa_id = empresa_id',
      createRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      updateRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['viagem', 'despesa', 'adiantamento', 'prestacao'],
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'versao', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'vigencia_inicio', type: 'date' },
        { name: 'created_by', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(workflows)

    const workflowEtapas = new Collection({
      name: 'workflow_etapas',
      type: 'base',
      listRule: '@request.auth.empresa_id = workflow_id.empresa_id',
      viewRule: '@request.auth.empresa_id = workflow_id.empresa_id',
      createRule:
        "@request.auth.empresa_id = workflow_id.empresa_id && @request.auth.role = 'admin'",
      updateRule:
        "@request.auth.empresa_id = workflow_id.empresa_id && @request.auth.role = 'admin'",
      deleteRule:
        "@request.auth.empresa_id = workflow_id.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'workflow_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: workflows.id,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number', required: true },
        {
          name: 'tipo_aprovador',
          type: 'select',
          values: ['gestor_direto', 'cargo', 'financeiro', 'custom_user'],
          maxSelect: 1,
        },
        { name: 'cargo_alvo', type: 'text' },
        { name: 'custom_user_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'alcada_valor_min', type: 'number' },
        { name: 'alcada_valor_max', type: 'number' },
        { name: 'paralela', type: 'bool' },
        { name: 'sla_horas', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(workflowEtapas)

    const workflowRuns = new Collection({
      name: 'workflow_runs',
      type: 'base',
      listRule:
        "@request.auth.empresa_id = empresa_id && (submitted_by = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor')",
      viewRule:
        "@request.auth.empresa_id = empresa_id && (submitted_by = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor')",
      createRule: '@request.auth.empresa_id = empresa_id',
      updateRule: '@request.auth.empresa_id = empresa_id',
      deleteRule: "@request.auth.empresa_id = empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'workflow_id',
          type: 'relation',
          required: true,
          collectionId: workflows.id,
          maxSelect: 1,
        },
        { name: 'target_collection', type: 'text', required: true },
        { name: 'target_id', type: 'text', required: true },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['em_andamento', 'aprovado', 'rejeitado', 'devolvido', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'submitted_by', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'submitted_at', type: 'date' },
        { name: 'finished_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(workflowRuns)

    const workflowRunSteps = new Collection({
      name: 'workflow_run_steps',
      type: 'base',
      listRule:
        "run_id.empresa_id = @request.auth.empresa_id && (run_id.submitted_by = @request.auth.id || aprovador_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor')",
      viewRule:
        "run_id.empresa_id = @request.auth.empresa_id && (run_id.submitted_by = @request.auth.id || aprovador_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'auditor')",
      createRule: 'run_id.empresa_id = @request.auth.empresa_id',
      updateRule: 'aprovador_id = @request.auth.id',
      deleteRule: "run_id.empresa_id = @request.auth.empresa_id && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'run_id',
          type: 'relation',
          required: true,
          cascadeDelete: true,
          collectionId: workflowRuns.id,
          maxSelect: 1,
        },
        { name: 'etapa_id', type: 'relation', collectionId: workflowEtapas.id, maxSelect: 1 },
        { name: 'ordem', type: 'number' },
        { name: 'aprovador_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'aprovado', 'rejeitado', 'devolvido', 'pulado'],
          maxSelect: 1,
        },
        { name: 'comentario', type: 'text' },
        { name: 'decided_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(workflowRunSteps)
  },
  (app) => {
    const collections = [
      'workflow_run_steps',
      'workflow_runs',
      'workflow_etapas',
      'workflows',
      'politica_categorias_bloqueadas',
      'politica_classes_viagem',
      'politica_diarias',
      'politica_tetos',
      'politicas',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (e) {
        // ignore
      }
    }
  },
)
