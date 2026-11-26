// 호스트 전용 응답 현황. 읽기 권한은 DB(RLS)가 막고, 이 화면은 보여주기만 함 (supabase/admin.sql).
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
const VIEWS = ['view-login', 'view-denied', 'view-dashboard'];

function show(view) {
  $('loading').hidden = true;
  VIEWS.forEach((v) => { $(v).hidden = v !== view; });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text; // 응답 내용은 항상 textContent로 넣음
  return node;
}

function formatTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderDashboard(rows) {
  const yes = rows.filter((r) => r.attending);
  const cars = yes.filter((r) => r.transport === 'car');
  $('stat-yes').textContent = `${yes.length}명`;
  $('stat-no').textContent = `${rows.length - yes.length}명`;
  $('stat-car').textContent = `${cars.length}대`;

  $('plate-count').textContent = cars.length;
  $('plate-list').replaceChildren(...cars.map((r) => {
    const li = el('li', 'plate-row');
    li.append(el('span', 'plate-row__plate', r.car_number), el('span', 'plate-row__name', r.name));
    return li;
  }));
  $('plate-list').hidden = cars.length === 0;
  $('plate-empty').hidden = cars.length > 0;

  $('total-count').textContent = rows.length;
  $('response-list').replaceChildren(...rows.map((r) => {
    const li = el('li', 'response-row');
    const left = el('div', 'response-row__main');
    const top = el('p', 'response-row__top');
    top.append(el('span', 'response-row__name', r.name), el('span', r.attending ? 'badge' : 'badge badge--muted', r.attending ? '참석' : '불참'));
    left.append(top);
    if (r.attending) left.append(el('p', 'response-row__sub', r.transport === 'car' ? `차량 · ${r.car_number}` : '도보'));
    li.append(left, el('time', 'response-row__time', formatTime(r.created_at)));
    li.lastChild.dateTime = r.created_at;
    return li;
  }));
  $('response-empty').hidden = rows.length > 0;
  show('view-dashboard');
}

async function render() {
  $('load-error').hidden = true;
  const { data: { session } } = await sb.auth.getSession();
  $('logout').hidden = !session;
  if (!session) return show('view-login');

  const { data: admin, error: adminErr } = await sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
  if (adminErr) return fail(adminErr);
  if (!admin) return show('view-denied');

  const { data, error } = await sb.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) return fail(error);
  renderDashboard(data);
}

function fail(err) {
  console.error(err);
  $('loading').hidden = true;
  $('load-error').textContent = '응답을 불러오지 못했어요. 새로고침해주세요.';
  $('load-error').hidden = false;
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim();
  const btn = $('login-submit');
  $('login-error').hidden = true;
  $('login-sent').hidden = true;
  if (!$('email').checkValidity() || !email) {
    $('login-error').textContent = '이메일 주소를 확인해주세요.';
    $('login-error').hidden = false;
    $('email').focus();
    return;
  }
  btn.disabled = true;
  btn.textContent = '보내는 중…';
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  btn.disabled = false;
  btn.textContent = '로그인 링크 받기';
  if (error) {
    console.error(error);
    $('login-error').textContent = '링크를 보내지 못했어요. 잠시 후 다시 시도해주세요.';
    $('login-error').hidden = false;
    return;
  }
  $('login-sent').hidden = false;
});

$('logout').addEventListener('click', () => sb.auth.signOut());

// 콜백 안에서 바로 supabase를 await하면 멈출 수 있어서 다음 틱에 실행
sb.auth.onAuthStateChange(() => setTimeout(() => render().catch(fail), 0));
