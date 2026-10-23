// CodeCoach 프로토타입: 화면 이동과 상호작용을 샘플 데이터로 보여 준다. 실제 AI 분석은 하지 않는다.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const store = {
  get(k, d) { try { const v = sessionStorage.getItem('cc.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { sessionStorage.setItem('cc.' + k, JSON.stringify(v)); } catch {} },
};
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- 공통: 상단 바와 결과 탭 ----------
function header(active) {
  const el = document.createElement('header');
  el.className = 'top';
  el.innerHTML = `<a class="logo" href="index.html">Code<b>Coach</b></a>
  <nav class="nav"><a href="index.html" class="${active === 'new' ? 'on' : ''}">새 분석</a><a href="result.html" class="${active === 'history' ? 'on' : ''}">분석 결과</a><a href="spec/" >화면 설계서</a></nav>
  <div class="user"><span class="av"></span><span>인태</span></div>`;
  document.body.prepend(el);
}
function tabs(active) {
  const list = [['result.html', '요약'], ['tests.html', '단위 테스트'], ['issues.html', '보완점·단점'], ['alternatives.html', '대안 비교'], ['coach.html', '코칭']];
  return `<nav class="tabs">${list.map(([h, t]) => `<a href="${h}" class="${h === active ? 'on' : ''}">${t}</a>`).join('')}</nav>`;
}

// ---------- 샘플 데이터 ----------
const SAMPLE_CODE = `// crawler/normalize.ts
export function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hash = '';
  for (const p of ['utm_source', 'utm_medium']) u.searchParams.delete(p);
  return u.toString().replace(/\\/$/, '');
}

// crawler/safety.ts
export function isDangerous(el: { text: string }): boolean {
  return el.text.includes('삭제') || el.text.includes('로그아웃');
}`;

const TESTS = [
  { name: '해시 제거', req: 'F-11', ok: true },
  { name: '쿼리 순서 정규화', req: 'F-11', ok: false, expect: '?a=1&b=2 와 ?b=2&a=1 → 같은 URL', actual: '서로 다른 URL로 판단', cause: '코드 결함', code: `it('F-11 쿼리 순서가 달라도 같은 URL', () => {\n  expect(normalizeUrl('https://a.com/?b=2&a=1'))\n    .toBe(normalizeUrl('https://a.com/?a=1&b=2'));\n});`, fix: 1 },
  { name: '같은 도메인만 방문', req: 'F-10', ok: true },
  { name: '로그아웃 링크 차단', req: 'F-17', ok: false, expect: 'aria-label="로그아웃" 아이콘 버튼 → 위험', actual: '안전한 링크로 판단', cause: '코드 결함', code: `it('F-17 아이콘 버튼도 위험 판정', () => {\n  expect(isDangerous({ text: '', ariaLabel: '로그아웃' })).toBe(true);\n});`, fix: 0 },
  { name: '템플릿 묶기', req: 'F-14', ok: true },
  { name: '기본값 30페이지', req: 'F-03', ok: false, expect: '옵션 없이 실행하면 maxPages = 30', actual: 'maxPages = 50', cause: '코드 결함', code: `it('F-03 기본 최대 페이지 수는 30', () => {\n  expect(defaults.maxPages).toBe(30);\n});`, fix: 4 },
  { name: '지연 1초 적용', req: 'F-12', ok: true },
  { name: '끝 슬래시 통일', req: 'F-11', ok: true },
  { name: 'mailto 링크 제외', req: 'F-10', ok: true },
];

const ISSUES = [
  { sev: 'high', kind: '단점', title: '위험 링크 판정이 아이콘 버튼을 놓침', loc: 'safety.ts:2', what: '글자 없이 휴지통 아이콘만 있는 삭제 버튼은 "삭제"라는 글자가 없어 안전한 링크로 판단됩니다.', when: '관리자 화면에서 아이콘 버튼을 눌러 실제 데이터가 지워질 수 있습니다.', diff: `- return el.text.includes('삭제') || ...\n+ const label = [el.text, el.ariaLabel, el.title].join(' ');\n+ return DANGER.test(label);` },
  { sev: 'high', kind: '단점', title: '페이지 하나 오류에 전체 중단', loc: 'crawler.ts:88', what: '한 페이지에서 시간 초과가 나면 예외가 위로 올라가 전체 탐색이 멈춥니다.', when: '느린 페이지가 하나만 있어도 결과가 하나도 남지 않습니다.', diff: `+ try { await visit(url); }\n+ catch (e) { failures.push({ url, reason: e.message }); }` },
  { sev: 'medium', kind: '보완점', title: 'robots.txt 확인 없음', loc: '해당 코드 없음', what: '요구사항 F-12는 robots.txt를 지키라고 하지만 확인하는 코드가 없습니다.', when: '수집을 금지한 경로까지 방문해 대상 사이트에 부담을 줍니다.', diff: `+ const robots = await loadRobots(origin);\n+ if (!robots.isAllowed(url)) continue;` },
  { sev: 'medium', kind: '보완점', title: '동시성 제한 2 미적용', loc: 'crawler.ts:15', what: '요구사항은 동시에 2개까지만 요청하라고 하지만 지금은 제한이 없습니다.', when: '큰 사이트에서 요청이 몰려 차단될 수 있습니다.', diff: `+ const limit = pLimit(options.concurrency ?? 2);` },
  { sev: 'medium', kind: '보완점', title: '요구사항 F-03 테스트 없음', loc: 'config.ts', what: '기본 옵션 값을 검증하는 테스트가 하나도 없습니다.', when: '기본값이 바뀌어도 알아차리지 못합니다.', diff: `+ it('F-03 기본값', () => expect(defaults).toMatchObject({ maxPages: 30, depth: 3 }));` },
  { sev: 'low', kind: '단점', title: '기본값이 여러 파일에 흩어짐', loc: 'config.ts', what: '30, 3 같은 기본값이 세 파일에 따로 적혀 있습니다.', when: '한 곳만 고치면 값이 서로 달라집니다.', diff: `+ export const DEFAULTS = { maxPages: 30, depth: 3 } as const;` },
];

const ALTS = [
  { topic: '크롤링: 직접 구현 vs Crawlee', cur: '직접 만든 BFS 큐', alt: 'Crawlee', rows: [['기능적 장점', '코드가 짧고 동작을 전부 이해하기 쉽다', '재시도, 동시성 제한, 중단 후 이어하기를 기본 제공'], ['관련 요구사항', 'F-10, F-11', 'F-12, 안정성(이어하기)'], ['바꾸는 비용', '-', '크롤러 모듈 교체, 의존성 약 15MB 추가']], bench: [['지금 코드', 48, 80], ['Crawlee', 31, 52]], unit: '초 (같은 사이트 20페이지)', reco: '부분 도입', why: '요청 큐와 재시도만 Crawlee로 바꾸고, URL 정규화와 위험 링크 판정은 지금 코드를 유지하세요.' },
  { topic: '요소 추출: DOM vs ARIA', cur: 'querySelectorAll로 DOM 순회', alt: 'ariaSnapshot(접근성 트리)', rows: [['기능적 장점', '좌표(bbox)를 바로 얻는다', '버튼·링크의 역할과 이름을 정확히 얻어 아이콘 버튼도 잡는다'], ['관련 요구사항', 'F-32', 'F-32, F-35, F-17'], ['바꾸는 비용', '-', '좌표는 따로 구해 합쳐야 함']], bench: [['지금 코드', 41, 68], ['ARIA', 52, 87]], unit: '개 (찾은 대화형 요소 수)', reco: '부분 도입', why: '위험 링크 판정에는 ARIA 이름을 함께 쓰고, 좌표 추출은 DOM 방식을 유지하세요.' },
  { topic: '렌더링: 문자열 vs Handlebars', cur: '템플릿 문자열', alt: 'Handlebars', rows: [['기능적 장점', '의존성이 없다', '자동 이스케이프로 스크립트 주입을 막고 템플릿을 분리'], ['관련 요구사항', 'F-50', 'F-50, 보안'], ['바꾸는 비용', '-', '템플릿 파일 3개로 옮기기']], bench: [], unit: '', reco: '유지', why: '지금 규모에서는 이스케이프 함수 하나를 추가하는 것으로 충분합니다.' },
];

const COACH_DEFAULT = [
  { t: '위험 링크 판정에 aria-label 포함', tag: 'high', done: true },
  { t: '쿼리 파라미터 정렬 후 비교', tag: 'high', done: false },
  { t: '페이지 오류는 건너뛰고 계속', tag: 'high', done: false },
  { t: 'robots.txt 확인 추가', tag: 'medium', done: false },
  { t: '요청 큐를 Crawlee로 교체', tag: '대안', done: false },
];
const sevChip = (s) => `<span class="chip ${s === 'high' ? 'c-red' : s === 'medium' ? 'c-amber' : s === '대안' ? 'c-blue' : 'c-gray'}">${esc(s)}</span>`;
const coachList = () => store.get('coach', COACH_DEFAULT);

// ---------- SCR-01 코드 제출 ----------
function pageSubmit() {
  header('new');
  const code = $('#code'), start = $('#start');
  code.value = store.get('code', SAMPLE_CODE);
  let mode = 'paste';
  const panes = { paste: $('#pane-paste'), file: $('#pane-file'), git: $('#pane-git') };
  const ready = () => {
    const ok = mode === 'paste' ? code.value.trim() : mode === 'file' ? $('#file').files.length : /^https:\/\/github\.com\/.+\/.+/.test($('#repo').value.trim());
    const any = $$('input[name=item]:checked').length;
    start.disabled = !(ok && any);
    $('#hint').textContent = !any ? '분석 항목을 하나 이상 고르세요' : !ok ? '분석할 코드를 넣어 주세요' : '';
  };
  $$('#modes button').forEach((b) => b.onclick = () => {
    mode = b.dataset.mode;
    $$('#modes button').forEach((x) => x.classList.toggle('on', x === b));
    Object.entries(panes).forEach(([k, el]) => el.hidden = k !== mode);
    ready();
  });
  $$('#depth button').forEach((b) => b.onclick = () => $$('#depth button').forEach((x) => x.classList.toggle('on', x === b)));
  [code, $('#file'), $('#repo')].forEach((el) => el.addEventListener('input', ready));
  $('#file').addEventListener('change', () => { $('#filelist').textContent = [...$('#file').files].map((f) => f.name).join(', ') || '선택된 파일 없음'; ready(); });
  $$('input[name=item]').forEach((el) => el.addEventListener('change', ready));
  $('#sample').onclick = () => { code.value = SAMPLE_CODE; ready(); toast('예시 코드를 넣었습니다'); };
  start.onclick = () => {
    if (/(sk-[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{10,}|api[_-]?key\s*[:=])/i.test(code.value) && !confirm('비밀 키처럼 보이는 값이 있습니다. 가리지 않고 분석할까요?')) return;
    store.set('code', code.value);
    store.set('items', $$('input[name=item]:checked').map((i) => i.value));
    store.set('depth', $('#depth .on').textContent);
    location.href = 'progress.html';
  };
  ready();
}

// ---------- SCR-02 분석 진행 ----------
function pageProgress() {
  header('new');
  const steps = [['코드 이해', '모듈 5개, 함수 23개 파악'], ['단위 테스트', '테스트 9개 작성, 실행 완료'], ['보완점', '요구사항 12개 대조 완료'], ['대안 비교', '라이브러리 3개 검토 완료'], ['단점 분석', '지적 6건 정리 완료']];
  const logs = ['코드 구조를 읽고 있습니다', '모듈 5개, 함수 23개를 찾았습니다', '요구사항별 단위 테스트 9개를 만들었습니다', '테스트 실행: 9개 중 6개 통과, 3개 실패', '실패: F-11 쿼리 순서가 다르면 다른 URL로 판단', '보완점 분석: 요구사항 문서의 기능 12개 대조', '대안 비교: 직접 만든 크롤러 vs Crawlee 실험', '단점 분석: 위험 링크 판정과 예외 처리 점검', '분석이 끝났습니다. 결과 화면으로 이동합니다'];
  $('#steps').innerHTML = steps.map(([t], i) => `<div class="panel step" id="st${i}"><span class="chip c-gray">대기</span><h2 style="margin:10px 0 2px">${i + 1}. ${t}</h2><div class="muted small">곧 시작</div></div>`).join('');
  let n = 0, cancelled = false;
  const total = logs.length;
  const tick = () => {
    if (cancelled) return;
    const pct = Math.round(((n + 1) / total) * 100);
    $('#pct').textContent = pct + '%'; $('#bar').style.width = pct + '%';
    const t = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    $('#log').textContent += `[${t}] ${logs[n]}\n`; $('#log').scrollTop = 1e9;
    const cur = Math.min(4, Math.floor((n / (total - 1)) * 5));
    steps.forEach(([, done], i) => {
      const el = $('#st' + i), chip = el.querySelector('.chip'), m = el.querySelector('.muted');
      const isDone = i < cur || pct === 100, isNow = i === cur && pct < 100 || (i === 3 && cur === 2 && pct < 100);
      chip.className = 'chip ' + (isDone ? 'c-green' : isNow ? 'c-blue' : 'c-gray');
      chip.textContent = isDone ? '완료' : isNow ? '진행 중' : '대기';
      m.textContent = isDone ? done : isNow ? '분석 중…' : '곧 시작';
      el.classList.toggle('active', isNow && !isDone);
    });
    n++;
    if (n < total) setTimeout(tick, 700);
    else setTimeout(() => { if (!cancelled) location.href = 'result.html'; }, 900);
  };
  $('#file').textContent = (store.get('code', SAMPLE_CODE).split('\n')[0].replace(/^\/\/\s*/, '') || '붙여넣은 코드') + ' · 분석 깊이 ' + store.get('depth', '보통');
  $('#cancel').onclick = () => { if (confirm('분석을 취소할까요?')) { cancelled = true; location.href = 'index.html'; } };
  $('#notify').onclick = (e) => { e.target.textContent = '완료되면 알려 드릴게요 ✓'; e.target.disabled = true; };
  tick();
}

// ---------- SCR-03 결과 요약 ----------
function pageResult() {
  header('history');
  $('#tabs').innerHTML = tabs('result.html');
  const fail = TESTS.filter((t) => !t.ok).length, pass = TESTS.length - fail;
  const gaps = ISSUES.filter((i) => i.kind === '보완점').length, high = ISSUES.filter((i) => i.kind === '단점' && i.sev === 'high').length;
  $('#m-test').textContent = `${pass}/${TESTS.length}`; $('#m-test-p').textContent = Math.round((pass / TESTS.length) * 100) + '%';
  $('#m-gap').textContent = gaps; $('#m-high').textContent = high;
  $('#print').onclick = () => window.print();
}

// ---------- SCR-04 단위 테스트 ----------
function pageTests() {
  header('history');
  $('#tabs').innerHTML = tabs('tests.html');
  let filter = 'all', sel = TESTS.findIndex((t) => !t.ok);
  const render = () => {
    const fail = TESTS.filter((t) => !t.ok).length;
    $('#f-all').textContent = `전체 ${TESTS.length}`; $('#f-ok').textContent = `통과 ${TESTS.length - fail}`; $('#f-fail').textContent = `실패 ${fail}`;
    $('#list').innerHTML = TESTS.map((t, i) => ({ t, i })).filter(({ t }) => filter === 'all' || (filter === 'ok') === t.ok)
      .map(({ t, i }) => `<tr class="click ${i === sel ? 'sel' : ''}" data-i="${i}"><td>${esc(t.name)}</td><td>${t.req}</td><td>${t.ok ? '<span class="chip c-green">통과</span>' : '<span class="chip c-red">실패</span>'}</td></tr>`).join('');
    $$('#list tr').forEach((tr) => tr.onclick = () => { sel = +tr.dataset.i; render(); });
    const t = TESTS[sel];
    $('#detail').innerHTML = !t ? '<div class="empty">테스트를 고르세요</div>' : t.ok
      ? `<h2>${esc(t.name)}</h2><span class="chip c-green">통과</span><p class="muted">요구사항 ${t.req}을 만족합니다. 고칠 것이 없습니다.</p>`
      : `<h2 style="margin:0">실패 상세: ${esc(t.name)}</h2>
      <div class="row" style="gap:10px"><div class="field"><b>기대</b><br>${esc(t.expect)}</div><div class="field"><b>실제</b><br>${esc(t.actual)}</div></div>
      <div><span class="chip c-red">원인: ${esc(t.cause)}</span> <span class="muted small">테스트가 아니라 코드를 고쳐야 합니다</span></div>
      <div class="code">${esc(t.code)}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="coach.html?item=${t.fix}">고치는 방법 보기</a><button class="btn ghost" id="rerun">테스트 다시 실행</button><button class="btn ghost" id="dl">테스트 코드 받기</button></div>`;
    const rr = $('#rerun');
    if (rr) rr.onclick = () => { rr.textContent = '실행 중…'; rr.disabled = true; setTimeout(() => { rr.textContent = '테스트 다시 실행'; rr.disabled = false; toast('다시 실행했지만 아직 실패합니다. 코드를 고쳐 주세요'); }, 1200); };
    const dl = $('#dl');
    if (dl) dl.onclick = () => {
      const body = "import { describe, it, expect } from 'vitest';\n\n" + TESTS.filter((x) => x.code).map((x) => x.code).join('\n\n') + '\n';
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })), download: 'codecoach.test.ts' });
      a.click(); toast('codecoach.test.ts 를 내려받았습니다');
    };
  };
  $$('#filters button').forEach((b) => b.onclick = () => { filter = b.dataset.f; $$('#filters button').forEach((x) => x.classList.toggle('on', x === b)); render(); });
  render();
}

// ---------- SCR-05 보완점·단점 ----------
function pageIssues() {
  header('history');
  $('#tabs').innerHTML = tabs('issues.html');
  let kind = 'all', sev = 'all', sel = 0;
  const wrong = new Set(store.get('wrong', []));
  const render = () => {
    $('#k-all').textContent = `전체 ${ISSUES.length}`; $('#k-gap').textContent = `보완점 ${ISSUES.filter((i) => i.kind === '보완점').length}`; $('#k-weak').textContent = `단점 ${ISSUES.filter((i) => i.kind === '단점').length}`;
    const rows = ISSUES.map((x, i) => ({ x, i })).filter(({ x }) => (kind === 'all' || x.kind === kind) && (sev === 'all' || x.sev === sev));
    $('#list').innerHTML = rows.length ? rows.map(({ x, i }) => `<tr class="click ${i === sel ? 'sel' : ''}" data-i="${i}"><td>${sevChip(x.sev)}</td><td>${x.kind}</td><td>${esc(x.title)}${wrong.has(i) ? ' <span class="chip c-gray">이의 제기됨</span>' : ''}</td><td class="small">${esc(x.loc)}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">조건에 맞는 항목이 없습니다</td></tr>';
    $$('#list tr[data-i]').forEach((tr) => tr.onclick = () => { sel = +tr.dataset.i; render(); });
    const x = ISSUES[sel];
    $('#detail').innerHTML = `<h2 style="margin:0">${esc(x.title)}</h2><div>${sevChip(x.sev)} <span class="chip c-gray">${x.kind}</span> <span class="muted small">${esc(x.loc)}</span></div>
      <div><b>무엇이 문제인가요?</b><div class="muted">${esc(x.what)}</div></div>
      <div><b>어떤 상황에서 터지나요?</b><div class="muted">${esc(x.when)}</div></div>
      <div class="code">${esc(x.diff)}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="add">개선 목록에 담기</button><button class="btn ghost" id="wrong">${wrong.has(sel) ? '이의 제기 취소' : '이 지적이 틀렸어요'}</button></div>`;
    $('#add').onclick = () => {
      const list = coachList();
      if (list.some((c) => c.t === x.title)) return toast('이미 개선 목록에 있습니다');
      list.push({ t: x.title, tag: x.sev, done: false }); store.set('coach', list); toast('개선 목록에 담았습니다');
    };
    $('#wrong').onclick = () => { wrong.has(sel) ? wrong.delete(sel) : wrong.add(sel); store.set('wrong', [...wrong]); toast(wrong.has(sel) ? '다음 분석에 반영하겠습니다' : '이의 제기를 취소했습니다'); render(); };
  };
  $$('#kinds button').forEach((b) => b.onclick = () => { kind = b.dataset.k; $$('#kinds button').forEach((x) => x.classList.toggle('on', x === b)); render(); });
  $('#sev').onchange = (e) => { sev = e.target.value; render(); };
  render();
}

// ---------- SCR-06 대안 비교 ----------
function pageAlternatives() {
  header('history');
  $('#tabs').innerHTML = tabs('alternatives.html');
  let sel = 0;
  $('#topics').innerHTML = ALTS.map((a, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${esc(a.topic)}</button>`).join('');
  const render = () => {
    const a = ALTS[sel];
    $('#table').innerHTML = `<table><tr><th style="width:18%">항목</th><th>지금 코드 (${esc(a.cur)})</th><th>대안 (${esc(a.alt)})</th></tr>${a.rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}
      <tr><td><b>근거</b></td><td colspan="2"><span class="chip c-green">공식 문서 확인</span> ${a.bench.length ? '<span class="chip c-blue">실험으로 확인</span>' : ''}</td></tr></table>`;
    $('#bench').innerHTML = a.bench.length ? `<h2>실험 결과</h2>${a.bench.map(([n, v, w], i) => `<div style="margin:12px 0">${esc(n)}: <b>${v}</b> ${esc(a.unit.split(' ')[0])}<div class="bar"><i style="width:${w}%;${i ? '' : 'background:#9aa6ba'}"></i></div></div>`).join('')}<div class="muted small">단위: ${esc(a.unit)}</div>` : '<h2>실험 결과</h2><div class="empty">이 비교는 공식 문서로만 판단했습니다</div>';
    $('#reco').innerHTML = `<h2>코치의 권고</h2><div style="font-size:22px;font-weight:800;color:var(--brand)">${esc(a.reco)}</div><p class="muted">${esc(a.why)}</p><a class="btn ghost" href="coach.html">코치에게 더 물어보기</a>`;
  };
  $$('#topics button').forEach((b) => b.onclick = () => { sel = +b.dataset.i; $$('#topics button').forEach((x) => x.classList.toggle('on', x === b)); render(); });
  render();
}

// ---------- SCR-07 코칭 ----------
const ANSWERS = [
  [/정렬|쿼리|F-11/, 'normalizeUrl 안에서 hash를 지운 다음 줄에 넣으세요.\n\nu.hash = \'\';\nu.searchParams.sort();  // 추가\n\n이 한 줄로 실패한 F-11 테스트가 통과합니다.'],
  [/아이콘|aria|위험|삭제/, '버튼의 글자만 보지 말고 aria-label과 title도 함께 보세요.\n\nconst label = [el.text, el.ariaLabel, el.title].join(\' \');\nreturn DANGER.test(label);'],
  [/오류|중단|예외/, '페이지 방문을 try/catch로 감싸고, 실패한 주소는 목록에 모아 마지막에 보고하세요. 전체 탐색은 계속 진행됩니다.'],
  [/robots/, 'origin마다 robots.txt를 한 번 읽어 두고, 방문 전에 isAllowed(url)로 확인하세요. robots-parser 같은 작은 라이브러리를 쓰면 됩니다.'],
  [/테스트/, "예를 들면 이렇게 쓸 수 있어요.\n\nit('쿼리 순서가 달라도 같은 URL', () => {\n  expect(normalizeUrl('https://a.com/?b=2&a=1'))\n    .toBe(normalizeUrl('https://a.com/?a=1&b=2'));\n});"],
  [/왜/, '같은 화면을 두 번 방문하면 최대 페이지 수를 중복 화면이 잡아먹어 다른 화면을 놓칩니다. 그래서 같은 주소는 같게 보이도록 정규화해야 합니다.'],
  [/다른 방법|대안|Crawlee/, 'Crawlee의 RequestQueue를 쓰면 중복 제거와 재시도를 라이브러리가 맡아 줍니다. 다만 정규화 규칙은 직접 넘겨야 하니, 지금 함수를 그대로 재사용하세요.'],
];
function pageCoach() {
  header('history');
  $('#tabs').innerHTML = tabs('coach.html');
  const list = coachList();
  const render = () => {
    const done = list.filter((c) => c.done).length;
    $('#todo').innerHTML = list.map((c, i) => `<label class="check"><input type="checkbox" data-i="${i}" ${c.done ? 'checked' : ''}><span class="${c.done ? 'done-text' : ''}" style="flex:1">${esc(c.t)}</span>${c.done ? '<span class="chip c-green">반영 완료</span>' : sevChip(c.tag)}</label>`).join('');
    $('#prog').textContent = `진행률 ${done} / ${list.length}`; $('#pbar').style.width = (done / list.length) * 100 + '%';
    $$('#todo input').forEach((el) => el.onchange = () => { list[+el.dataset.i].done = el.checked; store.set('coach', list); render(); if (el.checked) toast('잘했어요! 하나 반영했습니다'); });
  };
  const chat = $('#chat');
  const say = (who, text) => { const b = document.createElement('div'); b.className = 'bubble ' + who; b.textContent = text; chat.append(b); chat.scrollTop = 1e9; };
  const ask = (q) => {
    if (!q.trim()) return;
    say('me', q); $('#q').value = '';
    const typing = document.createElement('div'); typing.className = 'bubble ai muted'; typing.textContent = '코치가 답을 쓰는 중…'; chat.append(typing);
    setTimeout(() => { typing.remove(); say('ai', (ANSWERS.find(([re]) => re.test(q)) || [, '좋은 질문이에요. 지금은 예시 답변만 제공하는 프로토타입이라, 개선 목록의 항목 이름을 넣어 다시 물어보시면 구체적으로 답해 드릴게요.'])[1]); }, 700);
  };
  const item = new URLSearchParams(location.search).get('item');
  say('ai', '안녕하세요, 코드 코치입니다. 개선 목록에서 궁금한 항목을 골라 물어보세요.');
  if (item !== null && list[+item]) ask(`"${list[+item].t}"는 어떻게 고치면 되나요?`);
  $('#send').onclick = () => ask($('#q').value);
  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') ask($('#q').value); });
  $$('#suggest button').forEach((b) => b.onclick = () => ask(b.textContent));
  $('#reset').onclick = () => { store.set('coach', COACH_DEFAULT); location.reload(); };
  render();
}

const PAGES = { submit: pageSubmit, progress: pageProgress, result: pageResult, tests: pageTests, issues: pageIssues, alternatives: pageAlternatives, coach: pageCoach };
document.addEventListener('DOMContentLoaded', () => PAGES[document.body.dataset.page]?.());
