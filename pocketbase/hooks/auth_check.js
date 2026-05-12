onRecordAuthRequest((e) => {
  const user = e.record

  if (user.getBool('active') === false) {
    throw new ForbiddenError('Conta desativada.')
  }

  user.set('last_login', new Date().toISOString())
  $app.saveNoValidate(user)

  try {
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const auditRecord = new Record(auditCol)
    auditRecord.set('empresa_id', user.get('empresa_id'))
    auditRecord.set('user_id', user.id)
    auditRecord.set('action', 'login')
    auditRecord.set('module', 'auth')
    auditRecord.set('record_id', user.id)

    let ip = e.request.header.get('X-Forwarded-For') || ''
    if (!ip) {
      const remoteAddr = e.request.remoteAddr || ''
      ip = remoteAddr.split(':')[0]
    } else if (ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    auditRecord.set('ip', ip)
    auditRecord.set('user_agent', e.request.header.get('User-Agent') || '')

    $app.saveNoValidate(auditRecord)
  } catch (err) {
    $app.logger().error('Failed to write audit log for login', 'error', err.message)
  }

  e.next()
}, 'users')
