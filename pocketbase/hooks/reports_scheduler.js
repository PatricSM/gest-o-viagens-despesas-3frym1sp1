cronAdd('reports_scheduler', '0 0 * * *', () => {
  try {
    const records = $app.findRecordsByFilter(
      'relatorios_agendados',
      'active = true && proximo_envio <= @now',
      '',
      100,
      0,
    )
    for (const record of records) {
      try {
        const freq = record.getString('frequencia')
        const user = $app.findRecordById('users', record.getString('user_id'))

        $app
          .logger()
          .info(
            'Enviando relatório agendado (mock via scheduler)',
            'user_email',
            user.getString('email'),
            'tipo',
            record.getString('relatorio_tipo'),
          )

        const nextDate = new Date()
        if (freq === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7)
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        record.set('proximo_envio', nextDate.toISOString().replace('T', ' ').substring(0, 19) + 'Z')
        $app.save(record)
      } catch (innerErr) {
        $app.logger().error('Erro processando agendamento especifico', 'err', innerErr.message)
      }
    }
  } catch (err) {
    $app.logger().error('Erro no master scheduler de relatorios', 'err', err.message)
  }
})
