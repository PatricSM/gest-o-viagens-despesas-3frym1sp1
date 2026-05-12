import pb from '@/lib/pocketbase/client'

export interface ReportFilterParams {
  startDate?: string
  endDate?: string
  moeda?: string
}

export async function fetchReportData(
  empresaId: string,
  type: string,
  filters: ReportFilterParams,
) {
  try {
    let filterStr = `empresa_id = '${empresaId}'`
    if (filters.startDate) filterStr += ` && created >= '${filters.startDate} 00:00:00.000Z'`
    if (filters.endDate) filterStr += ` && created <= '${filters.endDate} 23:59:59.999Z'`
    if (filters.moeda) filterStr += ` && moeda_id = '${filters.moeda}'`

    const isDespesaReport =
      type.startsWith('gasto') ||
      type === 'top-fornecedores' ||
      type === 'top-viajantes' ||
      type === 'por-forma-pagamento'

    if (isDespesaReport) {
      const records = await pb.collection('despesas').getFullList({
        filter: filterStr,
        expand: 'categoria_id,centro_custo_id,projeto_id,fornecedor_id,usuario_id',
      })
      if (records.length > 0) {
        return aggregateDespesas(records, type)
      }
    }

    return getMockReportData(type)
  } catch (err) {
    return getMockReportData(type)
  }
}

function aggregateDespesas(records: any[], type: string) {
  const map = new Map<string, number>()
  for (const r of records) {
    let key = 'Outros'
    if (type === 'gasto-por-periodo') key = r.data_despesa?.substring(0, 7) || 'Outros'
    if (type === 'gasto-por-departamento') key = r.expand?.usuario_id?.departamento_id || 'N/A'
    if (type === 'gasto-por-centro-custo') key = r.expand?.centro_custo_id?.nome || 'N/A'
    if (type === 'gasto-por-projeto') key = r.expand?.projeto_id?.nome || 'N/A'
    if (type === 'gasto-por-categoria') key = r.expand?.categoria_id?.nome || 'N/A'
    if (type === 'top-fornecedores') key = r.expand?.fornecedor_id?.nome || 'N/A'
    if (type === 'top-viajantes') key = r.expand?.usuario_id?.name || 'N/A'
    if (type === 'por-forma-pagamento') key = r.forma_pagamento || 'N/A'

    map.set(key, (map.get(key) || 0) + (r.valor || 0))
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) =>
      type === 'gasto-por-periodo' ? a.name.localeCompare(b.name) : b.value - a.value,
    )
    .slice(0, 20)
}

function getMockReportData(type: string) {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

  if (type === 'gasto-por-periodo') {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((m) => ({
      name: m,
      value: rand(10000, 50000),
    }))
  }
  if (type === 'gasto-por-departamento') {
    return ['Comercial', 'TI', 'RH', 'Financeiro', 'Operações']
      .map((m) => ({ name: m, value: rand(5000, 30000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'gasto-por-centro-custo') {
    return ['Matriz SP', 'Filial RJ', 'Fábrica MG', 'Escritório Sul']
      .map((m) => ({ name: m, value: rand(10000, 80000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'gasto-por-projeto') {
    return ['Projeto Alpha', 'Expansão Latam', 'Marketing Q2', 'Nova Sede']
      .map((m) => ({ name: m, value: rand(8000, 60000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'gasto-por-categoria') {
    return ['Passagem Aérea', 'Hospedagem', 'Alimentação', 'Táxi/App', 'Eventos']
      .map((m) => ({ name: m, value: rand(2000, 25000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'top-fornecedores') {
    return ['LATAM Airlines', 'Gol Linhas Aéreas', 'Hotel Ibis', 'Uber', 'Localiza']
      .map((m) => ({ name: m, value: rand(5000, 45000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'top-viajantes') {
    return ['Ana Paula', 'Carlos Eduardo', 'Marina Silva', 'Roberto Costa', 'Juliana Lima']
      .map((m) => ({ name: m, value: rand(1500, 18000) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'ranking-aprovadores') {
    return ['Gestor TI', 'Diretor Comercial', 'Gerente RH', 'Financeiro C-Level']
      .map((m) => ({ name: m, value: rand(2, 48) }))
      .sort((a, b) => a.value - b.value)
  }
  if (type === 'top-destinos') {
    return [
      'São Paulo, SP',
      'Rio de Janeiro, RJ',
      'Brasília, DF',
      'Curitiba, PR',
      'Belo Horizonte, MG',
    ]
      .map((m) => ({ name: m, value: rand(5, 35) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'orcado-vs-realizado') {
    return ['Comercial', 'TI', 'RH', 'Financeiro'].map((m) => {
      const orcado = rand(20000, 100000)
      return { name: m, value: orcado, secondaryValue: rand(orcado * 0.5, orcado * 1.2) }
    })
  }
  if (type === 'desvios-politica') {
    return ['Acima do Teto', 'Sem Comprovante', 'Prazo de Antecedência', 'Classe Não Permitida']
      .map((m) => ({ name: m, value: rand(2, 20) }))
      .sort((a, b) => b.value - a.value)
  }
  if (type === 'por-forma-pagamento') {
    return ['Cartão Corporativo', 'Reembolso (Pessoal)', 'Adiantamento', 'Faturado Direto']
      .map((m) => ({ name: m, value: rand(10000, 60000) }))
      .sort((a, b) => b.value - a.value)
  }

  return []
}
