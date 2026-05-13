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
    const duplicates = $app.findRecordsByFilter('despesas', filter, '', 10, 0)
    if (duplicates.length > 0) {
      const toUpdate = $app.findRecordById('despesas', record.id)
      toUpdate.set('possivel_duplicidade', true)
      $app.saveNoValidate(toUpdate)

      const alertasCol = $app.findCollectionByNameOrId('duplicidade_alertas')
      for (const dup of duplicates) {
        const alerta = new Record(alertasCol)
        alerta.set('empresa_id', record.getString('empresa_id'))
        alerta.set('despesa_a_id', dup.id)
        alerta.set('despesa_b_id', record.id)
        alerta.set('motivo', 'Mesmo valor, data e usuário' + (fornecedorId ? ' e fornecedor' : ''))
        alerta.set('status', 'aberto')
        $app.saveNoValidate(alerta)

        if (!dup.getBool('possivel_duplicidade')) {
          dup.set('possivel_duplicidade', true)
          $app.saveNoValidate(dup)
        }
      }
    }
  } catch (err) {
    $app.logger().error('Error checking duplicates', 'error', err.message)
  }

  return e.next()
}, 'despesas')
