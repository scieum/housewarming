-- Supabase SQL Editor에서 한 번 실행하세요.
create table public.rsvps (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 50),
  attending boolean not null,
  transport text check (transport in ('car', 'walk')),
  car_number text check (char_length(car_number) <= 20),
  -- 참석이면 오시는 방법 필수, 불참이면 비움
  check (attending = (transport is not null)),
  -- 차량이면 차량번호 필수, 아니면 비움
  check ((transport = 'car') = (car_number is not null))
);

alter table public.rsvps enable row level security;

-- 초대장(익명 사용자)은 응답을 "쓰기"만 가능. 읽기 정책이 없어서 다른 사람 응답은 조회 불가.
-- 응답 확인은 Supabase 대시보드 Table Editor에서.
create policy "guests can submit rsvp"
  on public.rsvps for insert to anon
  with check (true);
