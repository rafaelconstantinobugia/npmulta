/*
  # Create app configuration table

  1. New Tables
    - `app_config`
      - `id` (text, primary key) - Configuration key
      - `value` (jsonb) - Configuration value
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `app_config` table
    - Add policy for staff users to manage configurations
*/

create table public.app_config (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Enable row-level-security
alter table app_config enable row level security;

-- Policy: only service role or users with 'staff' claim can manage configs
create policy "Staff can manage configs"
  on app_config
  for all
  using (auth.role() = 'service_role' or auth.jwt() ->> 'role' = 'staff');

-- Insert default configurations
insert into app_config (id, value) values
  ('default_arguments', '{
    "speeding": "O equipamento de medição não apresentava certificado de calibração válido.",
    "parking": "A sinalização no local não cumpria os requisitos legais estabelecidos."
  }'::jsonb),
  ('signature_block', '"Atentamente,\n{{userName}}\n"'::jsonb),
  ('features', '{
    "tts": false,
    "digitalSign": false
  }'::jsonb);