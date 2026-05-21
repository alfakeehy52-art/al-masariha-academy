-- =====================================================
-- إحصائيات عامة (C1c) — RPC آمنة من players + matches
-- نفّذ في Supabase SQL Editor (بعد NEWS_MEDIA_RLS.sql)
-- مهم: نفّذ الملف كاملاً من السطر 1 (أولاً أعمدة players ثم الدوال)
-- =====================================================

-- ─── الخطوة 1: أعمدة إحصائيات اللاعب (شغّلها قبل الدوال) ───
alter table public.players add column if not exists goals integer not null default 0;
alter table public.players add column if not exists assists integer not null default 0;
alter table public.players add column if not exists matches_played integer not null default 0;
alter table public.players add column if not exists avg_rate numeric;

create or replace function public.get_academy_stats_summary_public()
returns table (
  total_goals bigint,
  total_matches bigint,
  total_players bigint,
  active_scorers bigint,
  top_scorer_name text,
  top_scorer_goals integer,
  top_assist_name text,
  top_assist_value integer
)
language sql
security definer
set search_path = public
stable
as $$
  with active_players as (
    select
      p.id,
      p.full_name,
      coalesce(p.goals, 0) as goals,
      coalesce(p.assists, 0) as assists
    from public.players p
    where coalesce(p.status, '') in ('active', 'نشط', 'مكتمل')
  ),
  top_goal as (
    select full_name, goals
    from active_players
    order by goals desc, full_name asc nulls last
    limit 1
  ),
  top_ast as (
    select full_name, assists
    from active_players
    order by assists desc, full_name asc nulls last
    limit 1
  )
  select
    coalesce((select sum(goals) from active_players), 0)::bigint as total_goals,
    coalesce((
      select count(*)::bigint
      from public.matches m
      where m.status = 'finished'
    ), 0) as total_matches,
    coalesce((select count(*)::bigint from active_players), 0) as total_players,
    coalesce((select count(*)::bigint from active_players where goals > 0), 0) as active_scorers,
    (select full_name from top_goal) as top_scorer_name,
    coalesce((select goals from top_goal), 0) as top_scorer_goals,
    (select full_name from top_ast) as top_assist_name,
    coalesce((select assists from top_ast), 0) as top_assist_value;
$$;

create or replace function public.list_player_leaderboard_public(p_metric text default 'goals')
returns table (
  player_id uuid,
  full_name text,
  player_position text,
  metric_value integer,
  rank_order bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with active_players as (
    select
      p.id,
      p.full_name,
      p."position",
      coalesce(p.goals, 0) as goals,
      coalesce(p.assists, 0) as assists,
      coalesce(p.matches_played, 0) as matches_played,
      coalesce(p.avg_rate, 0)::numeric as avg_rate
    from public.players p
    where coalesce(p.status, '') in ('active', 'نشط', 'مكتمل')
  ),
  ranked as (
    select
      ap.id as player_id,
      ap.full_name,
      ap."position" as player_position,
      case lower(trim(coalesce(p_metric, 'goals')))
        when 'assists' then ap.assists
        when 'matches' then ap.matches_played
        when 'rating' then round(ap.avg_rate)::integer
        else ap.goals
      end as metric_value,
      row_number() over (
        order by
          case lower(trim(coalesce(p_metric, 'goals')))
            when 'assists' then ap.assists
            when 'matches' then ap.matches_played
            when 'rating' then ap.avg_rate
            else ap.goals
          end desc,
          ap.full_name asc nulls last
      ) as rank_order
    from active_players ap
  )
  select player_id, full_name, player_position, metric_value, rank_order
  from ranked
  where metric_value > 0
  order by rank_order
  limit 10;
$$;

revoke all on function public.get_academy_stats_summary_public() from public;
grant execute on function public.get_academy_stats_summary_public() to anon, authenticated;
revoke all on function public.list_player_leaderboard_public(text) from public;
grant execute on function public.list_player_leaderboard_public(text) to anon, authenticated;
