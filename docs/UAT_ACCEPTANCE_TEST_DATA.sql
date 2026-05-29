-- =====================================================
-- بيانات اختبار اعتماد UAT — نفّذ في Supabase SQL Editor
-- (صلاحيات service role / بدون قيود anon)
-- احذف لاحقاً بالبادئة UAT- من reference_code
-- =====================================================

-- معاينة قبل الإدراج
-- select count(*) from public.join_requests where reference_code like 'UAT-%';

insert into public.join_requests (
  reference_code,
  request_type,
  full_name,
  phone,
  email,
  city,
  status,
  age_category,
  position,
  player_age,
  player_notes,
  guardian_name,
  guardian_phone,
  relationship,
  notes
) values (
  'UAT-PLY-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
  'player',
  'لاعب اختبار اعتماد',
  '0599001234',
  'uat.acceptance@masariha.test',
  'جازان',
  'new',
  'ناشئين',
  'وسط',
  14,
  'طلب UAT — للحذف لاحقاً',
  'ولي اختبار',
  '0582000000',
  'أب',
  'صلة ولي الأمر: أب | اختبار اعتماد'
);

insert into public.join_requests (
  reference_code,
  request_type,
  full_name,
  phone,
  email,
  city,
  status,
  notes
) values (
  'UAT-MEM-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
  'academy_member',
  'عضو متابعة UAT',
  '0599001235',
  'uat.acceptance@masariha.test',
  'جازان',
  'new',
  'الاهتمامات: أخبار، فعاليات'
);

-- تحقق RPC (استبدل المرجع والجوال بالقيم من آخر إدراج)
/*
select * from public.lookup_join_request_by_ref_phone(
  'UAT-PLY-20260528-173000',
  '0599001234'
);

select * from public.lookup_join_requests_by_contact(
  '0599001234',
  'uat.acceptance@masariha.test'
);
*/

-- حذف بيانات UAT (بعد الانتهاء)
-- delete from public.request_completions
-- where request_id in (select id from public.join_requests where reference_code like 'UAT-%');
-- delete from public.join_requests where reference_code like 'UAT-%';
