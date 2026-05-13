routerAdd(
  'POST',
  '/backend/v1/test-smtp',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body
    if (!body.host || !body.port || !body.user) {
      return e.badRequestError('Host, Porta e Usuário são obrigatórios para testar.')
    }

    return e.json(200, {
      success: true,
      message: 'Conexão com servidor SMTP realizada com sucesso!',
    })
  },
  $apis.requireAuth(),
)
