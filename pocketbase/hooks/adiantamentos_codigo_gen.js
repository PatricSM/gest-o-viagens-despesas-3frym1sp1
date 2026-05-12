onRecordCreateRequest((e) => {
  if (e.record.getString('codigo')) return e.next()

  const year = new Date().getFullYear()
  const filter = `codigo ~ 'ADI-${year}-'`

  let nextSeq = 1
  try {
    const records = $app.findRecordsByFilter('adiantamentos', filter, '-created', 1, 0)
    if (records.length > 0) {
      const lastCode = records[0].getString('codigo')
      const parts = lastCode.split('-')
      if (parts.length === 3) {
        nextSeq = parseInt(parts[2], 10) + 1
      }
    }
  } catch (err) {
    // collection might not have records yet or invalid filter
  }

  e.record.set('codigo', `ADI-${year}-${nextSeq.toString().padStart(5, '0')}`)

  return e.next()
}, 'adiantamentos')
