migrate(
  (app) => {
    // 1. Seed Empresa
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      const empresaCol = app.findCollectionByNameOrId('empresas')
      empresa = new Record(empresaCol)
      empresa.set('razao_social', 'Adapta Corp')
      empresa.set('nome_fantasia', 'Adapta')
      empresa.set('cnpj', '00.000.000/0001-00')
      empresa.set('fuso_horario', 'America/Sao_Paulo')
      empresa.set('idioma_padrao', 'pt-BR')
      empresa.set('moeda_padrao', 'BRL')
      empresa.set('active', true)
      app.save(empresa)
    }

    // 2. Seed User
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'patric.martins@adapta.org')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      user = new Record(usersCol)
      user.setEmail('patric.martins@adapta.org')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Patric Martins')
      user.set('empresa_id', empresa.id)
      user.set('role', 'admin')
      user.set('active', true)
      app.save(user)
    }

    // 3. Seed user_empresas
    try {
      app.findFirstRecordByFilter(
        'user_empresas',
        `user_id = '${user.id}' && empresa_id = '${empresa.id}'`,
      )
    } catch (_) {
      const pivotCol = app.findCollectionByNameOrId('user_empresas')
      const pivot = new Record(pivotCol)
      pivot.set('user_id', user.id)
      pivot.set('empresa_id', empresa.id)
      pivot.set('role', 'admin')
      pivot.set('active', true)
      app.save(pivot)
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'patric.martins@adapta.org')
      try {
        const pivot = app.findFirstRecordByFilter('user_empresas', `user_id = '${user.id}'`)
        if (pivot) app.delete(pivot)
      } catch (_) {}
      app.delete(user)
    } catch (_) {}

    try {
      const empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
      app.delete(empresa)
    } catch (_) {}
  },
)
