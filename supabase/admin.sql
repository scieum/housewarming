-- 응답 현황 페이지(/responses)용. schema.sql 실행 후 Supabase SQL Editor에서 한 번 실행하세요.

-- 응답을 볼 수 있는 계정 목록. 이메일 대신 계정 ID로 저장해서 이 파일에 개인정보가 남지 않아요.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

-- 로그인한 사람은 "내가 관리자인지"만 확인 가능
create policy "admins can check themselves"
  on public.admins for select to authenticated
  using (user_id = auth.uid());

-- 관리자로 등록된 계정만 응답을 읽을 수 있음 (손님은 여전히 쓰기만 가능)
create policy "admins can read rsvps"
  on public.rsvps for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ▼ /responses 에서 내 이메일로 한 번 로그인한 "뒤에", 이메일을 바꿔서 이 줄만 따로 실행하세요.
-- insert into public.admins (user_id) select id from auth.users where email = '내이메일@example.com';
