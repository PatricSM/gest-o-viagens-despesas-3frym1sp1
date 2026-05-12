onRecordUpdateRequest((e) => {
  const role = e.auth?.getString('role')
  if (e.hasSuperuserAuth() || role === 'admin') return e.next()

  const originalStatus = e.record.original().getString('status')
  if (originalStatus !== 'rascunho') {
    return e.forbiddenError('Somente viagens em rascunho podem ser editadas.')
  }

  return e.next()
}, 'viagens')
