cronAdd('lembrete_prestacao', '0 8 * * *', () => {
  try {
    const viagens = $app.findRecordsByFilter('viagens', "status = 'concluida'", '-created', 100, 0)

    const notifCol = $app.findCollectionByNameOrId('notificacoes')
    const agora = new Date()

    for (const viagem of viagens) {
      const dataFim = viagem.getString('updated')
      if (!dataFim) continue
      const updatedAt = new Date(dataFim)
      const diffTime = Math.abs(agora - updatedAt)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 5) {
        try {
          $app.findFirstRecordByFilter('prestacoes_contas', 'viagem_id = {:v}', { v: viagem.id })
        } catch (_) {
          try {
            const notif = new Record(notifCol)
            notif.set('user_id', viagem.getString('usuario_id'))
            notif.set('empresa_id', viagem.getString('empresa_id'))
            notif.set('tipo', 'lembrete_prestacao_atraso')
            notif.set('titulo', 'Prestação de Contas Pendente')
            notif.set(
              'mensagem',
              `A viagem "${viagem.getString('motivo')}" requer prestação de contas. Evite bloqueios.`,
            )
            notif.set('link_url', `/prestacoes/nova?viagem=${viagem.id}`)
            notif.set('lida', false)
            $app.save(notif)
          } catch (e) {}
        }
      }
    }
  } catch (err) {}
})
