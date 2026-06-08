const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
p.title = "momso × InBodyLIKE 사업계획서 — 부록";

const INK="163F38", GREEN="2E6657", SAGE="7FA899", SAGELT="DDE9E3", MIST="F3F6F4", WHITE="FFFFFF", GOLD="C8A04A", BODY="2A332F", MUTE="6F7E78", F="Malgun Gothic", W=13.333, H=7.5;
const sh=()=>({type:"outer",color:"163F38",blur:7,offset:2,angle:135,opacity:0.13});
function bg(s,c){s.background={color:c};}
function foot(s,n,d){ s.addText("momso × InBodyLIKE  ·  부록",{x:0.5,y:H-0.42,w:6,h:0.3,fontFace:F,fontSize:8,color:d?SAGE:MUTE,valign:"middle",margin:0}); s.addText("A"+n,{x:W-1.0,y:H-0.42,w:0.5,h:0.3,fontFace:F,fontSize:9,color:d?SAGE:MUTE,align:"right",valign:"middle",margin:0}); }
function head(s,label,title){ s.addShape(p.shapes.OVAL,{x:0.55,y:0.45,w:0.42,h:0.42,fill:{color:INK}}); s.addText("부록",{x:0.55,y:0.45,w:0.42,h:0.42,fontFace:F,fontSize:9,bold:true,color:WHITE,align:"center",valign:"middle",margin:0}); s.addText(label,{x:1.08,y:0.46,w:8,h:0.4,fontFace:F,fontSize:12,bold:true,color:GOLD,charSpacing:2,valign:"middle",margin:0}); s.addText(title,{x:0.5,y:0.95,w:12.3,h:0.85,fontFace:F,fontSize:26,bold:true,color:INK,valign:"top",margin:0}); }
function src(s,t){ s.addText(t,{x:0.5,y:H-0.72,w:12.3,h:0.28,fontFace:F,fontSize:8.5,italic:true,color:MUTE,valign:"middle",margin:0}); }
function card(s,x,y,w,h,fill){ s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w,h,fill:{color:fill||WHITE},rectRadius:0.07,shadow:sh()}); }

// A1 표지
let s=p.addSlide(); bg(s,INK);
s.addShape(p.shapes.OVAL,{x:10.4,y:-1.6,w:5.2,h:5.2,fill:{color:GREEN}});
s.addText("APPENDIX",{x:0.9,y:2.4,w:9,h:0.5,fontFace:F,fontSize:15,color:GOLD,bold:true,charSpacing:3,margin:0});
s.addText("부록",{x:0.85,y:2.9,w:9,h:1.2,fontFace:F,fontSize:60,bold:true,color:WHITE,margin:0});
s.addText("상세 BM · 경쟁사 비교 · 리스크 매트릭스 · 데이터 출처 · English Positioning",{x:0.9,y:4.3,w:11.5,h:0.6,fontFace:F,fontSize:16,color:SAGELT,margin:0});
foot(s,1,true);

// A2 상세 BM 표
s=p.addSlide(); bg(s,WHITE); head(s,"A2 · BUSINESS MODEL","상세 BM — 가격 · ARPA · 시나리오");
const t1=[
  [{text:"상품",b:1},{text:"월 가격",b:1},{text:"대상",b:1}],
  ["B2C 기록권","5,000~7,000원","수련생 개인 수련 기록권"],
  ["PoC·파운딩","무료~4.9만","초기 검증·협력 요가원"],
  ["Software Basic","4.9~9.9만","기본 기록·검수·발행"],
  ["Studio Pro","15~30만","기록+리포트+세팅(프리미엄)"],
  ["InBody Partner","30만+","인바디 연동형(별도 협의)"],
];
s.addTable(t1.map((r,ri)=>r.map(c=>{const o=typeof c==="string"?{}:c; const txt=typeof c==="string"?c:c.text; return {text:txt,options:{fontFace:F,fontSize:ri===0?12.5:12.5,bold:ri===0||(o.b===1),color:ri===0?WHITE:BODY,fill:{color:ri===0?INK:(ri%2?WHITE:MIST)},valign:"middle",margin:4}};})),
  {x:0.6,y:2.0,w:6.0,colW:[1.9,1.8,2.3],rowH:[0.45,0.5,0.5,0.5,0.5,0.5],border:{type:"solid",pt:0.5,color:"DDE6E1"}});
card(s,6.95,2.0,5.75,3.05,MIST);
s.addText("단위 경제 (요가원 1곳)",{x:7.2,y:2.2,w:5.2,h:0.4,fontFace:F,fontSize:14,bold:true,color:INK,margin:0});
s.addText([
  {text:"기준 ARPA = B2B 20만 + 수련생 20명×7천 = 월 34만 = 연 408만",options:{breakLine:true,color:BODY}},
  {text:"프리미엄 ARPA = B2B 30만 + 20명×7천 = 월 44만 = 연 528만",options:{breakLine:true,color:BODY}},
  {text:"[가정] 유료 수련생: 초기 5~10 · 성숙 20 · 공격 30",options:{color:MUTE}},
],{x:7.2,y:2.7,w:5.25,h:2.2,fontFace:F,fontSize:13,valign:"top",paraSpaceAfter:10,margin:0});
card(s,6.95,5.2,5.75,1.4,INK);
s.addText("3년차 시나리오 (연 매출)",{x:7.2,y:5.35,w:5.2,h:0.4,fontFace:F,fontSize:13,bold:true,color:GOLD,margin:0});
s.addText("보수 300개 12.2~15.8억  ·  기준 500개 20.4~26.4억(발표)  ·  공격 1,000개 40.8~52.8억 (+30명 시 61.2억)",{x:7.2,y:5.75,w:5.25,h:0.8,fontFace:F,fontSize:12,color:WHITE,valign:"top",margin:0});
src(s,"출처: 노트 08 BM 정정표(GPT 검증). 60억은 기준 아닌 ‘1,000개+유료 30명’ 공격 시나리오로만.");
foot(s,2);

// A3 경쟁사 비교표 (검증된 가격)
s=p.addSlide(); bg(s,WHITE); head(s,"A3 · COMPETITION","경쟁사 비교 (확인된 가격·규모)");
const t2=[
  [{t:"서비스"},{t:"유형"},{t:"가격"},{t:"규모·비고"}],
  [{t:"바디코디"},{t:"국내 CRM"},{t:"Pro 19.8만(약정 15.8만)"},{t:"4,000센터·앱 170만+ / 헬스·필라"}],
  [{t:"Mindbody"},{t:"글로벌 SaaS"},{t:"$159~699/월"},{t:"글로벌 1위·고가·기능과다"}],
  [{t:"TeamUp"},{t:"글로벌 SaaS"},{t:"$104~309/월"},{t:"인원수 과금·기능 잠금 없음"}],
  [{t:"포인티"},{t:"국내 리포트"},{t:"비공개"},{t:"★가장 가까운 경쟁(퍼스널 리포트)"}],
  [{t:"오붓 / ClassPass"},{t:"패스 플랫폼"},{t:"수수료형"},{t:"오붓 1,000파트너 / CP 25,000+"}],
  [{t:"momso"},{t:"수업 기록 레이어"},{t:"B2C 5~7천 + B2B 4.9~30만"},{t:"강사 검수·데이터 고객 소유"}],
];
s.addTable(t2.map((r,ri)=>r.map(c=>({text:c.t,options:{fontFace:F,fontSize:ri===0?12.5:12,bold:ri===0||ri===t2.length-1,color:ri===0?WHITE:(ri===t2.length-1?WHITE:BODY),fill:{color:ri===0?INK:(ri===t2.length-1?GREEN:(ri%2?WHITE:MIST))},valign:"middle",margin:5}}))),
  {x:0.6,y:2.0,w:12.1,colW:[2.5,2.2,3.4,4.0],rowH:[0.5,0.6,0.6,0.6,0.6,0.6,0.66],border:{type:"solid",pt:0.5,color:"DDE6E1"}});
src(s,"출처: 웹 리서치(메모 01). 바디코디·Mindbody·TeamUp 공식 가격(2026). 스튜디오메이트·포인티·엑스바디 가격은 비공개[확인 불가].");
foot(s,3);

// A4 리스크 매트릭스
s=p.addSlide(); bg(s,WHITE); head(s,"A4 · RISK","리스크 매트릭스 — 위험과 대응");
const t3=[
  [{t:"리스크"},{t:"영향"},{t:"대응(제품 구조)"}],
  [{t:"개인정보·민감대화"},{t:"높음"},{t:"수업별 동의·원본 비공개·회원별 분리·민감 제외"}],
  [{t:"의료·진단 표현"},{t:"높음"},{t:"‘참고·경향’만·‘진단 아님’ 면책 화면 명시"}],
  [{t:"인바디 즉시연동 불가"},{t:"중간"},{t:"초기 결과지 업로드 → API는 계약·승인 후"}],
  [{t:"Tiro 의존"},{t:"중간"},{t:"음성처리 후보 다변화(OpenAI·온디바이스·자체)"}],
  [{t:"AI 비용 마진 잠식"},{t:"중간"},{t:"구독+초과 과금·BYOK·무제한 AI 금지"}],
  [{t:"노하우 유출 우려"},{t:"중간"},{t:"수련생 무단녹음 금지·노출률 설정·다운로드 제한"}],
];
s.addTable(t3.map((r,ri)=>r.map((c,ci)=>({text:c.t,options:{fontFace:F,fontSize:ri===0?12.5:12,bold:ri===0,color:ri===0?WHITE:(ci===1&&r[1].t==="높음"?GOLD:BODY),fill:{color:ri===0?INK:(ri%2?WHITE:MIST)},valign:"middle",align:ci===1?"center":"left",margin:5}}))),
  {x:0.6,y:2.0,w:12.1,colW:[3.4,1.6,7.1],rowH:[0.5,0.62,0.62,0.62,0.62,0.62,0.62],border:{type:"solid",pt:0.5,color:"DDE6E1"}});
src(s,"출처: 노트 06 HITL · 노트 09 도메인 우려 · 노트 10 BM · 메모 01.");
foot(s,4);

// A5 데이터 출처 & 신뢰도
s=p.addSlide(); bg(s,WHITE); head(s,"A5 · SOURCES","데이터 출처 · 신뢰도");
const cols=[
  ["공식 · 확정", INK, ["스포츠산업 사업체 131,764·매출 84.7조 (문체부 2024)","바디코디 가격 (공식 페이지)","인바디 연동 3요건: 구독+신청+승인 (공식 FAQ)","ECW·부위별 위상각 제품별 차등 (공식 비교표)","InBodyLIKE 일정·분야 (inbodylike.com)"]],
  ["추정 · 대리지표", GREEN, ["TAM/SAM/SOM 규모","시장 세부치(교육기관·체력단련장)","BM 매출 시나리오","글로벌 스튜디오 CAGR ~11.5%"]],
  ["확인 불가", MUTE, ["요가원·필라테스 단독 수","스튜디오메이트·포인티·엑스바디 가격","인바디 공식 정가·렌탈가","Claude/네이버클라우드 크레딧 (단, 공식 PDF엔 기재)"]],
];
cols.forEach(([t,c,items],i)=>{
  const x=0.6+i*4.12;
  card(s,x,2.05,3.85,4.2, i===0?MIST:WHITE);
  if(i>0) s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.05,w:3.85,h:4.2,fill:{color:WHITE},rectRadius:0.07,line:{color:SAGELT,width:1.2},shadow:sh()});
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:x+0.25,y:2.3,w:3.35,h:0.5,fill:{color:c},rectRadius:0.06});
  s.addText(t,{x:x+0.25,y:2.3,w:3.35,h:0.5,fontFace:F,fontSize:13,bold:true,color:WHITE,align:"center",valign:"middle",margin:0});
  s.addText(items.map((it,j)=>({text:it,options:{bullet:true,breakLine:j<items.length-1,color:BODY}})),{x:x+0.3,y:3.0,w:3.3,h:3.0,fontFace:F,fontSize:11.5,valign:"top",paraSpaceAfter:9,margin:0});
});
src(s,"발표 원칙: 공식=단정 가능, 추정=‘추정·대리지표’ 표기, 확인 불가=단정 금지. Claude 크레딧은 운영팀 재확인 후 사용.");
foot(s,5);

// A6 English positioning
s=p.addSlide(); bg(s,INK);
s.addShape(p.shapes.OVAL,{x:-1.6,y:4.4,w:5.2,h:5.2,fill:{color:GREEN}});
s.addText("ENGLISH POSITIONING",{x:0.9,y:1.0,w:10,h:0.5,fontFace:F,fontSize:13,bold:true,color:GOLD,charSpacing:2,margin:0});
s.addText("momso — the missing record layer for wellness",{x:0.85,y:1.5,w:11.6,h:0.9,fontFace:F,fontSize:27,bold:true,color:WHITE,margin:0});
s.addText("InBody records the body's specs. momso records the class context.",{x:0.9,y:2.5,w:11.5,h:0.6,fontFace:F,fontSize:17,color:SAGELT,italic:true,margin:0});
card(s,0.9,3.3,5.7,3.0,"1F4A41");
s.addText("What it is",{x:1.15,y:3.5,w:5,h:0.4,fontFace:F,fontSize:14,bold:true,color:GOLD,margin:0});
s.addText("A teacher-reviewed record layer that turns the language, cues, and felt sensations of a yoga/wellness class into a personal practice record — and links them to InBody's quantitative data.",{x:1.15,y:3.95,w:5.25,h:2.2,fontFace:F,fontSize:13,color:WHITE,valign:"top",margin:0});
card(s,6.85,3.3,5.6,3.0,"1F4A41");
s.addText("Principles & model",{x:7.1,y:3.5,w:5,h:0.4,fontFace:F,fontSize:14,bold:true,color:GOLD,margin:0});
s.addText([
  {text:"HITL: AI drafts, the teacher confirms",options:{bullet:true,breakLine:true,color:WHITE}},
  {text:"Originals private; only reviewed records are shared",options:{bullet:true,breakLine:true,color:WHITE}},
  {text:"Valet model: data stays customer-owned, momso operates",options:{bullet:true,breakLine:true,color:WHITE}},
  {text:"Aliases: “Voice Auto Archiving for Embodied Coaching”",options:{bullet:true,color:SAGELT}},
],{x:7.1,y:3.95,w:5.15,h:2.2,fontFace:F,fontSize:12.5,valign:"top",paraSpaceAfter:8,margin:0});
foot(s,6,true);

p.writeFile({fileName:"03_부록_appendix.pptx"}).then(f=>console.log("OK:",f));
