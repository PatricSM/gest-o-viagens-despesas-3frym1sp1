// @deps zod@3.23.8
routerAdd(
  'POST',
  '/backend/v1/signup-empresa',
  (e) => {
    const { z } = require('zod')

    const schema = z.object({
      razao_social: z.string().min(1, 'Razão social é obrigatória'),
      cnpj: z.string().optional(),
      nome_fantasia: z.string().optional(),
      name_admin: z.string().min(1, 'Nome é obrigatório'),
      email_admin: z.string().email('E-mail inválido'),
      senha_admin: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    })

    const result = schema.safeParse(e.requestInfo().body)
    if (!result.success) {
      const errors = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0]] = new ValidationError(issue.code, issue.message)
      }
      throw new BadRequestError('Dados inválidos', errors)
    }

    const data = result.data

    try {
      $app.findAuthRecordByEmail('users', data.email_admin)
      throw new BadRequestError('Email já está em uso', {
        email_admin: new ValidationError('validation_not_unique', 'Email já em uso'),
      })
    } catch (err) {
      if (err instanceof BadRequestError) throw err
      // "sql: no rows in result set" means it's available, so we can proceed
    }

    let adminRecord = null

    $app.runInTransaction((txApp) => {
      // 1. Create Empresa
      const empresasCol = txApp.findCollectionByNameOrId('empresas')
      const empresa = new Record(empresasCol)
      empresa.set('razao_social', data.razao_social)
      if (data.cnpj) empresa.set('cnpj', data.cnpj)
      if (data.nome_fantasia) empresa.set('nome_fantasia', data.nome_fantasia)
      empresa.set('active', true)
      txApp.save(empresa)

      // 2. Create User Admin
      const usersCol = txApp.findCollectionByNameOrId('users')
      adminRecord = new Record(usersCol)
      adminRecord.set('name', data.name_admin)
      adminRecord.setEmail(data.email_admin)
      adminRecord.setPassword(data.senha_admin)
      adminRecord.setVerified(true)
      adminRecord.set('role', 'admin')
      adminRecord.set('empresa_id', empresa.id)
      adminRecord.set('active', true)
      txApp.save(adminRecord)

      // 3. Create Pivot User Empresa
      const userEmpresasCol = txApp.findCollectionByNameOrId('user_empresas')
      const userEmpresa = new Record(userEmpresasCol)
      userEmpresa.set('user_id', adminRecord.id)
      userEmpresa.set('empresa_id', empresa.id)
      userEmpresa.set('role', 'admin')
      userEmpresa.set('active', true)
      txApp.save(userEmpresa)

      // 4. Default Currency BRL
      const moedasCol = txApp.findCollectionByNameOrId('moedas')
      const moeda = new Record(moedasCol)
      moeda.set('empresa_id', empresa.id)
      moeda.set('codigo', 'BRL')
      moeda.set('nome', 'Real Brasileiro')
      moeda.set('simbolo', 'R$')
      moeda.set('cotacao_atual', 1)
      moeda.set('padrao', true)
      moeda.set('active', true)
      txApp.save(moeda)

      // 5. Initial Policy
      const politicasCol = txApp.findCollectionByNameOrId('politicas')
      const politica = new Record(politicasCol)
      politica.set('empresa_id', empresa.id)
      politica.set('versao', 1)
      politica.set('vigencia_inicio', new Date().toISOString())
      politica.set('active', true)
      politica.set('created_by', adminRecord.id)
      txApp.save(politica)

      // 6. Default Workflows & Steps
      const workflowsCol = txApp.findCollectionByNameOrId('workflows')
      const etapasCol = txApp.findCollectionByNameOrId('workflow_etapas')
      const tipos = ['viagem', 'despesa', 'adiantamento', 'prestacao']

      for (const tipo of tipos) {
        const wf = new Record(workflowsCol)
        wf.set('empresa_id', empresa.id)
        wf.set('tipo', tipo)
        const nome = tipo.charAt(0).toUpperCase() + tipo.slice(1)
        wf.set('nome', 'Workflow Padrão de ' + nome)
        wf.set('versao', 1)
        wf.set('active', true)
        wf.set('vigencia_inicio', new Date().toISOString())
        wf.set('created_by', adminRecord.id)
        txApp.save(wf)

        const etapa1 = new Record(etapasCol)
        etapa1.set('workflow_id', wf.id)
        etapa1.set('ordem', 1)
        etapa1.set('tipo_aprovador', 'gestor_direto')
        txApp.save(etapa1)

        const etapa2 = new Record(etapasCol)
        etapa2.set('workflow_id', wf.id)
        etapa2.set('ordem', 2)
        etapa2.set('tipo_aprovador', 'financeiro')
        txApp.save(etapa2)
      }
    })

    const authRecord = $app.findRecordById('users', adminRecord.id)
    return $apis.recordAuthResponse($app, e, authRecord)
  },
  $apis.requireGuestOnly(),
)
