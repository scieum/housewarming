// 지역명(선택) + 2~3자리 숫자 + 한글 1자 + 4자리 숫자. 예: 12가3456, 123가4567, 서울12가3456
const PLATE_RE = /^([가-힣]{2})?\d{2,3}[가-힣]\d{4}$/;
function isValidPlate(value) {
  return PLATE_RE.test(String(value).replace(/\s/g, ''));
}

if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  const form = $('rsvp-form');
  const els = form.elements;

  // Supabase REST API로 rsvps 테이블에 한 줄 추가 (스키마: supabase/schema.sql)
  async function saveRsvp(row) {
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) throw new Error('config.js에 Supabase 설정이 없어요');
    const res = await fetch(`${window.SUPABASE_URL}/rest/v1/rsvps`, {
      method: 'POST',
      headers: {
        apikey: window.SUPABASE_KEY,
        Authorization: `Bearer ${window.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(`저장 실패 (${res.status})`);
  }

  const LABELS = { yes: '참석', no: '불참', car: '차량', walk: '도보' };

  function sync() {
    const attending = els.attendance.value === 'yes';
    $('field-transport').hidden = !attending;
    $('field-plate').hidden = !(attending && els.transport.value === 'car');
  }

  function setError(name, message) {
    const err = $('error-' + name);
    err.textContent = message || '';
    err.hidden = !message;
    const target = name === 'name' || name === 'plate' ? $(name) : $('field-' + name);
    if (message) target.setAttribute('aria-invalid', 'true');
    else target.removeAttribute('aria-invalid');
  }

  function validate() {
    const errors = {};
    if (!els.name.value.trim()) errors.name = '이름을 입력해주세요.';
    if (!els.attendance.value) errors.attendance = '참석 여부를 선택해주세요.';
    if (els.attendance.value === 'yes') {
      if (!els.transport.value) errors.transport = '오시는 방법을 선택해주세요.';
      else if (els.transport.value === 'car') {
        if (!els.plate.value.trim()) errors.plate = '차량번호를 입력해주세요.';
        else if (!isValidPlate(els.plate.value)) errors.plate = '차량번호 형식을 확인해주세요. 예) 12가 3456';
      }
    }
    return errors;
  }

  form.addEventListener('change', (e) => {
    sync();
    if (e.target.name) setError(e.target.name, '');
  });
  form.addEventListener('input', (e) => {
    if (e.target.name === 'name' || e.target.name === 'plate') setError(e.target.name, '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ($('submit').disabled) return;
    const errors = validate();
    const order = ['name', 'attendance', 'transport', 'plate'];
    order.forEach((n) => setError(n, errors[n]));
    const first = order.find((n) => errors[n]);
    if (first) {
      const focusTarget = first === 'name' || first === 'plate' ? $(first) : form.querySelector(`input[name="${first}"]`);
      focusTarget.focus();
      return;
    }

    const attending = els.attendance.value === 'yes';
    const isCar = attending && els.transport.value === 'car';
    const submitBtn = $('submit');
    const submitErr = $('error-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';
    submitErr.hidden = true;
    try {
      await saveRsvp({
        name: els.name.value.trim(),
        attending,
        transport: attending ? els.transport.value : null,
        car_number: isCar ? els.plate.value.trim() : null,
      });
    } catch (err) {
      console.error(err);
      submitErr.textContent = '응답을 보내지 못했어요. 잠시 후 다시 시도해주세요.';
      submitErr.hidden = false;
      return;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '참석 여부 보내기';
    }

    const rows =[['이름', els.name.value.trim()], ['참석 여부', LABELS[els.attendance.value]]];
    if (attending) rows.push(['오시는 방법', LABELS[els.transport.value]]);
    if (isCar) rows.push(['차량번호', els.plate.value.trim()]);

    const summary = $('summary');
    summary.replaceChildren(...rows.map(([k, v]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v; // textContent라 사용자 입력이 HTML로 해석되지 않음
      row.append(dt, dd);
      return row;
    }));
    $('done-desc').textContent = attending ? '12월 1일에 만나요! 조심히 오세요.' : '알려주셔서 감사합니다. 다음에 꼭 만나요.';

    form.hidden = true;
    $('rsvp-done').hidden = false;
    $('rsvp-done').focus();
  });

  $('back-to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sync();
}
