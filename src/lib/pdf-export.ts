import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface PrestacaoPDFData {
  codigo: string
  titulo: string
  viajante_nome: string
  empresa_nome: string
  empresa_logo_url?: string
  viagem_codigo?: string
  periodo: { inicio: string; fim: string }
  despesas: Array<{
    data: string
    categoria: string
    fornecedor: string
    descricao: string
    valor: number
  }>
  total_despesas: number
  total_adiantamento: number
  saldo: number
  moeda_simbolo: string
  timeline: Array<{
    etapa: string
    aprovador: string
    data: string
    comentario: string
  }>
}

export interface RemessaPDFData {
  empresa_nome: string
  data_geracao: string
  reembolsos: Array<{
    codigo: string
    colaborador: string
    cpf: string
    banco_destino: string
    agencia_destino: string
    conta_destino: string
    chave_pix?: string
    valor: number
    prestacao_codigo: string
  }>
}

export interface RelatorioPDFData {
  titulo: string
  subtitulo?: string
  empresa_nome: string
  filtros_aplicados: Record<string, string>
  colunas: string[]
  linhas: Array<Array<string | number>>
  total?: { label: string; valor: number; moeda_simbolo: string }
}

const PRIMARY_COLOR = '#00288e'

function addCorporateHeader(doc: jsPDF, companyName: string, title: string) {
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName, 40, 40)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  doc.text(`Gerado em: ${dateStr}`, doc.internal.pageSize.width - 40, 40, { align: 'right' })

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, doc.internal.pageSize.width / 2, 80, { align: 'center' })
}

function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 30,
      { align: 'center' },
    )
  }
}

export function exportPrestacaoPDF(data: PrestacaoPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  addCorporateHeader(doc, data.empresa_nome, 'Relatório de Prestação de Contas')

  doc.setFontSize(10)
  doc.text(`Código: ${data.codigo}`, 40, 110)
  doc.text(`Título: ${data.titulo}`, 40, 125)
  doc.text(`Colaborador: ${data.viajante_nome}`, 40, 140)
  if (data.viagem_codigo) {
    doc.text(`Viagem: ${data.viagem_codigo}`, 40, 155)
  }

  doc.text(
    `Período: ${data.periodo.inicio} a ${data.periodo.fim}`,
    doc.internal.pageSize.width - 40,
    110,
    { align: 'right' },
  )

  // Resumo financeiro
  autoTable(doc, {
    startY: 180,
    head: [['Resumo Financeiro', 'Valor']],
    body: [
      ['Total de Despesas', `${data.moeda_simbolo} ${data.total_despesas.toFixed(2)}`],
      ['Total de Adiantamentos', `${data.moeda_simbolo} ${data.total_adiantamento.toFixed(2)}`],
      ['Saldo Final', `${data.moeda_simbolo} ${data.saldo.toFixed(2)}`],
    ],
    headStyles: { fillColor: PRIMARY_COLOR, textColor: '#ffffff' },
    theme: 'striped',
  })

  // Despesas
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 30,
    head: [['Data', 'Categoria', 'Fornecedor', 'Descrição', 'Valor']],
    body: data.despesas.map((d) => [
      d.data,
      d.categoria,
      d.fornecedor,
      d.descricao,
      `${data.moeda_simbolo} ${d.valor.toFixed(2)}`,
    ]),
    headStyles: { fillColor: PRIMARY_COLOR, textColor: '#ffffff' },
    theme: 'striped',
  })

  // Timeline de aprovação
  if (data.timeline && data.timeline.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 30,
      head: [['Etapa', 'Aprovador', 'Data', 'Comentário']],
      body: data.timeline.map((t) => [t.etapa, t.aprovador, t.data, t.comentario]),
      headStyles: { fillColor: PRIMARY_COLOR, textColor: '#ffffff' },
      theme: 'striped',
    })
  }

  // TODO: Em uma versão futura, adicionar a opção de anexar imagens de comprovantes no final do PDF.

  addFooter(doc)

  const filename = `prestacao_${data.codigo || 'sem_codigo'}_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(filename)
}

export function exportRemessaPDF(data: RemessaPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  addCorporateHeader(doc, data.empresa_nome, 'Remessa de Pagamentos')

  doc.setFontSize(10)
  doc.text(`Data de Geração: ${data.data_geracao}`, 40, 110)

  const total = data.reembolsos.reduce((acc, r) => acc + r.valor, 0)

  autoTable(doc, {
    startY: 130,
    head: [['Código', 'Colaborador', 'Dados Bancários', 'Chave PIX', 'Prestação', 'Valor']],
    body: data.reembolsos.map((r) => [
      r.codigo,
      `${r.colaborador}\nCPF: ${r.cpf}`,
      `${r.banco_destino}\nAg: ${r.agencia_destino}\nCC: ${r.conta_destino}`,
      r.chave_pix || '-',
      r.prestacao_codigo,
      `R$ ${r.valor.toFixed(2)}`,
    ]),
    foot: [['', '', '', '', 'Total', `R$ ${total.toFixed(2)}`]],
    headStyles: { fillColor: PRIMARY_COLOR, textColor: '#ffffff' },
    footStyles: { fillColor: '#e2e8f0', textColor: '#000000', fontStyle: 'bold' },
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 4 },
  })

  addFooter(doc)

  const filename = `remessa_pagamentos_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(filename)
}

export function exportRelatorioPDF(data: RelatorioPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  addCorporateHeader(doc, data.empresa_nome, data.titulo)

  let currentY = 110
  if (data.subtitulo) {
    doc.setFontSize(12)
    doc.text(data.subtitulo, doc.internal.pageSize.width / 2, currentY, { align: 'center' })
    currentY += 20
  }

  const filters = Object.entries(data.filtros_aplicados)
  if (filters.length > 0) {
    doc.setFontSize(10)
    doc.text('Filtros Aplicados:', 40, currentY)
    currentY += 15
    filters.forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 50, currentY)
      currentY += 12
    })
    currentY += 10
  }

  autoTable(doc, {
    startY: currentY,
    head: [data.colunas],
    body: data.linhas,
    headStyles: { fillColor: PRIMARY_COLOR, textColor: '#ffffff' },
    theme: 'striped',
  })

  if (data.total) {
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `${data.total.label}: ${data.total.moeda_simbolo} ${data.total.valor.toFixed(2)}`,
      doc.internal.pageSize.width - 40,
      finalY,
      { align: 'right' },
    )
  }

  addFooter(doc)

  const filename = `relatorio_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(filename)
}
