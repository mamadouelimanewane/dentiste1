-- Stocks (remplace le tableau statique d'InventoryManager.tsx) et
-- Labo & CFAO (remplace les travaux fictifs de ProstheticsLab.tsx).

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  ref text,
  name text not null,
  category text not null default 'Divers',
  quantity int not null default 0,
  min_threshold int not null default 0,
  unit_price numeric(12, 0) not null default 0,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Stock de départ réel (remplace les 5 lignes codées en dur du composant).
insert into inventory_items (ref, name, category, quantity, min_threshold, unit_price) values
  ('GLV-NIT-M', 'Gants Nitrile Taille M (boîte)', 'EPI', 12, 20, 3500),
  ('CMP-A2-SYR', 'Résine Composite A2 (seringue)', 'Restauration', 45, 10, 15000),
  ('IMP-T4010', 'Implant Titane Ø4.0 x 10mm', 'Chirurgie', 2, 5, 45000),
  ('NDL-30G-S', 'Aiguilles Anesthésie 30G (boîte 100)', 'Anesthésie', 150, 50, 8000),
  ('CEM-GI-01', 'Ciment Scellement Verre Ionomère', 'Prothèse', 0, 5, 12000);

create type lab_order_status as enum ('production', 'shipped', 'completed');

create table lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  act_label text not null,
  teinte text,
  lab_name text not null,
  status lab_order_status not null default 'production',
  expected_delivery date,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lab_orders_patient_idx on lab_orders (patient_id);
