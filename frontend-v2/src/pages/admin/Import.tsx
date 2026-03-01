import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { parseCSV, detectarCategoria, parseDimensoes, type ImportRow } from '../../lib/importUtils'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function AdminImport() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<ImportRow[]>([])
  const [result, setResult] = useState<{ criados: number; atualizados: number; erros: number } | null>(null)

  const validRows = rows.filter(r => r._valid)
  const invalidRows = rows.filter(r => !r._valid)

  const handlePaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRows(parseCSV(e.target.value))
    setResult(null)
  }, [])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRows(parseCSV(ev.target?.result as string))
      setResult(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data: locais } = await supabase.from('locais').select('id, codigo')
      const localMap = Object.fromEntries((locais ?? []).map(l => [l.codigo, l.id]))

      let criados = 0
      let erros = 0

      for (const row of validRows) {
        try {
          const dims = parseDimensoes(row.dimensoes)
          const categoria = detectarCategoria(row.nome)
          const localId = localMap[row._localCodigo!]

          const { data: produto, error: prodErr } = await supabase
            .from('produtos')
            .upsert({
              ean: row.ean,
              nome: row.nome,
              dimensoes: row.dimensoes,
              ...dims,
              categoria,
            }, { onConflict: 'ean' })
            .select('id')
            .single()

          if (prodErr) { erros++; continue }

          const { error: estErr } = await supabase
            .from('estoque_por_local')
            .upsert(
              { produto_id: produto.id, local_id: localId, quantidade: row.quantidade },
              { onConflict: 'produto_id,local_id' }
            )

          if (estErr) { erros++; continue }

          await supabase.from('movimentacoes').insert({
            produto_id: produto.id,
            local_id: localId,
            tipo: 'IMPORT',
            quantidade: row.quantidade,
            usuario_id: user!.id,
            obs: `Import CSV: ${row.nome}`,
          })

          criados++
        } catch { erros++ }
      }

      return { criados, atualizados: 0, erros }
    },
    onSuccess: (data) => {
      setResult(data)
      setRows([])
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-6 text-slate-900">Importar Produtos</h2>

      {/* Input area — stacks to 1 col on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors group">
          <Upload className="mx-auto mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" size={32} />
          <p className="text-sm text-slate-500 mb-1">Upload arquivo CSV</p>
          <p className="text-xs text-slate-400 mb-3">Clique para selecionar</p>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-700">Ou cole a planilha aqui:</p>
          <textarea
            className="flex-1 min-h-32 w-full border border-slate-200 rounded-lg p-3 text-xs font-mono resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400"
            placeholder={"EAN,PRODUTO,DIMENSOES,QUANTIDADE,LOCALIZADO\n4070953983,TRAV VISCOPUR,14 x 40 x 60,6,loja anapolis"}
            onChange={handlePaste}
          />
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-sm">
              <Badge variant="default">{validRows.length} válidos</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive">{invalidRows.length} com erro</Badge>
              )}
            </span>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={validRows.length === 0 || importMutation.isPending}
              className="min-h-[40px]"
            >
              {importMutation.isPending ? 'Importando...' : `Importar ${validRows.length} produtos`}
            </Button>
          </div>

          <div className="-mx-4 md:mx-0 overflow-x-auto">
            <div className="min-w-[520px] px-4 md:px-0">
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      {['', 'EAN', 'Produto', 'Dimensões', 'Qtd', 'Local'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={row._valid ? 'border-t border-slate-100 hover:bg-slate-50' : 'border-t bg-red-50'}>
                        <td className="px-3 py-1.5">
                          {row._valid
                            ? <CheckCircle size={14} className="text-emerald-500" />
                            : <AlertTriangle size={14} className="text-red-500" />}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{row.ean}</td>
                        <td className="px-3 py-1.5 text-slate-700">{row.nome}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.dimensoes}</td>
                        <td className="px-3 py-1.5 text-center font-semibold">{row.quantidade}</td>
                        <td className="px-3 py-1.5">
                          {row._localCodigo
                            ? <span className="text-slate-600">{row._localCodigo}</span>
                            : <span className="text-red-500">{row._errors.join(', ')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
          ✅ Import concluído: <strong>{result.criados}</strong> produtos importados
          {result.erros > 0 && <span className="text-red-600"> · {result.erros} erros</span>}
        </div>
      )}
    </div>
  )
}
