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

function openPrintWindow(title: string, htmlContent: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #00288e; color: #fff; }
          .header { margin-bottom: 30px; border-bottom: 2px solid #00288e; padding-bottom: 10px; }
          .header h1 { margin: 0 0 10px 0; font-size: 20px; color: #00288e; }
          .header p { margin: 5px 0; font-size: 12px; color: #555; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .section-title { font-size: 16px; margin-top: 20px; margin-bottom: 10px; color: #00288e; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .summary-box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-top: 20px; width: 300px; float: right; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;}
          .summary-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px; }
          .clearfix::after { content: ""; clear: both; display: table; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = () => {
            window.print();
          }
        </script>
      </body>
    </html>
  `)
  win.document.close()
}

export function exportPrestacaoPDF(data: PrestacaoPDFData) {
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })

  let despesasHtml = ''
  data.despesas.forEach((d) => {
    despesasHtml += `
      <tr>
        <td>${d.data}</td>
        <td>${d.categoria}</td>
        <td>${d.fornecedor}</td>
        <td>${d.descricao}</td>
        <td class="text-right">${data.moeda_simbolo} ${d.valor.toFixed(2)}</td>
      </tr>
    `
  })

  let timelineHtml = ''
  if (data.timeline && data.timeline.length > 0) {
    data.timeline.forEach((t) => {
      timelineHtml += `
        <tr>
          <td>${t.etapa}</td>
          <td>${t.aprovador}</td>
          <td>${t.data}</td>
          <td>${t.comentario}</td>
        </tr>
      `
    })
  }

  const html = `
    <div class="header">
      <div style="float: right; text-align: right;">
        <p>Gerado em: ${dateStr}</p>
      </div>
      <h1>${data.empresa_nome}</h1>
      <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">Relatório de Prestação de Contas</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
      <div>
        <p><strong>Código:</strong> ${data.codigo}</p>
        <p><strong>Título:</strong> ${data.titulo}</p>
        <p><strong>Colaborador:</strong> ${data.viajante_nome}</p>
        ${data.viagem_codigo ? `<p><strong>Viagem:</strong> ${data.viagem_codigo}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p><strong>Período:</strong> ${data.periodo.inicio} a ${data.periodo.fim}</p>
      </div>
    </div>

    <div class="section-title">Despesas Detalhadas</div>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Categoria</th>
          <th>Fornecedor</th>
          <th>Descrição</th>
          <th class="text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${despesasHtml || '<tr><td colspan="5" class="text-center">Nenhuma despesa registrada.</td></tr>'}
      </tbody>
    </table>

    <div class="clearfix">
      <div class="summary-box">
        <div class="summary-row">
          <span>Total de Despesas:</span>
          <span>${data.moeda_simbolo} ${data.total_despesas.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Adiantamentos:</span>
          <span style="color: red;">- ${data.moeda_simbolo} ${data.total_adiantamento.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Saldo Final:</span>
          <span>${data.moeda_simbolo} ${data.saldo.toFixed(2)}</span>
        </div>
      </div>
    </div>

    ${
      data.timeline && data.timeline.length > 0
        ? `
      <div style="margin-top: 40px;">
        <div class="section-title">Histórico de Aprovação</div>
        <table>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Aprovador</th>
              <th>Data</th>
              <th>Comentário</th>
            </tr>
          </thead>
          <tbody>
            ${timelineHtml}
          </tbody>
        </table>
      </div>
    `
        : ''
    }
  `

  openPrintWindow(`Prestacao_${data.codigo}`, html)
}

export function exportRemessaPDF(data: RemessaPDFData) {
  const total = data.reembolsos.reduce((acc, r) => acc + r.valor, 0)

  let rowsHtml = ''
  data.reembolsos.forEach((r) => {
    rowsHtml += `
      <tr>
        <td>${r.codigo}</td>
        <td>${r.colaborador}<br/><small>CPF: ${r.cpf}</small></td>
        <td>${r.banco_destino}<br/><small>Ag: ${r.agencia_destino} CC: ${r.conta_destino}</small></td>
        <td>${r.chave_pix || '-'}</td>
        <td>${r.prestacao_codigo}</td>
        <td class="text-right">R$ ${r.valor.toFixed(2)}</td>
      </tr>
    `
  })

  const html = `
    <div class="header">
      <h1>${data.empresa_nome}</h1>
      <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">Remessa de Pagamentos</p>
      <p>Data de Geração: ${data.data_geracao}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Colaborador</th>
          <th>Dados Bancários</th>
          <th>Chave PIX</th>
          <th>Prestação</th>
          <th class="text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" class="text-center">Nenhum pagamento na remessa.</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="text-right font-bold">Total:</td>
          <td class="text-right font-bold">R$ ${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  `

  openPrintWindow(`Remessa_Pagamentos`, html)
}

export function exportRelatorioPDF(data: RelatorioPDFData) {
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })

  let filtersHtml = ''
  const filters = Object.entries(data.filtros_aplicados)
  if (filters.length > 0) {
    filtersHtml =
      '<div style="margin-bottom: 20px; font-size: 12px;"><strong>Filtros Aplicados:</strong><br/>'
    filters.forEach(([key, value]) => {
      filtersHtml += `<span>${key}: ${value}</span><br/>`
    })
    filtersHtml += '</div>'
  }

  let headHtml = '<tr>'
  data.colunas.forEach((col) => {
    headHtml += `<th>${col}</th>`
  })
  headHtml += '</tr>'

  let bodyHtml = ''
  data.linhas.forEach((row) => {
    bodyHtml += '<tr>'
    row.forEach((cell) => {
      bodyHtml += `<td>${cell}</td>`
    })
    bodyHtml += '</tr>'
  })

  const html = `
    <div class="header">
      <div style="float: right; text-align: right;">
        <p>Gerado em: ${dateStr}</p>
      </div>
      <h1>${data.empresa_nome}</h1>
      <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">${data.titulo}</p>
      ${data.subtitulo ? `<p style="font-size: 14px;">${data.subtitulo}</p>` : ''}
    </div>

    ${filtersHtml}

    <table>
      <thead>
        ${headHtml}
      </thead>
      <tbody>
        ${bodyHtml || `<tr><td colspan="${data.colunas.length}" class="text-center">Sem dados.</td></tr>`}
      </tbody>
    </table>

    ${
      data.total
        ? `
      <div class="text-right" style="margin-top: 20px; font-size: 16px;">
        <strong>${data.total.label}:</strong> ${data.total.moeda_simbolo} ${data.total.valor.toFixed(2)}
      </div>
    `
        : ''
    }
  `

  openPrintWindow(`Relatorio`, html)
}
