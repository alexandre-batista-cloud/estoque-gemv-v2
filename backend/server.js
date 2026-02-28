const express = require('express');
const db = require('./db/adapter');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend estático (usado na VPS)
app.use(express.static('/root/estoque_frontend'));

// ─── AUTH ────────────────────────────────────────────────

const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  const token = header.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

app.post('/api/login', async (req, res) => {
  const { senha, cfToken } = req.body;

  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  // Bypass Turnstile em desenvolvimento
  if (process.env.CF_TURNSTILE_SECRET === 'SKIP') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }

  try {
    const verify = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.CF_TURNSTILE_SECRET,
        response: cfToken,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    if (!verify.data.success) {
      return res.status(401).json({ error: 'Captcha inválido' });
    }
  } catch {
    return res.status(500).json({ error: 'Erro ao verificar captcha' });
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// ─── ROTAS PROTEGIDAS ────────────────────────────────────

app.get('/estoque', authMiddleware, async (req, res) => {
  try {
    const data = await db.getProdutos();
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/historico', authMiddleware, async (req, res) => {
  try {
    const data = await db.getHistorico(50);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/movimentacao', authMiddleware, async (req, res) => {
  const { produto_id, quantidade, tipo, usuario } = req.body;

  const produto = await db.getProdutoById(produto_id);
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

  const novaQuantidade = tipo === 'ENTRADA'
    ? produto.quantidade + quantidade
    : produto.quantidade - quantidade;

  await db.updateQuantidade(produto_id, novaQuantidade);
  await db.insertMovimentacao({ produto_id, quantidade, tipo, usuario });

  // Alerta WhatsApp só em produção
  if (process.env.NODE_ENV === 'production' && novaQuantidade < (produto.minimo_estoque || 5)) {
    try {
      const EVO_CONFIG = {
        url: process.env.EVO_URL || 'http://77.37.126.43:8081',
        apikey: process.env.EVO_APIKEY,
        instance: process.env.EVO_INSTANCE || 'Ortobom-Digital',
        my_number: process.env.EVO_NUMBER || '5562991827568'
      };
      await axios.post(`${EVO_CONFIG.url}/message/sendText/${EVO_CONFIG.instance}`, {
        number: EVO_CONFIG.my_number,
        textMessage: {
          text: `⚠️ *ALERTA ESTOQUE BAIXO*\n\n📦 *${produto.nome}*\n🔢 Qtd: ${novaQuantidade}\n📉 Mín: ${produto.minimo_estoque || 5}`
        }
      }, { headers: { apikey: EVO_CONFIG.apikey } });
    } catch (e) {
      console.log('Erro ao enviar alerta WhatsApp:', e.message);
    }
  }

  res.json({ success: true, novaQuantidade });
});

// SPA fallback
app.use((req, res) => {
  res.sendFile('/root/estoque_frontend/index.html');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend ONLINE em 0.0.0.0:${PORT}`));
