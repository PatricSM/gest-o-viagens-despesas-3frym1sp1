onRecordCreate((e) => {
  const record = e.record
  if (!record.getString('codigo')) {
    const year = new Date().getFullYear()
    const records = $app.findRecordsByFilter(
      'prestacoes_contas',
      `codigo ~ 'PC-${year}-'`,
      '-codigo',
      1,
      0,
    )
    let seq = 1
    if (records.length > 0) {
      const lastCode = records[0].getString('codigo')
      const parts = lastCode.split('-')
      if (parts.length === 3) {
        seq = parseInt(parts[2], 10) + 1
      }
    }
    record.set('codigo', `PC-${year}-${seq.toString().padStart(4, '0')}`)
  }

  const despesas = $app.findRecordsByFilter(
    'despesas',
    `prestacao_id = '${record.id}' && status != 'rejeitada'`,
    '',
    0,
    0,
  )
  let totalDespesas = 0
  for (const d of despesas) {
    totalDespesas += d.getFloat('valor_convertido') || d.getFloat('valor')
  }

  const adiantamentos = $app.findRecordsByFilter(
    'adiantamentos',
    `prestacao_id = '${record.id}' && status != 'cancelado' && status != 'rejeitado'`,
    '',
    0,
    0,
  )
  let totalAdiantamento = 0
  for (const a of adiantamentos) {
    totalAdiantamento += a.getFloat('valor')
  }

  record.set('total_despesas', totalDespesas)
  record.set('total_adiantamento', totalAdiantamento)
  record.set('saldo', totalDespesas - totalAdiantamento)

  e.next()
}, 'prestacoes_contas')

onRecordUpdate((e) => {
  const record = e.record
  const despesas = $app.findRecordsByFilter(
    'despesas',
    `prestacao_id = '${record.id}' && status != 'rejeitada'`,
    '',
    0,
    0,
  )
  let totalDespesas = 0
  for (const d of despesas) {
    totalDespesas += d.getFloat('valor_convertido') || d.getFloat('valor')
  }

  const adiantamentos = $app.findRecordsByFilter(
    'adiantamentos',
    `prestacao_id = '${record.id}' && status != 'cancelado' && status != 'rejeitado'`,
    '',
    0,
    0,
  )
  let totalAdiantamento = 0
  for (const a of adiantamentos) {
    totalAdiantamento += a.getFloat('valor')
  }

  record.set('total_despesas', totalDespesas)
  record.set('total_adiantamento', totalAdiantamento)
  record.set('saldo', totalDespesas - totalAdiantamento)

  e.next()
}, 'prestacoes_contas')
