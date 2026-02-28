-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  categoria TEXT,
  quantidade INT DEFAULT 0,
  minimo_estoque INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Movimentação
CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id),
  tipo TEXT CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  quantidade INT NOT NULL,
  usuario TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserindo alguns exemplos de teste (Colchões Ortobom)
INSERT INTO produtos (nome, sku, categoria, quantidade) VALUES
('Colchão Liberty Casal', 'LIB-001', 'Colchão', 10),
('Base Sommier Preta 138x188', 'BAS-001', 'Base', 5),
('Travesseiro Real Soft', 'TRV-001', 'Travesseiro', 20);
