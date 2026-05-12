migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    col.listRule =
      "(@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id) || id = @request.auth.id || (@request.auth.role = 'gestor' && gestor_id = @request.auth.id) || @request.auth.role = 'auditor'"
    col.viewRule =
      "(@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id) || id = @request.auth.id || (@request.auth.role = 'gestor' && gestor_id = @request.auth.id) || @request.auth.role = 'auditor'"
    col.createRule = ''
    col.updateRule =
      "id = @request.auth.id || (@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id)"
    col.deleteRule = "@request.auth.role = 'admin' && empresa_id = @request.auth.empresa_id"

    const empresaCol = app.findCollectionByNameOrId('empresas')

    const newFields = [
      new TextField({ name: 'cpf' }),
      new TextField({ name: 'rg' }),
      new TextField({ name: 'phone' }),
      new TextField({ name: 'banco_nome' }),
      new TextField({ name: 'banco_agencia' }),
      new TextField({ name: 'banco_conta' }),
      new TextField({ name: 'banco_chave_pix' }),
      new BoolField({ name: 'pref_email' }),
      new BoolField({ name: 'pref_push' }),
      new BoolField({ name: 'pref_inapp' }),
      new TextField({ name: 'idioma' }),
      new BoolField({ name: 'twofa_enabled' }),
      new TextField({ name: 'twofa_secret' }),
      new RelationField({
        name: 'empresa_id',
        collectionId: empresaCol.id,
        required: true,
        maxSelect: 1,
      }),
      new SelectField({
        name: 'role',
        values: ['admin', 'financeiro', 'gestor', 'viajante', 'auditor'],
        maxSelect: 1,
        required: true,
      }),
      new TextField({ name: 'departamento_id' }),
      new TextField({ name: 'centro_custo_id' }),
      new RelationField({ name: 'gestor_id', collectionId: col.id, maxSelect: 1 }),
      new BoolField({ name: 'active' }),
      new DateField({ name: 'last_login' }),
      new DateField({ name: 'aceitou_termos_em' }),
    ]

    for (const field of newFields) {
      if (!col.fields.getByName(field.name)) {
        col.fields.add(field)
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'

    const fieldsToRemove = [
      'cpf',
      'rg',
      'phone',
      'banco_nome',
      'banco_agencia',
      'banco_conta',
      'banco_chave_pix',
      'pref_email',
      'pref_push',
      'pref_inapp',
      'idioma',
      'twofa_enabled',
      'twofa_secret',
      'empresa_id',
      'role',
      'departamento_id',
      'centro_custo_id',
      'gestor_id',
      'active',
      'last_login',
      'aceitou_termos_em',
    ]

    for (const field of fieldsToRemove) {
      if (col.fields.getByName(field)) {
        col.fields.removeByName(field)
      }
    }

    app.save(col)
  },
)
