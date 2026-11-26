// 응답 현황: 주소를 아는 사람은 누구나 볼 수 있음 (supabase/public-read.sql)
const $ = (id) => document.getElementById(id);

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
    const time = el('time', 'response-row__time', formatTime(r.created_at));
    time.dateTime = r.created_at;
    li.append(left, time);
    return li;
  }));
  $('response-empty').hidden = rows.length > 0;

  $('loading').hidden = true;
  $('view-dashboard').hidden = false;
}

async function load() {
  const res = await fetch(`${window.SUPABASE_URL}/rest/v1/rsvps?select=*&order=created_at.desc`, {
    headers: { apikey: window.SUPABASE_KEY, Authorization: `Bearer ${window.SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`불러오기 실패 (${res.status})`);
  renderDashboard(await res.json());
}

load().catch((err) => {
  console.error(err);
  $('loading').hidden = true;
  $('load-error').textContent = '응답을 불러오지 못했어요. 새로고침해주세요.';
  $('load-error').hidden = false;
});
