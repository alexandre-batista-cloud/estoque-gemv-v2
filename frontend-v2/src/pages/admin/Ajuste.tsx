import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProdutos } from '../../hooks/useProdutos'
import { useLocais } from '../../hooks/useLocais'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { CheckCircle2 } from 'lucide-react'

export function AdminAjuste() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: produtos = [] } = useProdutos()
  const { data: locais = [] } = useLocais()
  const [produtoId, setProdutoId] = useState('')
  const [localId, setLocalId] = useState('')
  const [novaQtd, setNovaQtd] = useState('')
  const [obs, setObs] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const produto = produtos.find(p => p.id === produtoId)
      const epl = produto?.estoque_por_local?.find(e => e.local_id === localId)
      const qtdAnterior = epl?.quantidade ?? 0
      const qtd = parseInt(novaQtd, 10)

      await supabase.from('estoque_por_local')
        .upsert(
          { produto_id: produtoId, local_id: localId, quantidade: qtd },
          { onConflict: 'produto_id,local_id' }
        )

      await supabase.from('movimentacoes').insert({
        produto_id: produtoId,
        local_id: localId,
        tipo: 'AJUSTE',
        quantidade: qtd - qtdAnterior,
        usuario_id: user!.id,
        obs,
      })
    },
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setProdutoId('')
      setLocalId('')
      setNovaQtd('')
      setObs('')
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const produtoSelecionado = produtos.find(p => p.id === produtoId)
  const qtdAtual = produtoSelecionado?.estoque_por_local
    ?.find(e => e.local_id === localId)?.quantidade

  return (
    <div className="max-w-md w-full">
      <h2 className="text-xl font-bold mb-6 text-slate-900">Ajuste de Estoque</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Produto</label>
          <Select onValueChange={setProdutoId} value={produtoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar produto" />
            </SelectTrigger>
            <SelectContent>
              {produtos.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} — {p.ean}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Local</label>
          <Select onValueChange={setLocalId} value={localId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar local" />
            </SelectTrigger>
            <SelectContent>
              {locais.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {qtdAtual !== undefined && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
            Quantidade atual:
            <span className="font-bold text-slate-900">{qtdAtual}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova quantidade</label>
          <Input
            type="number"
            min={0}
            value={novaQtd}
            onChange={e => setNovaQtd(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Observação <span className="text-slate-400 font-normal">(obrigatória)</span>
          </label>
          <Input
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex: Contagem física 01/03/2026"
          />
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            Ajuste salvo com sucesso
          </div>
        )}

        <Button
          onClick={() => mutation.mutate()}
          disabled={!produtoId || !localId || !novaQtd || !obs || mutation.isPending}
          className="w-full min-h-[44px]"
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar Ajuste'}
        </Button>
      </div>
    </div>
  )
}
