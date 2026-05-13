migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      throw new Error("Empresa Adapta Corp não encontrada. Rode 0004 primeiro.")
    }

    let admin = null
    try {
      admin = app.findAuthRecordByEmail('users', 'admin@adapta.org')
    } catch (_) {
      const adms = app.findRecordsByFilter(
        'users',
        `empresa_id='${empresa.id}' && role='admin'`,
        '',
        1,
        0,
      )
      if (adms.length > 0) admin = adms[0]
    }

    let gestor = null
    try {
      gestor = app.findAuthRecordByEmail('users', 'gestor@adapta.org')
    } catch (_) {}

    const upsert = (colName, filter, builder) => {
      try {
        const recs = app.findRecordsByFilter(colName, filter, '', 1, 0)
        if (recs.length > 0) return recs[0]
      } catch (_) {}
      const col = app.findCollectionByNameOrId(colName)
      const rec = new Record(col)
      builder(rec)
      app.save(rec)
      return rec
    }

    // ─── FILIAIS ───
    const filMatriz = upsert(
      'filiais',
      `empresa_id='${empresa.id}' && codigo='MAT'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Matriz São Paulo')
        r.set('codigo', 'MAT')
        r.set('endereco_logradouro', 'Av. Paulista')
        r.set('endereco_numero', '1000')
        r.set('endereco_cidade', 'São Paulo')
        r.set('endereco_estado', 'SP')
        r.set('endereco_cep', '01310-100')
        if (admin) r.set('gestor_id', admin.id)
        r.set('active', true)
      },
    )

    const filRJ = upsert(
      'filiais',
      `empresa_id='${empresa.id}' && codigo='RJ-01'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Filial Rio de Janeiro')
        r.set('codigo', 'RJ-01')
        r.set('endereco_logradouro', 'Av. Atlântica')
        r.set('endereco_numero', '500')
        r.set('endereco_cidade', 'Rio de Janeiro')
        r.set('endereco_estado', 'RJ')
        r.set('endereco_cep', '22021-001')
        if (gestor) r.set('gestor_id', gestor.id)
        r.set('active', true)
      },
    )

    // ─── DEPARTAMENTOS (hierárquicos) ───
    const dirGeral = upsert(
      'departamentos',
      `empresa_id='${empresa.id}' && codigo='DIR'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Diretoria')
        r.set('codigo', 'DIR')
        if (admin) r.set('responsavel_id', admin.id)
        r.set('filial_id', filMatriz.id)
        r.set('active', true)
      },
    )

    upsert(
      'departamentos',
      `empresa_id='${empresa.id}' && codigo='COM'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Comercial')
        r.set('codigo', 'COM')
        r.set('departamento_pai_id', dirGeral.id)
        if (gestor) r.set('responsavel_id', gestor.id)
        r.set('filial_id', filMatriz.id)
        r.set('active', true)
      },
    )

    upsert(
      'departamentos',
      `empresa_id='${empresa.id}' && codigo='FIN'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Financeiro')
        r.set('codigo', 'FIN')
        r.set('departamento_pai_id', dirGeral.id)
        r.set('filial_id', filMatriz.id)
        r.set('active', true)
      },
    )

    upsert(
      'departamentos',
      `empresa_id='${empresa.id}' && codigo='OPE-RJ'`,
      (r) => {
        r.set('empresa_id', empresa.id)
        r.set('nome', 'Operações RJ')
        r.set('codigo', 'OPE-RJ')
        r.set('filial_id', filRJ.id)
        r.set('active', true)
      },
    )

    console.log('=== 0019 SEED ESTRUTURA ORGANIZACIONAL DONE ===')
  },
  (app) => {
    const safeDelete = (col, filter) => {
      try {
        const recs = app.findRecordsByFilter(col, filter, '', 100, 0)
        for (const r of recs) {
          try {
            app.delete(r)
          } catch (_) {}
        }
      } catch (_) {}
    }
    // Departamentos primeiro (filhos antes do pai)
    safeDelete('departamentos', `codigo='COM' || codigo='FIN' || codigo='OPE-RJ'`)
    safeDelete('departamentos', `codigo='DIR'`)
    safeDelete('filiais', `codigo='MAT' || codigo='RJ-01'`)
  },
)
