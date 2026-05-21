-- الخطوة 1 فقط — نفّذ قبل دوال ACADEMY_STATS_RLS.sql
-- إذا ظهر: column p.matches_played does not exist → شغّل هذا الملف أولاً

alter table public.players add column if not exists goals integer not null default 0;
alter table public.players add column if not exists assists integer not null default 0;
alter table public.players add column if not exists matches_played integer not null default 0;
alter table public.players add column if not exists avg_rate numeric;
