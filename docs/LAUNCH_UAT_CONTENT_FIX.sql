-- ═══════════════════════════════════════════════════════════
-- إصلاح محتوى الإطلاق (5–7) — نفّذ في Supabase → SQL Editor
-- الواجهة العامة تخفي خبر «اختبار» مؤقتاً؛ هذا يحذفه من القاعدة.
-- ═══════════════════════════════════════════════════════════

-- 6) حذف خبر تجريبي منشور
DELETE FROM public.academy_news
WHERE id = '400c7fef-b72f-4352-b1ef-014da123e22a'::uuid
   OR trim(title) = 'اختبار';

-- استبعاد «اختبار» من RPC العامة (بعد الحذف يبقى احتياطاً)
CREATE OR REPLACE FUNCTION public.list_news_public()
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  body text,
  category text,
  emoji text,
  image_url text,
  published_at timestamptz,
  is_featured boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    n.id,
    n.title,
    n.summary,
    n.body,
    n.category,
    n.emoji,
    n.image_url,
    n.published_at,
    n.is_featured,
    n.created_at
  FROM public.academy_news n
  WHERE n.status = 'published'
    AND trim(coalesce(n.title, '')) <> 'اختبار'
  ORDER BY n.is_featured DESC, n.published_at DESC NULLS LAST, n.created_at DESC;
$$;

-- 7) منتج متجر منشور — «كرات تدريب الأكاديمية» منشورة بالفعل.
-- (اختياري) نشر الطقم المميز أيضاً:
/*
UPDATE public.store_products
SET status = 'published', updated_at = now()
WHERE id = '23aef5bd-d31c-4439-b124-c20c9804e958'::uuid
  AND status = 'coming_soon';
*/
