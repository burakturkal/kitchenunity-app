-- Contact & Communication fields
alter table public.stores
  add column if not exists contact_email   text,
  add column if not exists contact_phone   text,
  add column if not exists website         text,
  add column if not exists reply_to_email  text;
