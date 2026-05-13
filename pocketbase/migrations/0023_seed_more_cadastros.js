/**
 * Adiciona MAIS cadastros à Adapta Corp para que as listagens de admin
 * tenham volume realista para QA.
 *
 * - 3 moedas extras (USD, EUR, ARS) com cotações + histórico
 * - 5 categorias de despesa extras
 * - 5 fornecedores extras
 * - 3 centros de custo extras
 * - 3 projetos extras
 *
 * Idempotente. Pré-requisitos: 0004 (empresa) + 0017 (users).
 */
migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      console.log('Empresa Adapta Corp não encontrada — skip 0023.')
      return
    }

    let gestor = null
    try {
      gestor = app.findAuthRecordByEmail('users', 'gestor@adapta.org')
    } catch (_) {}

    let financeiro = null
    try {
      financeiro = app.findAuthRecordByEmail('users', 'financeiro@adapta.org')
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

    const today = new Date().toISOString()

    // ─── MOEDAS EXTRAS ───
    const moedas = [
      { codigo: 'USD', nome: 'Dólar Americano', simbolo: 'US$', cotacao: 5.4 },
      { codigo: 'EUR', nome: 'Euro', simbolo: '€', cotacao: 5.85 },
      { codigo: 'ARS', nome: 'Peso Argentino', simbolo: '$AR', cotacao: 0.006 },
    ]
    for (const m of moedas) {
      const moedaRec = upsert(
        'moedas',
        `empresa_id='${empresa.id}' && codigo='${m.codigo}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('codigo', m.codigo)
          r.set('nome', m.nome)
          r.set('simbolo', m.simbolo)
          r.set('cotacao_atual', m.cotacao)
          r.set('cotacao_data', today)
          r.set('padrao', false)
          r.set('active', true)
        },
      )
      // Histórico (1 entry inicial)
      upsert(
        'cotacao_historico',
        `moeda_id='${moedaRec.id}' && data ~ '${today.substring(0, 10)}'`,
        (r) => {
          r.set('moeda_id', moedaRec.id)
          r.set('empresa_id', empresa.id)
          r.set('valor', m.cotacao)
          r.set('data', today)
        },
      )
    }

    // ─── CATEGORIAS EXTRAS ───
    const categorias = [
      { nome: 'Transporte', icone: 'directions_car', cor: '#3B82F6', desc: 'Táxi, Uber, transporte público' },
      { nome: 'Hospedagem', icone: 'hotel', cor: '#10B981', desc: 'Hotéis, pousadas, AirBnB' },
      { nome: 'Combustível', icone: 'local_gas_station', cor: '#EF4444', desc: 'Abastecimento de veículos próprios/corporativos' },
      { nome: 'Material Escritório', icone: 'inventory_2', cor: '#8B5CF6', desc: 'Suprimentos diversos' },
      { nome: 'Treinamento', icone: 'school', cor: '#F59E0B', desc: 'Cursos, certificações e workshops' },
    ]
    for (const c of categorias) {
      upsert(
        'categorias_despesa',
        `empresa_id='${empresa.id}' && nome='${c.nome}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('nome', c.nome)
          r.set('descricao', c.desc)
          r.set('icone', c.icone)
          r.set('cor', c.cor)
          r.set('reembolsavel_padrao', true)
          r.set('exige_justificativa', false)
          r.set('active', true)
        },
      )
    }

    // ─── FORNECEDORES EXTRAS ───
    const fornecedores = [
      { nome: 'Hotel Plaza SP', cnpj: '22.333.444/0001-55', email: 'reservas@hotelplazasp.com.br' },
      { nome: 'Uber do Brasil Tecnologia', cnpj: '17.895.646/0001-87', email: 'corporativo@uber.com' },
      { nome: 'Posto Shell Av. Paulista', cnpj: '33.444.555/0001-66', email: 'contato@shellpaulista.com.br' },
      { nome: 'Kalunga Papelaria', cnpj: '44.555.666/0001-77', email: 'vendas@kalunga.com.br' },
      { nome: 'Alura Cursos Online', cnpj: '55.666.777/0001-88', email: 'pj@alura.com.br' },
    ]
    for (const f of fornecedores) {
      upsert(
        'fornecedores',
        `empresa_id='${empresa.id}' && nome='${f.nome}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('nome', f.nome)
          r.set('cnpj', f.cnpj)
          r.set('contato_email', f.email)
          r.set('preferencial', false)
          r.set('active', true)
        },
      )
    }

    // ─── CENTROS DE CUSTO EXTRAS ───
    const ccs = [
      { codigo: 'MKT-001', nome: 'Marketing', orcamento: 30000 },
      { codigo: 'TI-001', nome: 'Tecnologia da Informação', orcamento: 80000 },
      { codigo: 'RH-001', nome: 'Recursos Humanos', orcamento: 25000 },
    ]
    for (const cc of ccs) {
      upsert(
        'centros_custo',
        `empresa_id='${empresa.id}' && codigo='${cc.codigo}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('codigo', cc.codigo)
          r.set('nome', cc.nome)
          r.set('orcamento_mensal', cc.orcamento)
          if (gestor) r.set('responsavel_id', gestor.id)
          r.set('active', true)
        },
      )
    }

    // ─── PROJETOS EXTRAS ───
    const ccMkt = app.findRecordsByFilter(
      'centros_custo',
      `empresa_id='${empresa.id}' && codigo='MKT-001'`,
      '',
      1,
      0,
    )
    const ccTi = app.findRecordsByFilter(
      'centros_custo',
      `empresa_id='${empresa.id}' && codigo='TI-001'`,
      '',
      1,
      0,
    )

    const projetos = [
      {
        codigo: 'CAMP-VERAO-26',
        nome: 'Campanha Verão 2026',
        ccId: ccMkt[0]?.id,
        orcamento: 75000,
        status: 'ativo',
      },
      {
        codigo: 'MIG-CLOUD',
        nome: 'Migração Cloud Infrastructure',
        ccId: ccTi[0]?.id,
        orcamento: 200000,
        status: 'ativo',
      },
      {
        codigo: 'EVENT-Q4-25',
        nome: 'Evento Anual Q4 2025',
        ccId: ccMkt[0]?.id,
        orcamento: 50000,
        status: 'encerrado',
      },
    ]
    for (const p of projetos) {
      upsert(
        'projetos',
        `empresa_id='${empresa.id}' && codigo='${p.codigo}'`,
        (r) => {
          r.set('empresa_id', empresa.id)
          r.set('codigo', p.codigo)
          r.set('nome', p.nome)
          r.set('data_inicio', today)
          r.set('orcamento_total', p.orcamento)
          if (p.ccId) r.set('centro_custo_padrao_id', p.ccId)
          if (financeiro) r.set('responsavel_id', financeiro.id)
          r.set('status', p.status)
          r.set('active', p.status === 'ativo')
        },
      )
    }

    console.log('=== 0023 SEED MORE CADASTROS DONE ===')
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

    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
    } catch (_) {
      return
    }

    safeDelete(
      'projetos',
      `empresa_id='${empresa.id}' && (codigo='CAMP-VERAO-26' || codigo='MIG-CLOUD' || codigo='EVENT-Q4-25')`,
    )
    safeDelete(
      'centros_custo',
      `empresa_id='${empresa.id}' && (codigo='MKT-001' || codigo='TI-001' || codigo='RH-001')`,
    )
    safeDelete(
      'fornecedores',
      `empresa_id='${empresa.id}' && (nome='Hotel Plaza SP' || nome='Uber do Brasil Tecnologia' || nome='Posto Shell Av. Paulista' || nome='Kalunga Papelaria' || nome='Alura Cursos Online')`,
    )
    safeDelete(
      'categorias_despesa',
      `empresa_id='${empresa.id}' && (nome='Transporte' || nome='Hospedagem' || nome='Combustível' || nome='Material Escritório' || nome='Treinamento')`,
    )
    safeDelete(
      'cotacao_historico',
      `empresa_id='${empresa.id}'`,
    )
    safeDelete(
      'moedas',
      `empresa_id='${empresa.id}' && (codigo='USD' || codigo='EUR' || codigo='ARS')`,
    )
  },
)
