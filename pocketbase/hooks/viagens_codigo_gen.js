onRecordCreate((e) => {
  const code = e.record.getString('codigo')
  if (code && code.trim() !== '') return e.next()

  const empresaId = e.record.getString('empresa_id')
  if (!empresaId) return e.next()

  const year = new Date().getFullYear().toString()
  const prefix = `VIA-${year}-`

  const records = $app.findRecordsByFilter(
    'viagens',
    `empresa_id = '${empresaId}' && codigo ~ '${prefix}'`,
    '-codigo',
    1,
    0,
  )

  let seq = 1
  if (records && records.length > 0) {
    const lastCode = records[0].getString('codigo')
    const parts = lastCode.split('-')
    const lastSeq = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1
    }
  }

  const seqStr = String(seq).padStart(5, '0')
  e.record.set('codigo', `VIA-${year}-${seqStr}`)

  return e.next()
}, 'viagens')
