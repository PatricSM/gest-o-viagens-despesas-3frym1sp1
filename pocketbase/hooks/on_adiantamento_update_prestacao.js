onRecordAfterCreateSuccess((e) => {
  const prestacaoId = e.record.getString('prestacao_id')
  if (prestacaoId) {
    try {
      const prestacao = $app.findRecordById('prestacoes_contas', prestacaoId)
      $app.save(prestacao)
    } catch (_) {}
  }
  e.next()
}, 'adiantamentos')

onRecordAfterUpdateSuccess((e) => {
  const prestacaoId = e.record.getString('prestacao_id')
  const oldPrestacaoId = e.record.original().getString('prestacao_id')

  if (prestacaoId) {
    try {
      const prestacao = $app.findRecordById('prestacoes_contas', prestacaoId)
      $app.save(prestacao)
    } catch (_) {}
  }
  if (oldPrestacaoId && oldPrestacaoId !== prestacaoId) {
    try {
      const oldPrestacao = $app.findRecordById('prestacoes_contas', oldPrestacaoId)
      $app.save(oldPrestacao)
    } catch (_) {}
  }
  e.next()
}, 'adiantamentos')

onRecordAfterDeleteSuccess((e) => {
  const prestacaoId = e.record.getString('prestacao_id')
  if (prestacaoId) {
    try {
      const prestacao = $app.findRecordById('prestacoes_contas', prestacaoId)
      $app.save(prestacao)
    } catch (_) {}
  }
  e.next()
}, 'adiantamentos')
