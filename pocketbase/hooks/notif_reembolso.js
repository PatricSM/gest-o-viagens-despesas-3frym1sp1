onRecordAfterCreateSuccess((e) => {
  try {
    const notifCol = $app.findCollectionByNameOrId('notificacoes')
    const notif = new Record(notifCol)
    notif.set('user_id', e.record.getString('usuario_id'))
    notif.set('empresa_id', e.record.getString('empresa_id'))
    notif.set('tipo', 'reembolso_processado')
    notif.set('titulo', 'Reembolso Lançado')
    notif.set('mensagem', `Um novo reembolso de ${e.record.getFloat('valor')} está a caminho.`)
    notif.set('link_url', `/reembolsos`)
    notif.set('lida', false)
    $app.save(notif)
  } catch (err) {}
  e.next()
}, 'reembolsos')
