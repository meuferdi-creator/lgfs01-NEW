export function formatMoney(value: string | number, currency = 'XOF') {
  const n = typeof value === 'string' ? Number(value) : value
  return `${Math.round(n).toLocaleString('fr-FR')} ${currency === 'XOF' ? 'FCFA' : currency}`
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
