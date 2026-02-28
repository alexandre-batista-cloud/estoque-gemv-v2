const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend estático (usado na VPS)
app.use(express.static('/root/estoque_frontend'));

// ─── AUTH (Supabase JWT) ───────────────────────────────────

const authMiddleware = async (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  req.user = user;
  next();
};

// ─── ALERTA WHATSAPP (única rota de negócio no backend) ─────

app.post('/api/alerta-estoque', authMiddleware, async (req, res) => {
  const { produtoNome, quantidade, minimo, localNome } = req.body;
  try {
    const EVO_CONFIG = {
      url: process.env.EVO_URL || 'http://77.37.126.43:8081',
      apikey: process.env.EVO_APIKEY,
      instance: process.env.EVO_INSTANCE || 'Ortobom-Digital',
      my_number: process.env.EVO_NUMBER || '5562991827568',
    };
    await axios.post(
      `${EVO_CONFIG.url}/message/sendText/${EVO_CONFIG.instance}`,
      {
        number: EVO_CONFIG.my_number,
        textMessage: {
          text: `⚠️ *ALERTA ESTOQUE BAIXO*\n\n📦 *${produtoNome}*\n🔢 Qtd: ${quantidade}\n📉 Mín: ${minimo}\n📍 ${localNome || ''}`,
        },
      },
      { headers: { apikey: EVO_CONFIG.apikey } }
    );
    res.json({ success: true });
  } catch (e) {
    console.log('Erro ao enviar alerta WhatsApp:', e.message);
    res.status(500).json({ error: 'Falha ao enviar alerta' });
  }
});

// SPA fallback
app.use((req, res) => {
  res.sendFile('/root/estoque_frontend/index.html');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend ONLINE em 0.0.0.0:${PORT}`));
