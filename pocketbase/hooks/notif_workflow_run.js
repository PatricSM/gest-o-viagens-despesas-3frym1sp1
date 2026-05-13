onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== newStatus && (newStatus === 'aprovado' || newStatus === 'rejeitado')) {
    try {
      const notifCol = $app.findCollectionByNameOrId('notificacoes')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('submitted_by'))
      notif.set('empresa_id', e.record.getString('empresa_id'))
      notif.set('tipo', newStatus === 'aprovado' ? 'solicitacao_aprovada' : 'solicitacao_rejeitada')
      notif.set(
        'titulo',
        newStatus === 'aprovado' ? 'Solicitação Aprovada' : 'Solicitação Rejeitada',
      )
      const modulo =
        e.record.getString('target_collection') === 'prestacoes_contas'
          ? 'prestações'
          : e.record.getString('target_collection')
      notif.set('mensagem', `Sua solicitação em ${modulo} foi ${newStatus}.`)
      notif.set(
        'link_url',
        `/${e.record.getString('target_collection')}/${e.record.getString('target_id')}`,
      )
      notif.set('lida', false)
      $app.save(notif)
    } catch (err) {
      console.log('Error creating notif for run', err.message)
    }
  }
  e.next()
}, 'workflow_runs')
