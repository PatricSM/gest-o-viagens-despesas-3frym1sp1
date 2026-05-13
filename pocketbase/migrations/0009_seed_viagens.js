migrate(
  (app) => {
    const empresas = app.findRecordsByFilter('empresas', '1=1', '', 1, 0)
    if (empresas.length === 0) return
    const empresaId = empresas[0].id

    const users = app.findRecordsByFilter('users', "email = 'admin@adapta.org'", '', 1, 0)
    if (users.length === 0) return
    const userId = users[0].id

    let ccId
    const ccs = app.findRecordsByFilter('centros_custo', `empresa_id = '${empresaId}'`, '', 1, 0)
    if (ccs.length === 0) {
      const colCC = app.findCollectionByNameOrId('centros_custo')
      const recordCC = new Record(colCC)
      recordCC.set('empresa_id', empresaId)
      recordCC.set('codigo', 'CC-001')
      recordCC.set('nome', 'Vendas')
      recordCC.set('active', true)
      app.save(recordCC)
      ccId = recordCC.id
    } else {
      ccId = ccs[0].id
    }

    try {
      app.findFirstRecordByData('viagens', 'motivo', 'Conferência de Vendas Q4')
    } catch (_) {
      const colViagens = app.findCollectionByNameOrId('viagens')
      const recordViagem = new Record(colViagens)
      recordViagem.set('empresa_id', empresaId)
      recordViagem.set('usuario_id', userId)
      recordViagem.set('motivo', 'Conferência de Vendas Q4')
      recordViagem.set('centro_custo_id', ccId)
      recordViagem.set('status', 'rascunho')
      recordViagem.set('total_estimado', 1500.0)
      app.save(recordViagem)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('viagens', 'motivo', 'Conferência de Vendas Q4')
      app.delete(record)
    } catch (_) {}
  },
)
