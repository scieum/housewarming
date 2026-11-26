-- 응답 현황(/responses)을 로그인 없이 누구나 볼 수 있게 함. Supabase SQL Editor에서 한 번 실행하세요.
-- 주의: 이 사이트 주소를 아는 사람은 이름·참석 여부·차량번호를 볼 수 있어요.
create policy "anyone can read rsvps"
  on public.rsvps for select to anon
  using (true);

-- 다시 나만 보게 되돌리려면:
-- drop policy "anyone can read rsvps" on public.rsvps;
