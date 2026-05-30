-- ═══════════════════════════════════════════════════════════
-- ملف اللاعب العام — صورة من players.image أو مرفقات الاستكمال
-- نفّذ في Supabase SQL Editor (مرة واحدة)
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_player_public_profile(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select
    to_jsonb(p.*)
    || jsonb_build_object(
      'image',
      coalesce(
        nullif(trim(p.image), ''),
        nullif(trim(rc.personal_photo_url), '')
      )
    )
  from public.players p
  left join public.request_completions rc on rc.request_id = p.source_request_id
  where p.id = p_id
    and lower(coalesce(p.status::text, 'active')) in ('active', 'نشط')
  limit 1;
$$;

revoke all on function public.get_player_public_profile(uuid) from public;
grant execute on function public.get_player_public_profile(uuid) to anon, authenticated;
