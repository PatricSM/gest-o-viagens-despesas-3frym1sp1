routerAdd(
  'POST',
  '/backend/v1/export-lgpd',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return e.json(200, {
      success: true,
      message: 'O processo foi iniciado. Você receberá um e-mail com seus dados em formato ZIP.',
    })
  },
  $apis.requireAuth(),
)
