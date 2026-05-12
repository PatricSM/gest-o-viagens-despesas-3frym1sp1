onRecordCreateRequest((e) => {
  if (!e.hasSuperuserAuth()) {
    if (e.auth && e.auth.getString('role') === 'admin') {
      e.record.set('empresa_id', e.auth.getString('empresa_id'))
    } else {
      e.record.set('role', 'viajante')
    }
  }
  e.next()
}, '_pb_users_auth_')
