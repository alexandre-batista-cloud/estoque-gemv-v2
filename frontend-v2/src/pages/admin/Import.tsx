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
      <h2 className="text-xl font-bold mb-6">Importar Produtos</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-sm text-gray-500 mb-3">Upload arquivo CSV</p>
          <input type="file" accept=".csv,.txt" onChange={handleFile}
            className="text-sm" />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Ou cole a planilha aqui:</p>
          <textarea
            className="w-full h-32 border rounded p-2 text-xs font-mono"
            placeholder={"EAN,PRODUTO,DIMENSOES,QUANTIDADE,LOCALIZADO\n4070953983,TRAV VISCOPUR,14 x 40 x 60,6,loja anapolis"}
            onChange={handlePaste}
          />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm">
              <Badge variant="default">{validRows.length} válidos</Badge>{' '}
              {invalidRows.length > 0 && <Badge variant="destructive">{invalidRows.length} com erro</Badge>}
            </span>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={validRows.length === 0 || importMutation.isPending}
            >
              {importMutation.isPending ? 'Importando...' : `Importar ${validRows.length} produtos`}
            </Button>
          </div>

          <div className="border rounded overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['', 'EAN', 'Produto', 'Dimensões', 'Qtd', 'Local'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={row._valid ? '' : 'bg-red-50'}>
                    <td className="px-2 py-1">
                      {row._valid
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <AlertTriangle size={14} className="text-red-500" />}
                    </td>
                    <td className="px-2 py-1 font-mono">{row.ean}</td>
                    <td className="px-2 py-1">{row.nome}</td>
                    <td className="px-2 py-1">{row.dimensoes}</td>
                    <td className="px-2 py-1 text-center">{row.quantidade}</td>
                    <td className="px-2 py-1">
                      {row._localCodigo ?? (
                        <span className="text-red-500">{row._errors.join(', ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          ✅ Import concluído: <strong>{result.criados}</strong> produtos | {result.erros} erros
        </div>
      )}
    </div>
  )
}
