onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const userId = record.getString('usuario_id')
  const fornecedorId = record.getString('fornecedor_id')
  const valor = record.getFloat('valor')
  const dataDespesaStr = record.getString('data_despesa')

  if (!userId || !dataDespesaStr) return e.next()

  const dateOnly = dataDespesaStr.split(' ')[0]

  let filter = `usuario_id = '${userId}' && valor = ${valor} && data_despesa >= '${dateOnly} 00:00:00.000Z' && data_despesa <= '${dateOnly} 23:59:59.999Z' && id != '${record.id}'`

  if (fornecedorId) {
    filter += ` && fornecedor_id = '${fornecedorId}'`
  } else {
    filter += ` && fornecedor_id = ''`
  }

  try {
    const duplicates = $app.findRecordsByFilter('despesas', filter, '', 1, 0)
    if (duplicates.length > 0) {
      const toUpdate = $app.findRecordById('despesas', record.id)
      toUpdate.set('possivel_duplicidade', true)
      $app.saveNoValidate(toUpdate)
    }
  } catch (err) {
    $app.logger().error('Error checking duplicates', 'error', err.message)
  }

  return e.next()
}, 'despesas')
