import Papa from 'papaparse'

export interface ImportRow {
  ean: string
  nome: string
  dimensoes: string
  quantidade: number
  localizado: string
  _localCodigo?: string
  _errors: string[]
  _valid: boolean
}

const LOCAIS_MAP: Record<string, string> = {
  'loja anapolis':    'loja_anapolis',
  'loja goiania':     'loja_goiania',
  'estoque anapolis': 'estoque_anapolis',
  'estoque goiania':  'estoque_goiania',
}

export function detectarCategoria(nome: string): string {
  const n = nome.toUpperCase()
  if (/^(COLCHAO|COLCHÃO|ORION|MOLAS|LIBERTY)/.test(n)) return 'Colchão'
  if (/^(BASE|SOMMIER)/.test(n)) return 'Base'
  if (/^(TRAV|TRAVESSEIRO)/.test(n)) return 'Travesseiro'
  if (/^PILLOW/.test(n)) return 'Pillow Top'
  if (/^PROTETOR/.test(n)) return 'Protetor'
  return 'Outros'
}

export function parseDimensoes(str: string) {
  const match = str?.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i)
  if (!match) return { dim_alt: null, dim_larg: null, dim_comp: null }
  return { dim_alt: +match[1], dim_larg: +match[2], dim_comp: +match[3] }
}

export function parseCSV(text: string): ImportRow[] {
  const { data } = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })

  const rows = data[0]?.[0]?.toUpperCase().includes('EAN') ? data.slice(1) : data

  return (rows ?? []).map((row: string[]) => {
    const [ean, nome, dimensoes, qtdStr, localizado] = (row ?? []).map((c: string) => c?.trim() ?? '')
    const errors: string[] = []

    if (!ean || !/^\d{8,13}$/.test(ean)) errors.push('EAN inválido')
    if (!nome) errors.push('Nome vazio')
    const quantidade = parseInt(qtdStr, 10)
    if (isNaN(quantidade) || quantidade < 0) errors.push('Quantidade inválida')
    const localCodigo = LOCAIS_MAP[localizado?.toLowerCase()]
    if (!localCodigo) errors.push(`Local inválido: "${localizado}"`)

    return {
      ean, nome, dimensoes, quantidade,
      localizado, _localCodigo: localCodigo,
      _errors: errors, _valid: errors.length === 0,
    }
  })
}
