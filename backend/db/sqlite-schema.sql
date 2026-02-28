CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  quantidade INTEGER NOT NULL DEFAULT 0,
  minimo_estoque INTEGER NOT NULL DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  produto_id TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('ENTRADA', 'SAIDA')),
  usuario TEXT NOT NULL DEFAULT 'Vendedor',
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);
