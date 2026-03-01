-- supabase/migrations/003_seed_locais.sql

INSERT INTO locais (codigo, nome, tipo) VALUES
  ('loja_anapolis',    'Loja Anápolis',    'loja'),
  ('loja_goiania',     'Loja Goiânia',     'loja'),
  ('estoque_anapolis', 'Estoque Anápolis', 'estoque'),
  ('estoque_goiania',  'Estoque Goiânia',  'estoque');
