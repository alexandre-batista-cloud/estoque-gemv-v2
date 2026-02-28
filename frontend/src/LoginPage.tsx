import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://77.37.126.43:3001';
const TURNSTILE_SITE_KEY = '0x4AAAAAACiTpFu2nQ6u4aIY';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState('');
  const widgetRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCfToken(token),
        'error-callback': () => setErro('Erro no captcha. Recarregue a página.'),
        size: 'normal',
        theme: 'light',
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfToken) {
      setErro('Aguarde o captcha carregar.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await axios.post(`${API_URL}/api/login`, { senha, cfToken });
      onLogin(res.data.token);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao fazer login';
      setErro(msg);
      if (widgetRef.current !== null) {
        window.turnstile.reset(widgetRef.current);
        setCfToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💎</div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1a1a2e' }}>Estoque Ortobom</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.85rem' }}>Acesso restrito</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#444', marginBottom: '6px', fontWeight: 600 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite a senha"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#0f3460')}
              onBlur={e => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          <div ref={containerRef} style={{ marginBottom: '16px' }} />

          {erro && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              color: '#c00',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !cfToken}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !cfToken ? '#999' : '#0f3460',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading || !cfToken ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
