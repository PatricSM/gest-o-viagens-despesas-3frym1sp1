migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      throw new Error("Company 'Adapta Corp' (CNPJ: 00.000.000/0001-00) not found.")
    }

    const users = [
      { email: 'financeiro@adapta.org', name: 'Fernanda Finance', role: 'financeiro' },
      { email: 'gestor@adapta.org', name: 'Gabriel Gestor', role: 'gestor' },
      { email: 'viajante@adapta.org', name: 'Vitor Viajante', role: 'viajante' },
      { email: 'auditor@adapta.org', name: 'Aurora Auditor', role: 'auditor' },
    ]

    const usersCol = app.findCollectionByNameOrId('users')
    const userEmpresasCol = app.findCollectionByNameOrId('user_empresas')

    const createdUsers = {}

    for (const u of users) {
      let userRecord
      try {
        userRecord = app.findAuthRecordByEmail('users', u.email)
      } catch (_) {
        userRecord = new Record(usersCol)
        userRecord.setEmail(u.email)
        userRecord.setPassword('Skip@Pass')
        userRecord.setVerified(true)
        userRecord.set('name', u.name)
        userRecord.set('role', u.role)
        userRecord.set('empresa_id', empresa.id)
        userRecord.set('active', true)
        app.save(userRecord)
      }
      createdUsers[u.role] = userRecord

      try {
        app.findFirstRecordByFilter(
          'user_empresas',
          `user_id = '${userRecord.id}' && empresa_id = '${empresa.id}'`,
        )
      } catch (_) {
        const ueRecord = new Record(userEmpresasCol)
        ueRecord.set('user_id', userRecord.id)
        ueRecord.set('empresa_id', empresa.id)
        ueRecord.set('role', u.role)
        ueRecord.set('active', true)
        app.save(ueRecord)
      }
    }

    if (createdUsers['viajante'] && createdUsers['gestor']) {
      const viajante = createdUsers['viajante']
      if (viajante.get('gestor_id') !== createdUsers['gestor'].id) {
        viajante.set('gestor_id', createdUsers['gestor'].id)
        app.save(viajante)
      }
    }
  },
  (app) => {
    const emails = [
      'financeiro@adapta.org',
      'gestor@adapta.org',
      'viajante@adapta.org',
      'auditor@adapta.org',
    ]

    for (const email of emails) {
      try {
        const user = app.findAuthRecordByEmail('users', email)

        try {
          const ues = app.findRecordsByFilter('user_empresas', `user_id = '${user.id}'`, '', 100, 0)
          for (const ue of ues) {
            app.delete(ue)
          }
        } catch (_) {}

        app.delete(user)
      } catch (_) {}
    }
  },
)
