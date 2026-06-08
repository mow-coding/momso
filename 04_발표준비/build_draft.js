// momso × InBodyLIKE — §0~§6 워크시트 반영 집중 초안 (14장)
// 03_사업계획서 build.js의 팔레트·헬퍼 관례를 따른다.
const path = require("path");
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
p.author = "빅블루 요가 (momso)";
p.title = "momso × InBodyLIKE 지원서 초안 (§0~§6)";

// ---------- palette ----------
const INK = "163F38", GREEN = "2E6657", SAGE = "7FA899", SAGELT = "DDE9E3";
const MIST = "F3F6F4", WHITE = "FFFFFF", GOLD = "C8A04A", BODY = "2A332F", MUTE = "6F7E78";
const ROSE = "C58B7A"; // 살구(개인) 보조 액센트
const F = "Malgun Gothic";
const W = 13.333, H = 7.5;
const sh = () => ({ type: "outer", color: "163F38", blur: 7, offset: 2, angle: 135, opacity: 0.13 });

function bg(s, c){ s.background = { color: c }; }
function foot(s, n, dark){
  s.addText("momso × InBodyLIKE  ·  지원서 초안", {x:0.5, y:H-0.42, w:6, h:0.3, fontFace:F, color: dark?SAGE:MUTE, fontSize:8, align:"left", valign:"middle", margin:0});
  s.addText(String(n), {x:W-1.0, y:H-0.42, w:0.5, h:0.3, fontFace:F, fontSize:9, color: dark?SAGE:MUTE, align:"right", valign:"middle", margin:0});
}
function head(s, secNo, secLabel, title){
  s.addShape(p.shapes.OVAL, {x:0.55, y:0.45, w:0.42, h:0.42, fill:{color:INK}});
  s.addText(secNo, {x:0.55, y:0.45, w:0.42, h:0.42, fontFace:F, fontSize:12, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(secLabel, {x:1.08, y:0.46, w:9, h:0.4, fontFace:F, fontSize:12, bold:true, color:GOLD, align:"left", valign:"middle", charSpacing:2, margin:0});
  s.addText(title, {x:0.5, y:0.95, w:12.3, h:0.85, fontFace:F, fontSize:26, bold:true, color:INK, align:"left", valign:"top", margin:0});
}
function chip(s, x, y, w, text, fill, col){
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x, y, w, h:0.42, fill:{color:fill}, rectRadius:0.08});
  s.addText(text, {x, y, w, h:0.42, fontFace:F, fontSize:11, color:col, align:"center", valign:"middle", margin:0});
}
function card(s, x, y, w, h, fill){
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x, y, w, h, fill:{color:fill||WHITE}, rectRadius:0.07, shadow:sh()});
}
function src(s, text){
  s.addText(text, {x:0.5, y:H-0.72, w:12.3, h:0.28, fontFace:F, fontSize:8.5, italic:true, color:MUTE, align:"left", valign:"middle", margin:0});
}
function arrow(s, x, y){
  s.addText("→", {x, y, w:0.3, h:1.0, fontFace:F, fontSize:18, bold:true, color:SAGE, align:"center", valign:"middle", margin:0});
}

// ============ S1 TITLE ============
let s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:10.6, y:-1.6, w:5.2, h:5.2, fill:{color:GREEN}});
s.addShape(p.shapes.OVAL, {x:11.9, y:4.4, w:3.6, h:3.6, fill:{color:"1C4A41"}});
s.addText("InBodyLIKE 2026  ·  지원서 초안 (생각정리 §0~§6)", {x:0.9, y:1.45, w:11, h:0.5, fontFace:F, fontSize:14, color:GOLD, bold:true, charSpacing:2, margin:0});
s.addText("momso", {x:0.85, y:2.0, w:9, h:1.5, fontFace:F, fontSize:84, bold:true, color:WHITE, margin:0});
s.addText("몸소", {x:0.92, y:3.45, w:9, h:0.7, fontFace:F, fontSize:23, color:SAGE, margin:0});
s.addText("수업에서 사라지는 말·교정·감각을, 강사가 검수해 개인 수련 기록으로 남깁니다.",
  {x:0.9, y:4.35, w:11.3, h:0.7, fontFace:F, fontSize:19, color:WHITE, margin:0});
s.addShape(p.shapes.LINE, {x:0.92, y:5.35, w:3.2, h:0, line:{color:GOLD, width:2}});
s.addText("빅블루 요가  ·  공동대표 유동환 · 김성균  ·  서울 연희동      |      2026.06",
  {x:0.9, y:5.55, w:11.5, h:0.5, fontFace:F, fontSize:13, color:SAGELT, margin:0});

// ============ S2 §0 정체성 (헤드라인 + 비전 split) ============
s = p.addSlide(); bg(s, WHITE); head(s, "0", "POSITIONING", "한 문장 — 심사자에겐 헤드라인, 소비자에겐 비전");
card(s, 0.6, 1.95, 6.0, 2.05, MIST);
s.addText("심사자용 헤드라인", {x:0.85, y:2.12, w:5.5, h:0.35, fontFace:F, fontSize:12, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"수업에서 사라지는 ", options:{color:BODY}},
  {text:"말·교정·감각", options:{color:INK, bold:true}},
  {text:"을 ", options:{color:BODY}},
  {text:"강사가 검수해", options:{color:GOLD, bold:true}},
  {text:" 개인 수련 기록으로 남긴다.", options:{color:BODY}},
], {x:0.85, y:2.5, w:5.55, h:1.35, fontFace:F, fontSize:17, valign:"top", lineSpacingMultiple:1.18, margin:0});
card(s, 6.75, 1.95, 5.95, 2.05, INK);
s.addText("소비자용 비전", {x:7.0, y:2.12, w:5.5, h:0.35, fontFace:F, fontSize:12, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"그렇게 쌓이면 momso는 내 몸을 가장 잘 아는 ", options:{color:WHITE}},
  {text:"'세컨드 바디'", options:{color:SAGE, bold:true}},
  {text:"가 된다.", options:{color:WHITE}},
], {x:7.0, y:2.5, w:5.5, h:1.35, fontFace:F, fontSize:17, valign:"top", lineSpacingMultiple:1.18, margin:0});
s.addText("인바디는 헤드라인에 두지 않는다 — '첫 정량 데이터 파트너'(필수·종속 아님).", {x:0.65, y:4.18, w:12, h:0.4, fontFace:F, fontSize:13, bold:true, italic:true, color:GREEN, margin:0});
s.addText("momso가 아닌 것 — 이미 포화된 포지션은 피한다", {x:0.65, y:4.72, w:11, h:0.35, fontFace:F, fontSize:12, bold:true, color:MUTE, margin:0});
["요가원 CRM","예약·결제 앱","웰니스 패스","AI 회의록 앱","장비 판매"].forEach((t,i)=> chip(s, 0.65 + i*2.42, 5.18, 2.25, "✕ "+t, SAGELT, GREEN));
src(s, "출처: §0 워크시트 결론(헤드라인/비전 분리, 인바디 헤드라인 제외) · 노트 06 정의·제품원칙.");
foot(s, 2);

// ============ S3 §1 문제 (1) 한 통점·두 얼굴 ============
s = p.addSlide(); bg(s, WHITE); head(s, "01", "PROBLEM", "한 통점, 두 얼굴 — 수업의 핵심은 끝나면 사라진다");
card(s, 0.6, 1.95, 12.1, 0.85, MIST);
s.addText([
  {text:"한 통점 — ", options:{color:GOLD, bold:true}},
  {text:"수업에서 오간 말·교정·감각이 ", options:{color:BODY}},
  {text:"수업이 끝나면 휘발된다.", options:{color:INK, bold:true}},
], {x:0.9, y:2.05, w:11.5, h:0.65, fontFace:F, fontSize:16, valign:"middle", margin:0});
// 두 카드
card(s, 0.6, 3.05, 5.95, 3.15, WHITE);
s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:0.85, y:3.28, w:2.4, h:0.5, fill:{color:ROSE}, rectRadius:0.06});
s.addText("수련생", {x:0.85, y:3.28, w:2.4, h:0.5, fontFace:F, fontSize:14, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
[["일상에서 수업 내용을 다시 못 쓴다"],["같은 부위를 또 다친다"],["내 몸이 어떻게 변하는지 모른다"]].forEach((t,i)=>{
  s.addText("·", {x:0.95, y:3.95+i*0.62, w:0.3, h:0.5, fontFace:F, fontSize:18, bold:true, color:ROSE, valign:"top", margin:0});
  s.addText(t[0], {x:1.25, y:3.97+i*0.62, w:5.1, h:0.55, fontFace:F, fontSize:14, color:BODY, valign:"top", margin:0});
});
card(s, 6.75, 3.05, 5.95, 3.15, WHITE);
s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:7.0, y:3.28, w:3.1, h:0.5, fill:{color:GREEN}, rectRadius:0.06});
s.addText("강사 · 운영자", {x:7.0, y:3.28, w:3.1, h:0.5, fontFace:F, fontSize:14, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
[["수십 명을 다 기억·관리할 수 없다"],["쌓은 전문성이 기록으로 안 남는다"],["변화를 못 보여줘 재방문을 놓친다"]].forEach((t,i)=>{
  s.addText("·", {x:7.1, y:3.95+i*0.62, w:0.3, h:0.5, fontFace:F, fontSize:18, bold:true, color:GREEN, valign:"top", margin:0});
  s.addText(t[0], {x:7.4, y:3.97+i*0.62, w:5.1, h:0.55, fontFace:F, fontSize:14, color:BODY, valign:"top", margin:0});
});
src(s, "출처: §1 워크시트(한 통점·두 얼굴) · 빅블루 리뷰 123건 분석(2026-05-08) · 5/13 기획회의.");
foot(s, 3);

// ============ S4 §1 문제 (2) 킬러 인사이트 ============
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:-1.5, y:4.6, w:5, h:5, fill:{color:"1C4A41"}});
s.addText("KILLER INSIGHT", {x:0.9, y:1.0, w:9, h:0.4, fontFace:F, fontSize:12, bold:true, color:GOLD, charSpacing:3, margin:0});
s.addText([
  {text:"변화는 일어나는데,\n", options:{color:WHITE}},
  {text:"강사는 ", options:{color:WHITE}},
  {text:"보여줄 수 없고", options:{color:GOLD, bold:true}},
  {text:" 수련생은 ", options:{color:WHITE}},
  {text:"볼 수 없다.", options:{color:GOLD, bold:true}},
], {x:0.9, y:1.6, w:11.5, h:2.2, fontFace:F, fontSize:36, bold:true, valign:"top", lineSpacingMultiple:1.1, margin:0});
s.addText("→  동기를 줄 자극점이 안 생기고, 재방문이 끊긴다.", {x:0.92, y:3.95, w:11.5, h:0.6, fontFace:F, fontSize:19, color:SAGELT, margin:0});
card(s, 0.9, 4.95, 11.5, 1.35, "1C4A41");
s.addText([
  {text:"여기서 인바디가 변화를 ", options:{color:WHITE}},
  {text:"'보이게'", options:{color:SAGE, bold:true}},
  {text:" 하고, momso가 그 변화에 ", options:{color:WHITE}},
  {text:"'수업의 의미'", options:{color:GOLD, bold:true}},
  {text:"를 입힌다.", options:{color:WHITE}},
], {x:1.2, y:5.2, w:11, h:0.85, fontFace:F, fontSize:17, valign:"middle", margin:0});
s.addText("웰니스 유료 고객의 80~90%가 여성 [현장 관찰] — '변화를 함께 본다(참고값)'로 표현, '살을 뺀다' 아님.", {x:0.9, y:6.62, w:11.6, h:0.3, fontFace:F, fontSize:9, italic:true, color:SAGE, margin:0});

// ============ S5 §1 기존 도구 공백 ============
s = p.addSlide(); bg(s, WHITE); head(s, "01", "PROBLEM", "왜 지금까지 못 풀었나 — 비어 있는 '수업 맥락 기록 계층'");
const gaps = [
  ["운영 CRM","바디코디 등","예약·결제만"],
  ["예약·패스","오붓 등","수업 접근만"],
  ["전사·회의록","Tiro 등","음성→글만"],
  ["측정기","인바디 등","몸 수치만"],
];
gaps.forEach(([a,b,c],i)=>{
  const x = 0.6 + i*3.05;
  card(s, x, 2.0, 2.85, 1.55, MIST);
  s.addText(a, {x:x+0.2, y:2.15, w:2.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:INK, margin:0});
  s.addText(b, {x:x+0.2, y:2.55, w:2.5, h:0.32, fontFace:F, fontSize:10.5, color:MUTE, margin:0});
  s.addText("기록: "+c, {x:x+0.2, y:2.92, w:2.5, h:0.45, fontFace:F, fontSize:12, color:GREEN, margin:0});
});
card(s, 0.6, 4.0, 12.1, 2.0, INK);
s.addText([
  {text:"누구도 기록하지 않는 칸 = ", options:{color:WHITE}},
  {text:"수업 안의 언어·피드백·감각·반응", options:{color:GOLD, bold:true}},
], {x:1.0, y:4.35, w:11.3, h:0.55, fontFace:F, fontSize:19, bold:true, valign:"middle", margin:0});
s.addText("운영 관리 → 수업 기록 (가로축),  정량 신체 → 정성 맥락 (세로축) 의 2×2에서, momso는 '수업 기록 × 정성 맥락' 사분면을 차지한다. 인바디와 결합하면 정량+정성 하이브리드.",
  {x:1.0, y:4.95, w:11.3, h:0.95, fontFace:F, fontSize:14, color:SAGELT, valign:"top", lineSpacingMultiple:1.15, margin:0});
src(s, "출처: §1·§2 경쟁 비교 · 노트 06 포지셔닝 · 외부 경쟁/시장 리서치(2026-05-26).");
foot(s, 5);

// ============ S6 §2 솔루션 흐름 (HITL) ============
s = p.addSlide(); bg(s, WHITE); head(s, "02", "SOLUTION", "해결 흐름 — AI는 초안만, 강사가 확정한다 (HITL)");
const steps = [
  ["수업 전","참고지표·초점", SAGELT, INK],
  ["녹음","강사만", SAGELT, INK],
  ["AI 초안","전사·요약", SAGELT, INK],
  ["강사 검수","공유/내부/보류/제외", GOLD, WHITE],
  ["발행","검수본만", SAGELT, INK],
  ["축적","회원별", SAGELT, INK],
  ["회수","다음 수업", SAGELT, INK],
];
const bw = 1.52, gap = 0.17, x0 = 0.55, yb = 2.7;
steps.forEach(([t,d,fill,col],i)=>{
  const x = x0 + i*(bw+gap);
  card(s, x, yb, bw, 1.15, fill);
  s.addText(t, {x:x, y:yb+0.18, w:bw, h:0.45, fontFace:F, fontSize:14, bold:true, color:col, align:"center", valign:"middle", margin:0});
  s.addText(d, {x:x, y:yb+0.62, w:bw, h:0.42, fontFace:F, fontSize:9.5, color: fill===GOLD?"FBEFD6":MUTE, align:"center", valign:"top", margin:0});
  if(i<steps.length-1) s.addText("›", {x:x+bw-0.02, y:yb, w:0.19, h:1.15, fontFace:F, fontSize:16, bold:true, color:SAGE, align:"center", valign:"middle", margin:0});
});
card(s, 0.6, 4.35, 12.1, 1.75, MIST);
s.addText("핵심 = 강사 검수(HITL)", {x:0.9, y:4.55, w:11.5, h:0.4, fontFace:F, fontSize:15, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"AI는 ", options:{color:BODY}},
  {text:"초안만", options:{color:INK, bold:true}},
  {text:" 만들고, ", options:{color:BODY}},
  {text:"강사가 초점 단위로 검수해 확정한 것만", options:{color:INK, bold:true}},
  {text:" 발행한다. 원본 음성·전체 전사는 기본 비공개. ", options:{color:BODY}},
  {text:"검수된 기록은 회원별로 쌓여 다음 수업 맥락으로 환류된다.", options:{color:BODY}},
], {x:0.9, y:4.98, w:11.5, h:1.0, fontFace:F, fontSize:14, valign:"top", lineSpacingMultiple:1.2, margin:0});
src(s, "출처: §2 워크시트 · PRD v1(2026-06-03) · 데이터 3계층(raw→metadata→shareable).");
foot(s, 6);

// ============ S7 §2 차별점 (순서 + 경쟁 5종) ============
s = p.addSlide(); bg(s, WHITE); head(s, "02", "SOLUTION", "차별점 — ① 검수+수업맥락, ② 게다가 데이터 주권");
card(s, 0.6, 1.95, 5.95, 2.15, INK);
s.addText("① 첫째 차별점 (해자)", {x:0.85, y:2.12, w:5.5, h:0.35, fontFace:F, fontSize:12, bold:true, color:GOLD, margin:0});
s.addText("HITL + 수업 맥락 기록", {x:0.85, y:2.48, w:5.5, h:0.45, fontFace:F, fontSize:18, bold:true, color:WHITE, margin:0});
s.addText("요가의 민감성(노하우·개인·타인정보)을 강사가 검수해, 검수본만 회원별로 장기 축적. AI 회의록·CRM엔 구조 자체가 없다.", {x:0.85, y:2.98, w:5.5, h:1.05, fontFace:F, fontSize:13, color:SAGELT, valign:"top", lineSpacingMultiple:1.18, margin:0});
card(s, 6.75, 1.95, 5.95, 2.15, MIST);
s.addText("② 둘째 차별점 (게다가)", {x:7.0, y:2.12, w:5.5, h:0.35, fontFace:F, fontSize:12, bold:true, color:GOLD, margin:0});
s.addText("비용 · 데이터 주권 (BYOK)", {x:7.0, y:2.48, w:5.5, h:0.45, fontFace:F, fontSize:18, bold:true, color:INK, margin:0});
s.addText("고객이 자기 AI 키로 연결 → 추가금 없이 + 데이터는 고객 소유. 네이버·클로드 '간편 연동'으로 부담은 우리가 흡수(S11).", {x:7.0, y:2.98, w:5.5, h:1.05, fontFace:F, fontSize:13, color:BODY, valign:"top", lineSpacingMultiple:1.18, margin:0});
s.addText("\"걔네는 X를 기록, 우리는 Y를 기록 — 그리고 강사가 검수한다\"", {x:0.65, y:4.28, w:12, h:0.35, fontFace:F, fontSize:12.5, bold:true, italic:true, color:GREEN, margin:0});
const vs = [
  ["바디코디(CRM)","센터 운영","수업 경험"],
  ["오붓(예약)","수업에 가게","수업이 남게"],
  ["Tiro(전사)","음성을 글로","수업을 수련 기록으로"],
  ["인바디(측정)","몸의 스펙","수업에서의 변화·의미"],
  ["포인티(운동)","PT 운동기록","요가 맥락·감각 + 검수"],
];
let vy = 4.7;
vs.forEach(([a,b,c])=>{
  s.addText(a, {x:0.7, y:vy, w:2.7, h:0.35, fontFace:F, fontSize:11.5, bold:true, color:INK, valign:"middle", margin:0});
  s.addText(b, {x:3.5, y:vy, w:3.7, h:0.35, fontFace:F, fontSize:11.5, color:MUTE, valign:"middle", margin:0});
  s.addText([{text:"→ momso: ", options:{color:GOLD, bold:true}},{text:c, options:{color:BODY}}], {x:7.3, y:vy, w:5.4, h:0.35, fontFace:F, fontSize:11.5, valign:"middle", margin:0});
  vy += 0.38;
});
foot(s, 7);

// ============ S8 §2 데모 ============
s = p.addSlide(); bg(s, WHITE); head(s, "02", "SOLUTION", "지금 작동하는 것 — momso.vercel.app");
card(s, 0.6, 1.95, 12.1, 0.85, MIST);
s.addText([
  {text:"이미 만들었다. ", options:{color:GOLD, bold:true}},
  {text:"작동하는 모바일 웹앱 데모 — 강사용 5탭 · 수련생용 4탭 · 발행 게이트·면책 구현.", options:{color:BODY}},
], {x:0.9, y:2.05, w:11.5, h:0.65, fontFace:F, fontSize:15, valign:"middle", margin:0});
card(s, 0.6, 3.05, 5.95, 3.0, WHITE);
s.addText("데모의 주인공 — 강사", {x:0.85, y:3.25, w:5.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:INK, margin:0});
s.addText("AI 위키", {x:0.85, y:3.65, w:5.5, h:0.4, fontFace:F, fontSize:17, bold:true, color:GREEN, margin:0});
s.addText("수업을 정리하고, 회원별 맥락을 다음 수업으로 불러온다. 6/12 데모는 이 강사 흐름을 완성형으로 보여준다.", {x:0.85, y:4.15, w:5.5, h:1.7, fontFace:F, fontSize:13.5, color:BODY, valign:"top", lineSpacingMultiple:1.2, margin:0});
card(s, 6.75, 3.05, 5.95, 3.0, INK);
s.addText("비전 — 수련생", {x:7.0, y:3.25, w:5.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:SAGE, margin:0});
s.addText("세컨드 바디", {x:7.0, y:3.65, w:5.5, h:0.4, fontFace:F, fontSize:17, bold:true, color:GOLD, margin:0});
s.addText("기록이 쌓일수록 AI가 내 몸 맥락을 이해한다. 지금은 PoC로 검증 — '구현 완료'로 단정하지 않는다.", {x:7.0, y:4.15, w:5.5, h:1.7, fontFace:F, fontSize:13.5, color:SAGELT, valign:"top", lineSpacingMultiple:1.2, margin:0});
src(s, "출처: §2 워크시트(LLM 주인공=강사 데모/수련생 비전) · InbodylikePrototype.tsx(2026-06-02~03).");
foot(s, 8);

// ============ S9 §3 시장 ============
s = p.addSlide(); bg(s, WHITE); head(s, "03", "MARKET", "시장 — 요가 쐐기로 검증, 인바디 깔린 필라·PT로 확장");
// 좌: 규모
card(s, 0.6, 1.95, 5.6, 4.1, MIST);
s.addText("시장 규모", {x:0.85, y:2.12, w:5, h:0.4, fontFace:F, fontSize:14, bold:true, color:GOLD, margin:0});
[["TAM","전국 체육·웰니스 사업체 131,764곳 — 89.9%가 1~4인 소규모"],
 ["SAM","요가+필라+PT 프리미엄 참여형 스튜디오 (수도권 중심) [가정]"],
 ["SOM","3년차 500곳(기본) ~ 1,000곳(공격)"]].forEach(([k,v],i)=>{
  const y = 2.62 + i*1.08;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:0.85, y:y, w:1.1, h:0.5, fill:{color:INK}, rectRadius:0.06});
  s.addText(k, {x:0.85, y:y, w:1.1, h:0.5, fontFace:F, fontSize:13, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(v, {x:2.1, y:y-0.06, w:3.95, h:1.0, fontFace:F, fontSize:12.5, color:BODY, valign:"top", lineSpacingMultiple:1.12, margin:0});
});
// 우: 확장 경로
card(s, 6.35, 1.95, 6.35, 4.1, WHITE);
s.addText("첫 시장 → 확장 (좁게 시작해 넓힌다)", {x:6.6, y:2.12, w:5.9, h:0.4, fontFace:F, fontSize:14, bold:true, color:INK, margin:0});
[["①","요가 쐐기","빅블루 + 연희동 1:1·소그룹 — 가장 어려운 도메인에서 증명", GOLD],
 ["②","연희동 클러스터","밀집 지역 레퍼런스 확산", GREEN],
 ["③","필라·PT (인바디 풍부)","인바디 레버리지 본격화", GREEN],
 ["④","인바디·몸 관심 일반","가정용 인바디 소비자까지 [확장]", SAGE]].forEach(([n,t,d,c],i)=>{
  const y = 2.6 + i*0.85;
  s.addShape(p.shapes.OVAL, {x:6.6, y:y, w:0.42, h:0.42, fill:{color:c}});
  s.addText(n, {x:6.6, y:y, w:0.42, h:0.42, fontFace:F, fontSize:12, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText([{text:t+"  ", options:{bold:true, color:INK}},{text:d, options:{color:MUTE, fontSize:11}}], {x:7.15, y:y-0.02, w:5.4, h:0.75, fontFace:F, fontSize:12.5, valign:"top", lineSpacingMultiple:1.05, margin:0});
});
s.addText("\"가장 까다로운 요가에서 인바디 없이도 통하게 만들고 → 인바디가 깔린 필라·PT로 넘어가 협업을 키운다.\"", {x:6.6, y:5.5, w:6.0, h:0.5, fontFace:F, fontSize:10.5, italic:true, color:GREEN, valign:"top", lineSpacingMultiple:1.1, margin:0});
src(s, "출처: 공식 통계(사업체 131,764·89.9% 1~4인) · §3 워크시트(요가 쐐기→필라/PT 확장). 슬라이드13 하위숫자 교체 권고는 메모 참조.");
foot(s, 9);

// ============ S10 §3 BM·단위경제 ============
s = p.addSlide(); bg(s, WHITE); head(s, "03", "BUSINESS MODEL", "수익 — 고정비가 아니라 '재방문 투자'");
// 좌: 2-tier
card(s, 0.6, 1.95, 6.0, 2.55, MIST);
s.addText("두 티어 — 역할이 다르다", {x:0.85, y:2.1, w:5.5, h:0.35, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
s.addText([{text:"B2B  월 30만 (주 매출)\n", options:{bold:true, color:INK, fontSize:14}},
  {text:"AI 위키·운영효율·재방문·차별화 마케팅. 회원 1~2명만 더 잡아도 회수 — 비용이 아니라 투자.", options:{color:BODY, fontSize:12}}],
  {x:0.85, y:2.5, w:5.5, h:1.0, fontFace:F, valign:"top", lineSpacingMultiple:1.15, margin:0});
s.addText([{text:"B2C  월 7천 (바이럴 엔진)\n", options:{bold:true, color:GREEN, fontSize:14}},
  {text:"수련생 기록권. 싸야 한다 — 입소문이 원장을 끌어온다(B2B2C).", options:{color:BODY, fontSize:12}}],
  {x:0.85, y:3.5, w:5.5, h:0.9, fontFace:F, valign:"top", lineSpacingMultiple:1.15, margin:0});
// 좌하: 곳당
card(s, 0.6, 4.65, 6.0, 1.4, INK);
s.addText("곳당 월 매출 (회원 80~120명 가정)", {x:0.85, y:4.8, w:5.5, h:0.35, fontFace:F, fontSize:12, bold:true, color:SAGE, margin:0});
s.addText([{text:"41~47만 ", options:{color:SAGELT, fontSize:13}},{text:"(전환 20%)", options:{color:SAGE, fontSize:11}},
  {text:"   →   ", options:{color:GOLD}},
  {text:"58~72만 ", options:{color:WHITE, bold:true, fontSize:15}},{text:"(전환 50%·성숙)", options:{color:SAGE, fontSize:11}}],
  {x:0.85, y:5.2, w:5.6, h:0.7, fontFace:F, valign:"middle", lineSpacingMultiple:1.1, margin:0});
// 우: 3-tier 시나리오
card(s, 6.75, 1.95, 5.95, 4.1, WHITE);
s.addText("3년차 연 매출 — 조건을 붙여 말한다", {x:7.0, y:2.12, w:5.5, h:0.4, fontFace:F, fontSize:13, bold:true, color:INK, margin:0});
[["기본 (보수)","20~26억","500곳 · 발표에서 먼저 말하는 숫자", SAGELT, INK],
 ["성숙 (전환 50%)","35~39억","서비스 완성·마케팅 가정의 상단", GOLD, WHITE],
 ["공격 (조건부)","약 60억","1,000곳 + 유료 30명 — 조건부로만", INK, WHITE]].forEach(([k,v,d,fill,col],i)=>{
  const y = 2.65 + i*1.08;
  card(s, 7.0, y, 5.45, 0.95, fill);
  s.addText(k, {x:7.25, y:y+0.12, w:2.4, h:0.4, fontFace:F, fontSize:13, bold:true, color:col, valign:"middle", margin:0});
  s.addText(v, {x:9.55, y:y+0.1, w:2.7, h:0.45, fontFace:F, fontSize:19, bold:true, color: fill===SAGELT?INK:(fill===GOLD?WHITE:GOLD), align:"right", valign:"middle", margin:0});
  s.addText(d, {x:7.25, y:y+0.5, w:5.0, h:0.4, fontFace:F, fontSize:10.5, color: fill===SAGELT?MUTE:SAGELT, valign:"top", margin:0});
});
src(s, "출처: §3 워크시트(전환율 50%=성숙 가정·동환님 추정) · BM 노트(기본 20~26억·60억은 공격 시나리오). 회원수·전환율은 [가정], PoC로 실측.");
foot(s, 10);

// ============ S11 §3 BYOK 간편연동 ============
s = p.addSlide(); bg(s, WHITE); head(s, "03", "DATA SOVEREIGNTY", "BYOK의 부담은 우리가 흡수한다 — '간편 연동'");
card(s, 0.6, 1.95, 12.1, 1.15, MIST);
s.addText([
  {text:"\"BYOK가 장점\"이라고만 쓰면 역효과", options:{bold:true, color:INK}},
  {text:" — 자유는 곧 부담. \"그럼 내가 따로 구독하고 API 키를 발급하라고?\"  →  ", options:{color:BODY}},
  {text:"부담을 우리가 흡수한다.", options:{bold:true, color:GOLD}},
], {x:0.9, y:2.1, w:11.5, h:0.85, fontFace:F, fontSize:14, valign:"middle", lineSpacingMultiple:1.15, margin:0});
card(s, 0.6, 3.35, 5.95, 2.7, INK);
s.addText("간편 연동 (스폰서 인프라)", {x:0.85, y:3.55, w:5.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:GOLD, margin:0});
s.addText([{text:"· 네이버 오브젝트 스토리지 ", options:{color:WHITE, bold:true}},{text:"간편 연동\n", options:{color:SAGELT}},
  {text:"· 앤트로픽 클로드 ", options:{color:WHITE, bold:true}},{text:"간편 연동\n\n", options:{color:SAGELT}},
  {text:"사용자는 키·발급을 의식하지 않고 '연동 켜기'만. (InBodyLIKE 스폰서 = 네이버·앤트로픽)", options:{color:SAGE, fontSize:12}}],
  {x:0.85, y:3.98, w:5.5, h:2.0, fontFace:F, fontSize:14, valign:"top", lineSpacingMultiple:1.2, margin:0});
card(s, 6.75, 3.35, 5.95, 2.7, WHITE);
s.addText("발레파킹 BM — 데이터 주권", {x:7.0, y:3.55, w:5.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:GREEN, margin:0});
s.addText([{text:"데이터는 고객 소유", options:{bold:true, color:INK}},{text:" (data plane)\n", options:{color:BODY}},
  {text:"momso는 운영만", options:{bold:true, color:INK}},{text:" (control plane)\n\n", options:{color:BODY}},
  {text:"\"우리는 고객 데이터를 팔거나 가두지 않는다\" → 민감 데이터를 믿고 맡기는 신뢰 + 가격 정당화.", options:{color:BODY, fontSize:12}}],
  {x:7.0, y:3.98, w:5.5, h:2.0, fontFace:F, fontSize:14, valign:"top", lineSpacingMultiple:1.2, margin:0});
src(s, "출처: §3 워크시트(Joplin=OneDrive 호환 인사이트) · web2.5 가입대행 BM. ⚠️ '별도 결제 없이'는 스폰서 크레딧 확정 시 추가(서류 통과 후 확인).");
foot(s, 11);

// ============ S12 §4 팀 ============
s = p.addSlide(); bg(s, WHITE); head(s, "04", "TEAM", "왜 우리 — 요가를 '아는' 사람과 '만드는' 사람");
card(s, 0.6, 1.95, 5.95, 2.0, MIST);
s.addText("유동환", {x:0.85, y:2.12, w:5.5, h:0.4, fontFace:F, fontSize:16, bold:true, color:INK, margin:0});
s.addText("요가 도메인 · 현장 PoC(빅블루) · 연희동 네트워크\n증거: 연희 요가 위크 1,677명(정산 기준) · 리뷰 123건 · 리뷰 밀도 2위/채움률 93.0%", {x:0.85, y:2.55, w:5.5, h:1.3, fontFace:F, fontSize:12, color:BODY, valign:"top", lineSpacingMultiple:1.15, margin:0});
card(s, 6.75, 1.95, 5.95, 2.0, INK);
s.addText("김성균", {x:7.0, y:2.12, w:5.5, h:0.4, fontFace:F, fontSize:16, bold:true, color:WHITE, margin:0});
s.addText("전략 · 기술 · 문서화 · 데이터 주권 설계\n증거: 작동하는 momso.vercel.app · 아키텍처", {x:7.0, y:2.55, w:5.5, h:1.3, fontFace:F, fontSize:13, color:SAGELT, valign:"top", lineSpacingMultiple:1.2, margin:0});
card(s, 0.6, 4.1, 6.0, 1.95, WHITE);
s.addText("\"개발자도 없는데 되나?\" — 3단 방어", {x:0.85, y:4.25, w:5.6, h:0.4, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
s.addText("① 이미 작동하는 데모 = 증거\n② AI 보조개발로 2인이 PoC 도달\n③ 채용은 투자 후 (불확실성 전가 안 함)", {x:0.85, y:4.68, w:5.6, h:1.3, fontFace:F, fontSize:12.5, color:BODY, valign:"top", lineSpacingMultiple:1.25, margin:0});
card(s, 6.75, 4.1, 5.95, 1.95, MIST);
s.addText("영업 공백 — 4중 보완", {x:7.0, y:4.25, w:5.5, h:0.4, fontFace:F, fontSize:13, bold:true, color:GREEN, margin:0});
s.addText("창업자 직접영업 · 연희동 클러스터 등대 · B2C-pull(inbound) · 인바디 파트너 채널  → playbook 검증 후 영업 매니저 채용", {x:7.0, y:4.68, w:5.5, h:1.3, fontFace:F, fontSize:12.5, color:BODY, valign:"top", lineSpacingMultiple:1.22, margin:0});
src(s, "출처: §4 워크시트 · 영업 채용·투자 원칙(2026-06-05). 가장 부족한 역할=영업(정직).");
foot(s, 12);

// ============ S13 §5 인바디 협업 ============
s = p.addSlide(); bg(s, WHITE); head(s, "05", "PARTNERSHIP", "인바디 협업 — win-win, 그리고 과장하지 않는 연동");
card(s, 0.6, 1.95, 6.0, 2.55, MIST);
s.addText("인바디가 얻는 것", {x:0.85, y:2.1, w:5.5, h:0.35, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
[["요가원 미점유","요가 도메인 진입 통로"],
 ["측정값의 '그래서 뭐?'","수업 맥락으로 변화를 설명 → 앱 가치↑"],
 ["정량 일변도","정성+HITL로 신뢰·주권 결 맞춤"]].forEach(([a,b],i)=>{
  const y = 2.5 + i*0.62;
  s.addText("인바디: "+a, {x:0.9, y:y, w:5.4, h:0.3, fontFace:F, fontSize:11.5, color:MUTE, margin:0});
  s.addText("→ "+b, {x:0.9, y:y+0.28, w:5.4, h:0.34, fontFace:F, fontSize:12.5, bold:true, color:INK, margin:0});
});
card(s, 6.75, 1.95, 5.95, 2.55, WHITE);
s.addText("3단 연동 로드맵 — '즉시 직결' 약속 안 함", {x:7.0, y:2.1, w:5.5, h:0.35, fontFace:F, fontSize:13, bold:true, color:GREEN, margin:0});
[["①","직접 입력 (즉시)","계약 불필요 — 지금 작동", GOLD],
 ["②","앱 연동 (협조)","인바디 앱 데이터·센터찾기 (앱-앱)", GREEN],
 ["③","공식 API (심화)","계약·승인 후 직결 — 단계적", SAGE]].forEach(([n,t,d,c],i)=>{
  const y = 2.55 + i*0.62;
  s.addShape(p.shapes.OVAL, {x:7.0, y:y, w:0.38, h:0.38, fill:{color:c}});
  s.addText(n, {x:7.0, y:y, w:0.38, h:0.38, fontFace:F, fontSize:11, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText([{text:t+"  ", options:{bold:true, color:INK}},{text:d, options:{color:MUTE, fontSize:10.5}}], {x:7.5, y:y, w:5.0, h:0.55, fontFace:F, fontSize:12, valign:"middle", margin:0});
});
card(s, 0.6, 4.7, 12.1, 1.35, INK);
s.addText("첫 요청 = 작은 문을 먼저 연다", {x:0.9, y:4.88, w:11.5, h:0.4, fontFace:F, fontSize:14, bold:true, color:GOLD, margin:0});
s.addText("큰 API·계약이 아니라 → 빅블루 1곳에서 8~12주 공동 PoC + 데이터 해석 멘토링. 거절 비용이 낮고, 잘 되면 앱 연동·API는 자연히 따라온다.", {x:0.9, y:5.28, w:11.5, h:0.7, fontFace:F, fontSize:13.5, color:SAGELT, valign:"top", lineSpacingMultiple:1.15, margin:0});
src(s, "출처: §5 워크시트 · 인바디 앱-앱 연동 합의(2026-06-06) · 연동 타당성 리서치(2026-05-26).");
foot(s, 13);

// ============ S14 CLOSING / ASK ============
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:10.2, y:-1.8, w:5.6, h:5.6, fill:{color:GREEN}});
s.addText("우리의 요청", {x:0.9, y:1.1, w:9, h:0.45, fontFace:F, fontSize:13, bold:true, color:GOLD, charSpacing:3, margin:0});
s.addText("인바디와 8~12주 공동 PoC.", {x:0.9, y:1.65, w:11.5, h:0.9, fontFace:F, fontSize:34, bold:true, color:WHITE, margin:0});
s.addText("정량 데이터(인바디) × 수업 맥락(momso)의 재방문 효과를, 빅블루에서 함께 검증한다.", {x:0.92, y:2.75, w:11.3, h:0.6, fontFace:F, fontSize:17, color:SAGELT, margin:0});
const cl = [
  ["문제","수업의 말·교정·감각은 끝나면 사라진다 — 변화가 안 보여 동기·재방문이 끊긴다."],
  ["해결","AI 초안 → 강사 검수(HITL) → 회원별 축적. 작동하는 데모 보유."],
  ["시장·BM","요가 쐐기→필라·PT 확장. B2B 30만+B2C 7천, 기본 20~26억(공격 60억은 조건부)."],
];
let cy = 3.7;
cl.forEach(([k,v])=>{
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:0.9, y:cy, w:1.7, h:0.6, fill:{color:GOLD}, rectRadius:0.06});
  s.addText(k, {x:0.9, y:cy, w:1.7, h:0.6, fontFace:F, fontSize:13, bold:true, color:INK, align:"center", valign:"middle", margin:0});
  s.addText(v, {x:2.8, y:cy, w:9.7, h:0.6, fontFace:F, fontSize:13.5, color:WHITE, valign:"middle", margin:0});
  cy += 0.78;
});
s.addText("momso — 인바디는 몸의 스펙을, momso는 수업의 맥락을 기록합니다.", {x:0.9, y:6.5, w:11.5, h:0.4, fontFace:F, fontSize:13, italic:true, color:SAGE, margin:0});

const outputPath = path.join(__dirname, "08_몸소_지원서초안.pptx");
p.writeFile({ fileName: outputPath })
  .then(f => console.log("OK:", f))
  .catch(e => console.error("ERR:", e));
