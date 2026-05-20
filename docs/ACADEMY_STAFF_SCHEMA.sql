-- =====================================================
-- ACADEMY STAFF TABLE (منفّذ في Supabase)
-- أكاديمية المسارحة - جدول الكادر والموظفين
-- =====================================================

create table if not exists public.academy_staff (
    id uuid primary key default gen_random_uuid(),

    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    full_name text not null,
    email text,
    phone text not null,

    national_id text,
    birth_date date,
    nationality text,

    staff_type text not null,
    staff_category text not null,

    qualification text,
    experience_years integer default 0,
    notes text,

    join_request_id uuid,

    status text default 'active'
    check (status in ('active', 'inactive', 'suspended')),

    role text default 'staff'
    check (role in ('staff', 'manager', 'admin')),

    auth_user_id uuid,

    constraint academy_staff_email_unique unique (email),
    constraint academy_staff_phone_unique unique (phone)
);

-- ربط اختياري بطلب الانضمام (نفّذه إن لم يكن موجوداً):
-- alter table public.academy_staff
--   add constraint academy_staff_join_request_fkey
--   foreign key (join_request_id) references public.join_requests(id) on delete set null;

-- =====================================================
-- تعيين الحقول من التطبيق عند اعتماد طلب staff
-- =====================================================
-- staff_type     → معرّف الدور (coach, doctor, security, …)
-- staff_category → معرّف المجال (sports, medical, admin, operations, media_tech)
-- role           → صلاحية النظام (staff | manager | admin) — ليس اسم الوظيفة
-- join_request_id → join_requests.id

create index if not exists idx_academy_staff_type on public.academy_staff(staff_type);
create index if not exists idx_academy_staff_category on public.academy_staff(staff_category);
create index if not exists idx_academy_staff_status on public.academy_staff(status);
create index if not exists idx_academy_staff_join_request on public.academy_staff(join_request_id);
