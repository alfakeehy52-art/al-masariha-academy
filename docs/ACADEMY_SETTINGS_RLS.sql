-- =====================================================
-- إعدادات الأكاديمية (صف واحد) — قراءة عامة + تعديل الإدارة
-- نفّذ في Supabase SQL Editor
-- =====================================================

create table if not exists public.academy_settings (
  id text primary key default 'default',
  brand_name_ar text not null default 'أكاديمية المسارحة',
  brand_subtitle_ar text default 'لكرة القدم',
  tagline text default 'نطوّر المواهب ونصنع مستقبل اللاعبين',
  location_text text default 'المسارحة - السعودية',
  contact_email text default 'info@masariha-academy.com',
  contact_phone text default '',
  contact_hours text default 'يوميًا من 4:00 مساءً حتى 10:00 مساءً',
  whatsapp_url text default '',
  instagram_url text default '',
  twitter_handle text default '@masariha_academy',
  logo_url text default 'academy-logo.svg',
  hero_heading_1 text default 'أكاديمية',
  hero_heading_highlight text default 'المسارحة',
  hero_heading_2 text default 'لكرة القدم',
  hero_description text default 'انضم للأكاديمية، تابع اللاعبين والمدربين من قاعدة البيانات، وقدّم طلبك بخطوات واضحة.',
  hero_image_url text default '',
  about_snippet text default 'أكاديمية المسارحة لكرة القدم تهدف إلى تطوير مهارات اللاعبين وصناعة جيل مميز من المواهب الكروية.',
  footer_copyright text default '© أكاديمية المسارحة لكرة القدم - جميع الحقوق محفوظة',
  color_gold text default '#d5b15a',
  color_green text default '#0d6c48',
  show_store boolean not null default true,
  show_media boolean not null default true,
  show_news boolean not null default true,
  nav_show_track_join boolean not null default true,
  nav_show_track_store boolean not null default true,
  nav_show_admin_login boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.academy_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.academy_settings enable row level security;

drop policy if exists academy_settings_public_select on public.academy_settings;
create policy academy_settings_public_select on public.academy_settings
  for select to anon, authenticated
  using (id = 'default');

drop policy if exists admin_manage_academy_settings on public.academy_settings;
create policy admin_manage_academy_settings on public.academy_settings
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- تحقق:
-- select brand_name_ar, contact_email, show_store from public.academy_settings where id = 'default';
