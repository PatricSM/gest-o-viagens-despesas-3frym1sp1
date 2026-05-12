module.exports = {
  writeAudit: function ($app, ctx) {
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const auditRecord = new Record(auditCol)

      if (ctx.empresa_id) auditRecord.set('empresa_id', ctx.empresa_id)
      if (ctx.user_id) auditRecord.set('user_id', ctx.user_id)
      if (ctx.action) auditRecord.set('action', ctx.action)
      if (ctx.module) auditRecord.set('module', ctx.module)
      if (ctx.record_id) auditRecord.set('record_id', ctx.record_id)
      if (ctx.before_state) auditRecord.set('before_state', ctx.before_state)
      if (ctx.after_state) auditRecord.set('after_state', ctx.after_state)

      if (ctx.request) {
        let ip = ctx.request.header?.get('X-Forwarded-For') || ''
        if (!ip && ctx.request.remoteAddr) {
          ip = ctx.request.remoteAddr.split(':')[0]
        } else if (ip.includes(',')) {
          ip = ip.split(',')[0].trim()
        }
        auditRecord.set('ip', ip)
        auditRecord.set('user_agent', ctx.request.header?.get('User-Agent') || '')
      }

      $app.saveNoValidate(auditRecord)
    } catch (err) {
      $app.logger().error('writeAudit helper failed', 'error', err.message)
    }
  },
}
