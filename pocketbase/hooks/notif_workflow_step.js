onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('status') === 'pendente' && e.record.getString('aprovador_id')) {
    try {
      const run = $app.findRecordById('workflow_runs', e.record.getString('run_id'))
      const notifCol = $app.findCollectionByNameOrId('notificacoes')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('aprovador_id'))
      notif.set('empresa_id', run.getString('empresa_id'))
      notif.set('tipo', 'aprovacao_pendente')
      notif.set('titulo', 'Aprovação Pendente')
      notif.set('mensagem', 'Você tem uma nova aprovação pendente no sistema.')
      notif.set('link_url', '/aprovacoes')
      notif.set('lida', false)
      $app.save(notif)
    } catch (err) {
      console.log('Error creating notif for step', err.message)
    }
  }
  e.next()
}, 'workflow_run_steps')
