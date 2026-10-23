// screens.mjs의 화면 정의로 index.html(화면 설계서)과 summary.html(PDF용 요약 자료)을 만든다.
import fs from 'node:fs';
import { screens, product } from './screens.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const css = `
:root{--ink:#1b2333;--sub:#5b6577;--line:#e3e7ee;--bg:#fff;--head:#f5f7fa;--brand:#3b5bdb;--red:#e5484d}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#e6e9ef;--sub:#a3acbd;--line:#2d3442;--bg:#141821;--head:#1c212c;--brand:#8aa2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 "Malgun Gothic","Segoe UI",sans-serif}
main{max-width:1200px;margin:0 auto;padding:32px 16px 80px}a{color:var(--brand)}
nav.toc{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:14px;flex-wrap:wrap;font-size:14px}
h1{font-size:30px;margin:8px 0 6px}h2{font-size:22px;margin:48px 0 14px;padding-top:14px;border-top:2px solid var(--ink)}h3{font-size:17px;margin:22px 0 8px}
.lead{color:var(--sub);margin:0 0 20px}
table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{background:var(--head);white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.card{border:1px solid var(--line);border-radius:10px;overflow:hidden;text-decoration:none;color:inherit;background:var(--head)}
.card img{width:100%;display:block;border-bottom:1px solid var(--line)}.card div{padding:10px 12px}.card b{color:var(--red);margin-right:6px}
.shot{width:100%;border:1px solid var(--line);border-radius:8px;display:block}
.no{display:inline-block;width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;text-align:center;font:700 12px/22px "Segoe UI",sans-serif}
.flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.flow span{border:1px solid var(--line);background:var(--head);border-radius:8px;padding:6px 12px}.flow i{color:var(--sub);font-style:normal}
code{font-size:13px}
@media (max-width:700px){h1{font-size:24px}th,td{padding:6px}}
`;

const meta = `
<table>
<tr><th>서비스명</th><td>${esc(product.name)}</td><th>문서 버전</th><td>v0.1</td></tr>
<tr><th>작성일</th><td>2026-10-23</td><th>작성자</th><td>인태</td></tr>
<tr><th>목적</th><td colspan="3">${esc(product.goal)}</td></tr>
<tr><th>대상 사용자</th><td colspan="3">${esc(product.users)}</td></tr>
</table>`;

const list = `<table><tr><th>화면 ID</th><th>화면명</th><th>메뉴 경로</th><th>화면 목적</th></tr>
${screens.map((s) => `<tr><td><a href="#${s.id}">${s.id}</a></td><td>${esc(s.name)}</td><td>${esc(s.path)}</td><td>${esc(s.purpose)}</td></tr>`).join('\n')}</table>`;

const flow = `<div class="flow">${product.flow.map((f, i) => (i ? '<i>→</i>' : '') + `<span>${esc(f)}</span>`).join('')}</div>
<p class="lead" style="margin-top:10px">${esc(product.flowNote)}</p>`;

const detail = screens.map((s) => `
<h2 id="${s.id}">${s.id} ${esc(s.name)}</h2>
<table>
<tr><th>화면 ID</th><td>${s.id}</td><th>메뉴 경로</th><td>${esc(s.path)}</td></tr>
<tr><th>화면 목적</th><td colspan="3">${esc(s.purpose)}</td></tr>
<tr><th>진입 경로</th><td>${esc(s.from)}</td><th>이동 화면</th><td>${esc(s.to)}</td></tr>
</table>
<img class="shot" src="design/images/${s.id}.png" alt="${s.id} ${esc(s.name)} 화면 목업" loading="lazy">
<h3>Description</h3>
<table><tr><th>No</th><th>요소</th><th>유형</th><th>기능 설명</th></tr>
${s.items.map((it, i) => `<tr><td><span class="no">${i + 1}</span></td><td>${esc(it[0])}</td><td>${esc(it[1])}</td><td>${esc(it[2])}</td></tr>`).join('\n')}
</table>
${s.rules ? `<h3>처리 규칙</h3><ul>${s.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}`).join('\n');

const index = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CodeCoach 화면 설계서</title><style>${css}</style></head>
<body>
<nav class="toc"><a href="#cover">표지</a><a href="#list">화면 목록</a><a href="#flow">화면 흐름</a>${screens.map((s) => `<a href="#${s.id}">${s.id}</a>`).join('')}<a href="CodeCoach-화면설계-요약.pdf">요약 PDF</a></nav>
<main>
<section id="cover">
<h1>CodeCoach 화면 설계서</h1>
<p class="lead">${esc(product.tagline)}</p>
${meta}
</section>
<h2 id="list">화면 목록 (${screens.length})</h2>
<div class="grid">${screens.map((s) => `<a class="card" href="#${s.id}"><img src="design/images/${s.id}.png" alt="${s.id} 미리보기" loading="lazy"><div><b>${s.id}</b>${esc(s.name)}</div></a>`).join('')}</div>
${list}
<h2 id="flow">화면 흐름</h2>
${flow}
${detail}
</main></body></html>
`;
fs.writeFileSync('index.html', index);

// ---------- PDF용 요약 자료 (A4 가로, 한 장에 하나씩) ----------
const pcss = `
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}body{margin:0;font:13px/1.55 "Malgun Gothic","Segoe UI",sans-serif;color:#1b2333}
.page{width:297mm;height:210mm;padding:14mm 16mm;page-break-after:always;position:relative;overflow:hidden}
.page:last-child{page-break-after:auto}
.dark{background:#1b2333;color:#fff}
h1{font-size:34px;margin:0 0 10px;line-height:1.25}h2{font-size:24px;margin:0 0 4mm}
.kicker{color:#e5484d;font-weight:800;font-size:14px;margin-bottom:6px}
.sub{color:#5b6577}.dark .sub{color:#b9c2d3}
.foot{position:absolute;left:16mm;bottom:7mm;font-size:10px;color:#8a94a6}
.no{display:inline-block;min-width:20px;height:20px;border-radius:50%;background:#e5484d;color:#fff;text-align:center;font:700 11px/20px "Segoe UI",sans-serif;margin-right:8px}
.row{display:flex;gap:8mm}
.shot{border:1px solid #d5dae1;border-radius:6px;box-shadow:0 2px 8px rgba(27,35,51,.15);display:block}
.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;margin-top:8mm}
.step{background:#f2f4f7;border-radius:8px;padding:5mm}.step b{display:block;font-size:16px;margin:6px 0 4px}
.big{font-size:40px;font-weight:800;color:#3b5bdb;line-height:1}
.feat{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm}
.feat div{background:#f2f4f7;border-radius:8px;padding:5mm}.feat b{font-size:16px}
ul{margin:0;padding-left:18px}li{margin:3px 0}
.items div{display:flex;align-items:flex-start;margin:0 0 7px}
`;
const easy = product.features.map((f) => `<div><span class="no">${f.n}</span><b>${esc(f.title)}</b><div class="sub" style="margin-top:4px">${esc(f.desc)}</div></div>`).join('');
const pages = [];
pages.push(`<section class="page dark">
<div class="row" style="align-items:center;height:100%">
<div style="flex:1"><div class="kicker">화면 설계서 요약 · v0.1</div><h1>CodeCoach<br>코드를 올리면 AI가 코칭해 주는 웹페이지</h1>
<p class="sub" style="font-size:15px">${esc(product.tagline)}</p><p class="sub" style="margin-top:14mm">인태 · 핑거 교육 실습 · 2026-10-23</p></div>
<img class="shot" src="design/images/SCR-03.png" style="width:150mm;border-color:#33415c">
</div></section>`);
pages.push(`<section class="page">
<h2>한눈에 보는 핵심 기능</h2><div class="sub">개발자가 자기 코드에 대해 궁금한 네 가지 질문에 답합니다</div>
<div class="feat">${easy}</div>
<div class="foot">CodeCoach 화면 설계서 요약</div></section>`);
pages.push(`<section class="page">
<h2>이렇게 사용합니다</h2><div class="sub">화면 7개, 5단계 흐름</div>
<div class="steps">${product.howto.map((h, i) => `<div class="step"><span class="no">${i + 1}</span><b>${esc(h[0])}</b><div class="sub">${esc(h[1])}</div></div>`).join('')}</div>
<div style="margin-top:8mm" class="sub">${esc(product.flowNote)}</div>
<div class="foot">CodeCoach 화면 설계서 요약</div></section>`);
for (const s of screens) {
  pages.push(`<section class="page">
<div style="display:flex;align-items:baseline;gap:10px"><h2><span style="color:#e5484d">${s.id}</span> ${esc(s.name)}</h2></div>
<div class="row">
<img class="shot" src="design/images/${s.id}.png" style="width:168mm;height:105mm">
<div style="flex:1">
<div class="sub" style="margin-bottom:5mm">${esc(s.easy || s.purpose)}</div>
<div class="items">${s.items.map((it, i) => `<div><span class="no">${i + 1}</span><span><b>${esc(it[0])}</b><br><span class="sub">${esc(it[3] || it[2])}</span></span></div>`).join('')}</div>
</div></div>
<div class="foot">CodeCoach 화면 설계서 요약 · ${s.id}</div></section>`);
}
const summary = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>CodeCoach 화면 설계서 요약</title><style>${pcss}</style></head><body>${pages.join('\n')}</body></html>`;
fs.writeFileSync('summary.html', summary);
console.log('generated index.html, summary.html');
