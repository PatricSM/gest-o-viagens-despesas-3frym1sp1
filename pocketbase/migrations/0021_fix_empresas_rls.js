/**
 * FIX: a regra original de listRule/viewRule da coleção `empresas` restringia
 * leitura apenas a `admin` (da própria empresa) ou `auditor`. Isso impedia
 * financeiro/gestor/viajante de fazer o expand de `empresa_id` ao carregar
 * `user_empresas` no use-auth.tsx, o que travava o login desses roles
 * (currentEmpresa ficava null e o ProtectedRoute redirecionava de volta).
 *
 * Correção: permitir qualquer usuário autenticado ler a empresa à qual
 * pertence (isolamento multi-tenant preservado via `id = @request.auth.empresa_id`).
 * Create/Update/Delete continuam restritos a admin.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    col.listRule = 'id = @request.auth.empresa_id'
    col.viewRule = 'id = @request.auth.empresa_id'
    // createRule, updateRule, deleteRule permanecem como estavam (admin only)
    app.save(col)
    console.log('=== 0021 FIX EMPRESAS RLS — list/view agora permitem qualquer user da empresa ===')
  },
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    col.listRule =
      "(@request.auth.role = 'admin' && @request.auth.empresa_id = id) || @request.auth.role = 'auditor'"
    col.viewRule =
      "(@request.auth.role = 'admin' && @request.auth.empresa_id = id) || @request.auth.role = 'auditor'"
    app.save(col)
  },
)
