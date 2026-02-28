import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProdutos } from '../../hooks/useProdutos'
import { useLocais } from '../../hooks/useLocais'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

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
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-6">Ajuste de Estoque</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Produto</label>
          <Select onValueChange={setProdutoId}>
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
          <label className="text-sm font-medium">Local</label>
          <Select onValueChange={setLocalId}>
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
          <p className="text-sm text-gray-500">Quantidade atual: <strong>{qtdAtual}</strong></p>
        )}

        <div>
          <label className="text-sm font-medium">Nova quantidade</label>
          <Input type="number" min={0} value={novaQtd}
            onChange={e => setNovaQtd(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Observação (obrigatória)</label>
          <Input value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: Contagem física 28/02/2026" />
        </div>

        {success && <p className="text-green-600 text-sm">✅ Ajuste salvo com sucesso</p>}

        <Button
          onClick={() => mutation.mutate()}
          disabled={!produtoId || !localId || !novaQtd || !obs || mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar Ajuste'}
        </Button>
      </div>
    </div>
  )
}
