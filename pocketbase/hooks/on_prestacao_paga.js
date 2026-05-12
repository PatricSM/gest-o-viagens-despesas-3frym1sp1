onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = e.record.original()

  if (record.getString('status') === 'paga' && original.getString('status') !== 'paga') {
    try {
      const reembolsos = $app.findCollectionByNameOrId('reembolsos')
      const reembolso = new Record(reembolsos)
      reembolso.set('empresa_id', record.getString('empresa_id'))
      $app.save(reembolso)

      const prestacao = $app.findRecordById('prestacoes_contas', record.id)
      prestacao.set('reembolso_id', reembolso.id)
      $app.saveNoValidate(prestacao)
    } catch (err) {
      console.log('Erro ao criar reembolso:', err)
    }
  }
  e.next()
}, 'prestacoes_contas')
