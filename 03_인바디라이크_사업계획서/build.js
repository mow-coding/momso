const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
p.author = "빅블루 요가 (momso)";
p.title = "momso × InBodyLIKE 사업계획서";

// ---------- palette ----------
const INK = "163F38";   // deep brand green
const GREEN = "2E6657"; // mid green
const SAGE = "7FA899";  // sage
const SAGELT = "DDE9E3";// light sage
const MIST = "F3F6F4";  // off-white green-grey
const WHITE = "FFFFFF";
const GOLD = "C8A04A";  // warm accent
const BODY = "2A332F";  // body text
const MUTE = "6F7E78";  // muted
const F = "Malgun Gothic";
const W = 13.333, H = 7.5;

const sh = () => ({ type: "outer", color: "163F38", blur: 7, offset: 2, angle: 135, opacity: 0.13 });

function bg(s, c){ s.background = { color: c }; }
function foot(s, n, dark){
  s.addText([{text:"momso × InBodyLIKE  ·  사업계획서", options:{color: dark?SAGE:MUTE, fontSize:8}}],
    {x:0.5, y:H-0.42, w:6, h:0.3, fontFace:F, align:"left", valign:"middle", margin:0});
  s.addText(String(n), {x:W-1.0, y:H-0.42, w:0.5, h:0.3, fontFace:F, fontSize:9, color: dark?SAGE:MUTE, align:"right", valign:"middle", margin:0});
}
// section header for light content slides
function head(s, secNo, secLabel, title){
  s.addShape(p.shapes.OVAL, {x:0.55, y:0.45, w:0.42, h:0.42, fill:{color:INK}});
  s.addText(secNo, {x:0.55, y:0.45, w:0.42, h:0.42, fontFace:F, fontSize:13, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(secLabel, {x:1.08, y:0.46, w:8, h:0.4, fontFace:F, fontSize:12, bold:true, color:GOLD, align:"left", valign:"middle", charSpacing:2, margin:0});
  s.addText(title, {x:0.5, y:0.95, w:12.3, h:0.85, fontFace:F, fontSize:27, bold:true, color:INK, align:"left", valign:"top", margin:0});
}
function chip(s, x, y, w, text, fill, col){
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x, y, w, h:0.42, fill:{color:fill}, rectRadius:0.08});
  s.addText(text, {x, y, w, h:0.42, fontFace:F, fontSize:11.5, color:col, align:"center", valign:"middle", margin:0});
}
function card(s, x, y, w, h, fill){
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x, y, w, h, fill:{color:fill||WHITE}, rectRadius:0.07, shadow:sh()});
}
function src(s, text){
  s.addText(text, {x:0.5, y:H-0.72, w:12.3, h:0.28, fontFace:F, fontSize:8.5, italic:true, color:MUTE, align:"left", valign:"middle", margin:0});
}

// ================= S1 TITLE =================
let s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:10.6, y:-1.6, w:5.2, h:5.2, fill:{color:GREEN}});
s.addShape(p.shapes.OVAL, {x:11.9, y:4.4, w:3.6, h:3.6, fill:{color:"1C4A41"}});
s.addText("InBodyLIKE 2026  ·  사업계획서", {x:0.9, y:1.5, w:9, h:0.5, fontFace:F, fontSize:15, color:GOLD, bold:true, charSpacing:2, margin:0});
s.addText("momso", {x:0.85, y:2.1, w:9, h:1.5, fontFace:F, fontSize:84, bold:true, color:WHITE, margin:0});
s.addText("몸소", {x:0.92, y:3.55, w:9, h:0.7, fontFace:F, fontSize:24, color:SAGE, margin:0});
s.addText("인바디는 몸의 스펙을, momso는 수업의 맥락을 기록합니다.",
  {x:0.9, y:4.5, w:11, h:0.7, fontFace:F, fontSize:20, color:WHITE, margin:0});
s.addShape(p.shapes.LINE, {x:0.92, y:5.5, w:3.2, h:0, line:{color:GOLD, width:2}});
s.addText("빅블루 요가  ·  공동대표 유동환 · 김성균  ·  서울 연희동      |      2026.06",
  {x:0.9, y:5.7, w:11.5, h:0.5, fontFace:F, fontSize:13, color:SAGELT, margin:0});

// ================= S2 한 줄 정의 =================
s = p.addSlide(); bg(s, WHITE); head(s, "0", "POSITIONING", "momso는 '수업 맥락 기록 레이어'입니다");
card(s, 0.6, 2.05, 12.1, 1.7, MIST);
s.addText([
  {text:"요가·웰니스 수업의 ", options:{color:BODY}},
  {text:"언어 · 교정 · 감각", options:{color:INK, bold:true}},
  {text:"을 ", options:{color:BODY}},
  {text:"강사 검수", options:{color:GOLD, bold:true}},
  {text:"를 거쳐 ", options:{color:BODY}},
  {text:"개인 수련 기록", options:{color:INK, bold:true}},
  {text:"으로 바꾸는 서비스", options:{color:BODY}},
], {x:1.1, y:2.35, w:11.1, h:1.1, fontFace:F, fontSize:24, valign:"middle", lineSpacingMultiple:1.15, margin:0});
s.addText("momso가 아닌 것 — 이미 포화된 포지션은 피한다", {x:0.65, y:4.2, w:11, h:0.4, fontFace:F, fontSize:13, bold:true, color:MUTE, margin:0});
const nots = ["요가원 CRM", "예약·결제 앱", "웰니스 패스", "AI 회의록 앱", "인바디 장비 판매"];
nots.forEach((t,i)=> chip(s, 0.65 + i*2.42, 4.75, 2.25, "✕ "+t, SAGELT, GREEN));
src(s, "출처: 노트 06 정의와 제품원칙 · 거시 포지셔닝 리서치(GPT 고급이성).");
foot(s, 2);

// ================= S3 EXEC SUMMARY =================
s = p.addSlide(); bg(s, WHITE); head(s, "01", "EXECUTIVE SUMMARY", "한 장 요약");
const ex = [
  ["문제", "수업의 핵심(말·교정·감각)이 수업 후 사라진다. 기존 도구는 각자 일부만 기록.", INK],
  ["해결", "AI 초안 → 강사 검수(HITL) → 개인 리포트. 작동하는 모바일 웹앱 데모 보유.", GREEN],
  ["시장", "요가+필라테스+PT 프리미엄 스튜디오. SAM 4,000~8,000개 [추정].", GREEN],
  ["BM", "B2B 월 30만 + B2C 월 5~7천. 데이터는 고객 소유, momso는 운영(발레파킹).", GREEN],
  ["요청", "인바디와 8~12주 PoC — 정량 데이터 × 수업 맥락의 재방문 효과 검증.", GOLD],
];
let yy = 1.95;
ex.forEach(([k,v,c])=>{
  card(s, 0.6, yy, 12.1, 0.92, MIST);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:0.85, y:yy+0.21, w:1.55, h:0.5, fill:{color:c}, rectRadius:0.06});
  s.addText(k, {x:0.85, y:yy+0.21, w:1.55, h:0.5, fontFace:F, fontSize:14, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(v, {x:2.65, y:yy, w:9.9, h:0.92, fontFace:F, fontSize:14.5, color:BODY, valign:"middle", margin:0});
  yy += 1.02;
});
foot(s, 3);

// ================= S4 PROBLEM 1 =================
s = p.addSlide(); bg(s, WHITE); head(s, "02", "PROBLEM", "수업의 가치는 '그 순간의 말과 감각'인데, 끝나면 사라진다");
card(s, 0.6, 2.0, 6.0, 4.2, MIST);
s.addText("현장에서 일어나는 일", {x:0.9, y:2.25, w:5.4, h:0.4, fontFace:F, fontSize:15, bold:true, color:INK, margin:0});
s.addText([
  {text:"수업 중 지도자의 교정·큐잉·언어가 핵심 데이터다", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"그러나 귀가와 동시에 빠르게 흐려진다", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"수기 '수련 수첩'은 실패 — 수십 명 피드백을 손으로 못 남긴다", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"가장 큰 손실: 수업 중 포착한 영감이 기록 시점에 휘발", options:{bullet:true, color:BODY}},
], {x:0.9, y:2.75, w:5.4, h:3.3, fontFace:F, fontSize:14.5, valign:"top", paraSpaceAfter:10, margin:0});
card(s, 6.85, 2.0, 5.85, 4.2, INK);
s.addText("고객 리뷰가 증명하는 통점", {x:7.15, y:2.25, w:5.2, h:0.4, fontFace:F, fontSize:15, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"“그날 얻은 교정 피드백이 일회성으로 사라진다”", options:{breakLine:true, color:WHITE, italic:true}},
  {text:"“몸 사용법을 다시 배웠는데, 집에 가면 흐려진다”", options:{breakLine:true, color:WHITE, italic:true}},
], {x:7.15, y:2.85, w:5.25, h:1.6, fontFace:F, fontSize:15, valign:"top", paraSpaceAfter:14, margin:0});
s.addText("리뷰 123건(3.5년치) 역순 분석 결과", {x:7.15, y:5.3, w:5.2, h:0.5, fontFace:F, fontSize:12, color:SAGE, margin:0});
src(s, "출처: 노트 03 리뷰 123건 역순 분석 · 노트 04 5/13 기획회의 · 모두의창업 지원서 Q2.");
foot(s, 4);

// ================= S5 PROBLEM 2 — 공백 =================
s = p.addSlide(); bg(s, WHITE); head(s, "02", "PROBLEM", "기존 도구는 저마다 '일부'만 기록한다");
const tools = [
  ["CRM (바디코디)", "예약 · 결제 · 회원", SAGE],
  ["예약앱 (오붓)", "수업 접근 · 유입", SAGE],
  ["전사앱 (Tiro)", "음성 → 텍스트", SAGE],
  ["인바디", "몸의 정량 수치", SAGE],
];
tools.forEach(([t,v],i)=>{
  const x = 0.6 + i*3.05;
  card(s, x, 2.05, 2.85, 1.6, MIST);
  s.addText(t, {x:x+0.15, y:2.25, w:2.55, h:0.5, fontFace:F, fontSize:14, bold:true, color:INK, align:"center", margin:0});
  s.addText(v, {x:x+0.15, y:2.8, w:2.55, h:0.6, fontFace:F, fontSize:12.5, color:BODY, align:"center", valign:"top", margin:0});
});
s.addText("▼  비어 있는 칸", {x:0.6, y:4.0, w:12, h:0.5, fontFace:F, fontSize:14, bold:true, color:MUTE, align:"center", margin:0});
card(s, 2.4, 4.55, 8.5, 1.55, INK);
s.addText([
  {text:"수업 안에서 오간 ", options:{color:WHITE}},
  {text:"언어 · 피드백 · 감각 · 반응", options:{color:GOLD, bold:true}},
  {text:"  →  momso", options:{color:WHITE, bold:true}},
], {x:2.6, y:4.75, w:8.1, h:0.55, fontFace:F, fontSize:20, align:"center", valign:"middle", margin:0});
s.addText("몸의 변화가 '어떤 수업 맥락에서' 만들어졌는지를 설명한다", {x:2.6, y:5.35, w:8.1, h:0.5, fontFace:F, fontSize:13, color:SAGELT, align:"center", margin:0});
src(s, "출처: 노트 06 · 노트 08 경쟁 지형. 바디코디 4,000개 센터·앱 사용자 170만+(회사 공개 수치).");
foot(s, 5);

// ================= S6 PROBLEM 3 — 단순 녹음 아님 =================
s = p.addSlide(); bg(s, WHITE); head(s, "02", "PROBLEM", "요가 수업은 '단순히 녹음해서 공유할 콘텐츠'가 아니다");
const risks = [
  ["개인정보", "통증·감정·사적 대화가 동의 항목 밖에서 섞인다"],
  ["타인 정보", "그룹 수업: A의 리포트에 B·C 정보가 혼입될 위험"],
  ["지도자 노하우", "시퀀스·큐잉은 경쟁력 — TTC 교육 자산 유출 우려"],
];
risks.forEach(([t,v],i)=>{
  const y = 2.05 + i*1.35;
  card(s, 0.6, y, 12.1, 1.18, MIST);
  s.addShape(p.shapes.OVAL, {x:0.85, y:y+0.32, w:0.55, h:0.55, fill:{color:GOLD}});
  s.addText(String(i+1), {x:0.85, y:y+0.32, w:0.55, h:0.55, fontFace:F, fontSize:16, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(t, {x:1.65, y:y, w:2.7, h:1.18, fontFace:F, fontSize:16, bold:true, color:INK, valign:"middle", margin:0});
  s.addText(v, {x:4.4, y:y, w:8.1, h:1.18, fontFace:F, fontSize:14.5, color:BODY, valign:"middle", margin:0});
});
s.addText("→  그래서 momso는 동의 · 필터링 · 강사 검수 · 노출 통제를 '핵심 기능'으로 둔다", {x:0.6, y:6.2, w:12.1, h:0.5, fontFace:F, fontSize:15, bold:true, color:GREEN, align:"center", margin:0});
src(s, "출처: 노트 07 피치덱 v3 · 노트 09 유동환 요가 도메인 우려 → 제품 전략.");
foot(s, 6);

// ================= S7 SOLUTION 정의+흐름 =================
s = p.addSlide(); bg(s, WHITE); head(s, "03", "SOLUTION", "수업 전 → 중 → 후 → 다음으로 도는 기록 흐름");
const flow = [
  ["수업 전", "인바디 참고 지표 · 오늘의 기록 초점"],
  ["수업 중", "강사 보호 녹음 · 원본 비공개"],
  ["수업 후", "AI 초안 → 강사 검수 → 개인 리포트"],
  ["다음 수업", "검수된 기록이 관찰 포인트로 환류"],
];
flow.forEach(([t,v],i)=>{
  const x = 0.6 + i*3.14;
  card(s, x, 2.2, 2.9, 2.6, i===2?INK:MIST);
  s.addText("0"+(i+1), {x:x+0.2, y:2.4, w:2.5, h:0.5, fontFace:F, fontSize:20, bold:true, color: i===2?GOLD:SAGE, margin:0});
  s.addText(t, {x:x+0.2, y:2.95, w:2.5, h:0.5, fontFace:F, fontSize:16, bold:true, color: i===2?WHITE:INK, margin:0});
  s.addText(v, {x:x+0.2, y:3.5, w:2.5, h:1.1, fontFace:F, fontSize:13, color: i===2?SAGELT:BODY, valign:"top", margin:0});
  if(i<3) s.addText("→", {x:x+2.78, y:3.1, w:0.5, h:0.6, fontFace:F, fontSize:22, bold:true, color:GOLD, align:"center", margin:0});
});
card(s, 0.6, 5.15, 12.1, 1.0, SAGELT);
s.addText([
  {text:"한 번 보고 끝나는 회의록이 아니라, ", options:{color:BODY}},
  {text:"다음 수업에서 다시 회수되는 수업 지식", options:{color:INK, bold:true}},
], {x:0.9, y:5.15, w:11.5, h:1.0, fontFace:F, fontSize:17, align:"center", valign:"middle", margin:0});
src(s, "출처: 노트 06 · 노트 13 ai위키 프로토타입(회수 루프).");
foot(s, 7);

// ================= S8 제품 흐름 상세 (MVP) =================
s = p.addSlide(); bg(s, WHITE); head(s, "03", "SOLUTION", "MVP — 강사용 작업 흐름 5단계");
const mvp = [
  ["오늘의 수업", "수업·참여 수련생 선택 → AI 위키(RAG) 검색 범위가 좁혀짐"],
  ["보호 녹음", "강사만 기록 시작 · 민감 구간 제외 · 원본 기본 비공개"],
  ["AI 작업대 · 검수", "AI가 '대화의 초점' 단위로 분류 → 강사가 공유/내부/보류/제외 확정"],
  ["수련생 리포트", "공유 확정 문장만 발행 · 인바디 참고 지표 · 감각 메모"],
  ["다음 수업 맥락", "확정된 기록이 다음 수업의 관찰 포인트로 돌아옴"],
];
mvp.forEach(([t,v],i)=>{
  const y = 1.95 + i*0.92;
  s.addShape(p.shapes.OVAL, {x:0.6, y:y+0.12, w:0.6, h:0.6, fill:{color:i===2?GOLD:INK}});
  s.addText(String(i+1), {x:0.6, y:y+0.12, w:0.6, h:0.6, fontFace:F, fontSize:17, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  card(s, 1.45, y, 11.25, 0.82, i===2?MIST:WHITE);
  if(i!==2) s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:1.45, y:y, w:11.25, h:0.82, fill:{color:WHITE}, rectRadius:0.06, line:{color:SAGELT, width:1}});
  s.addText(t, {x:1.75, y:y, w:3.0, h:0.82, fontFace:F, fontSize:15.5, bold:true, color:INK, valign:"middle", margin:0});
  s.addText(v, {x:4.8, y:y, w:7.7, h:0.82, fontFace:F, fontSize:13.5, color:BODY, valign:"middle", margin:0});
});
src(s, "출처: 노트 11 프로토타입 · 노트 13 ai위키 프로토타입(초점 검수) · PRD v1.");
foot(s, 8);

// ================= S9 HITL 5원칙 =================
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:0.55, y:0.45, w:0.42, h:0.42, fill:{color:GOLD}});
s.addText("03", {x:0.55, y:0.45, w:0.42, h:0.42, fontFace:F, fontSize:13, bold:true, color:INK, align:"center", valign:"middle", margin:0});
s.addText("PRINCIPLE", {x:1.08, y:0.46, w:8, h:0.4, fontFace:F, fontSize:12, bold:true, color:GOLD, charSpacing:2, valign:"middle", margin:0});
s.addText("제품을 관통하는 HITL 5원칙", {x:0.5, y:0.95, w:12, h:0.8, fontFace:F, fontSize:27, bold:true, color:WHITE, margin:0});
const pr = [
  ["AI는 초안만", "강사가 검수해 공유/내부/보류/제외로 확정 · 자동 발송 금지"],
  ["원본 비공개", "원본 음성·전체 전사본은 기본 비공개 · 검수된 문장만 발행"],
  ["수련생 무단 녹음 금지", "수련생 앱엔 녹음 기능 없음 · 강사·요가원 노하우 보호"],
  ["인바디는 참고 지표", "‘진단·평가·처방 아님’ — 면책을 화면에 명시"],
  ["다음 수업으로 환류", "1회성 리포트가 아니라 누적되는 수업 아카이브"],
];
pr.forEach(([t,v],i)=>{
  const y = 2.0 + i*0.92;
  s.addText(String(i+1), {x:0.65, y:y, w:0.7, h:0.78, fontFace:F, fontSize:30, bold:true, color:GOLD, align:"center", valign:"middle", margin:0});
  s.addText(t, {x:1.5, y:y, w:3.9, h:0.78, fontFace:F, fontSize:17, bold:true, color:WHITE, valign:"middle", margin:0});
  s.addText(v, {x:5.5, y:y, w:7.2, h:0.78, fontFace:F, fontSize:13.5, color:SAGELT, valign:"middle", margin:0});
  if(i<4) s.addShape(p.shapes.LINE, {x:1.5, y:y+0.85, w:11.2, h:0, line:{color:GREEN, width:1}});
});
foot(s, 9, true);

// ================= S10 데이터 3계층 =================
s = p.addSlide(); bg(s, WHITE); head(s, "03", "SOLUTION", "데이터 3계층 + 발행 게이트");
const layers = [
  ["raw  (원본)", "녹음·전체 전사·미검수 초안", "고객 소유 · 기본 비공개", SAGELT, INK],
  ["metadata", "초점·태그·수련생·RAG 색인", "AI 위키의 ‘지도’ · 다음 수업 재사용", MIST, INK],
  ["shareable  (공유)", "강사가 확정한 리포트만", "수련생 앱 · API · SNS 확장 기반", INK, WHITE],
];
layers.forEach(([t,v,w2,fill,col],i)=>{
  const x = 0.6 + i*4.12;
  card(s, x, 2.1, 3.85, 2.9, fill);
  s.addText(t, {x:x+0.25, y:2.35, w:3.35, h:0.5, fontFace:F, fontSize:17, bold:true, color: i===2?GOLD:INK, margin:0});
  s.addText(v, {x:x+0.25, y:2.95, w:3.35, h:0.9, fontFace:F, fontSize:13.5, color: col===WHITE?WHITE:BODY, valign:"top", margin:0});
  s.addText(w2, {x:x+0.25, y:4.15, w:3.35, h:0.7, fontFace:F, fontSize:12, color: col===WHITE?SAGELT:MUTE, valign:"top", margin:0});
  if(i<2) s.addText("→", {x:x+3.78, y:3.1, w:0.4, h:0.6, fontFace:F, fontSize:22, bold:true, color:GOLD, align:"center", margin:0});
});
card(s, 0.6, 5.3, 12.1, 0.95, MIST);
s.addText([
  {text:"발행 게이트:  ", options:{color:INK, bold:true}},
  {text:"‘공유’로 확정한 문장이 1개 이상일 때만 발행 가능 — 검수가 바뀌면 발행은 자동 무효화", options:{color:BODY}},
], {x:0.9, y:5.3, w:11.5, h:0.95, fontFace:F, fontSize:14.5, align:"center", valign:"middle", margin:0});
src(s, "출처: 노트 11 · 노트 13. 앱 화면엔 내부 설계어 대신 사용자 언어만 노출(원본 숨김/강사 검수/검수본만 발행).");
foot(s, 10);

// ================= S11 라이브 데모 =================
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:-1.5, y:4.5, w:5, h:5, fill:{color:GREEN}});
s.addText("LIVE DEMO", {x:0.9, y:1.2, w:8, h:0.5, fontFace:F, fontSize:13, bold:true, color:GOLD, charSpacing:2, margin:0});
s.addText("스크린샷이 아니라, 클릭 가능한 모바일 웹앱", {x:0.85, y:1.7, w:11.5, h:0.9, fontFace:F, fontSize:28, bold:true, color:WHITE, margin:0});
card(s, 0.9, 3.0, 5.7, 2.9, "1F4A41");
s.addText("강사용 · 5탭", {x:1.2, y:3.2, w:5, h:0.5, fontFace:F, fontSize:16, bold:true, color:GOLD, margin:0});
s.addText("수업  →  녹음  →  검수  →  리포트  →  다음", {x:1.2, y:3.8, w:5.2, h:0.6, fontFace:F, fontSize:14, color:WHITE, margin:0});
s.addText("AI 초안을 ‘초점 단위’로 검수 · 공유 확정만 발행", {x:1.2, y:4.5, w:5.2, h:1.2, fontFace:F, fontSize:13, color:SAGELT, valign:"top", margin:0});
card(s, 6.85, 3.0, 5.6, 2.9, "1F4A41");
s.addText("수련생용 · 4탭", {x:7.15, y:3.2, w:5, h:0.5, fontFace:F, fontSize:16, bold:true, color:GOLD, margin:0});
s.addText("홈  →  리포트  →  아카이브  →  연결", {x:7.15, y:3.8, w:5, h:0.6, fontFace:F, fontSize:14, color:WHITE, margin:0});
s.addText("검수된 리포트만 수신 · 원본·전체 전사 비공개", {x:7.15, y:4.5, w:5, h:1.2, fontFace:F, fontSize:13, color:SAGELT, valign:"top", margin:0});
s.addText("데모 URL:  momso.vercel.app    ·    제출 PDF에 클릭 가능한 링크로 삽입", {x:0.9, y:6.15, w:11.5, h:0.5, fontFace:F, fontSize:13, color:WHITE, margin:0});
foot(s, 11, true);

// ================= S12 시장 정의 =================
s = p.addSlide(); bg(s, WHITE); head(s, "04", "MARKET", "시장은 '요가 단독'이 아니라 프리미엄 참여형 스튜디오");
card(s, 0.6, 2.05, 5.9, 4.1, MIST);
s.addText("왜 요가만으로 정의하지 않나", {x:0.9, y:2.3, w:5.3, h:0.4, fontFace:F, fontSize:15, bold:true, color:INK, margin:0});
s.addText([
  {text:"요가원·필라테스 단독 공식 통계가 약하다", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"수업 중 언어·피드백이 자산이 되는 업장은 공통", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"→ 요가 + 필라테스 + PT 프리미엄 케어 스튜디오로 정의", options:{bullet:true, color:BODY}},
], {x:0.9, y:2.85, w:5.3, h:3.0, fontFace:F, fontSize:14.5, paraSpaceAfter:12, margin:0});
card(s, 6.75, 2.05, 5.95, 4.1, INK);
s.addText("초기 타깃 (가장 까다로운 첫 시장)", {x:7.05, y:2.3, w:5.4, h:0.4, fontFace:F, fontSize:15, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"1:1 개인 수업", options:{bullet:true, breakLine:true, color:WHITE}},
  {text:"2~4인 소그룹", options:{bullet:true, breakLine:true, color:WHITE}},
  {text:"프리미엄 케어형 요가·필라테스·PT 스튜디오", options:{bullet:true, color:WHITE}},
], {x:7.05, y:2.9, w:5.4, h:2.0, fontFace:F, fontSize:15, paraSpaceAfter:14, margin:0});
s.addText("대형 그룹은 초기 매출보다 PoC·브랜드 실험장", {x:7.05, y:5.45, w:5.4, h:0.5, fontFace:F, fontSize:12.5, color:SAGE, margin:0});
src(s, "출처: 노트 08 시장·BM 검증 · 노트 09 도메인 전략(타깃 축소).");
foot(s, 12);

// ================= S13 TAM/SAM/SOM =================
s = p.addSlide(); bg(s, WHITE); head(s, "04", "MARKET", "TAM · SAM · SOM");
const funnel = [
  ["공식 통계 (참고)", "스포츠산업 사업체 131,764  ·  스포츠시설업 49,082", 11.8, INK],
  ["Middle TAM", "약 3.6만~3.9만 개  →  약 1,470~2,060억 원   [추정]", 9.9, GREEN],
  ["SAM", "4,000~8,000 개  →  약 163~422억 원   [추정]", 8.0, SAGE],
  ["SOM (3년차)", "기준 500개  ·  공격 1,000개", 6.1, GOLD],
];
let fy = 2.05;
funnel.forEach(([t,v,w2,c])=>{
  const x = (W - w2)/2;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x, y:fy, w:w2, h:0.92, fill:{color:c}, rectRadius:0.06});
  s.addText(t, {x:x+0.3, y:fy, w:2.5, h:0.92, fontFace:F, fontSize:15, bold:true, color:WHITE, valign:"middle", margin:0});
  s.addText(v, {x:x+2.9, y:fy, w:w2-3.2, h:0.92, fontFace:F, fontSize:13, color:WHITE, valign:"middle", align:"left", margin:0});
  fy += 1.05;
});
src(s, "출처: 노트 08. 공식=문체부 스포츠산업조사. 기타 스포츠 교육기관 23,483·체력단련장 12,669~15,548은 2차 대리 지표[추정]. 요가원 단독 통계 단정 금지.");
foot(s, 13);

// ================= S14 Why Now =================
s = p.addSlide(); bg(s, WHITE); head(s, "04", "MARKET", "Why Now — 지금이 적기인 이유");
const wn = [
  ["인바디의 위기감", "카메라 기반 AI 체형분석기(Exbody·Bodydot)가 부상 — 인바디는 데이터의 새 활용처가 필요하다"],
  ["AI가 현장에 닿는 시점", "전사·요약·RAG 기술이 수업 현장에서 실제로 쓸 만한 수준에 도달"],
  ["요가의 기록 계층 부재", "비정형·블랙박스 — 지도자도 맞는 수련생을, 수련생도 맞는 요가원을 못 찾는다"],
];
wn.forEach(([t,v],i)=>{
  const y = 2.1 + i*1.42;
  card(s, 0.6, y, 12.1, 1.28, i===0?INK:MIST);
  s.addText(t, {x:0.9, y:y, w:3.3, h:1.28, fontFace:F, fontSize:16, bold:true, color: i===0?GOLD:INK, valign:"middle", margin:0});
  s.addText(v, {x:4.3, y:y, w:8.2, h:1.28, fontFace:F, fontSize:13.5, color: i===0?WHITE:BODY, valign:"middle", margin:0});
});
src(s, "출처: 노트 08 경쟁·시장 · 노트 12 제품·전략 회의(인바디 위기감).");
foot(s, 14);

// ================= S15 경쟁 2x2 =================
s = p.addSlide(); bg(s, WHITE); head(s, "05", "COMPETITION", "경쟁 지형 — momso는 비어 있는 사분면에 들어간다");
// axes
const ax=2.2, ay=1.95, aw=8.7, ah=4.0;
s.addShape(p.shapes.RECTANGLE, {x:ax, y:ay, w:aw, h:ah, fill:{color:MIST}});
s.addShape(p.shapes.LINE, {x:ax+aw/2, y:ay, w:0, h:ah, line:{color:"C9D6CF", width:1.5}});
s.addShape(p.shapes.LINE, {x:ax, y:ay+ah/2, w:aw, h:0, line:{color:"C9D6CF", width:1.5}});
s.addText("정성 · 수업 맥락 ▲", {x:ax-1.85, y:ay-0.05, w:1.8, h:0.4, fontFace:F, fontSize:10.5, color:MUTE, align:"right", margin:0});
s.addText("▼ 정량 · 신체", {x:ax-1.85, y:ay+ah-0.35, w:1.8, h:0.4, fontFace:F, fontSize:10.5, color:MUTE, align:"right", margin:0});
s.addText("◀ 운영 관리", {x:ax, y:ay+ah+0.05, w:2.5, h:0.35, fontFace:F, fontSize:10.5, color:MUTE, margin:0});
s.addText("수업 기록 ▶", {x:ax+aw-2.5, y:ay+ah+0.05, w:2.5, h:0.35, fontFace:F, fontSize:10.5, color:MUTE, align:"right", margin:0});
function dot(x,y,label,c,big){
  const w2 = big?2.4:1.9, h2=0.5;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:x-w2/2, y:y-h2/2, w:w2, h:h2, fill:{color:c}, rectRadius:0.08, shadow: big?sh():undefined});
  s.addText(label, {x:x-w2/2, y:y-h2/2, w:w2, h:h2, fontFace:F, fontSize: big?13:11, bold:big, color: c===SAGELT?GREEN:WHITE, align:"center", valign:"middle", margin:0});
}
dot(ax+aw*0.22, ay+ah*0.30, "인바디", SAGE);            // 정량·운영쪽
dot(ax+aw*0.30, ay+ah*0.18, "체형분석기", SAGE);        // 정량
dot(ax+aw*0.20, ay+ah*0.74, "바디코디·오붓", SAGE);     // 운영
dot(ax+aw*0.62, ay+ah*0.40, "Tiro (전사)", SAGE);
dot(ax+aw*0.78, ay+ah*0.24, "momso", INK, true);        // 수업기록·정성 우상단
src(s, "출처: 노트 08. momso = 수업 기록 × 정성 맥락(우상단) — 기존 도구를 대체하지 않고 그 위에 얹힌다.");
foot(s, 15);

// ================= S16 차별점 =================
s = p.addSlide(); bg(s, WHITE); head(s, "05", "COMPETITION", "차별점 — 대체하지 않고 '위에 얹힌다'");
const diffs = [
  ["바디코디는 ", "센터 운영", "을, momso는 ", "수업 경험", "을 기록한다"],
  ["오붓은 ", "수업에 가게", " 하고, momso는 ", "수업이 남게", " 한다"],
  ["Tiro는 ", "음성을 글로", ", momso는 ", "수업을 수련 기록으로", " 바꾼다"],
];
diffs.forEach((d,i)=>{
  const y = 2.05 + i*1.05;
  card(s, 0.6, y, 12.1, 0.9, MIST);
  s.addText([
    {text:d[0], options:{color:BODY}},
    {text:d[1], options:{color:MUTE, bold:true}},
    {text:d[2], options:{color:BODY}},
    {text:d[3], options:{color:INK, bold:true}},
    {text:d[4], options:{color:BODY}},
  ], {x:0.9, y:y, w:11.5, h:0.9, fontFace:F, fontSize:17, valign:"middle", margin:0});
});
s.addText("가장 가까운 인접 — 포인티(PT 운동기록): momso는 요가의 언어·호흡·감각·정렬에 특화해 구분된다.",
  {x:0.6, y:5.4, w:12.1, h:0.5, fontFace:F, fontSize:13, color:MUTE, align:"center", margin:0});
src(s, "출처: 노트 06 · 노트 08(GPT 거시 포지셔닝 답변).");
foot(s, 16);

// ================= S17 BM 발레파킹 =================
s = p.addSlide(); bg(s, WHITE); head(s, "06", "BUSINESS MODEL", "발레파킹 · Web2.5 — 데이터는 고객, 운영은 momso");
card(s, 0.6, 2.05, 5.9, 4.1, MIST);
s.addText("발레파킹 비유", {x:0.9, y:2.3, w:5.3, h:0.4, fontFace:F, fontSize:15, bold:true, color:INK, margin:0});
s.addText([
  {text:"차(데이터)도 차고지(저장소)도 고객의 것", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"momso는 ‘주차(정리·운영)’만 대행한다", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"수익 = 데이터 소유료가 아니라 운영 자동화 비용", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"‘중요하나 귀찮은 일’ 대행 → J-커브", options:{bullet:true, color:BODY}},
], {x:0.9, y:2.85, w:5.3, h:3.0, fontFace:F, fontSize:14, paraSpaceAfter:11, margin:0});
card(s, 6.75, 2.05, 5.95, 4.1, INK);
s.addText("두 평면 분리", {x:7.05, y:2.3, w:5.4, h:0.4, fontFace:F, fontSize:15, bold:true, color:GOLD, margin:0});
s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:7.05, y:2.85, w:5.4, h:1.3, fill:{color:"1F4A41"}, rectRadius:0.06});
s.addText("data plane — 고객 소유", {x:7.25, y:2.95, w:5, h:0.4, fontFace:F, fontSize:13, bold:true, color:SAGE, margin:0});
s.addText("원본 녹음·교재·시퀀스·감각 기록 (momso 서버에 장기 보관 안 함, export 가능)", {x:7.25, y:3.35, w:5, h:0.75, fontFace:F, fontSize:12, color:WHITE, valign:"top", margin:0});
s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:7.05, y:4.3, w:5.4, h:1.55, fill:{color:"1F4A41"}, rectRadius:0.06});
s.addText("control plane — momso", {x:7.25, y:4.4, w:5, h:0.4, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
s.addText("동의·전사·검수·발행·권한·비용·요가원별 기록 문법(style memory) 운영", {x:7.25, y:4.8, w:5, h:0.95, fontFace:F, fontSize:12, color:WHITE, valign:"top", margin:0});
src(s, "출처: 노트 10 제품철학·발레파킹 BM · 노트 12(6/3 통화서 BM 확정). 외부 표현은 ‘Web3’ 전면화 금지.");
foot(s, 17);

// ================= S18 가격 구조 =================
s = p.addSlide(); bg(s, WHITE); head(s, "06", "BUSINESS MODEL", "가격 구조");
const rows = [
  [{text:"상품",options:{bold:true,color:WHITE}},{text:"월 가격",options:{bold:true,color:WHITE}},{text:"대상 · 비고",options:{bold:true,color:WHITE}}],
  ["B2C 기록권", "5,000~7,000원", "수련생 개인 수련 기록권 (저장비 아닌 ‘기록·리포트’로 포지셔닝)"],
  ["PoC · 파운딩", "무료~4.9만원", "초기 검증 · 협력 요가원"],
  ["Software Basic", "4.9~9.9만원", "기본 기록·검수·발행"],
  ["Studio Pro", "15~30만원", "기록+리포트+세팅 — 프리미엄 패키지(바디코디 약정가 15.84만 앵커)"],
  ["InBody Partner", "30만원+", "인바디 연동형 (별도 협의)"],
];
const tbl = rows.map((r,ri)=> r.map(c=>{
  const txt = typeof c==="string"? c : c.text;
  const o = typeof c==="string"? {} : c.options;
  return {text:txt, options:Object.assign({fontFace:F, fontSize: ri===0?13.5:13, color: ri===0?WHITE:BODY, valign:"middle", fill:{color: ri===0?INK : (ri%2? "FFFFFF":MIST)}, bold: ri===0||ri===4, margin:5}, o||{})};
}));
s.addTable(tbl, {x:0.6, y:2.0, w:12.1, colW:[3.0, 2.8, 6.3], rowH:[0.5,0.62,0.62,0.62,0.78,0.62], border:{type:"solid", pt:0.5, color:"DDE6E1"}, align:"left"});
src(s, "출처: 노트 07 피치덱 v3(BM) · 노트 08. ’30만원’은 단순 SaaS(시장가 15~22만)가 아니라 프리미엄 패키지일 때 방어. [가정] 전환율·믹스는 미검증.");
foot(s, 18);

// ================= S19 단위경제 =================
s = p.addSlide(); bg(s, WHITE); head(s, "06", "BUSINESS MODEL", "단위 경제 (요가원 1곳 기준)");
function stat(x, big, label, sub, c){
  card(s, x, 2.2, 3.75, 3.2, MIST);
  s.addText(big, {x:x, y:2.55, w:3.75, h:1.1, fontFace:F, fontSize:38, bold:true, color:c, align:"center", margin:0});
  s.addText(label, {x:x+0.2, y:3.7, w:3.35, h:0.5, fontFace:F, fontSize:15, bold:true, color:INK, align:"center", margin:0});
  s.addText(sub, {x:x+0.2, y:4.25, w:3.35, h:1.0, fontFace:F, fontSize:12, color:BODY, align:"center", valign:"top", margin:0});
}
stat(0.6, "월 34만", "기준 ARPA", "B2B 20만 + 수련생 20명 × 7천\n= 연 408만 원", GREEN);
stat(4.78, "월 44만", "프리미엄 ARPA", "B2B 30만 + 수련생 20명 × 7천\n= 연 528만 원", INK);
stat(8.96, "5 → 30명", "유료 수련생 [가정]", "초기 5~10 · 성숙 20 · 공격 30\n(보수가 아닌 성숙 기준)", GOLD);
src(s, "출처: 노트 08 BM 정정표(GPT 검증). ‘유료 20명’은 보수가 아니라 성숙 파트너 기준 — 초기엔 5~10명 [가정].");
foot(s, 19);

// ================= S20 매출 시나리오 (chart) =================
s = p.addSlide(); bg(s, WHITE); head(s, "06", "BUSINESS MODEL", "3년차 매출 시나리오 — 발표 기준은 500개");
s.addChart(p.charts.BAR, [
  {name:"기준 ARPA(연408만)", labels:["보수 300개","기준 500개","공격 1,000개"], values:[12.2, 20.4, 40.8]},
  {name:"프리미엄 ARPA(연528만)", labels:["보수 300개","기준 500개","공격 1,000개"], values:[15.8, 26.4, 52.8]},
], {
  x:0.7, y:2.0, w:7.6, h:4.0, barDir:"col",
  chartColors:[SAGE, INK], showLegend:true, legendPos:"b", legendFontSize:11, legendColor:BODY,
  catAxisLabelColor:BODY, catAxisLabelFontSize:11, valAxisLabelColor:MUTE, valAxisTitle:"연 매출 (억원)", showValAxisTitle:true, valAxisTitleColor:MUTE, valAxisTitleFontSize:10,
  valGridLine:{color:"E8EEEB", size:0.5}, catGridLine:{style:"none"},
  showValue:true, dataLabelPosition:"outEnd", dataLabelColor:INK, dataLabelFontSize:10, dataLabelFontBold:true,
  chartArea:{fill:{color:WHITE}},
});
card(s, 8.6, 2.0, 4.1, 4.0, INK);
s.addText("연 60억의 진실", {x:8.85, y:2.25, w:3.6, h:0.5, fontFace:F, fontSize:16, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"발표 기준 = 500개 = 20~26억", options:{breakLine:true, color:WHITE, bold:true}},
  {text:"", options:{breakLine:true, fontSize:6}},
  {text:"‘연 60억’은 1,000개 + 유료 30명(월 51만) 조건의 공격 시나리오에서만 = 61.2억", options:{color:SAGELT}},
], {x:8.85, y:2.85, w:3.6, h:2.6, fontFace:F, fontSize:14, valign:"top", margin:0});
src(s, "출처: 노트 08 BM 정정표·GPT 스팟체크. 60억은 기준 전망이 아니라 ‘조건부 공격 시나리오’로만 제시.");
foot(s, 20);

// ================= S21 GTM =================
s = p.addSlide(); bg(s, WHITE); head(s, "07", "GO-TO-MARKET", "확장 경로 — 빅블루에서 검증하고 웰니스로 넓힌다");
const gtm = [
  ["0", "빅블루 요가 자체 PoC", "연희동 · 현장 검증"],
  ["1", "연희동 로컬 3~5곳 베타", "프리미엄 케어 스튜디오"],
  ["2", "요가 + 필라테스 + PT", "참여형 스튜디오 확장"],
  ["3", "명상·재활·시니어·기업", "웰니스 전체"],
];
gtm.forEach(([n,t,v],i)=>{
  const x = 0.6 + i*3.14;
  s.addShape(p.shapes.OVAL, {x:x+1.0, y:2.2, w:0.9, h:0.9, fill:{color:i===0?GOLD:INK}});
  s.addText(n, {x:x+1.0, y:2.2, w:0.9, h:0.9, fontFace:F, fontSize:26, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  if(i<3) s.addShape(p.shapes.LINE, {x:x+1.95, y:2.65, w:1.2, h:0, line:{color:SAGE, width:2, dashType:"dash"}});
  card(s, x, 3.4, 2.9, 2.0, MIST);
  s.addText(t, {x:x+0.2, y:3.65, w:2.5, h:1.0, fontFace:F, fontSize:14.5, bold:true, color:INK, valign:"top", margin:0});
  s.addText(v, {x:x+0.2, y:4.7, w:2.5, h:0.6, fontFace:F, fontSize:12.5, color:BODY, valign:"top", margin:0});
});
src(s, "출처: 모두의창업 지원서 Q4 로드맵 · 노트 01 시간선 · 노트 09 도메인 확장.");
foot(s, 21);

// ================= S22 획득 전략 =================
s = p.addSlide(); bg(s, WHITE); head(s, "07", "GO-TO-MARKET", "획득 전략");
const acq = [
  ["맛보기 스푼", "방문 전 AI 챗봇으로 수업 스타일을 미리 체험 → 신규 탐색 비용·이탈 감소"],
  ["수련생 → 원장 (바이럴)", "소비자 앱이 매력적이면 수련생이 원장에게 도입을 요청한다"],
  ["FGI · 진성 데이터", "구글폼 대신 녹음 기반 인터뷰로 진실한 사용자 데이터 (수련권 보상)"],
  ["연희동 네트워크", "연희 요가 축제 1,664명 참여 · 9개 요가원 연합 기반 [근거]"],
];
acq.forEach(([t,v],i)=>{
  const x = 0.6 + (i%2)*6.15, y = 2.1 + Math.floor(i/2)*2.05;
  card(s, x, y, 5.95, 1.85, i===0?INK:MIST);
  s.addText(t, {x:x+0.3, y:y+0.22, w:5.4, h:0.5, fontFace:F, fontSize:16, bold:true, color: i===0?GOLD:INK, margin:0});
  s.addText(v, {x:x+0.3, y:y+0.78, w:5.4, h:0.95, fontFace:F, fontSize:13.5, color: i===0?WHITE:BODY, valign:"top", margin:0});
});
src(s, "출처: 노트 04 5/13 회의(맛보기 스푼) · 노트 12(바이럴·FGI) · 모두의창업 지원서(연희 요가 축제 1,664명).");
foot(s, 22);

// ================= S23 재무 3년 추정 =================
s = p.addSlide(); bg(s, WHITE); head(s, "08", "FINANCIALS", "3년 추정 — 시나리오와 가정을 분리한다");
const frows = [
  [{t:"시나리오"},{t:"3년차 업장"},{t:"기준 ARPA"},{t:"프리미엄 ARPA"}],
  [{t:"보수"},{t:"300개"},{t:"12.2억"},{t:"15.8억"}],
  [{t:"기준 (발표)"},{t:"500개"},{t:"20.4억"},{t:"26.4억"}],
  [{t:"공격"},{t:"1,000개"},{t:"40.8억"},{t:"52.8억 (+30명 시 61.2억)"}],
];
const ft = frows.map((r,ri)=> r.map(c=>({text:c.t, options:{fontFace:F, fontSize: ri===0?13.5:14, bold: ri===0||ri===2, color: ri===0?WHITE: (ri===2?INK:BODY), fill:{color: ri===0?INK : (ri===2?SAGELT : (ri%2?"FFFFFF":MIST))}, align: "center", valign:"middle", margin:5}})));
s.addTable(ft, {x:0.6, y:2.0, w:12.1, colW:[3.0,2.6,3.0,3.5], rowH:[0.55,0.62,0.7,0.62], border:{type:"solid", pt:0.5, color:"DDE6E1"}});
card(s, 0.6, 4.7, 12.1, 1.4, MIST);
s.addText("[가정] — 아직 데이터가 없어 가정으로 표시", {x:0.9, y:4.85, w:11.5, h:0.4, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
s.addText("전환율 · 해지율 · CAC · 업장당 유료 수련생 믹스 · 초기 자본 · 런웨이 — PoC(7~11월)에서 실측 예정",
  {x:0.9, y:5.3, w:11.5, h:0.7, fontFace:F, fontSize:13.5, color:BODY, valign:"top", margin:0});
src(s, "출처: 노트 08 BM 정정표. 매출=업장 수 × ARPA의 단순 추정 [추정]. 비용·마진은 다음 장.");
foot(s, 23);

// ================= S24 비용·마진 =================
s = p.addSlide(); bg(s, WHITE); head(s, "08", "FINANCIALS", "비용 · 마진 구조");
const cm = [
  ["AI 비용 통제", "기본은 momso가 먼저 부담 → ‘구독 + 포함량 + 초과 과금’. 무제한 AI 금지로 gross margin 방어."],
  ["BYOK (프리미엄)", "고객이 자기 Claude·API 키 연결 시 AI 비용 고객 부담 + 할인(예: 월 1만 → 3,300원)."],
  ["저장 = 고객 소유", "원본은 고객 저장소(예: 네이버 클라우드)에 — momso 서버 보관비 최소화."],
  ["J-커브", "아카이브 누적 → 이탈비용↑ · B2B(업장) + B2C(기록권) 결합으로 ARPA 상승."],
];
cm.forEach(([t,v],i)=>{
  const y = 2.05 + i*1.05;
  card(s, 0.6, y, 12.1, 0.92, i===3?INK:MIST);
  s.addText(t, {x:0.9, y:y, w:3.4, h:0.92, fontFace:F, fontSize:15, bold:true, color: i===3?GOLD:INK, valign:"middle", margin:0});
  s.addText(v, {x:4.4, y:y, w:8.1, h:0.92, fontFace:F, fontSize:13.5, color: i===3?WHITE:BODY, valign:"middle", margin:0});
});
src(s, "출처: 노트 10 발레파킹 BM(비용 모델) · 노트 12(BYOK·단일 LLM=Claude).");
foot(s, 24);

// ================= S25 로드맵 =================
s = p.addSlide(); bg(s, WHITE); head(s, "09", "ROADMAP", "단계 로드맵");
const rm = [
  ["2026 하반기", "1단계 · 빅블루 기술 고도화", "STT·요약·검수·리포트 발송·학생별 기록방"],
  ["2027 상반기", "2단계 · 연희동 로컬 확산", "베타 5~10곳 · 요가원별 모델 표준화"],
  ["2027 하반기~", "3단계 · 웰니스 확장", "필라테스·PT·명상 + 평생 웰니스 기록 앱"],
];
rm.forEach(([d,t,v],i)=>{
  const y = 2.15 + i*1.42;
  s.addShape(p.shapes.OVAL, {x:0.75, y:y+0.28, w:0.42, h:0.42, fill:{color:GOLD}});
  if(i<2) s.addShape(p.shapes.LINE, {x:0.96, y:y+0.7, w:0, h:1.12, line:{color:SAGE, width:2}});
  s.addText(d, {x:1.4, y:y, w:2.7, h:1.0, fontFace:F, fontSize:15, bold:true, color:GREEN, valign:"middle", margin:0});
  card(s, 4.1, y, 8.6, 1.05, MIST);
  s.addText(t, {x:4.4, y:y+0.13, w:8.0, h:0.45, fontFace:F, fontSize:15.5, bold:true, color:INK, margin:0});
  s.addText(v, {x:4.4, y:y+0.58, w:8.0, h:0.4, fontFace:F, fontSize:12.5, color:BODY, margin:0});
});
src(s, "출처: 모두의창업 지원서 Q4 · 노트 01 시간선.");
foot(s, 25);

// ================= S26 InBodyLIKE PoC =================
s = p.addSlide(); bg(s, WHITE); head(s, "09", "ROADMAP", "InBodyLIKE 육성 · PoC 계획");
card(s, 0.6, 2.05, 5.9, 4.1, INK);
s.addText("일정 · 규모", {x:0.9, y:2.3, w:5.3, h:0.4, fontFace:F, fontSize:15, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"육성: 2026-07-20 ~ 11-13 (약 4개월)", options:{bullet:true, breakLine:true, color:WHITE}},
  {text:"PoC: 8~12주", options:{bullet:true, breakLine:true, color:WHITE}},
  {text:"대상: 빅블루 요가 + 연희동 3~5곳", options:{bullet:true, breakLine:true, color:WHITE}},
  {text:"핵심 수련생 30~80명", options:{bullet:true, color:WHITE}},
], {x:0.9, y:2.85, w:5.3, h:2.8, fontFace:F, fontSize:14.5, paraSpaceAfter:13, margin:0});
card(s, 6.75, 2.05, 5.95, 4.1, MIST);
s.addText("검증 가설", {x:7.05, y:2.3, w:5.4, h:0.4, fontFace:F, fontSize:15, bold:true, color:INK, margin:0});
s.addText([
  {text:"인바디 정량 데이터 × 수업 맥락 기록의 결합 효용", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"데이터가 상담·수련 지속·재방문으로 이어지는가", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"강사 검수(HITL) 워크플로우의 현장 적용성", options:{bullet:true, breakLine:true, color:BODY}},
  {text:"연동: 초기엔 결과지 업로드 → 이후 API 협의", options:{bullet:true, color:BODY}},
], {x:7.05, y:2.85, w:5.4, h:2.9, fontFace:F, fontSize:13.5, paraSpaceAfter:11, margin:0});
src(s, "출처: 노트 02 두 공모전(일정) · 노트 07 사업계획서 · 노트 08(인바디 API는 계약·승인 필요 → 초기는 결과지 업로드).");
foot(s, 26);

// ================= S27 인바디 협업 포인트 =================
s = p.addSlide(); bg(s, WHITE); head(s, "09", "ROADMAP", "인바디 협업 포인트");
card(s, 0.6, 2.05, 5.9, 2.0, SAGELT);
s.addText("역할 분담", {x:0.9, y:2.25, w:5, h:0.4, fontFace:F, fontSize:14, bold:true, color:INK, margin:0});
s.addText([
  {text:"momso — 요가 도메인 · 현장 검증 · 매뉴얼 설계", options:{breakLine:true, color:BODY}},
  {text:"인바디 — 측정 인프라 · 정량 데이터 · 리포트 공동 검토", options:{color:BODY}},
], {x:0.9, y:2.7, w:5.3, h:1.2, fontFace:F, fontSize:13.5, paraSpaceAfter:8, valign:"top", margin:0});
card(s, 6.75, 2.05, 5.95, 4.1, WHITE);
s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:6.75, y:2.05, w:5.95, h:4.1, fill:{color:WHITE}, rectRadius:0.07, line:{color:SAGELT, width:1.2}, shadow:sh()});
s.addText("요청 5종", {x:7.05, y:2.25, w:5, h:0.4, fontFace:F, fontSize:14, bold:true, color:GOLD, margin:0});
s.addText([
  {text:"데이터 해석 · 안전 표현 멘토링", options:{bullet:{type:"number"}, breakLine:true, color:BODY}},
  {text:"측정 환경(InBody270S·380 등) 협력", options:{bullet:{type:"number"}, breakLine:true, color:BODY}},
  {text:"리포트 UX 공동 검토", options:{bullet:{type:"number"}, breakLine:true, color:BODY}},
  {text:"8~12주 공동 PoC (빅블루 + 로컬 3~5곳)", options:{bullet:{type:"number"}, breakLine:true, color:BODY}},
  {text:"사업화 · 글로벌 확장 멘토링", options:{bullet:{type:"number"}, color:BODY}},
], {x:7.15, y:2.75, w:5.4, h:3.2, fontFace:F, fontSize:13.5, paraSpaceAfter:9, margin:0});
card(s, 0.6, 4.3, 5.9, 1.85, INK);
s.addText("핵심 메시지", {x:0.9, y:4.5, w:5.3, h:0.4, fontFace:F, fontSize:13, bold:true, color:GOLD, margin:0});
s.addText("“momSO는 장비 판매 앱이 아니라, 인바디 데이터가 웰니스 현장에서 수업 경험·재방문으로 이어지는지 검증하는 레이어다.”",
  {x:0.9, y:4.9, w:5.3, h:1.15, fontFace:F, fontSize:12.5, color:WHITE, italic:true, valign:"top", margin:0});
src(s, "출처: 노트 07 사업계획서 5항목(인바디 협업) · 노트 08 인바디 연동 타당성.");
foot(s, 27);

// ================= S28 팀 =================
s = p.addSlide(); bg(s, WHITE); head(s, "10", "TEAM", "팀 — 현장과 기술의 결합 (50:50 공동대표)");
function person(x, name, role, items){
  card(s, x, 2.1, 5.95, 3.9, MIST);
  s.addShape(p.shapes.OVAL, {x:x+0.35, y:2.45, w:1.0, h:1.0, fill:{color:INK}});
  s.addText(name.slice(0,1), {x:x+0.35, y:2.45, w:1.0, h:1.0, fontFace:F, fontSize:30, bold:true, color:GOLD, align:"center", valign:"middle", margin:0});
  s.addText(name, {x:x+1.55, y:2.5, w:4.2, h:0.5, fontFace:F, fontSize:19, bold:true, color:INK, margin:0});
  s.addText(role, {x:x+1.55, y:3.0, w:4.2, h:0.5, fontFace:F, fontSize:13, color:GREEN, margin:0});
  s.addText(items.map((t,i)=>({text:t, options:{bullet:true, breakLine:i<items.length-1, color:BODY}})),
    {x:x+0.4, y:3.7, w:5.15, h:2.1, fontFace:F, fontSize:13.5, paraSpaceAfter:8, margin:0});
}
person(0.6, "유동환", "공동대표 · 요가 도메인 / 현장", ["빅블루 요가 운영 (연희동)", "수업 설계·현장 PoC", "연희동 웰니스 네트워크"]);
person(6.75, "김성균", "공동대표 · 전략 / 기술", ["제품·전략·포지셔닝 설계", "AI 기록 흐름·리포트 구조", "리서치·문서화·파트너 협의"]);
src(s, "출처: 노트 07 사업계획서(Team) · 노트 04 5/13 회의(50:50 공동대표).");
foot(s, 28);

// ================= S29 리스크·안전장치 =================
s = p.addSlide(); bg(s, WHITE); head(s, "10", "RISK & SAFEGUARDS", "리스크와 안전장치");
const rk = [
  ["개인정보", "동의·필터링·원본 비공개·회원별 분리 (개인정보보호법 민감정보 관점)"],
  ["의료 표현", "‘진단·처방’ 금지 → ‘참고·경향·수련 흐름’으로 표현"],
  ["데이터 주권", "고객 소유 · 삭제·정정 요청 · AI 학습 미사용 조건"],
  ["HITL 게이트", "AI는 초안만 · 강사 검수 후에만 발행 (자동 발송 차단)"],
];
rk.forEach(([t,v],i)=>{
  const x = 0.6 + (i%2)*6.15, y = 2.1 + Math.floor(i/2)*2.05;
  card(s, x, y, 5.95, 1.85, MIST);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {x:x+0.3, y:y+0.28, w:1.7, h:0.5, fill:{color:INK}, rectRadius:0.06});
  s.addText(t, {x:x+0.3, y:y+0.28, w:1.7, h:0.5, fontFace:F, fontSize:13, bold:true, color:WHITE, align:"center", valign:"middle", margin:0});
  s.addText(v, {x:x+0.3, y:y+0.92, w:5.35, h:0.8, fontFace:F, fontSize:13.5, color:BODY, valign:"top", margin:0});
});
src(s, "출처: 노트 06 HITL · 노트 09 도메인 우려 · 안전/접근성 기준선(개인정보보호법·NIST HITL 참고).");
foot(s, 29);

// ================= S30 CLOSING =================
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.OVAL, {x:9.8, y:3.6, w:6, h:6, fill:{color:GREEN}});
s.addText("CLOSING", {x:0.9, y:1.3, w:8, h:0.5, fontFace:F, fontSize:13, bold:true, color:GOLD, charSpacing:2, margin:0});
s.addText([
  {text:"인바디의 정량 데이터  ×  momso의 수업 맥락", options:{breakLine:true, color:WHITE, bold:true}},
  {text:"= 웰니스에 빠져 있던 '기록 계층'", options:{color:GOLD, bold:true}},
], {x:0.85, y:2.0, w:11.5, h:1.7, fontFace:F, fontSize:30, lineSpacingMultiple:1.15, margin:0});
s.addShape(p.shapes.LINE, {x:0.92, y:3.9, w:3.2, h:0, line:{color:GOLD, width:2}});
s.addText("우리의 비전 — 사람과 사람의 소통이 안전하고, 진실되고, 오래 지속되도록.",
  {x:0.9, y:4.2, w:11, h:0.6, fontFace:F, fontSize:17, color:SAGELT, margin:0});
s.addText("momso  ·  몸소", {x:0.9, y:5.4, w:6, h:0.6, fontFace:F, fontSize:22, bold:true, color:WHITE, margin:0});
s.addText("빅블루 요가  ·  유동환 · 김성균", {x:0.9, y:6.0, w:8, h:0.5, fontFace:F, fontSize:13, color:SAGE, margin:0});
foot(s, 30, true);

p.writeFile({ fileName: "momso_InBodyLIKE_사업계획서.pptx" }).then(f=>console.log("OK:", f));
