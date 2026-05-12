migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('reembolsos')
    col.listRule =
      "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'financeiro' || @request.auth.role = 'admin' || @request.auth.role = 'auditor')"
    col.viewRule =
      "empresa_id = @request.auth.empresa_id && (@request.auth.id = usuario_id || @request.auth.role = 'financeiro' || @request.auth.role = 'admin' || @request.auth.role = 'auditor')"
    col.createRule =
      "empresa_id = @request.auth.empresa_id && (@request.auth.role = 'financeiro' || @request.auth.role = 'admin')"
    col.updateRule =
      "empresa_id = @request.auth.empresa_id && (@request.auth.role = 'financeiro' || @request.auth.role = 'admin')"
    col.deleteRule =
      "empresa_id = @request.auth.empresa_id && (@request.auth.role = 'financeiro' || @request.auth.role = 'admin')"

    if (!col.fields.getByName('usuario_id')) {
      col.fields.add(
        new RelationField({
          name: 'usuario_id',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('prestacao_id')) {
      col.fields.add(
        new RelationField({
          name: 'prestacao_id',
          collectionId: app.findCollectionByNameOrId('prestacoes_contas').id,
          required: true,
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('codigo')) col.fields.add(new TextField({ name: 'codigo' }))
    if (!col.fields.getByName('valor'))
      col.fields.add(new NumberField({ name: 'valor', required: true }))
    if (!col.fields.getByName('moeda_id'))
      col.fields.add(
        new RelationField({
          name: 'moeda_id',
          collectionId: app.findCollectionByNameOrId('moedas').id,
          maxSelect: 1,
        }),
      )
    if (!col.fields.getByName('status'))
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['a_pagar', 'pago', 'cancelado'],
          required: true,
        }),
      )
    if (!col.fields.getByName('data_aprovacao'))
      col.fields.add(new DateField({ name: 'data_aprovacao' }))
    if (!col.fields.getByName('data_pagamento'))
      col.fields.add(new DateField({ name: 'data_pagamento' }))
    if (!col.fields.getByName('referencia_pagamento'))
      col.fields.add(new TextField({ name: 'referencia_pagamento' }))
    if (!col.fields.getByName('banco_destino'))
      col.fields.add(new TextField({ name: 'banco_destino' }))
    if (!col.fields.getByName('agencia_destino'))
      col.fields.add(new TextField({ name: 'agencia_destino' }))
    if (!col.fields.getByName('conta_destino'))
      col.fields.add(new TextField({ name: 'conta_destino' }))
    if (!col.fields.getByName('chave_pix')) col.fields.add(new TextField({ name: 'chave_pix' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('reembolsos')
    col.listRule = 'empresa_id = @request.auth.empresa_id'
    col.viewRule = 'empresa_id = @request.auth.empresa_id'
    col.createRule = "@request.auth.role = 'admin'"
    col.updateRule = "@request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
