onRecordAfterUpdateSuccess((e) => {
  const currentStatus = e.record.getString('status')
  const oldStatus = e.record.original().getString('status')

  if (currentStatus === 'paga' && oldStatus !== 'paga') {
    const saldo = e.record.getFloat('saldo')
    if (saldo > 0) {
      const empresaId = e.record.getString('empresa_id')
      const userId = e.record.getString('usuario_id')

      let user = null
      try {
        user = $app.findRecordById('_pb_users_auth_', userId)
      } catch (err) {
        return e.next()
      }

      const year = new Date().getFullYear()
      const filter = "empresa_id = '" + empresaId + "' && codigo ~ 'REE-" + year + "-'"
      let nextSeq = 1
      try {
        const lastRecords = $app.findRecordsByFilter('reembolsos', filter, '-codigo', 1, 0)
        if (lastRecords.length > 0) {
          const lastCode = lastRecords[0].getString('codigo')
          const parts = lastCode.split('-')
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10)
            if (!isNaN(seq)) nextSeq = seq + 1
          }
        }
      } catch (err) {
        // empty, fallback to 1
      }

      const codigo = 'REE-' + year + '-' + nextSeq.toString().padStart(4, '0')

      const col = $app.findCollectionByNameOrId('reembolsos')
      const rec = new Record(col)
      rec.set('empresa_id', empresaId)
      rec.set('usuario_id', userId)
      rec.set('prestacao_id', e.record.id)
      rec.set('valor', saldo)
      rec.set('moeda_id', e.record.getString('moeda_id'))
      rec.set('status', 'a_pagar')
      rec.set('data_aprovacao', new Date().toISOString())

      rec.set('banco_destino', user.getString('banco_nome'))
      rec.set('agencia_destino', user.getString('banco_agencia'))
      rec.set('conta_destino', user.getString('banco_conta'))
      rec.set('chave_pix', user.getString('banco_chave_pix'))
      rec.set('codigo', codigo)

      $app.save(rec)

      try {
        const pRecord = $app.findRecordById('prestacoes_contas', e.record.id)
        pRecord.set('reembolso_id', rec.id)
        $app.saveNoValidate(pRecord)
      } catch (err) {
        $app.logger().error('Erro ao vincular reembolso na prestacao', 'error', err.message)
      }
    }
  }

  return e.next()
}, 'prestacoes_contas')
