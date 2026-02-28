const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'homolog.db');
const schemaPath = path.join(__dirname, 'sqlite-schema.sql');

const db = new Database(dbPath);
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

const produtos = [
  { nome: 'Colchão Ortobom Orion Casal', sku: 'COL-ORI-CAL', quantidade: 8, minimo_estoque: 3 },
  { nome: 'Colchão Ortobom Orion Solteiro', sku: 'COL-ORI-SOL', quantidade: 12, minimo_estoque: 5 },
  { nome: 'Colchão Ortobom Molas Casal', sku: 'COL-MOL-CAL', quantidade: 4, minimo_estoque: 3 },
  { nome: 'Colchão Ortobom Molas Queen', sku: 'COL-MOL-QUE', quantidade: 2, minimo_estoque: 3 },
  { nome: 'Box Ortobom Casal', sku: 'BOX-CAL-001', quantidade: 6, minimo_estoque: 2 },
  { nome: 'Box Ortobom Solteiro', sku: 'BOX-SOL-001', quantidade: 10, minimo_estoque: 4 },
  { nome: 'Travesseiro Ortobom Premium', sku: 'TRV-PRE-001', quantidade: 20, minimo_estoque: 8 },
  { nome: 'Travesseiro Ortobom Látex', sku: 'TRV-LAT-001', quantidade: 15, minimo_estoque: 6 },
  { nome: 'Protetor de Colchão Casal', sku: 'PRO-CAL-001', quantidade: 9, minimo_estoque: 4 },
  { nome: 'Protetor de Colchão Solteiro', sku: 'PRO-SOL-001', quantidade: 7, minimo_estoque: 3 },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO produtos (nome, sku, quantidade, minimo_estoque) VALUES (?, ?, ?, ?)'
);

const insertMany = db.transaction((items) => {
  for (const p of items) insert.run(p.nome, p.sku, p.quantidade, p.minimo_estoque);
});

insertMany(produtos);
console.log('Seed OK - ' + produtos.length + ' produtos inseridos em ' + dbPath);
db.close();
