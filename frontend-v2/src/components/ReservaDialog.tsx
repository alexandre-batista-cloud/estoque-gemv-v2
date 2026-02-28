import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Produto, Local } from '../types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select'

interface Props {
  produto: Produto
  locais: Local[]
  onClose: () => void
}

export function ReservaDialog({ produto, locais, onClose }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [clienteNome, setClienteNome] = useState('')
  const [localId, setLocalId] = useState('')
  const [quantidade, setQuantidade] = useState(1)

  const locaisDisponiveis = produto.estoque_por_local
    ?.filter(e => e.quantidade > 0)
    .map(e => {
      const local = locais.find(l => l.id === e.local_id)
      return local ? { ...local, disponivel: e.quantidade } : null
    })
    .filter((l): l is Local & { disponivel: number } => Boolean(l)) ?? []

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reservas').insert({
        produto_id: produto.id,
        local_id: localId,
        quantidade,
        vendedor_id: user!.id,
        cliente_nome: clienteNome,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      onClose()
    },
  })

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservar — {produto.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Nome do cliente</label>
            <Input
              placeholder="Nome completo"
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Local</label>
            <Select onValueChange={setLocalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar local" />
              </SelectTrigger>
              <SelectContent>
                {locaisDisponiveis.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome} — {l.disponivel} disponíveis
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Quantidade</label>
            <Input
              type="number" min={1}
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
            />
          </div>
          {mutation.isError && (
            <p className="text-red-500 text-sm">Erro ao criar reserva</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!clienteNome || !localId || mutation.isPending}
          >
            {mutation.isPending ? 'Reservando...' : 'Confirmar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
