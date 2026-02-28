require('dotenv').config({
  path: require('path').join(__dirname, '..', `.env.${process.env.NODE_ENV || 'development'}`)
});

const IS_DEV = process.env.DB_ADAPTER === 'sqlite';

let db;

function getDb() {
  if (db) return db;

  if (IS_DEV) {
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');
    const dbPath = path.resolve(__dirname, '..', process.env.SQLITE_PATH || 'db/homolog.db');
    const schemaPath = path.join(__dirname, 'sqlite-schema.sql');

    db = new Database(dbPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  } else {
    const { createClient } = require('@supabase/supabase-js');
    db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return db;
}

async function getProdutos() {
  if (IS_DEV) {
    return getDb().prepare('SELECT * FROM produtos ORDER BY nome').all();
  }
  const { data, error } = await getDb().from('produtos').select('*').order('nome');
  if (error) throw error;
  return data;
}

async function getHistorico(limit = 50) {
  if (IS_DEV) {
    return getDb().prepare(`
      SELECT m.*, p.nome as produto_nome
      FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      ORDER BY m.data DESC LIMIT ?
    `).all(limit);
  }
  const { data, error } = await getDb()
    .from('movimentacoes')
    .select('*, produtos(nome)')
    .order('data', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function getProdutoById(id) {
  if (IS_DEV) {
    return getDb().prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  }
  const { data } = await getDb().from('produtos').select('*').eq('id', id).single();
  return data;
}

async function updateQuantidade(id, novaQuantidade) {
  if (IS_DEV) {
    getDb().prepare('UPDATE produtos SET quantidade = ? WHERE id = ?').run(novaQuantidade, id);
    return;
  }
  const { error } = await getDb().from('produtos').update({ quantidade: novaQuantidade }).eq('id', id);
  if (error) throw error;
}

async function insertMovimentacao(payload) {
  if (IS_DEV) {
    const { produto_id, quantidade, tipo, usuario } = payload;
    getDb().prepare(
      'INSERT INTO movimentacoes (produto_id, quantidade, tipo, usuario) VALUES (?, ?, ?, ?)'
    ).run(produto_id, quantidade, tipo, usuario || 'Vendedor');
    return;
  }
  const { error } = await getDb().from('movimentacoes').insert([payload]);
  if (error) console.error('Erro ao gravar log:', error);
}

module.exports = { getProdutos, getHistorico, getProdutoById, updateQuantidade, insertMovimentacao };
