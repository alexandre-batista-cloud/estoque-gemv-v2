import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, LogOut } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  quantidade: number;
  minimo_estoque: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://77.37.126.43:3001';

// Inject JWT into every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

interface AppProps {
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ onLogout }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const fetchEstoque = async () => {
    try {
      const res = await axios.get(`${API_URL}/estoque`, { timeout: 10000 });
      setProdutos(res.data || []);
      setErro('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        onLogout();
      } else {
        setErro(`Erro ao carregar: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMovimentacao = async (id: string, quantidade: number, tipo: 'ENTRADA' | 'SAIDA') => {
    try {
      await axios.post(`${API_URL}/movimentacao`, { produto_id: id, quantidade, tipo });
      fetchEstoque();
    } catch (err: any) {
      if (err.response?.status === 401) {
        onLogout();
      } else {
        alert('Erro ao processar movimentação');
      }
    }
  };

  useEffect(() => { fetchEstoque(); }, []);

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      Carregando Estoque Ortobom...
    </div>
  );

  return (
    <div className="dashboard">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>💎 Estoque Gemv - Ortobom</h1>
            <p>Dashboard de Controle em Tempo Real</p>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', borderRadius: '8px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {erro && (
        <div style={{ background: '#fff0f0', color: '#c00', padding: '10px 20px', textAlign: 'center' }}>
          {erro}
        </div>
      )}

      <div className="product-grid">
        {produtos.map((p) => (
          <div key={p.id} className="card">
            <h3>{p.nome}</h3>
            <div className="sku">SKU: {p.sku}</div>

            <div className="stock-info">
              <div>
                <span className={`stock-value ${p.quantidade < p.minimo_estoque ? 'stock-low' : ''}`}>
                  {p.quantidade}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#666' }}>em estoque</span>
              </div>
              {p.quantidade < p.minimo_estoque && (
                <div style={{ color: '#d93025', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={16} /> Baixo
                </div>
              )}
            </div>

            <div className="actions">
              <button className="btn-add" onClick={() => handleMovimentacao(p.id, 1, 'ENTRADA')}>
                <ArrowUpCircle size={18} /> Entrada
              </button>
              <button className="btn-remove" onClick={() => handleMovimentacao(p.id, 1, 'SAIDA')}>
                <ArrowDownCircle size={18} /> Saída
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
