import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type AppRole = 'teacher' | 'student'

type PrototypeScreen = 'today' | 'recording' | 'review' | 'report' | 'archive' | 'ai'

type StudentScreen = 'home' | 'report' | 'archive' | 'connect' | 'place' | 'ai'

type TeacherTabId = 'today' | 'report' | 'archive' | 'ai'

type StudentTabId = 'home' | 'place' | 'archive' | 'ai'

type FocusViewMode = 'cards' | 'paragraph' | 'cloud' | 'map'

type AsideContext = {
  title: string
  description: string
  points: Array<[string, string]>
}

// 검수 결정(독립 멀티선택):
//  - toMember  : 회원 리포트에 포함(회원 공유)
//  - toTeacher : 강사 리포트에 포함(내부)
//  둘은 독립적이라 한 조각이 회원·강사 양쪽에 동시에 들어갈 수 있다.
//  둘 다 off ⇒ 제외(기본값).
// 📌 보관(kept)은 위 결정과 독립적인 토글로, 강사 개인 아카이브로 보낸다.
type ReviewItem = {
  id: string
  focus: string
  // 카드 면에 보이는 더 풍성한 요약 문구 (R4)
  text: string
  detail: string
  source: string
  // 카드 클릭 시 펼쳐지는 구체적 전사 내용 (R4)
  transcript: string
  // 전사 시간 — 카드 면에서는 숨기고 펼친 상세에서만 노출 (R4)
  transcriptTime: string
  cloudTerms: string[]
  // 회원 리포트 포함 여부
  toMember: boolean
  // 강사 리포트 포함 여부
  toTeacher: boolean
  // 📌 보관: 회원/강사와 독립적인 강사 개인 아카이브용 플래그
  kept: boolean
  // 몸소(AI) 제안 결정 라벨
  suggestedStatus: string
  needsTermReview?: boolean
}

// 발행 대상: 회원 리포트(회원 항목) / 강사 리포트(강사 항목)
type PublishTarget = 'member' | 'teacher'

// 4-tab IA. Each tab has its own id, the label shown in the nav, and the
// screen id that tapping the tab should land on. Internal screen ids stay
// granular (recording/review/report all live under the 리포트 tab).
const teacherTabs: Array<{ id: TeacherTabId; label: string; target: PrototypeScreen }> = [
  { id: 'today', label: '홈', target: 'today' },
  { id: 'report', label: '리포트', target: 'review' },
  { id: 'archive', label: '아카이브', target: 'archive' },
  { id: 'ai', label: '모미', target: 'ai' },
]

const studentTabs: Array<{ id: StudentTabId; label: string; target: StudentScreen }> = [
  { id: 'home', label: '홈', target: 'home' },
  { id: 'place', label: '플레이스', target: 'place' },
  { id: 'archive', label: '아카이브', target: 'archive' },
  { id: 'ai', label: '모미', target: 'ai' },
]

// recording/review/report all highlight the 리포트 tab.
function teacherActiveTab(screen: PrototypeScreen): TeacherTabId {
  if (screen === 'recording' || screen === 'review' || screen === 'report') return 'report'
  if (screen === 'archive') return 'archive'
  if (screen === 'ai') return 'ai'
  return 'today'
}

// the student report view is reachable from 홈/아카이브 but is not its own tab,
// so it keeps the 홈 tab highlighted.
function studentActiveTab(screen: StudentScreen): StudentTabId {
  if (screen === 'place') return 'place'
  if (screen === 'archive') return 'archive'
  if (screen === 'ai') return 'ai'
  return 'home'
}

const focusViewModes: Array<{ id: FocusViewMode; label: string }> = [
  { id: 'cards', label: '카드' },
  { id: 'paragraph', label: '문단' },
  { id: 'cloud', label: '워드' },
  { id: 'map', label: '맵' },
]

const inbodyReferenceMetrics = [
  ['골격근량', '22.4kg'],
  ['체지방률', '24.8%'],
  ['좌우 균형', '우측 관찰'],
]

const inbodyDisclaimer = '수업 관찰을 돕는 참고 정보이며 진단이나 처방이 아닙니다.'

// 빅블루 요가 — 오늘 수업(시간별). 홈에서 시간 칩을 누르면 해당 수업으로 바뀐다 (H2~H5).
// 09:00 하타 베이직 = 5명, 11:00 빈야사 플로우 = 3명, 19:00 인요가 = 6명.
type TodayClass = { time: string; title: string; teacher: string; members: string[] }
const todayClasses: TodayClass[] = [
  {
    time: '09:00',
    title: '하타 베이직',
    teacher: '이지은',
    members: ['김하린', '박지연', '이수민', '정유나', '한지우'],
  },
  {
    time: '11:00',
    title: '빈야사 플로우',
    teacher: '이지은',
    members: ['최서연', '오민재', '윤하경'],
  },
  {
    time: '19:00',
    title: '인요가',
    teacher: '박서윤',
    members: ['강다은', '신예린', '문태현', '배수아', '조은채', '임도윤'],
  },
]

// 주간 캘린더 (이번 주 월~일). 각 날짜의 수업명·시간·예약 인원·강사명 (데모)
type WeeklyClass = { time: string; title: string; count: number; teacher: string }
const weeklySchedule: Array<{
  day: string
  date: string
  classes: WeeklyClass[]
}> = [
  { day: '월', date: '06.09', classes: [{ time: '10:30', title: '빈야사 플로우', count: 5, teacher: '이지은' }] },
  {
    day: '화',
    date: '06.10',
    classes: [
      { time: '09:00', title: '하타 베이직', count: 1, teacher: '이지은' },
      { time: '10:30', title: '빈야사 플로우', count: 4, teacher: '이지은' },
      { time: '14:00', title: '기구 필라테스', count: 3, teacher: '박서윤' },
    ],
  },
  { day: '수', date: '06.11', classes: [{ time: '09:00', title: '하타 베이직', count: 2, teacher: '이지은' }] },
  { day: '목', date: '06.12', classes: [{ time: '19:00', title: '인요가', count: 6, teacher: '박서윤' }] },
  { day: '금', date: '06.13', classes: [{ time: '09:00', title: '하타 베이직', count: 3, teacher: '이지은' }] },
  { day: '토', date: '06.14', classes: [{ time: '11:00', title: '아쉬탕가', count: 8, teacher: '박서윤' }] },
  { day: '일', date: '06.15', classes: [] },
]

// 최근 초안 — 강사가 이미 검수해 둔 지난 초안 (발행 전 단계라 수련생용/강사용 구분 없음, R1).
// kind: 'solo' 개인지도(1:1) → 수련생 이름 / 'group' 그룹 수업 → 회원 수 + 날짜 + 시간
type RecentDraft =
  | { id: string; kind: 'solo'; className: string; member: string; date: string; time: string }
  | { id: string; kind: 'group'; className: string; memberCount: number; date: string; time: string }
const recentDrafts: RecentDraft[] = [
  { id: 'rd1', kind: 'solo', className: '하타 베이직', member: '김하린', date: '06.10', time: '09:00' },
  { id: 'rd2', kind: 'solo', className: '기구 필라테스', member: '박지연', date: '06.09', time: '14:00' },
  { id: 'rd3', kind: 'group', className: '빈야사 플로우', memberCount: 4, date: '06.06', time: '10:30' },
  { id: 'rd4', kind: 'solo', className: '하타 베이직', member: '이수민', date: '06.02', time: '09:00' },
  { id: 'rd5', kind: 'group', className: '인요가', memberCount: 6, date: '05.30', time: '19:00' },
]

// 검수 대기 초안 — 아직 검수·발행하지 않은 AI 초안 목록 (데모, R2)
// 그룹 수업은 대표 회원 + 남은 인원수("김하린 외 4")로 표기한다 (R5).
// memberCount > 1 이면 그룹. 첫 항목이 기본으로 작업대에 올라온 초안이다.
type PendingDraft = {
  id: string
  className: string
  member: string // 대표 회원
  memberCount: number // 전체 참여 인원 (1이면 개인지도)
  date: string
}
const pendingDrafts: PendingDraft[] = [
  { id: 'd1', className: '하타 베이직', member: '김하린', memberCount: 5, date: '오늘 09:00' },
  { id: 'd2', className: '빈야사 플로우', member: '최서연', memberCount: 3, date: '오늘 11:00' },
  { id: 'd3', className: '인요가', member: '강다은', memberCount: 6, date: '어제 19:00' },
]

// 그룹 수업 대표 표기: "김하린 외 4" (대표 회원 + 남은 인원), 개인지도면 이름만 (R5).
function formatDraftMember(member: string, memberCount: number): string {
  return memberCount > 1 ? `${member} 외 ${memberCount - 1}` : member
}

// 지난 수업 포인트 — 강사용 리포트(검수본)에서 회수한 관찰 (데모)
const pastClassOptions: Array<{ id: string; label: string; points: string[] }> = [
  {
    id: '0601',
    label: '06.01 하타 베이직',
    points: ['오른발 접지', '내쉬는 호흡의 길이', '골반 정렬과 햄스트링 긴장'],
  },
  {
    id: '0528',
    label: '05.28 하타 베이직',
    points: ['좌우 어깨 높이 차이', '다운독 진입 시 손목 부하', '복부 개입 인지'],
  },
  {
    id: '0521',
    label: '05.21 하타 베이직',
    points: ['호흡 리듬 안정화', '발바닥 아치 인지', '척추 중립 유지'],
  },
]

// 인바디 기록 — 참여 회원별 추이 (골격근량 kg · 체지방률 %, 최근 3-4개월 데모)
const memberInbodyTrends: Array<{
  name: string
  muscle: number[]
  fat: number[]
  months: string[]
}> = [
  {
    name: '김하린',
    months: ['3월', '4월', '5월', '6월'],
    muscle: [21.6, 21.9, 22.2, 22.4],
    fat: [27.1, 26.2, 25.4, 24.8],
  },
  {
    name: '박지연',
    months: ['3월', '4월', '5월', '6월'],
    muscle: [24.8, 25.0, 25.1, 25.4],
    fat: [23.5, 23.0, 22.6, 22.1],
  },
  {
    name: '이수민',
    months: ['3월', '4월', '5월', '6월'],
    muscle: [19.4, 19.6, 20.0, 20.3],
    fat: [29.8, 29.0, 28.3, 27.6],
  },
]

type MemberTrend = { name: string; muscle: number[]; fat: number[]; months: string[] }

// 회원 이름으로 인바디 추이를 반환. 미리 정의된 회원은 실데이터,
// 그 외 데모 회원은 이름 기반으로 결정적인(매번 같은) 추이를 생성한다 (H4).
function getMemberTrend(name: string): MemberTrend {
  const known = memberInbodyTrends.find((member) => member.name === name)
  if (known) return known

  const months = ['3월', '4월', '5월', '6월']
  const seed = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const muscleBase = 18 + (seed % 9) // 18~26
  const fatBase = 22 + (seed % 8) // 22~29
  const muscle = months.map((_, i) => Number((muscleBase + i * 0.4).toFixed(1)))
  const fat = months.map((_, i) => Number((fatBase - i * 0.7).toFixed(1)))
  return { name, months, muscle, fat }
}

const studentArchiveStates = [
  ['검수 리포트', '보관됨'],
  ['원본 음성', '비공개'],
  ['외부 연결', '동의 후'],
]

const studentShareUrl = '예시 링크: momso.vercel.app/r/harin-0602'

const sampleStudentReportItems = [
  '오른발 접지와 내쉬는 호흡에서 골반 정렬을 함께 확인했습니다.',
  '파스치모타나사나 진입 전 햄스트링 긴장을 낮추는 큐를 다음 수업에서 다시 살펴봅니다.',
]

// 회원 홈 브리핑 — 최근 3개의 몸소 리포트 요약 (SH3, 데모)
const studentBriefingReports: Array<{ date: string; className: string; summary: string }> = [
  {
    date: '오늘',
    className: '하타 베이직',
    summary: '오른발 접지가 안정되며 내쉬는 호흡이 길어졌고, 골반 정렬을 함께 확인했습니다.',
  },
  {
    date: '06.07',
    className: '하타 베이직',
    summary: '파스치모타나사나 진입 전 햄스트링 긴장을 무릎 굽힘 변형으로 낮췄습니다.',
  },
  {
    date: '06.01',
    className: '인바디 참고',
    summary: '골격근량 증가와 함께 좌우 균형이 개선되는 흐름이 관찰됐습니다.',
  },
]

// 회원 홈 브리핑 — 최근 인바디 데이터 요약 (SH3, 데모: 김하린 최신 + 변화)
const studentInbodyBriefing = {
  measuredAt: '06.01 측정',
  muscle: { label: '골격근량', value: '22.4kg', delta: '+0.2kg', up: true },
  fat: { label: '체지방률', value: '24.8%', delta: '-0.6%p', up: false },
}

// 회원 홈 — 연동 센터 수업 예약 스케줄(다가오는 수업, 데모). SH6.
// 강사 홈 schedule과 유사하되, 참여 인원은 '수'만 노출하고 명단은 절대 보이지 않는다.
type StudentUpcomingClass = {
  id: string
  day: string
  date: string
  time: string
  title: string
  teacher: string
  count: number
  reserved: boolean
}
const studentUpcomingClasses: StudentUpcomingClass[] = [
  { id: 'su1', day: '오늘', date: '06.11', time: '19:00', title: '인요가', teacher: '박서윤', count: 6, reserved: true },
  { id: 'su2', day: '목', date: '06.12', time: '10:30', title: '빈야사 플로우', teacher: '이지은', count: 4, reserved: false },
  { id: 'su3', day: '금', date: '06.13', time: '09:00', title: '하타 베이직', teacher: '이지은', count: 3, reserved: false },
  { id: 'su4', day: '토', date: '06.14', time: '11:00', title: '아쉬탕가', teacher: '박서윤', count: 8, reserved: false },
]

// 회원 아카이브 — 수련 통계 요약 카드 (SA1, 데모)
const studentTrainingStats: Array<[string, string, string]> = [
  ['누적 수련 횟수', '42회', '최근 3개월 18회'],
  ['누적 수련 시간', '38시간', '평균 주 2.5회'],
  ['개선율', '+12%', '골격근량·정렬 기준'],
]

// 회원 아카이브 — 히스토리(받은 리포트·수업 이력 시간순, SA3 데모)
const studentHistoryEntries: Array<{ date: string; kind: '리포트' | '수업'; title: string; detail: string }> = [
  { date: '오늘', kind: '리포트', title: '하타 베이직 리포트', detail: '접지와 호흡 리듬, 골반 정렬 관찰' },
  { date: '06.07', kind: '수업', title: '하타 베이직 09:00', detail: '햄스트링 긴장과 전굴 진입 변형' },
  { date: '06.01', kind: '리포트', title: '인바디 참고 리포트', detail: '좌우 균형과 골반 정렬 추이' },
  { date: '05.29', kind: '수업', title: '하타 베이직 09:00', detail: '내쉬는 호흡의 길이 안정화' },
  { date: '05.25', kind: '수업', title: '빈야사 플로우 11:00', detail: '호흡-동작 동기화 연습' },
]

const connectionChannels = [
  [
    '내 AI로 열기',
    '준비 중',
    'ChatGPT, Claude, Gemini 등 사용자가 선택한 AI와 검수 리포트만 연결합니다.',
  ],
  [
    '개인 저장소',
    '동의 후',
    '개인 저장소 연결은 별도 동의 후 준비됩니다.',
  ],
  [
    'SNS형 피드',
    '관계 기반',
    '강사와 수련생이 동의한 일부 기록만 요가원 관계 피드로 공유하는 구상입니다.',
  ],
  [
    '읽기 API',
    '권한 기반',
    '원본 음성은 제외하고 발행된 리포트만 읽기 권한으로 연결합니다.',
  ],
]

const connectionFlow = [
  '기록 선택',
  '공유 범위 확인',
  '연결 대상 선택',
  '동의와 철회 관리',
]

const permissionScopes = [
  ['공개 대상', '나 / 담당 강사'],
  ['연결 가능 데이터', '검수 리포트만'],
  ['차단 데이터', '원본 음성 · 전체 전사'],
  ['상태', '준비 중'],
]

// 이전 기록 초점 — 과거 수업에 실제로 썼던 초점 텍스트 모음 (H1).
// 각 항목: 초점 텍스트 + 날짜 + 어떤 수업에 썼는지.
const pastFocusHistory: Array<{
  id: string
  focus: string
  date: string
  className: string
}> = [
  {
    id: 'pf1',
    focus: '오른발 접지와 내쉬는 호흡 중심, 파스치모타나사나 진입 준비',
    date: '06.01',
    className: '하타 베이직 09:00',
  },
  {
    id: 'pf2',
    focus: '골반 정렬과 햄스트링 긴장 회수, 전굴 변형 단계 안내',
    date: '05.28',
    className: '하타 베이직 09:00',
  },
  {
    id: 'pf3',
    focus: '수리야 나마스카라 B 호흡-동작 동기화, 들숨/날숨 큐 단순화',
    date: '05.25',
    className: '빈야사 플로우 11:00',
  },
  {
    id: 'pf4',
    focus: '좌우 어깨 높이 차이와 다운독 손목 부하 관찰',
    date: '05.21',
    className: '하타 베이직 09:00',
  },
  {
    id: 'pf5',
    focus: '인요가 장시간 유지 자세에서 호흡 리듬 안정화',
    date: '05.18',
    className: '인요가 19:00',
  },
  {
    id: 'pf6',
    focus: '리포머 풋워크 골반 전방경사, 코어 흉식 호흡 인지',
    date: '05.14',
    className: '기구 필라테스 14:00',
  },
  {
    id: 'pf7',
    focus: '척추 중립 유지와 발바닥 아치 인지, 복부 개입 점검',
    date: '05.11',
    className: '하타 베이직 09:00',
  },
  {
    id: 'pf8',
    focus: '아쉬탕가 점프백 전환에서 어깨 안정과 호흡 연결',
    date: '05.07',
    className: '아쉬탕가 11:00',
  },
]

// 수업 데이터 참조 — 개인지도면 그 회원의 지난 3회, 그룹이면 그 수업의 지난 3회,
// 그리고 그 수업과 관련된 센터 지식 요약 (데모: 김하린 개인지도 기준)
const aiWikiSources = [
  ['지난 3회 기록', '김하린 · 접지/호흡 반복 관찰'],
  ['센터 지식', '골반·호흡 시퀀스 교재 요약'],
]

const dataLayerFlow = [
  ['raw', '원본', '음성·전체 전사 비공개'],
  ['metadata', '정리', '초점·태그·다음 수업'],
  ['shareable', '공유', '강사 검수본만 발행'],
]

const nextLoopSteps = [
  ['검수 결과', '회원/강사/보관/제외 확정'],
  ['metadata 적립', '초점·용어·관찰 태그'],
  ['다음 수업 검색', '수업 데이터 참조가 관련 기록 회수'],
]

// 강사 아카이브 탭 — 발행된 리포트 모음 (inst_flow 와이어프레임 샘플)
// 5개 필터 카테고리 — 수업 · 회원 · 강사 · 보관 · 전체
type ArchiveFilterId = 'class' | 'member' | 'teacher' | 'saved' | 'all'

const teacherArchiveFilters: Array<{ id: ArchiveFilterId; label: string }> = [
  { id: 'class', label: '수업' },
  { id: 'member', label: '회원' },
  { id: 'teacher', label: '강사' },
  { id: 'saved', label: '보관' },
  { id: 'all', label: '전체' },
]

type ArchiveReport = {
  id: string
  // 초안 작성일 기준 (발행일 아님) — 이번 달(2026-06) 분포
  draftDate: string // 'YYYY-MM-DD'
  dateLabel: string // 카드/목록 표기용 (예: '06.10')
  className: string
  member: string
  title: string
  summary: string
  tags: string[]
  forTeacher: boolean // 강사용(내부) 리포트 여부
  saved: boolean // 📌 보관 여부
  // 기능3: 강사가 첨부한 사진이 있으면 카드 썸네일로 사진을 보여준다 (없으면 바디맵)
  photo?: boolean
}

const teacherArchiveReports: ArchiveReport[] = [
  {
    id: 'r1',
    draftDate: '2026-06-10',
    dateLabel: '06.10',
    className: '하타 베이직',
    member: '김하린',
    title: '우측 어깨 타이트함 및 골반 정렬',
    summary:
      '다운독 자세에서 우측 어깨 말림 현상 발견. 견갑골 주변 이완 스트레칭 추가. 다음 세션 가슴 열기 집중.',
    tags: ['어깨', '골반정렬'],
    forTeacher: false,
    saved: true,
    photo: true,
  },
  {
    id: 'r2',
    draftDate: '2026-06-10',
    dateLabel: '06.10',
    className: '기구 필라테스',
    member: '박지연',
    title: '코어 안정화 및 흉식 호흡',
    summary:
      '리포머 풋워크 시 골반 전방경사 심화. 코어 개입을 위해 흉식 호흡 인지 훈련 10분 진행 후 본 운동 돌입.',
    tags: ['코어', '호흡'],
    forTeacher: false,
    saved: false,
  },
  {
    id: 'r3',
    draftDate: '2026-06-07',
    dateLabel: '06.07',
    className: '하타 베이직',
    member: '이수민',
    title: '햄스트링 긴장과 전굴 진입',
    summary:
      '파스치모타나사나 진입 전 햄스트링 긴장이 높아 무릎 굽힘 변형 안내. 좌우 비대칭 점진 개선 중.',
    tags: ['햄스트링', '전굴'],
    forTeacher: false,
    saved: true,
  },
  {
    id: 'r4',
    draftDate: '2026-06-07',
    dateLabel: '06.07',
    className: '빈야사 플로우',
    member: '정민서',
    title: '플로우 호흡-동작 동기화',
    summary:
      '수리야 나마스카라 B에서 호흡과 동작 타이밍 불일치. 들숨/날숨 큐를 단순화해 흐름 안정화.',
    tags: ['빈야사', '호흡'],
    forTeacher: false,
    saved: false,
    photo: true,
  },
  {
    id: 'r5',
    draftDate: '2026-06-08',
    dateLabel: '06.08',
    className: '기구 필라테스',
    member: '박지연',
    title: '[강사 메모] 리포머 스프링 처방 기록',
    summary:
      '내부용: 박지연 회원 풋워크 스프링 강도와 다음 4주 처방 로드맵 정리. 회원 공유 전 단계.',
    tags: ['내부', '처방'],
    forTeacher: true,
    saved: false,
  },
  {
    id: 'r6',
    draftDate: '2026-06-10',
    dateLabel: '06.10',
    className: '하타 베이직',
    member: '김하린',
    title: '좌우 균형과 골반 정렬 추이',
    summary:
      '인바디 참고. 골격근량 증가와 함께 좌우 균형 개선. 다음 달 어깨 가동성 측정 권장.',
    tags: ['인바디', '균형'],
    forTeacher: false,
    saved: false,
  },
  {
    id: 'r7',
    draftDate: '2026-06-07',
    dateLabel: '06.07',
    className: '빈야사 플로우',
    member: '한가람',
    title: '첫 수업 베이스라인 기록',
    summary:
      '신규 회원 첫 세션. 기본 정렬과 호흡 패턴 베이스라인 확보. 인바디 미연동 상태.',
    tags: ['신규', '베이스라인'],
    forTeacher: false,
    saved: false,
  },
  {
    id: 'r8',
    draftDate: '2026-06-08',
    dateLabel: '06.08',
    className: '하타 베이직',
    member: '이수민',
    title: '[강사 메모] 전굴 변형 단계 설계',
    summary:
      '내부용: 이수민 회원 전굴 진입 4단계 변형 시퀀스 설계. 보관 후 다음 수업에서 회수.',
    tags: ['내부', '시퀀스'],
    forTeacher: true,
    saved: true,
  },
]

// 회원 목록 — 일부는 인바디 데이터 보유(InBody 로고 표시), 일부는 미연동
type ArchiveMember = {
  name: string
  hasInbody: boolean
  className: string
  reportCount: number
}

const archiveMembers: ArchiveMember[] = [
  { name: '김하린', hasInbody: true, className: '하타 베이직', reportCount: 2 },
  { name: '박지연', hasInbody: true, className: '기구 필라테스', reportCount: 2 },
  { name: '이수민', hasInbody: true, className: '하타 베이직', reportCount: 2 },
  { name: '정민서', hasInbody: false, className: '빈야사 플로우', reportCount: 1 },
  { name: '한가람', hasInbody: false, className: '빈야사 플로우', reportCount: 1 },
]

// 강사 모미 탭 — 채팅 + 데이터 표 (inst_flow 와이어프레임 샘플)
const teacherAiAnswerTable = [
  ['우측 상체 근육량', '+0.4kg 증가 (개선 중)'],
  ['다운독 자세 안정도', '60% → 85% (안정화)'],
  ['핵심 처방 (다음 세션)', '우측 햄스트링 집중 이완'],
]

// 회원 플레이스 탭 — 주변 스튜디오 (mem_flow 와이어프레임 샘플)
// 회원 플레이스 — 연희동 지도 기반 탐색 데모 데이터
type PlaceKind = '요가원' | '필라테스' | 'PT샵' | '헬스장'

type PlaceCenter = {
  id: string
  name: string
  kind: PlaceKind
  // 실제 연희동(서울 서대문구) 좌표 — Leaflet 지도 마커 위치
  lat: number
  lng: number
  rating: number
  reviewCount: number
  hearts: number
  distance: string
  address: string
  hours: string
  tags: string[]
  hasMomso: boolean
  hasInbody: boolean
  instructors: string[]
  reviews: string[]
  // 몸소 레이어 — 이 센터에서 전체공개로 발행된 리뷰/블로그 (연희 요가 위크 스타일)
  posts: PlacePost[]
}

// 전체공개로 발행된 리뷰/블로그 — 강사·수련생이 자유롭게 작성
type PlacePost = {
  id: string
  author: string
  authorType: '강사' | '수련생'
  kind: '리뷰' | '블로그'
  title: string
  snippet: string
  likes: number
}

const placeCenters: PlaceCenter[] = [
  {
    id: 'oyoga',
    name: '오요가 스튜디오',
    kind: '요가원',
    lat: 37.5681,
    lng: 126.9255,
    rating: 4.9,
    reviewCount: 128,
    hearts: 214,
    distance: '0.3km',
    address: '서울 서대문구 연희동 188-1',
    hours: '평일 07:00~22:00 · 주말 09:00~18:00',
    tags: ['하타 전문', '1:1 프라이빗'],
    hasMomso: true,
    hasInbody: true,
    instructors: ['김하린', '박서윤'],
    reviews: ['선생님이 자세를 꼼꼼히 봐주세요.', '소수정예라 집중이 잘 돼요.'],
    posts: [
      { id: 'oyoga-p1', author: '김하린', authorType: '강사', kind: '블로그', title: '하타 베이직, 골반 중립부터', snippet: '초보 회원과 6주간 골반 중립을 잡아온 수업 기록을 공유해요.', likes: 86 },
      { id: 'oyoga-p2', author: '윤채아', authorType: '수련생', kind: '리뷰', title: '거북목이 한 달 만에', snippet: '인바디로 좌우 균형까지 체크해줘서 자세 변화가 눈에 보였어요.', likes: 52 },
      { id: 'oyoga-p3', author: '박서윤', authorType: '강사', kind: '리뷰', title: '프라이빗 수업 후기 모음', snippet: '1:1 수업에서 가장 많이 받은 질문 세 가지를 정리했습니다.', likes: 41 },
    ],
  },
  {
    id: 'yhpilates',
    name: '연희 필라테스',
    kind: '필라테스',
    lat: 37.5689,
    lng: 126.9298,
    rating: 4.8,
    reviewCount: 96,
    hearts: 168,
    distance: '0.5km',
    address: '서울 서대문구 연희동 132-7',
    hours: '평일 06:00~23:00 · 주말 10:00~17:00',
    tags: ['기구 필라테스', '체형교정'],
    hasMomso: true,
    hasInbody: true,
    instructors: ['이지안'],
    reviews: ['기구 종류가 다양해요.', '거북목 교정에 도움이 됐어요.'],
    posts: [
      { id: 'yhpilates-p1', author: '이지안', authorType: '강사', kind: '블로그', title: '리포머로 잡는 코어 안정화', snippet: '체형교정이 필요한 직장인을 위한 8주 리포머 루틴을 단계별로 풀어봤어요.', likes: 73 },
      { id: 'yhpilates-p2', author: '정다은', authorType: '수련생', kind: '리뷰', title: '인바디 골격근량 +1.8kg', snippet: '센터 인바디로 3개월 추이를 비교하니 변화가 확실히 느껴져요.', likes: 64 },
      { id: 'yhpilates-p3', author: '한지우', authorType: '수련생', kind: '블로그', title: '기구 필라테스 입문 일기', snippet: '처음엔 무서웠던 캐딜락, 한 달 차 솔직 후기를 남겨요.', likes: 38 },
    ],
  },
  {
    id: 'bodypt',
    name: '바디PT 연희',
    kind: 'PT샵',
    lat: 37.5652,
    lng: 126.9271,
    rating: 4.7,
    reviewCount: 74,
    hearts: 132,
    distance: '0.7km',
    address: '서울 서대문구 연희동 90-3',
    hours: '매일 06:00~24:00',
    tags: ['1:1 PT', '인바디 무료'],
    hasMomso: false,
    hasInbody: true,
    instructors: ['최도현'],
    reviews: ['인바디로 변화를 체크해줘서 좋아요.', '식단 관리까지 챙겨주세요.'],
    posts: [],
  },
  {
    id: 'yhfitness',
    name: '연희 피트니스',
    kind: '헬스장',
    lat: 37.5663,
    lng: 126.9312,
    rating: 4.5,
    reviewCount: 211,
    hearts: 98,
    distance: '0.9km',
    address: '서울 서대문구 연희동 73-12',
    hours: '24시간 연중무휴',
    tags: ['24시간', '머신 다수'],
    hasMomso: false,
    hasInbody: true,
    instructors: ['정민호'],
    reviews: ['넓고 기구가 많아요.', '샤워실이 깨끗해요.'],
    posts: [],
  },
  {
    id: 'sumflow',
    name: '숨플로우 요가',
    kind: '요가원',
    lat: 37.5641,
    lng: 126.9244,
    rating: 4.9,
    reviewCount: 53,
    hearts: 187,
    distance: '0.6km',
    address: '서울 서대문구 연희동 201-5',
    hours: '평일 08:00~21:00 · 주말 휴무',
    tags: ['빈야사', '명상'],
    hasMomso: true,
    hasInbody: false,
    instructors: ['한소율'],
    reviews: ['분위기가 차분하고 좋아요.', '명상 클래스가 인상적이에요.'],
    posts: [
      { id: 'sumflow-p1', author: '한소율', authorType: '강사', kind: '블로그', title: '빈야사와 호흡 명상', snippet: '움직임과 호흡을 잇는 빈야사 시퀀스를 글로 천천히 안내합니다.', likes: 91 },
      { id: 'sumflow-p2', author: '서지민', authorType: '수련생', kind: '리뷰', title: '퇴근 후 명상 클래스', snippet: '하루의 긴장이 풀리는 차분한 저녁 수업, 진심으로 추천해요.', likes: 47 },
    ],
  },
]

const placeCategories = ['전체', '요가원', '필라테스', 'PT샵', '헬스장'] as const

// 공간×시계열 탐색 — 내 발자취 데모 데이터
type PlaceHistoryEntry = {
  id: string
  period: string
  centerId: string
  centerName: string
  kind: PlaceKind
  activity: string
  // 해당 분류별 내 수업 리포트 요약
  reportSummary: string
}

const placeHistory: PlaceHistoryEntry[] = [
  {
    id: 'h1',
    period: '2026.06',
    centerId: 'oyoga',
    centerName: '오요가 스튜디오',
    kind: '요가원',
    activity: '하타 요가 12회 수련 · 어깨 가동성 집중',
    reportSummary: '요가원 누적 38회 · 평균 집중도 92% · 우측 어깨 말림 개선 추세',
  },
  {
    id: 'h2',
    period: '2026.04',
    centerId: 'yhpilates',
    centerName: '연희 필라테스',
    kind: '필라테스',
    activity: '기구 필라테스 8회 · 코어/체형교정',
    reportSummary: '필라테스 누적 20회 · 코어 안정성 +15% · 골반 정렬 개선',
  },
  {
    id: 'h3',
    period: '2026.02',
    centerId: 'bodypt',
    centerName: '바디PT 연희',
    kind: 'PT샵',
    activity: '1:1 PT 16회 · 인바디 4회 측정',
    reportSummary: 'PT샵 누적 16회 · 골격근량 +2.1kg · 체지방률 -3.4%',
  },
]

const focusCloudTerms = [
  {
    itemId: 'grounding',
    word: '호흡',
    left: '46%',
    top: '24%',
    rotate: '-4deg',
    className: 'text-[30px] text-[#E26D5C]',
  },
  {
    itemId: 'grounding',
    word: '오른발',
    left: '31%',
    top: '42%',
    rotate: '3deg',
    className: 'text-[22px] text-[#2e6a5c]',
  },
  {
    itemId: 'grounding',
    word: '접지',
    left: '58%',
    top: '43%',
    rotate: '2deg',
    className: 'text-[24px] text-[#1f5b4b]',
  },
  {
    itemId: 'asana-term',
    word: '파스치모타나사나',
    left: '47%',
    top: '61%',
    rotate: '-2deg',
    className: 'text-[17px] text-[#8a6a3b]',
  },
  {
    itemId: 'asana-term',
    word: '햄스트링',
    left: '72%',
    top: '54%',
    rotate: '5deg',
    className: 'text-[20px] text-[#8a6a3b]',
  },
  {
    itemId: 'privacy',
    word: '사적 고민',
    left: '73%',
    top: '28%',
    rotate: '-5deg',
    className: 'text-[18px] text-[#7d3b39]',
  },
  {
    itemId: 'other-student',
    word: '타인 이름',
    left: '29%',
    top: '69%',
    rotate: '4deg',
    className: 'text-[16px] text-[#7d3b39]',
  },
  {
    itemId: 'sequence',
    word: '지도자 노하우',
    left: '66%',
    top: '77%',
    rotate: '-3deg',
    className: 'text-[15px] text-[#4c5360]',
  },
]

const focusMindMapNodes = [
  { itemId: 'grounding', x: 30, y: 36, label: '공유 후보' },
  { itemId: 'asana-term', x: 70, y: 36, label: '용어 확인' },
  { itemId: 'privacy', x: 30, y: 63, label: '민감 보류' },
  { itemId: 'sequence', x: 70, y: 63, label: '내부 지식' },
  { itemId: 'other-student', x: 50, y: 86, label: '제외 후보' },
]

const initialReviewItems: ReviewItem[] = [
  {
    id: 'grounding',
    focus: '호흡·접지 초점',
    text: '오른발 접지가 안정되면서 내쉬는 호흡이 길어졌고, 그 흐름에서 골반 정렬을 함께 확인했습니다. 다음 수업에서도 이 감각을 이어가면 좋겠다고 정리한 부분입니다.',
    detail: '개인 리포트에 포함',
    source: '오른발 접지, 내쉬는 호흡, 골반 정렬이 반복됨',
    transcript:
      '"자, 오른발 엄지 아래쪽으로 무게를 천천히 내려보세요. … 좋아요, 내쉴 때 그 접지가 더 분명해지죠? 그 상태에서 골반이 앞으로 말리지 않게 꼬리뼈를 살짝 내리고… 네, 지금 정렬이 좋습니다." — 접지와 호흡, 골반 정렬을 묶어 안내하는 구간.',
    transcriptTime: '12:40~16:05',
    cloudTerms: ['호흡', '오른발', '접지', '골반 정렬'],
    toMember: true,
    toTeacher: true,
    kept: true,
    suggestedStatus: '회원',
  },
  {
    id: 'privacy',
    focus: '민감 대화 초점',
    text: '수업 전 개인 상담에서 피로의 원인이 언급됐습니다. 개인 사정이 섞여 있어 회원·강사 어느 리포트에 넣기 전에 한 번 더 확인이 필요한 조각입니다.',
    detail: '민감 대화',
    source: '수련생의 개인 사정과 컨디션 원인이 언급됨',
    transcript:
      '"요즘 회사 일 때문에 잠을 잘 못 자서요… 그게 좀 영향이 있는 것 같아요." — 컨디션 저하의 배경으로 개인 사정이 언급된 구간. 공유 시 민감 정보 노출 우려가 있어 기본 제외로 둠.',
    transcriptTime: '03:18~05:02',
    cloudTerms: ['사적 고민', '피로 원인', '공유 전 확인'],
    toMember: false,
    toTeacher: false,
    kept: false,
    suggestedStatus: '제외',
  },
  {
    id: 'asana-term',
    focus: '요가 용어 초점',
    text: '파스치모타나사나 진입 전 햄스트링 긴장이 높아, 무릎을 살짝 굽혀 긴장을 낮추는 큐를 안내했습니다. 산스크리트 자세명 표기가 정확한지 확인이 필요한 조각입니다.',
    detail: '요가 용어',
    source: '산스크리트 자세명과 햄스트링 큐가 함께 등장',
    transcript:
      '"파스치모타나사나로 넘어갈게요. 햄스트링이 당기면 무릎을 살짝 굽혀도 좋아요. 중요한 건 등을 둥글게 말지 않는 거예요." — 자세명과 햄스트링 큐가 함께 등장. 용어 표기 검수 대상.',
    transcriptTime: '21:08~23:44',
    cloudTerms: ['파스치모타나사나', '햄스트링', '요가 용어'],
    toMember: true,
    toTeacher: false,
    kept: false,
    suggestedStatus: '강사',
    needsTermReview: true,
  },
  {
    id: 'sequence',
    focus: '지도자 노하우 초점',
    text: 'TTC 수준의 시퀀스 설계 의도와 지도자 노하우가 담긴 설명입니다. 회원에게 공개하기보다 강사 내부 기록으로 유지하는 편이 적절합니다.',
    detail: '지도자 노하우',
    source: '지도자 교육용 시퀀스 설명과 연결됨',
    transcript:
      '"이 시퀀스는 후굴 전에 흉추를 먼저 여는 순서가 핵심이에요. 골반을 중립으로 두고 갈비뼈를 끌어올리면 요추 부담이 줄죠. TTC에서 다루는 보상 패턴 얘기예요." — 지도자 교육 맥락의 내부 노하우 설명.',
    transcriptTime: '26:30~29:12',
    cloudTerms: ['지도자 노하우', '시퀀스', 'TTC'],
    toMember: false,
    toTeacher: true,
    kept: true,
    suggestedStatus: '강사',
  },
  {
    id: 'other-student',
    focus: '타인 정보 초점',
    text: '다른 수련생의 이름과 비교 표현이 섞인 문장입니다. 타인 정보가 노출되므로 어느 리포트에도 넣지 않고 제외합니다.',
    detail: '타인 정보',
    source: '다른 수련생 이름과 비교 표현이 감지됨',
    transcript:
      '"○○님은 이 자세에서 더 깊게 들어가시던데, 하린님은 지금 정도가 딱 좋아요." — 다른 수련생 이름과 비교 표현이 감지된 구간. 타인 정보 노출로 제외 권장.',
    transcriptTime: '32:12~32:40',
    cloudTerms: ['타인 이름', '비교 표현', '제외'],
    toMember: false,
    toTeacher: false,
    kept: false,
    suggestedStatus: '제외',
  },
]

const teacherAsideContexts: Record<PrototypeScreen, AsideContext> = {
  today: {
    title: '오늘 수업의 기록 초점을 먼저 챙깁니다.',
    description:
      '빅블루 요가의 다음 수업과 참여 회원을 확인하고, 지난 포인트와 기록 초점을 챙긴 뒤 바로 기록을 시작하는 홈 화면입니다.',
    points: [
      ['사용자 행동', '다음 수업·주간 스케줄 확인, 지난 포인트 회수, 기록 초점 입력'],
      ['제품 의도', '녹음 전에 관찰 초점을 명확히 남김'],
      ['주의', '인바디 추이는 수업 관찰 참고 정보로만 표시'],
    ],
  },
  recording: {
    title: '원본과 운영 설명은 앱 밖에서 보입니다.',
    description:
      '원본은 고객 소유 공간에 두고, momso는 정리·검수·발행 과정을 맡습니다. 이 설명은 앱 밖의 데모 맥락입니다.',
    points: [
      ['앱 안의 언어', '강사만 기록, 무단 녹음 금지, 원본 기본 비공개'],
      ['사업 구조', '소유는 고객, 정리와 검수 운영은 momso'],
      ['PoC 가정', '저장소와 AI 연동은 선발 후 검증 대상'],
    ],
  },
  review: {
    title: '리포트 탭은 검수 → 발행 작업대입니다.',
    description:
      '[검수 대기]에서 AI 초안을 보고 각 조각을 회원·강사·보관·제외로 결정한 뒤 발행합니다. [최근 발행]에서는 지난 2주 발행본을 봅니다.',
    points: [
      ['사용자 행동', '조각마다 회원·강사·📌보관 확정, 선택 안 하면 자동 제외'],
      ['보기 방식', '카드, 문단, 워드클라우드, 마인드맵'],
      ['데이터 흐름', 'raw 원본 -> metadata 초점 -> shareable 발행본'],
    ],
  },
  report: {
    title: '검수된 기록만 수련생에게 발행됩니다.',
    description:
      'AI 초안은 자동 발송되지 않습니다. 공유 가능으로 확정된 기록만 수련생 화면에 나타납니다.',
    points: [
      ['공유 대상', '검수된 개인 리포트'],
      ['비공개 대상', '원본 음성과 전체 전사'],
      ['연결 방향', '개인 아카이브와 외부 연결은 동의 기반'],
    ],
  },
  archive: {
    title: '아카이브는 발행된 리포트가 쌓이는 곳입니다.',
    description:
      '검수해 발행한 리포트가 회원·초점별로 축적됩니다. 다음 수업의 회수는 모미 탭이 맡고, 여기서는 기록의 누적을 봅니다.',
    points: [
      ['사용자 행동', '검색·필터로 발행된 리포트 다시 찾기'],
      ['축적 단위', '날짜 · 회원 · 초점 metadata'],
      ['데이터 원칙', 'shareable 발행본만 보관, 원본은 비공개'],
    ],
  },
  ai: {
    title: '모미는 강사의 프라이빗 위키입니다.',
    description:
      '쌓인 기록과 요가원 지식을 근거로 질문에 답하고, 검수 결과를 다음 수업 맥락으로 회수합니다. AI는 제안만 하고 결정은 강사가 합니다.',
    points: [
      ['채팅 AI', '기록·인바디 추이를 묻고 표로 받기'],
      ['회수 루프', '검수 결과 -> metadata 적립 -> 다음 수업 검색'],
      ['BYOK Vault', '참조 범위는 설정에서 관리'],
    ],
  },
}

const studentAsideContexts: Record<StudentScreen, AsideContext> = {
  home: {
    title: '수련생은 검수된 기록만 봅니다.',
    description:
      '수련생용 화면은 전체 전사본이 아니라 강사가 확인한 개인 리포트와 아카이브를 보는 앱입니다.',
    points: [
      ['첫 화면', '오늘 리포트, 보관 상태, 다음 수업'],
      ['공유 원칙', '검수된 기록만 표시'],
      ['연결 방향', '개인 저장소, AI, 피드, API는 별도 동의'],
    ],
  },
  report: {
    title: '개인 리포트는 수업 기억을 보존합니다.',
    description:
      '수련생은 원본 녹음이 아니라 강사가 확정한 관찰 기록과 감각 메모를 확인합니다.',
    points: [
      ['보이는 것', '개인 리포트와 수련생 감각 메모'],
      ['보이지 않는 것', '원본 음성, 전체 전사, 타인 정보'],
      ['다음 행동', '다음 수업에서 이어볼 관찰 확인'],
    ],
  },
  archive: {
    title: '아카이브는 각자의 기록 방식으로 확장됩니다.',
    description:
      '사용자마다 다른 메모 방식과 수련 맥락을 반영하는 개인 아카이브로 확장할 수 있습니다.',
    points: [
      ['현재 데모', '검수 기록의 시간순 보관'],
      ['철학', 'momso의 방식 강요가 아니라 사용자 방식 보조'],
      ['PoC 질문', '어떤 아카이빙 형태가 실제로 편한지 검증'],
    ],
  },
  connect: {
    title: '외부 연결은 권한과 동의를 전제로 합니다.',
    description:
      'SNS, API, 개인 저장소 연결은 PoC 확장 방향입니다. 앱 안에서는 연결 가능 범위만 보여줍니다.',
    points: [
      ['연결 가능', '검수 리포트'],
      ['차단 대상', '원본 음성과 전체 전사'],
      ['확장 방향', '내 AI, 개인 저장소, 관계 기반 피드, 읽기 API'],
    ],
  },
  place: {
    title: '플레이스는 공간 기반으로 수련을 탐색합니다.',
    description:
      '인바디 보유 업체 지도 위에 수업 기록·리뷰 레이어를 얹어, 어느 시기 어느 곳에서 무엇을 했는지 나 중심으로 탐색합니다.',
    points: [
      ['사용자 행동', '주변 스튜디오 검색·지도·카테고리 탐색'],
      ['2레이어', '인바디 레이어 위에 몸소 기록 레이어'],
      ['전략 자산', '예약·패스 플랫폼으로 확장할 옵션 보유'],
    ],
  },
  ai: {
    title: '모미는 나를 가장 잘 아는 웰니스 메이트입니다.',
    description:
      '강사가 검수한 내 기록을 근거로 대화하고, 오늘 수련에 맞는 루틴을 제안합니다. 원본은 공개되지 않고 검수된 기록만 참조합니다.',
    points: [
      ['채팅 UX', '자유롭게 질문하고 맞춤 루틴 받기'],
      ['근거', '검수된 개인 리포트와 감각 메모'],
      ['확장 방향', '내 AI 연결은 동의 후'],
    ],
  },
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}

function teacherTopLabel(screen: PrototypeScreen) {
  if (screen === 'recording') return '보호 녹음 중'
  if (screen === 'review') return '발행 전 검수'
  if (screen === 'report') return '공유 미리보기'
  if (screen === 'archive') return '리포트 아카이브'
  if (screen === 'ai') return '모미'
  return '오늘의 수업'
}

function studentTopLabel(screen: StudentScreen) {
  if (screen === 'report') return '오늘 리포트'
  if (screen === 'archive') return '개인 아카이브'
  if (screen === 'connect') return '공유와 연결'
  if (screen === 'place') return '플레이스'
  if (screen === 'ai') return '모미'
  return '수련생 홈'
}

function RoleToggle({
  activeRole,
  onChangeRole,
}: {
  activeRole: AppRole
  onChangeRole: (role: AppRole) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-[#edf1ed] p-1">
      {([
        ['teacher', '강사용'],
        ['student', '수련생용'],
      ] as Array<[AppRole, string]>).map(([role, label]) => {
        const isActive = activeRole === role

        return (
          <button
            key={role}
            className={[
              'h-10 rounded-[6px] text-xs font-semibold transition',
              isActive
                ? role === 'student'
                  ? 'bg-[#E26D5C] text-white shadow-sm'
                  : 'bg-white text-[#1F3F5B] shadow-sm'
                : 'text-[#667583] hover:bg-[#f8faf5]',
            ].join(' ')}
            type="button"
            onClick={() => onChangeRole(role)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function NavButton<TTab extends string, TScreen extends string>({
  tab,
  activeTabId,
  onSelect,
  tone = 'teacher',
}: {
  tab: { id: TTab; label: string; target: TScreen }
  activeTabId: TTab
  onSelect: (screen: TScreen) => void
  tone?: AppRole
}) {
  const isActive = activeTabId === tab.id
  const isStudentTone = tone === 'student'

  return (
    <button
      className={[
        'flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[6px] text-xs font-semibold transition',
        isActive
          ? isStudentTone
            ? 'bg-white text-[#E26D5C]'
            : 'bg-[#E26D5C] text-white'
          : isStudentTone
            ? 'text-[#C9DDF0] hover:bg-[#225B88]'
            : 'text-[#6c716b] hover:bg-[#edf1ed]',
      ].join(' ')}
      type="button"
      onClick={() => onSelect(tab.target)}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          isActive
            ? isStudentTone
              ? 'bg-[#E26D5C]'
              : 'bg-[#DCEBFA]'
            : isStudentTone
              ? 'bg-[#6F95B8]'
              : 'bg-[#bdc7bd]',
        ].join(' ')}
      />
      {tab.label}
    </button>
  )
}

// 회원/강사는 독립적이라 둘 다, 하나, 혹은 둘 다 아님(제외)일 수 있다.
function StatusPill({
  toMember,
  toTeacher,
  kept,
}: {
  toMember: boolean
  toTeacher: boolean
  kept?: boolean
}) {
  const excluded = !toMember && !toTeacher

  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      {toMember && (
        <span className="whitespace-nowrap rounded-full border border-[#C2553F] bg-[#FBE8E3] px-2.5 py-1 text-[11px] font-semibold text-[#B0432F]">
          회원
        </span>
      )}
      {toTeacher && (
        <span className="whitespace-nowrap rounded-full border border-[#1F3F5B] bg-[#EEF5FA] px-2.5 py-1 text-[11px] font-semibold text-[#1F3F5B]">
          강사
        </span>
      )}
      {excluded && (
        <span className="whitespace-nowrap rounded-full border border-[#9aa19a] bg-[#f3f4ef] px-2.5 py-1 text-[11px] font-semibold text-[#626D78]">
          제외
        </span>
      )}
      {kept && (
        <span className="whitespace-nowrap rounded-full border border-[#E26D5C] bg-[#FBE8E3] px-2 py-1 text-[11px] font-semibold text-[#B0432F]">
          📌 보관
        </span>
      )}
    </span>
  )
}

// 강사/회원은 독립 토글(둘 다 켤 수 있음). 둘 다 끄면 제외.
// R5: 더 컴팩트하게 (낮은 높이·작은 폰트·좁은 패딩).
function ReviewStatusButtons({
  item,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  item: ReviewItem
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  return (
    <div className="mt-2.5 flex items-center gap-1">
      {/* 강사 — 강사 리포트 포함 (독립 토글) */}
      <button
        className={[
          'h-7 flex-1 rounded-[5px] text-[11px] font-semibold transition',
          item.toTeacher
            ? 'bg-[#1F3F5B] text-white'
            : 'bg-[#f3f4ef] text-[#626D78] hover:bg-[#e8ebe4]',
        ].join(' ')}
        type="button"
        aria-pressed={item.toTeacher}
        title="강사 리포트에 포함 (회원과 독립)"
        onClick={() => onToggleTeacher(item.id)}
      >
        강사
      </button>
      {/* 회원 — 회원 리포트 포함 (독립 토글) */}
      <button
        className={[
          'h-7 flex-1 rounded-[5px] text-[11px] font-semibold transition',
          item.toMember
            ? 'bg-[#E26D5C] text-white'
            : 'bg-[#f3f4ef] text-[#626D78] hover:bg-[#e8ebe4]',
        ].join(' ')}
        type="button"
        aria-pressed={item.toMember}
        title="회원 리포트에 공유 (강사와 독립)"
        onClick={() => onToggleMember(item.id)}
      >
        회원
      </button>
      {/* 📌 보관 — 강사/회원과 독립 토글, 강사 개인 아카이브로 이동 */}
      <button
        className={[
          'flex h-7 shrink-0 items-center gap-0.5 rounded-[5px] border px-2 text-[11px] font-semibold transition',
          item.kept
            ? 'border-[#E26D5C] bg-[#FBE8E3] text-[#B0432F]'
            : 'border-[#DCE4EA] bg-white text-[#8A949C] hover:bg-[#f8faf5]',
        ].join(' ')}
        type="button"
        aria-pressed={item.kept}
        title="강사 개인 아카이브로 보관 (강사/회원과 무관)"
        onClick={() => onToggleKept(item.id)}
      >
        📌 보관
      </button>
    </div>
  )
}

function FocusDecisionPanel({
  item,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  item: ReviewItem
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  return (
    <div className="mt-3 rounded-[8px] border border-[#DCE4EA] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#718293]">선택한 초점</p>
          <p className="mt-1 text-sm font-semibold text-[#252D34]">{item.focus}</p>
          <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{item.detail}</p>
        </div>
        <StatusPill toMember={item.toMember} toTeacher={item.toTeacher} kept={item.kept} />
      </div>
      <div className="mt-3 rounded-[8px] bg-[#F7FAFD] px-3 py-2">
        <p className="text-[11px] font-semibold text-[#718293]">전사/위키 근거</p>
        <p className="mt-1 text-xs font-normal leading-5 text-[#3a423a]">{item.source}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.cloudTerms.map((term) => (
          <span
            key={term}
            className="rounded-full border border-[#DCE4EA] bg-[#FBFCFF] px-2 py-1 text-[10px] font-semibold text-[#5D6874]"
          >
            {term}
          </span>
        ))}
      </div>
      <ReviewStatusButtons
        item={item}
        onToggleMember={onToggleMember}
        onToggleTeacher={onToggleTeacher}
        onToggleKept={onToggleKept}
      />
    </div>
  )
}

function FocusCardView({
  items,
  expandedId,
  onToggleExpand,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  items: ReviewItem[]
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  return (
    <section className="space-y-3">
      {items.map((item) => {
        const isExpanded = expandedId === item.id

        return (
          <article key={item.id} className="border-b border-[#E1E6EA] pb-4">
            {/* 카드 면 — 누르면 전사 상세가 펼쳐진다 (R4) */}
            <button
              className="w-full text-left"
              type="button"
              aria-expanded={isExpanded}
              onClick={() => onToggleExpand(item.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
                      {item.detail}
                    </span>
                    <span className="rounded-full border border-[#CDD6DE] bg-[#f8faf5] px-2 py-0.5 text-[10px] font-semibold text-[#5f6a60]">
                      몸소 제안: {item.suggestedStatus}
                    </span>
                    {item.needsTermReview && (
                      <span className="rounded-full border border-[#a27637] bg-[#f8edd9] px-2 py-0.5 text-[10px] font-semibold text-[#6e4b1d]">
                        요가 용어 확인 필요
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#242b25]">{item.text}</p>
                  <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">{item.source}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#7BA3C7]">
                    {isExpanded ? '접기 ▲' : '구체적 전사 내용 보기 ▾'}
                  </p>
                </div>
              </div>
            </button>
            {isExpanded && (
              <div className="mt-3 rounded-[8px] bg-[#F7FAFD] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#718293]">구체적 전사 내용</p>
                  <span className="shrink-0 rounded-full border border-[#DCE4EA] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
                    전사 {item.transcriptTime}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-normal leading-6 text-[#3a423a]">
                  {item.transcript}
                </p>
              </div>
            )}
            <ReviewStatusButtons
              item={item}
              onToggleMember={onToggleMember}
              onToggleTeacher={onToggleTeacher}
              onToggleKept={onToggleKept}
            />
          </article>
        )
      })}
    </section>
  )
}

function FocusParagraphView({
  items,
  selectedItemId,
  onSelectItem,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0]

  return (
    <section className="space-y-3 rounded-[8px] bg-[#f3f4ef] p-4">
      <p className="text-xs font-semibold text-[#6F7780]">문단 보기</p>
      <p className="text-xs font-normal leading-5 text-[#6F7780]">
        AI가 전사본에서 잘라낸 초점 문단입니다. 문단을 누르면 공유 범위를 정할 수 있습니다.
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          className={[
            'w-full rounded-[8px] px-4 py-3 text-left transition',
            selectedItemId === item.id
              ? 'bg-white ring-2 ring-[#E26D5C]'
              : 'bg-white hover:bg-[#f8faf5]',
          ].join(' ')}
          type="button"
          onClick={() => onSelectItem(item.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold leading-7 text-[#252D34]">{item.text}</p>
              <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">{item.source}</p>
            </div>
            <StatusPill toMember={item.toMember} toTeacher={item.toTeacher} kept={item.kept} />
          </div>
        </button>
      ))}
      {selectedItem && (
        <FocusDecisionPanel
          item={selectedItem}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
    </section>
  )
}

function FocusCloudView({
  items,
  selectedItemId,
  onSelectItem,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0]

  return (
    <section className="rounded-[8px] bg-[#EEF5FA] p-4">
      <p className="text-xs font-semibold text-[#5F7690]">워드클라우드 보기</p>
      <p className="mt-1 text-xs font-normal leading-5 text-[#5F7690]">
        녹음에서 두드러진 단어를 누르면 해당 초점과 공유 판단을 바로 확인합니다.
      </p>
      <div className="relative mt-4 h-[19rem] overflow-hidden rounded-[8px] bg-white">
        <div className="absolute inset-4 rounded-[999px] border border-dashed border-[#d9e2d9]" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EEF5FA]" />
        {focusCloudTerms.map(({ itemId, word, left, top, rotate, className }) => {
          const item = items.find((candidate) => candidate.id === itemId)

          if (!item) return null
          const isActive = selectedItemId === itemId

          return (
            <button
              key={`${itemId}-${word}`}
              className={[
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-center font-semibold shadow-sm transition',
                isActive
                  ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                  : 'border-[#DCE4EA] bg-[#F7FAFD] hover:border-[#7BA3C7] hover:bg-white',
              ].join(' ')}
              style={{ left, top, transform: `translate(-50%, -50%) rotate(${rotate})` }}
              type="button"
              onClick={() => onSelectItem(itemId)}
            >
              <span className={isActive ? 'text-white' : className}>{word}</span>
            </button>
          )
        })}
      </div>
      {selectedItem && (
        <FocusDecisionPanel
          item={selectedItem}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
    </section>
  )
}

function FocusMindMapView({
  items,
  selectedItemId,
  onSelectItem,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0]

  return (
    <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
      <p className="text-xs font-semibold text-[#5F7690]">마인드맵 보기</p>
      <p className="mt-1 text-xs font-normal leading-5 text-[#5F7690]">
        오늘 녹음에서 생긴 초점을 공유 후보, 보호, 내부 지식 흐름으로 나눠 봅니다.
      </p>
      <div className="relative mt-4 h-[27rem] overflow-hidden rounded-[8px] bg-white">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {focusMindMapNodes.map((node) => (
            <line
              key={`${node.itemId}-line`}
              stroke="#d7e0d8"
              strokeDasharray={node.itemId === 'other-student' ? '3 3' : undefined}
              strokeWidth="0.7"
              x1="50"
              x2={node.x}
              y1="16"
              y2={node.y}
            />
          ))}
        </svg>
        <div className="absolute left-1/2 top-[16%] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E26D5C] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
          오늘 녹음
        </div>
        {focusMindMapNodes.map(({ itemId, x, y, label }) => {
          const item = items.find((candidate) => candidate.id === itemId)

          if (!item) return null
          const isActive = selectedItemId === itemId

          return (
            <button
              key={itemId}
              className={[
                'absolute w-[8.4rem] -translate-x-1/2 -translate-y-1/2 rounded-[8px] border px-3 py-2 text-left shadow-sm transition',
                isActive
                  ? 'border-[#E26D5C] bg-[#E8F1FA]'
                  : 'border-[#DCE4EA] bg-[#FBFCFF] hover:border-[#7BA3C7] hover:bg-white',
              ].join(' ')}
              style={{ left: `${x}%`, top: `${y}%` }}
              type="button"
              onClick={() => onSelectItem(itemId)}
            >
              <p className="text-[10px] font-semibold text-[#5F7690]">{label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#252D34]">{item.focus}</p>
              <div className="mt-2">
                <StatusPill toMember={item.toMember} toTeacher={item.toTeacher} kept={item.kept} />
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-3 rounded-[8px] bg-white px-3 py-2">
        <p className="text-[11px] font-normal leading-5 text-[#687682]">
          노드를 누르면 해당 초점을 회원·강사 범위로 정하고, 📌로 강사 개인 아카이브 보관 여부를 표시합니다.
        </p>
      </div>
      {selectedItem && (
        <FocusDecisionPanel
          item={selectedItem}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
    </section>
  )
}

function FocusReviewModePanel({
  items,
  mode,
  onChangeMode,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
}: {
  items: ReviewItem[]
  mode: FocusViewMode
  onChangeMode: (mode: FocusViewMode) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
}) {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? '')
  // 카드 보기에서 펼쳐진 전사 카드 (R4) — 한 번에 하나만 열림
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const toggleExpand = (id: string) =>
    setExpandedCardId((current) => (current === id ? null : id))

  return (
    <section className="space-y-3">
      <div className="rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">수업 요약 보기</p>
        <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
          수업 요약을 원하는 방식으로 펼쳐 보고, 각 조각마다 강사·회원 범위를 바로 확정합니다.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-[8px] bg-[#edf1ed] p-1">
          {focusViewModes.map((viewMode) => {
            const isActive = mode === viewMode.id

            return (
              <button
                key={viewMode.id}
                className={[
                  'h-9 rounded-[6px] text-xs font-semibold transition',
                  isActive
                    ? 'bg-[#E26D5C] text-white shadow-sm'
                    : 'text-[#667583] hover:bg-[#f8faf5]',
                ].join(' ')}
                type="button"
                onClick={() => onChangeMode(viewMode.id)}
              >
                {viewMode.label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'cards' && (
        <FocusCardView
          items={items}
          expandedId={expandedCardId}
          onToggleExpand={toggleExpand}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
      {mode === 'paragraph' && (
        <FocusParagraphView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
      {mode === 'cloud' && (
        <FocusCloudView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
      {mode === 'map' && (
        <FocusMindMapView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onToggleMember={onToggleMember}
          onToggleTeacher={onToggleTeacher}
          onToggleKept={onToggleKept}
        />
      )}
    </section>
  )
}

// 인바디 변화 그래프 — 골격근량(파란 선) + 체지방률(코랄 선), 둘 다 라인 그래프 (H2)
function MemberInbodyChart({
  trend,
}: {
  trend: { name: string; muscle: number[]; fat: number[]; months: string[] }
}) {
  const muscleMax = Math.max(...trend.muscle)
  const muscleMin = Math.min(...trend.muscle)
  const fatMax = Math.max(...trend.fat)
  const fatMin = Math.min(...trend.fat)
  const span = trend.months.length - 1 || 1
  // 각 시리즈를 viewBox(0~100 x, 0~40 y) 좌표의 폴리라인 포인트로 변환.
  // 자기 시리즈의 min~max로 정규화해 두 추세선을 같은 영역에 그린다.
  const toPoints = (values: number[], min: number, max: number) =>
    values
      .map((value, index) => {
        const x = (index / span) * 100
        const ratio = max === min ? 0.5 : (value - min) / (max - min)
        const y = 4 + (1 - ratio) * 32
        return `${x},${y}`
      })
      .join(' ')
  // 골격근량: 파란 선 (H2). 체지방률: 코랄 선.
  const musclePoints = toPoints(trend.muscle, muscleMin, muscleMax)
  const fatPoints = toPoints(trend.fat, fatMin, fatMax)

  return (
    <div className="mt-3 rounded-[8px] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#1F3F5B]">{trend.name} · 인바디 추이</p>
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-[#2F5F8F]">
            <span className="h-2 w-2 rounded-full bg-[#2F5F8F]" />골격근량
          </span>
          <span className="flex items-center gap-1 text-[#B0432F]">
            <span className="h-2 w-2 rounded-full bg-[#E26D5C]" />체지방률
          </span>
        </div>
      </div>
      <div className="relative mt-3 h-28">
        {/* 두 시리즈 모두 라인 그래프 — 골격근량(파랑) + 체지방률(코랄) */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 40"
        >
          {/* 골격근량 — 파란 선 */}
          <polyline
            fill="none"
            points={musclePoints}
            stroke="#2F5F8F"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
          {/* 체지방률 — 코랄 선 */}
          <polyline
            fill="none"
            points={fatPoints}
            stroke="#E26D5C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* 데이터 포인트 — 파랑(골격근량) / 코랄(체지방률) */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 40"
        >
          {trend.muscle.map((value, index) => {
            const x = (index / span) * 100
            const ratio =
              muscleMax === muscleMin ? 0.5 : (value - muscleMin) / (muscleMax - muscleMin)
            const y = 4 + (1 - ratio) * 32
            return (
              <circle key={`m-${index}`} cx={x} cy={y} fill="#2F5F8F" r="0.9" vectorEffect="non-scaling-stroke" />
            )
          })}
          {trend.fat.map((value, index) => {
            const x = (index / span) * 100
            const ratio = fatMax === fatMin ? 0.5 : (value - fatMin) / (fatMax - fatMin)
            const y = 4 + (1 - ratio) * 32
            return (
              <circle key={`f-${index}`} cx={x} cy={y} fill="#E26D5C" r="0.9" vectorEffect="non-scaling-stroke" />
            )
          })}
        </svg>
      </div>
      {/* 월별 값 — 골격근량(파랑 kg) · 체지방률(코랄 %) */}
      <div className="mt-2 flex justify-between">
        {trend.months.map((month, index) => (
          <span key={month} className="flex-1 text-center text-[10px] font-semibold text-[#9aa19a]">
            {month}
            <span className="ml-0.5 text-[#2F5F8F]">{trend.muscle[index]}</span>
            <span className="ml-0.5 text-[#B0432F]">{trend.fat[index]}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// BodyMap — 자극 포인트 바디맵 (MVP, 정적 SVG)
// 키워드를 신체 부위 영역으로 매핑해 코랄로 하이라이트하고,
// 선택적으로 인바디 상·하체 × 좌·우 4분면 근육 밸런스 레이어를 얹는다.
// ─────────────────────────────────────────────────────────────────────────

// 하이라이트 가능한 영역 id
type BodyRegionId =
  | 'neck'
  | 'shoulderL'
  | 'shoulderR'
  | 'chest'
  | 'spine'
  | 'core'
  | 'pelvisL'
  | 'pelvisR'
  | 'thighL'
  | 'thighR'
  | 'hamstringL'
  | 'hamstringR'
  | 'calf'
  | 'feet'

type BodyView = 'front' | 'back'

// 영역별 한글 라벨 (도트 라벨/범례용)
const bodyRegionLabels: Record<BodyRegionId, string> = {
  neck: '목',
  shoulderL: '좌측 어깨',
  shoulderR: '우측 어깨',
  chest: '가슴',
  spine: '등/척추',
  core: '코어/복부',
  pelvisL: '좌측 골반',
  pelvisR: '우측 골반',
  thighL: '좌측 허벅지',
  thighR: '우측 허벅지',
  hamstringL: '좌측 햄스트링',
  hamstringR: '우측 햄스트링',
  calf: '종아리',
  feet: '발(접지)',
}

// 어느 영역이 어느 뷰(앞/뒤)에서 보이는지
const frontRegions: BodyRegionId[] = [
  'neck',
  'shoulderL',
  'shoulderR',
  'chest',
  'core',
  'pelvisL',
  'pelvisR',
  'thighL',
  'thighR',
  'feet',
]
const backRegions: BodyRegionId[] = [
  'neck',
  'shoulderL',
  'shoulderR',
  'spine',
  'pelvisL',
  'pelvisR',
  'hamstringL',
  'hamstringR',
  'calf',
  'feet',
]

// 키워드 → 영역 매핑. 리포트/검수 텍스트에서 영역을 도출할 때 쓴다.
// 우/오른 = 오른쪽(R), 좌/왼 = 왼쪽(L). 방향 없으면 양쪽.
function keywordsToRegions(text: string): BodyRegionId[] {
  const t = text
  const has = (...keys: string[]) => keys.some((k) => t.includes(k))
  const right = has('우측', '오른', '우 ')
  const left = has('좌측', '왼', '좌 ')
  const set = new Set<BodyRegionId>()

  if (has('목', '거북목', '경추')) set.add('neck')
  if (has('어깨', '견갑', '승모')) {
    if (right) set.add('shoulderR')
    if (left) set.add('shoulderL')
    if (!right && !left) {
      set.add('shoulderL')
      set.add('shoulderR')
    }
  }
  if (has('가슴', '흉곽', '흉추', '가슴 열기')) set.add('chest')
  if (has('등', '척추', '후굴', '중립')) set.add('spine')
  if (has('코어', '복부', '복근', '호흡', '들숨', '날숨')) set.add('core')
  if (has('골반', '정렬', '전방경사')) {
    if (right) set.add('pelvisR')
    if (left) set.add('pelvisL')
    if (!right && !left) {
      set.add('pelvisL')
      set.add('pelvisR')
    }
  }
  if (has('허벅지', '대퇴', '풋워크')) {
    if (right) set.add('thighR')
    if (left) set.add('thighL')
    if (!right && !left) {
      set.add('thighL')
      set.add('thighR')
    }
  }
  if (has('햄스트링', '전굴', '파스치모', '뒤쪽')) {
    if (right) set.add('hamstringR')
    if (left) set.add('hamstringL')
    if (!right && !left) {
      set.add('hamstringL')
      set.add('hamstringR')
    }
  }
  if (has('종아리', '아킬레스')) set.add('calf')
  if (has('접지', '발', '발바닥', '아치', '엄지')) set.add('feet')

  return Array.from(set)
}

// 인바디 4분면 밸런스 (상·하체 × 좌·우). MVP/목 데이터.
type InbodyBalance = {
  upperL: number // 0~100 (균형도, 100=완벽)
  upperR: number
  lowerL: number
  lowerR: number
  note: string
}

const defaultInbodyBalance: InbodyBalance = {
  upperL: 88,
  upperR: 72,
  lowerL: 84,
  lowerR: 90,
  note: '우측 상체 근육량 부족',
}

// 밸런스 점수 → 색/라벨
function balanceTone(score: number): { fill: string; text: string; label: string } {
  if (score >= 85) return { fill: '#9DD3B6', text: '#1F5B4B', label: '균형' }
  if (score >= 75) return { fill: '#F2C9A0', text: '#8a6a3b', label: '관찰' }
  return { fill: '#F3B0A2', text: '#B0432F', label: '부족' }
}

// 영역별 SVG 좌표 (viewBox 0 0 100 180). 도트/라벨 위치.
const regionDots: Record<BodyRegionId, { x: number; y: number }> = {
  neck: { x: 50, y: 26 },
  shoulderL: { x: 32, y: 40 },
  shoulderR: { x: 68, y: 40 },
  chest: { x: 50, y: 52 },
  spine: { x: 50, y: 56 },
  core: { x: 50, y: 72 },
  pelvisL: { x: 41, y: 90 },
  pelvisR: { x: 59, y: 90 },
  thighL: { x: 40, y: 112 },
  thighR: { x: 60, y: 112 },
  hamstringL: { x: 40, y: 116 },
  hamstringR: { x: 60, y: 116 },
  calf: { x: 50, y: 146 },
  feet: { x: 50, y: 170 },
}

// 실루엣 위에 코랄로 칠해질 영역의 SVG path/shape.
// 간단한 형태로 부위를 알아볼 수 있게 그린다.
function BodyRegionShape({ id }: { id: BodyRegionId }) {
  const fill = '#E26D5C'
  const common = { fill, opacity: 0.85 }
  switch (id) {
    case 'neck':
      return <rect x="45" y="20" width="10" height="9" rx="3" {...common} />
    case 'shoulderL':
      return <circle cx="32" cy="40" r="7" {...common} />
    case 'shoulderR':
      return <circle cx="68" cy="40" r="7" {...common} />
    case 'chest':
      return <rect x="38" y="44" width="24" height="14" rx="5" {...common} />
    case 'spine':
      return <rect x="46" y="40" width="8" height="34" rx="4" {...common} />
    case 'core':
      return <rect x="40" y="62" width="20" height="18" rx="5" {...common} />
    case 'pelvisL':
      return <path d="M36 84 L50 84 L50 100 L38 100 Z" {...common} />
    case 'pelvisR':
      return <path d="M50 84 L64 84 L62 100 L50 100 Z" {...common} />
    case 'thighL':
      return <rect x="35" y="100" width="11" height="26" rx="5" {...common} />
    case 'thighR':
      return <rect x="54" y="100" width="11" height="26" rx="5" {...common} />
    case 'hamstringL':
      return <rect x="35" y="100" width="11" height="26" rx="5" {...common} />
    case 'hamstringR':
      return <rect x="54" y="100" width="11" height="26" rx="5" {...common} />
    case 'calf':
      return (
        <>
          <rect x="37" y="130" width="9" height="24" rx="4" {...common} />
          <rect x="54" y="130" width="9" height="24" rx="4" {...common} />
        </>
      )
    case 'feet':
      return (
        <>
          <ellipse cx="42" cy="170" rx="6" ry="4" {...common} />
          <ellipse cx="58" cy="170" rx="6" ry="4" {...common} />
        </>
      )
    default:
      return null
  }
}

// 인바디 4분면 밸런스 칩 (상·하체 × 좌·우)
function InbodyBalanceQuadrants({ balance }: { balance: InbodyBalance }) {
  const cells: Array<{ key: string; label: string; score: number }> = [
    { key: 'ul', label: '좌 상체', score: balance.upperL },
    { key: 'ur', label: '우 상체', score: balance.upperR },
    { key: 'll', label: '좌 하체', score: balance.lowerL },
    { key: 'lr', label: '우 하체', score: balance.lowerR },
  ]
  return (
    <div className="rounded-[8px] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#5F7690]">인바디 근육 밸런스 (상·하체 × 좌·우)</p>
        <InBodyLogo />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {cells.map((cell) => {
          const tone = balanceTone(cell.score)
          return (
            <div
              key={cell.key}
              className="flex items-center justify-between rounded-[6px] px-2.5 py-2"
              style={{ backgroundColor: `${tone.fill}33` }}
            >
              <span className="text-[11px] font-semibold text-[#3a423a]">{cell.label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: tone.fill, color: tone.text }}
              >
                {tone.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 rounded-[6px] bg-[#FBE8E3] px-2.5 py-1.5 text-[11px] font-semibold text-[#B0432F]">
        · {balance.note}
      </p>
    </div>
  )
}

function BodyMap({
  parts,
  showInbody = false,
  inbody = defaultInbodyBalance,
  size = 'full',
  allowFlip = true,
}: {
  parts: BodyRegionId[]
  showInbody?: boolean
  inbody?: InbodyBalance
  size?: 'mini' | 'full'
  // full에서 앞/뒤 토글 노출 여부
  allowFlip?: boolean
}) {
  const [view, setView] = useState<BodyView>('front')
  const mini = size === 'mini'
  const viewRegions = view === 'front' ? frontRegions : backRegions
  // 이 뷰에서 보이는 하이라이트 영역만 그린다
  const activeInView = parts.filter((p) => viewRegions.includes(p))
  // 다른 뷰에만 있는 하이라이트가 있으면 안내 도트로 힌트
  const hiddenCount = parts.filter((p) => !viewRegions.includes(p)).length

  const svg = (
    <svg
      viewBox="0 0 100 180"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* 실루엣 (앞/뒤 동일한 단순 형태) */}
      <g fill="#DCE4EA" stroke="#C4D0DA" strokeWidth="0.6">
        {/* 머리 */}
        <circle cx="50" cy="12" r="9" />
        {/* 목 */}
        <rect x="46" y="19" width="8" height="6" rx="2" />
        {/* 몸통 */}
        <path d="M30 38 Q50 30 70 38 L66 84 L34 84 Z" />
        {/* 팔 */}
        <rect x="22" y="38" width="8" height="40" rx="4" />
        <rect x="70" y="38" width="8" height="40" rx="4" />
        {/* 골반 */}
        <path d="M34 84 L66 84 L62 102 L38 102 Z" />
        {/* 다리 */}
        <rect x="36" y="100" width="11" height="56" rx="5" />
        <rect x="53" y="100" width="11" height="56" rx="5" />
        {/* 발 */}
        <ellipse cx="42" cy="170" rx="7" ry="4.5" />
        <ellipse cx="58" cy="170" rx="7" ry="4.5" />
      </g>
      {/* 척추 가이드 (뒤 뷰일 때만) */}
      {view === 'back' && (
        <line x1="50" y1="30" x2="50" y2="84" stroke="#B7C4CF" strokeWidth="1.2" strokeDasharray="2 2" />
      )}
      {/* 하이라이트 영역 (soft glow + fill) */}
      {activeInView.map((id) => {
        const dot = regionDots[id]
        return (
          <g key={id}>
            {/* glow */}
            <circle cx={dot.x} cy={dot.y} r={mini ? 9 : 11} fill="#E26D5C" opacity={0.18} />
            <BodyRegionShape id={id} />
            {/* 도트 + 라벨 (full에서만 라벨) */}
            <circle cx={dot.x} cy={dot.y} r={mini ? 1.6 : 1.8} fill="#B0432F" />
          </g>
        )
      })}
    </svg>
  )

  if (mini) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[#EEF5FA]">
        {svg}
        {parts.length === 0 && (
          <span className="absolute bottom-1 text-[9px] font-semibold text-[#9aa19a]">자극 포인트</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#5F7690]">자극 포인트 바디맵</p>
        {allowFlip && (
          <div className="flex gap-1 rounded-[8px] bg-[#edf1ed] p-0.5">
            {([
              ['front', '앞'],
              ['back', '뒤'],
            ] as Array<[BodyView, string]>).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={[
                  'rounded-[6px] px-3 py-1 text-[11px] font-semibold transition',
                  view === id ? 'bg-[#E26D5C] text-white shadow-sm' : 'text-[#667583]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {/* 실루엣 */}
        <div className="relative h-56 w-32 shrink-0 rounded-[10px] bg-[#EEF5FA] p-2">
          {svg}
        </div>
        {/* 하이라이트된 부위 범례 */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#718293]">이 수업의 자극 포인트</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parts.length > 0 ? (
              parts.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-[#E26D5C] bg-[#FBE8E3] px-2 py-1 text-[11px] font-semibold text-[#B0432F]"
                >
                  {bodyRegionLabels[id]}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-normal text-[#9aa19a]">표시할 자극 포인트가 없습니다.</span>
            )}
          </div>
          {hiddenCount > 0 && (
            <p className="mt-2 text-[10px] font-normal text-[#9aa19a]">
              {view === 'front' ? '뒤' : '앞'} 뷰에 {hiddenCount}개 부위가 더 있습니다.
            </p>
          )}
        </div>
      </div>

      {showInbody && <InbodyBalanceQuadrants balance={inbody} />}
    </div>
  )
}

// 리포트 텍스트 묶음에서 자극 포인트 영역을 도출 (중복 제거)
function regionsFromTexts(texts: string[]): BodyRegionId[] {
  const set = new Set<BodyRegionId>()
  for (const t of texts) for (const r of keywordsToRegions(t)) set.add(r)
  return Array.from(set)
}

function TodayScreen({
  recording,
  seconds,
  onStart,
  onFinish,
}: {
  recording: boolean
  seconds: number
  onStart: () => void
  onFinish: () => void
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [pastClassId, setPastClassId] = useState(pastClassOptions[0].id)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  // 기록 초점 입력값 (controlled) — 이전 초점 불러오기 모달에서 선택 시 채워진다 (H1)
  const [focusText, setFocusText] = useState('')
  // 이전 초점 불러오기 모달 + 검색어 (H1)
  const [focusPickerOpen, setFocusPickerOpen] = useState(false)
  const [focusQuery, setFocusQuery] = useState('')
  // 오늘 수업 시간 선택 (H2) — 기본 09:00
  const [selectedClassTime, setSelectedClassTime] = useState(todayClasses[0].time)
  // 회원 전체 명단 모달 (H5)
  const [memberListOpen, setMemberListOpen] = useState(false)

  // 검색어로 필터링한 이전 초점 목록 (초점 텍스트·수업명·날짜 기준) (H1)
  const filteredPastFocus = pastFocusHistory.filter((entry) => {
    const q = focusQuery.trim().toLowerCase()
    if (!q) return true
    return (
      entry.focus.toLowerCase().includes(q) ||
      entry.className.toLowerCase().includes(q) ||
      entry.date.toLowerCase().includes(q)
    )
  })

  const selectedPastClass =
    pastClassOptions.find((option) => option.id === pastClassId) ?? pastClassOptions[0]

  // 선택된 오늘 수업과 그 참여 회원 (H3)
  const selectedClass =
    todayClasses.find((cls) => cls.time === selectedClassTime) ?? todayClasses[0]
  const attendingNames = selectedClass.members
  const activeTrend = selectedMember ? getMemberTrend(selectedMember) : null

  const activeDay = weeklySchedule.find((day) => day.date === selectedDay) ?? null

  return (
    <div className="space-y-5">
      {/* 1) 빅블루 요가 — 센터 + 오늘 수업 시간칩 + 참여 회원 (H1~H5) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-[#1F3F5B]">빅블루 요가</p>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE4EA] bg-white text-sm transition hover:bg-[#F7FAFD]"
            type="button"
            aria-label="주간 달력 보기"
            title="주간 달력 보기"
            onClick={() => setCalendarOpen((open) => !open)}
          >
            📅
          </button>
        </div>

        {/* 오늘 수업 시간 칩 (H2) — 누르면 해당 수업 선택 */}
        <div className="flex flex-wrap items-center gap-2">
          {todayClasses.map((cls, index) => {
            const isActive = cls.time === selectedClassTime
            return (
              <span key={cls.time} className="flex items-center gap-2">
                {index > 0 && <span className="text-xs text-[#B7C0C9]">·</span>}
                <button
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    isActive
                      ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                      : 'border-[#DCE4EA] bg-white text-[#5D6874] hover:border-[#7BA3C7]',
                  ].join(' ')}
                  type="button"
                  onClick={() => {
                    setSelectedClassTime(cls.time)
                    setSelectedMember(null)
                  }}
                >
                  {cls.time}
                </button>
              </span>
            )
          })}
        </div>

        {/* 선택된 수업 — 큰 타이틀 (H1: 베이지 박스 제거, 평문 큰 텍스트) */}
        <div>
          <p className="text-[11px] font-semibold text-[#737F8A]">선택한 수업</p>
          <p className="mt-1 text-2xl font-semibold text-[#202B36]">
            {selectedClass.time} {selectedClass.title}
          </p>
        </div>

        {/* 주간 캘린더 (월~일) */}
        {calendarOpen && (
          <div className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#5F7690]">이번 주 · 날짜를 누르면 수업이 보여요</p>
              <button
                className="text-xs font-semibold text-[#2F5F8F]"
                type="button"
                onClick={() => {
                  setCalendarOpen(false)
                  setSelectedDay(null)
                }}
              >
                닫기
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {weeklySchedule.map((day) => {
                const isActive = selectedDay === day.date
                return (
                  <button
                    key={day.date}
                    className={[
                      'flex flex-col items-center rounded-[6px] py-2 text-center transition',
                      isActive
                        ? 'bg-[#E26D5C] text-white'
                        : 'bg-white text-[#5D6874] hover:bg-[#EEF5FA]',
                    ].join(' ')}
                    type="button"
                    onClick={() =>
                      setSelectedDay((current) => (current === day.date ? null : day.date))
                    }
                  >
                    <span className="text-[11px] font-semibold">{day.day}</span>
                    <span className="mt-0.5 text-[10px] font-normal">{day.date.slice(3)}</span>
                  </button>
                )
              })}
            </div>
            {activeDay && (
              <div className="mt-3 space-y-2 border-t border-[#D4E0EA] pt-3">
                {activeDay.classes.length > 0 ? (
                  activeDay.classes.map((cls) => (
                    <div
                      key={`${cls.time}-${cls.title}`}
                      className="flex items-start justify-between gap-3 rounded-[8px] bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#252D34]">
                          {cls.time} · {cls.title}
                        </p>
                        <p className="mt-0.5 text-[11px] font-normal text-[#687682]">
                          예약 {cls.count}명 · {cls.teacher}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2.5 py-1 text-[11px] font-semibold text-[#5F7690]">
                        {cls.count}명
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[8px] bg-white px-3 py-2 text-xs font-normal text-[#9aa19a]">
                    이 날은 예정된 수업이 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 참여 회원 수 / 강사 / 기록 (H3) — 회원 칩을 누르면 전체 명단 모달 (H5) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            className="rounded-[8px] bg-[#f3f4ef] px-3 py-3 text-left transition hover:bg-[#e8ebe4]"
            type="button"
            onClick={() => setMemberListOpen(true)}
            title="참여 회원 전체 명단 보기"
          >
            <p className="text-[11px] font-semibold text-[#747F89]">참여 회원</p>
            <p className="mt-1 text-sm font-semibold text-[#202B36]">{attendingNames.length}명</p>
          </button>
          <div className="rounded-[8px] bg-[#f3f4ef] px-3 py-3">
            <p className="text-[11px] font-semibold text-[#747F89]">강사</p>
            <p className="mt-1 text-sm font-semibold text-[#202B36]">{selectedClass.teacher}</p>
          </div>
          <div className="rounded-[8px] bg-[#f3f4ef] px-3 py-3">
            <p className="text-[11px] font-semibold text-[#747F89]">기록</p>
            <p className="mt-1 text-sm font-semibold text-[#202B36]">
              {recording ? '진행 중' : '대기'}
            </p>
          </div>
        </div>
      </section>

      {/* 회원 전체 명단 모달 (H5) — 인원수와 무관하게 전체 표시, 길면 스크롤 */}
      {memberListOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-6"
          onClick={() => setMemberListOpen(false)}
        >
          <div
            className="w-full max-w-[20rem] rounded-[12px] bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F3F5B]">
                  {selectedClass.time} {selectedClass.title}
                </p>
                <p className="mt-0.5 text-xs font-normal text-[#737F8A]">
                  참여 회원 {attendingNames.length}명
                </p>
              </div>
              <button
                className="text-xs font-semibold text-[#2F5F8F]"
                type="button"
                onClick={() => setMemberListOpen(false)}
              >
                닫기
              </button>
            </div>
            <div className="mt-3 max-h-[16rem] space-y-1.5 overflow-y-auto">
              {attendingNames.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[8px] bg-[#f3f4ef] px-3 py-2"
                >
                  <span className="text-sm font-semibold text-[#26303A]">{name}</span>
                  <span className="text-[11px] font-semibold text-[#9aa19a]">인바디 연동</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2) 지난 수업 포인트 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#6F7780]">지난 수업 포인트</p>
          <span className="rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2.5 py-1 text-[10px] font-semibold text-[#5F7690]">
            강사용 리포트(검수본) 기반
          </span>
        </div>
        <select
          className="h-10 w-full rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] px-3 text-sm font-semibold text-[#252D34] outline-none focus:border-[#7BA3C7]"
          value={pastClassId}
          onChange={(event) => setPastClassId(event.target.value)}
        >
          {pastClassOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="space-y-2">
          {selectedPastClass.points.map((point) => (
            <div
              key={point}
              className="flex items-center justify-between border-b border-[#E1E6EA] py-3"
            >
              <span className="text-sm font-semibold text-[#26303A]">{point}</span>
              <span className="text-xs text-[#737F8A]">{selectedPastClass.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3) 인바디 기록 — 회원 이름 리스트 → 그래프 */}
      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">인바디 기록</p>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          회원 이름을 누르면 골격근량·체지방률 추이를 봅니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {attendingNames.map((name) => {
            const isActive = activeTrend?.name === name
            return (
              <button
                key={name}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  isActive
                    ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                    : 'border-[#DCE4EA] bg-white text-[#5D6874] hover:border-[#7BA3C7]',
                ].join(' ')}
                type="button"
                onClick={() =>
                  setSelectedMember((current) => (current === name ? null : name))
                }
              >
                {name}
              </button>
            )
          })}
        </div>
        {activeTrend && <MemberInbodyChart trend={activeTrend} />}
      </section>

      {/* 4) 기록 초점 — 수업 기록 시작 버튼 바로 위 (H1~H4) */}
      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <div>
          <p className="text-xs font-semibold text-[#5F7690]">기록 초점</p>
          <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
            수업 주제, 상황, 고유명사 등 수업과 관련된 맥락을 입력하면 기록되는 리포트의 성능이
            높아집니다.
          </p>
        </div>
        <textarea
          className="mt-3 h-20 w-full resize-none rounded-[8px] border border-[#DCE4EA] bg-white px-3 py-2 text-sm font-normal leading-6 text-[#252D34] outline-none placeholder:text-[#9aa19a] focus:border-[#7BA3C7]"
          placeholder="예) 오른발 접지와 호흡 중심, 파스치모타나사나 진입 준비"
          value={focusText}
          onChange={(event) => setFocusText(event.target.value)}
        />
        <button
          className="mt-3 h-10 w-full rounded-[6px] border border-[#DCE4EA] bg-white text-sm font-semibold text-[#2F5F8F] transition hover:bg-[#F7FAFD]"
          type="button"
          onClick={() => {
            setFocusQuery('')
            setFocusPickerOpen(true)
          }}
        >
          이전 초점 불러오기
        </button>
      </section>

      {/* 이전 초점 불러오기 모달 (H1) — 과거 초점 + 날짜 + 수업, 검색 가능 */}
      {focusPickerOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-6"
          onClick={() => setFocusPickerOpen(false)}
        >
          <div
            className="flex max-h-[80%] w-full max-w-[20rem] flex-col rounded-[12px] bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F3F5B]">이전 초점 불러오기</p>
                <p className="mt-0.5 text-xs font-normal text-[#737F8A]">
                  지난 수업에 썼던 기록 초점을 골라 채웁니다.
                </p>
              </div>
              <button
                className="text-xs font-semibold text-[#2F5F8F]"
                type="button"
                onClick={() => setFocusPickerOpen(false)}
              >
                닫기
              </button>
            </div>
            <input
              className="mt-3 h-10 w-full shrink-0 rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] px-3 text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a] focus:border-[#7BA3C7]"
              placeholder="초점·수업·날짜 검색"
              value={focusQuery}
              onChange={(event) => setFocusQuery(event.target.value)}
            />
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
              {filteredPastFocus.length > 0 ? (
                filteredPastFocus.map((entry) => (
                  <button
                    key={entry.id}
                    className="w-full rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] px-3 py-2.5 text-left transition hover:border-[#7BA3C7] hover:bg-[#F7FAFD]"
                    type="button"
                    onClick={() => {
                      setFocusText(entry.focus)
                      setFocusPickerOpen(false)
                    }}
                  >
                    <p className="text-sm font-semibold leading-6 text-[#252D34]">{entry.focus}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#737F8A]">
                      {entry.date} · {entry.className}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-[8px] bg-[#f3f4ef] px-3 py-3 text-xs font-normal text-[#9aa19a]">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5) 수업 기록 시작 / 인플레이스 녹음 — 기록 초점 바로 아래 (H4, H6) */}
      {recording ? (
        <section className="rounded-[8px] border border-[#E26D5C] bg-[#FBE8E3] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#B0432F]">보호 녹음 중</p>
            <p className="text-2xl font-semibold tabular-nums text-[#B0432F]">
              {formatTimer(seconds)}
            </p>
          </div>
          {/* 파형 */}
          <div className="mt-3 flex h-16 items-end justify-between gap-1 rounded-[8px] bg-white px-3 py-3">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full bg-[#E26D5C] transition-all duration-300"
                style={{
                  height: `${10 + ((index * 13 + seconds * 5) % 38)}px`,
                  opacity: 0.7 + ((index % 4) * 0.06),
                }}
              />
            ))}
          </div>
          <button
            className="mt-3 h-12 w-full rounded-[6px] bg-[#E26D5C] text-sm font-semibold text-white transition hover:bg-[#D15A48]"
            type="button"
            onClick={onFinish}
          >
            AI 초안 만들기
          </button>
        </section>
      ) : (
        <button
          className="h-13 w-full rounded-[6px] bg-[#E26D5C] text-sm font-semibold text-white shadow-sm transition hover:bg-[#D15A48]"
          type="button"
          onClick={onStart}
        >
          수업 기록 시작
        </button>
      )}
    </div>
  )
}

function ReviewScreen({
  items,
  focusViewMode,
  onChangeFocusViewMode,
  onToggleMember,
  onToggleTeacher,
  onToggleKept,
  onPublish,
}: {
  items: ReviewItem[]
  focusViewMode: FocusViewMode
  onChangeFocusViewMode: (mode: FocusViewMode) => void
  onToggleMember: (id: string) => void
  onToggleTeacher: (id: string) => void
  onToggleKept: (id: string) => void
  onPublish: () => void
}) {
  // 리포트 탭은 [최근 초안] / [검수 대기 (N)] 세그먼트로 나뉜다. 기본은 검수 대기.
  const [segment, setSegment] = useState<'recent' | 'pending'>('pending')
  // 전체 AI 초안 보기 토글
  const [fullDraftOpen, setFullDraftOpen] = useState(false)
  // 현재 작업대에 올라온(클릭으로 연 ) 검수 대기 초안 id (R2). 기본은 첫 항목.
  const [activeDraftId, setActiveDraftId] = useState(pendingDrafts[0]?.id ?? '')
  // 기능2: 사진·영상 첨부 — 데모상 버튼을 누르면 플레이스홀더 썸네일이 추가된다 (실제 업로드 없음)
  const [attachments, setAttachments] = useState<Array<{ id: string; kind: 'photo' | 'video' }>>([])
  const addAttachment = (kind: 'photo' | 'video') =>
    setAttachments((prev) => [...prev, { id: `att-${Date.now()}-${prev.length}`, kind }])

  // 회원/강사는 독립적이라 한 항목이 양쪽에 동시에 카운트될 수 있다.
  const memberCount = items.filter((item) => item.toMember).length
  // 회원-tagged 항목이 수련생 리포트 연결을 만든다.
  const shareableItems = items.filter((item) => item.toMember)
  const canPublish = memberCount > 0
  // 검수 대기 초안 개수 = 데모 목록 길이 (R2)
  const pendingCount = pendingDrafts.length

  const segmentControl = (
    <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-[#edf1ed] p-1">
      {([
        ['recent', '최근 초안'],
        ['pending', `검수 대기 (${pendingCount})`],
      ] as Array<['recent' | 'pending', string]>).map(([id, label]) => {
        const isActive = segment === id
        return (
          <button
            key={id}
            className={[
              'h-10 rounded-[6px] text-xs font-semibold transition',
              isActive
                ? 'bg-[#E26D5C] text-white shadow-sm'
                : 'text-[#667583] hover:bg-[#f8faf5]',
            ].join(' ')}
            type="button"
            onClick={() => setSegment(id)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  if (segment === 'recent') {
    return (
      <div className="space-y-5">
        {segmentControl}
        <section>
          <p className="text-xs font-semibold text-[#6F7780]">최근 초안</p>
          <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
            다시 검수할 수 있는 최근 초안입니다. 발행된 리포트는 아카이브 탭에 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          {recentDrafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between gap-3 border-b border-[#E1E6EA] py-3"
            >
              <div>
                {draft.kind === 'solo' ? (
                  // 개인지도(1:1) — 수련생 이름 (R1)
                  <p className="text-sm font-semibold text-[#252D34]">
                    {draft.member} · {draft.className}
                  </p>
                ) : (
                  // 그룹 수업 — 이름 대신 회원 수 + 날짜 + 시간 (R1)
                  <p className="text-sm font-semibold text-[#252D34]">
                    {draft.className} · {draft.memberCount}명
                  </p>
                )}
                <p className="mt-0.5 text-xs font-normal text-[#737F8A]">
                  {draft.date} · {draft.time}
                </p>
              </div>
              <span
                className={[
                  'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                  draft.kind === 'solo'
                    ? 'border-[#1F3F5B] bg-[#EEF5FA] text-[#1F3F5B]'
                    : 'border-[#9aa19a] bg-[#f3f4ef] text-[#5D6874]',
                ].join(' ')}
              >
                {draft.kind === 'solo' ? '개인지도' : '그룹 수업'}
              </span>
            </div>
          ))}
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {segmentControl}

      <section className="rounded-[8px] bg-[#f3f4ef] px-4 py-3">
        <p className="text-xs font-normal leading-5 text-[#687682]">
          녹음은 끝났지만 아직 검수 안 한 AI 초안입니다. 강사·회원 범위를 정하고 발행하세요.
          강사·회원은 독립이라 한 조각을 양쪽에 모두 넣을 수 있습니다.
        </p>
      </section>

      {/* 검수 대기 초안 목록 — 각 초안을 눌러 작업대에 올린다 (R2) */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-[#6F7780]">검수 대기 초안 {pendingCount}건</p>
        {pendingDrafts.map((draft) => {
          const isActive = draft.id === activeDraftId
          return (
            <button
              key={draft.id}
              className={[
                'flex w-full items-center justify-between gap-3 rounded-[8px] border px-3 py-2.5 text-left transition',
                isActive
                  ? 'border-[#E26D5C] bg-[#FBE8E3]'
                  : 'border-[#E1E6EA] bg-[#FBFCFF] hover:border-[#7BA3C7] hover:bg-[#F7FAFD]',
              ].join(' ')}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveDraftId(draft.id)}
            >
              <div>
                <p className="text-sm font-semibold text-[#252D34]">
                  {draft.className} · {formatDraftMember(draft.member, draft.memberCount)}
                </p>
                <p className="mt-0.5 text-[11px] font-normal text-[#737F8A]">{draft.date}</p>
              </div>
              <span
                className={[
                  'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                  isActive
                    ? 'border-[#E26D5C] bg-white text-[#B0432F]'
                    : 'border-[#DCE4EA] bg-[#EEF5FA] text-[#5F7690]',
                ].join(' ')}
              >
                {isActive ? '검수 중' : '검수 열기'}
              </span>
            </button>
          )
        })}
      </section>

      {/* 전체 AI 초안 보기 — 모든 초점의 요약/전사를 한 번에 */}
      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] p-4">
        <button
          className="flex w-full items-center justify-between gap-3"
          type="button"
          aria-expanded={fullDraftOpen}
          onClick={() => setFullDraftOpen((open) => !open)}
        >
          <span className="text-xs font-semibold text-[#5F7690]">전체 AI 초안 보기</span>
          <span className="text-[11px] font-semibold text-[#7BA3C7]">
            {fullDraftOpen ? '접기 ▲' : '펼치기 ▾'}
          </span>
        </button>
        {fullDraftOpen && (
          <div className="mt-3 space-y-3">
            <p className="text-[11px] font-normal leading-5 text-[#687682]">
              검수 전 AI가 만든 전체 초안입니다. 각 초점의 요약과 전사 근거를 한 번에 봅니다.
            </p>
            {items.map((item) => (
              <div key={item.id} className="rounded-[8px] bg-[#F7FAFD] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#1F3F5B]">{item.focus}</p>
                  <span className="shrink-0 rounded-full border border-[#DCE4EA] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
                    전사 {item.transcriptTime}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-normal leading-6 text-[#3a423a]">{item.text}</p>
                <p className="mt-1.5 text-[11px] font-normal leading-5 text-[#687682]">
                  {item.transcript}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 기능2: 사진·영상 첨부 창 — 검수 단계에서 자료를 덧붙인다 (데모) */}
      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#5F7690]">사진·영상 첨부</p>
          <span className="rounded-full bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
            {attachments.length}개 첨부됨
          </span>
        </div>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          자세 사진이나 짧은 영상을 덧붙여 리포트를 더 풍성하게 만듭니다.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => addAttachment('photo')}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[#DCE4EA] bg-white text-xs font-semibold text-[#2F5F8F] transition hover:bg-[#F7FAFD]"
          >
            📷 사진 첨부
          </button>
          <button
            type="button"
            onClick={() => addAttachment('video')}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[#DCE4EA] bg-white text-xs font-semibold text-[#2F5F8F] transition hover:bg-[#F7FAFD]"
          >
            🎬 영상 첨부
          </button>
        </div>
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex h-16 w-16 items-center justify-center rounded-[8px] border border-[#DCE4EA] bg-[#EEF5FA] text-xl"
              >
                {att.kind === 'photo' ? '🖼️' : '▶️'}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  aria-label="첨부 삭제"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E26D5C] text-[10px] font-bold text-white shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">수업 데이터 참조</p>
            <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
              이번 수업과 연결된 지식 소스를 추려 요약합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2F5F8F]">
            RAG
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {aiWikiSources.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 border-b border-[#E1E6EA] py-2 last:border-b-0"
            >
              <p className="text-xs font-semibold text-[#718293]">{label}</p>
              <p className="max-w-[14rem] text-right text-sm font-semibold leading-5 text-[#252D34]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">데이터 변환</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {dataLayerFlow.map(([key, label, value]) => (
            <div key={key} className="rounded-[8px] bg-white px-3 py-3">
              <p className="text-[10px] font-semibold uppercase text-[#687D91]">{key}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{label}</p>
              <p className="mt-1 text-[11px] font-normal leading-4 text-[#687682]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <FocusReviewModePanel
        items={items}
        mode={focusViewMode}
        onChangeMode={onChangeFocusViewMode}
        onToggleMember={onToggleMember}
        onToggleTeacher={onToggleTeacher}
        onToggleKept={onToggleKept}
      />

      <button
        className={[
          'h-13 w-full rounded-[6px] text-sm font-semibold transition',
          canPublish
            ? 'bg-[#E26D5C] text-white hover:bg-[#D15A48]'
            : 'cursor-not-allowed bg-[#d9ded7] text-[#747D86]',
        ].join(' ')}
        type="button"
        disabled={!canPublish}
        onClick={onPublish}
      >
        {canPublish
          ? `발행 화면으로 이동 (회원 ${shareableItems.length}건)`
          : '회원 항목이 없으면 발행할 수 없습니다'}
      </button>
    </div>
  )
}

function ReportScreen({
  items,
  shareableItems,
  publishedTo,
  onPublishMember,
  onPublishTeacher,
  onGoReview,
  onOpenStudent,
}: {
  items: ReviewItem[]
  shareableItems: ReviewItem[]
  publishedTo: PublishTarget | null
  onPublishMember: () => void
  onPublishTeacher: () => void
  onGoReview: () => void
  onOpenStudent: () => void
}) {
  const shareableCount = shareableItems.length
  const excludedItems = items.filter((item) => !item.toMember && !item.toTeacher)
  const keptItems = items.filter((item) => item.kept)
  // 회원 리포트 수신 대상 (R6) — 하타 베이직 09:00 참여 회원 5명 (데모)
  const memberDeliveryNames = todayClasses[0].members
  // 강사 리포트 = toTeacher 항목만 (R8). 회원·강사 양쪽인 항목은 양쪽에 모두 나타난다.
  const teacherReportItems = items.filter((item) => item.toTeacher)
  const canPublishMember = shareableCount > 0

  // 기능2: 검수된 회원 항목의 신체 부위 키워드로 자극 포인트 바디맵을 생성 (정적, MVP)
  const previewRegions = regionsFromTexts(
    shareableItems.map((item) => `${item.text} ${item.source} ${item.cloudTerms.join(' ')}`),
  )

  // 발행 버튼 패널 — 회원 리포트(회원 항목) / 강사 리포트(강사 항목)
  const publishPanel = (
    <section className="space-y-4 rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] p-4">
      {/* 기능2: 몸소 시각 디자인(자극 포인트) 생성 미리보기 — 발행 전 강사가 비주얼 확인 */}
      <div className="rounded-[8px] border border-[#F0D5CE] bg-[#FFF7F4] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#1F3F5B]">몸소 시각 디자인 (자극 포인트)</p>
          <span className="rounded-full border border-[#E26D5C] bg-[#FBE8E3] px-2 py-0.5 text-[10px] font-semibold text-[#B0432F]">
            발행 전 미리보기
          </span>
        </div>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          검수한 회원 항목의 부위 키워드로 자동 생성된 바디맵입니다. 발행 전 확인하세요.
        </p>
        <div className="mt-3 rounded-[8px] bg-white p-3">
          <BodyMap parts={previewRegions} size="full" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#5F7690]">발행</p>
        <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">
          회원 리포트(회원 항목) / 강사 리포트(강사 항목)로 발행합니다. 강사·회원은 독립이라
          한 조각이 양쪽에 모두 들어갈 수 있습니다. 📌 보관 항목은 강사 개인 아카이브로 이동하고,
          어느 쪽도 선택 안 한 항목은 제외됩니다.
        </p>
      </div>

      {/* 회원 리포트 — 회원 항목만, coral */}
      <div className="rounded-[8px] border border-[#F0D5CE] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#252D34]">회원 리포트</p>
            <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">
              회원 {shareableCount}건 · 회원 앱에 공유됩니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#E26D5C] bg-[#FBE8E3] px-2.5 py-1 text-[11px] font-semibold text-[#B0432F]">
            회원 {shareableCount}
          </span>
        </div>
        <button
          className={[
            'mt-3 h-12 w-full rounded-[6px] text-sm font-semibold transition',
            canPublishMember
              ? 'bg-[#E26D5C] text-white hover:bg-[#D15A48]'
              : 'cursor-not-allowed bg-[#d9ded7] text-[#747D86]',
          ].join(' ')}
          type="button"
          disabled={!canPublishMember}
          onClick={onPublishMember}
        >
          {canPublishMember
            ? publishedTo === 'member'
              ? '회원 리포트 다시 발행'
              : '회원 리포트 발행'
            : '회원 항목이 없으면 발행할 수 없습니다'}
        </button>
      </div>

      {/* 강사 리포트 — 강사+회원 전체, navy */}
      <div className="rounded-[8px] border border-[#CFDDEA] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#252D34]">강사 리포트</p>
            <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">
              강사 {teacherReportItems.length}건 · 📌 보관 {keptItems.length}건은 강사 개인
              아카이브로 이동합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#1F3F5B] bg-[#EEF5FA] px-2.5 py-1 text-[11px] font-semibold text-[#1F3F5B]">
            강사 {teacherReportItems.length}
          </span>
        </div>
        <button
          className="mt-3 h-12 w-full rounded-[6px] bg-[#1F3F5B] text-sm font-semibold text-white transition hover:bg-[#173049]"
          type="button"
          onClick={onPublishTeacher}
        >
          {publishedTo === 'teacher' ? '강사 리포트 다시 발행' : '강사 리포트 발행 (강사 항목)'}
        </button>
      </div>
    </section>
  )

  if (publishedTo === null) {
    return (
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase text-[#6F7780]">리포트 발행</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
            아직 발행되지 않았습니다.
          </h2>
          <p className="mt-2 text-sm font-normal leading-6 text-[#566055]">
            AI 초안은 자동 공유되지 않습니다. 검수한 항목을 아래에서 직접 발행하세요.
          </p>
        </section>

        {publishPanel}

        <button
          className="h-13 w-full rounded-[6px] bg-[#f3f4ef] text-sm font-semibold text-[#303A45] transition hover:bg-[#e8ebe4]"
          type="button"
          onClick={onGoReview}
        >
          검수 화면으로 이동
        </button>
      </div>
    )
  }

  // 강사 리포트 발행 시: 전체 기록 + 📌 보관 강조
  if (publishedTo === 'teacher') {
    return (
      <div className="space-y-5">
        <section className="rounded-[8px] bg-[#1F3F5B] p-4 text-white">
          <p className="text-xs font-semibold text-[#BBD3E8]">강사 리포트 발행 완료</p>
          <p className="mt-2 text-sm font-normal leading-6 text-[#E3EEF6]">
            강사 항목 {teacherReportItems.length}건이 강사 리포트로 보관됐습니다. 📌 보관{' '}
            {keptItems.length}건은 강사 개인 아카이브로 이동했고, 제외 {excludedItems.length}건과
            함께 회원에게는 공개되지 않습니다.
          </p>
        </section>

        {keptItems.length > 0 && (
          <section className="rounded-[8px] border border-[#E26D5C] bg-[#FBE8E3] p-4">
            <p className="text-xs font-semibold text-[#B0432F]">📌 강사 개인 아카이브 {keptItems.length}건</p>
            <div className="mt-3 space-y-2">
              {keptItems.map((item) => (
                <div key={item.id} className="rounded-[8px] bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#252D34]">{item.focus}</p>
                    <StatusPill toMember={item.toMember} toTeacher={item.toTeacher} kept={item.kept} />
                  </div>
                  <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <p className="text-xs font-semibold text-[#6F7780]">강사 리포트(강사 항목)</p>
          {teacherReportItems.map((item) => (
            <div key={item.id} className="border-b border-[#E1E6EA] pb-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#747F89]">{item.focus}</p>
                <StatusPill toMember={item.toMember} toTeacher={item.toTeacher} kept={item.kept} />
              </div>
              <p className="mt-1 text-sm font-normal leading-7 text-[#2c332c]">{item.text}</p>
            </div>
          ))}
        </section>

        {publishPanel}

        <button
          className="h-13 w-full rounded-[6px] bg-[#f3f4ef] text-sm font-semibold text-[#303A45] transition hover:bg-[#e8ebe4]"
          type="button"
          onClick={onGoReview}
        >
          검수 화면으로 이동
        </button>
      </div>
    )
  }

  const publishedTexts =
    shareableItems.length > 0
      ? shareableItems.map((item) => item.text)
      : sampleStudentReportItems

  return (
    <div className="space-y-5">
      <section className="rounded-[8px] bg-[#E26D5C] p-4 text-white">
        <p className="text-xs font-semibold text-[#FBE8E3]">회원 리포트 발행 완료</p>
        <p className="mt-2 text-sm font-normal leading-6 text-[#FBE8E3]">
          회원 {shareableCount}건만 회원 앱으로 발행됐습니다. 강사 항목·제외 항목은 회원에게
          공개되지 않습니다.
        </p>
        {/* 누구에게 몇 명에게 발행됐는지 (R6) — 하타 베이직 5명 */}
        <div className="mt-3 rounded-[8px] bg-white/15 px-3 py-2.5">
          <p className="text-xs font-semibold text-white">
            회원 리포트 {memberDeliveryNames.length}명에게 발행
          </p>
          <p className="mt-1 text-xs font-normal leading-5 text-[#FBE8E3]">
            {memberDeliveryNames.join(' · ')}
          </p>
        </div>
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4 text-[#1F3F5B]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">공유 링크</p>
            <p className="mt-1 text-sm font-normal leading-6">
              발행된 리포트는 수련생용 앱에서 검수 기록만 보여줍니다.
            </p>
          </div>
          <button
            className="h-10 shrink-0 rounded-[6px] bg-[#E26D5C] px-3 text-xs font-semibold text-white transition hover:bg-[#D15A48]"
            type="button"
            onClick={onOpenStudent}
          >
            수련생 앱으로 보기
          </button>
        </div>
        <p className="mt-3 border-t border-[#D4E0EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          {studentShareUrl} · 원본 음성과 전체 전사는 비공개
        </p>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">발행된 데이터 계층</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {dataLayerFlow.map(([key, label, value]) => (
            <div key={key} className="rounded-[8px] bg-white px-3 py-3">
              <p className="text-[10px] font-semibold uppercase text-[#737F8A]">{key}</p>
              <p className="mt-1 text-sm font-semibold text-[#252D34]">{label}</p>
              <p className="mt-1 text-[11px] font-normal leading-4 text-[#697682]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase text-[#6F7780]">김하린 수련 기록</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          오늘은 접지와 호흡 리듬을 함께 관찰한 수업으로 기록됐어요.
        </h2>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">내 기록 보관</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {studentArchiveStates.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-[#718293]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#DCE4EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          강사가 공유로 확정한 기록만 개인 아카이브에 표시됩니다.
        </p>
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">인바디 참고 지표</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {inbodyReferenceMetrics.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#687D91]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#D4E0EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          {inbodyDisclaimer}
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">강사가 공유한 기록</p>
        {publishedTexts.length > 0 ? (
          publishedTexts.map((text) => (
            <p
              key={text}
              className="border-b border-[#E1E6EA] pb-3 text-sm font-normal leading-7 text-[#2c332c]"
            >
              {text}
            </p>
          ))
        ) : (
          <p className="rounded-[8px] bg-[#f3f4ef] p-4 text-sm font-semibold text-[#6c716b]">
            아직 공유 후보가 없습니다.
          </p>
        )}
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">수련생 감각 메모</p>
        <p className="mt-1 text-[11px] font-normal text-[#747F89]">
          수업 후 수련생이 남긴 감각을 강사가 확인한 기록
        </p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#3a423a]">
          오른발 엄지 아래쪽에 무게가 더 잘 실렸고, 내쉬는 호흡에서 허벅지 뒤쪽 긴장이 조금
          줄었다고 기록했습니다.
        </p>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">다음 수업에서 이어볼 것</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#2c332c]">
          내쉬는 호흡에서 골반 정렬을 천천히 확인하고, 오른발 접지가 무너지지
          않는지 다시 살펴봅니다.
        </p>
      </section>

      {publishPanel}
    </div>
  )
}

function StudentHomeScreen({ onOpenReport }: { onOpenReport: () => void }) {
  // SH6: 회원은 다른 회원 명단을 볼 수 없으므로, 참여 인원은 '수'만 표시하고
  // 클릭해도 명단 모달을 열지 않는다(강사 홈과의 핵심 프라이버시 차이).
  // 가장 가까운(다음) 수업 = 목록 첫 항목.
  const nextClass = studentUpcomingClasses[0]

  return (
    <div className="space-y-5">
      {/* SH1: 오늘 받은 리포트 안내 카드 (상태 row는 제거됨) */}
      <section className="rounded-[10px] bg-[#E26D5C] p-5 text-white">
        <p className="text-xs font-semibold text-[#DCEBFA]">김하린님의 momso</p>
        <h2 className="mt-2 text-[26px] font-semibold leading-tight">
          오늘 받은 리포트가 개인 아카이브에 보관됐어요.
        </h2>
        <p className="mt-3 text-sm font-normal leading-6 text-[#cfe2d7]">
          강사가 검수한 기록만 표시되고, 원본 음성과 전체 전사는 공개되지 않습니다.
        </p>
        <button
          className="mt-5 h-11 w-full rounded-[6px] bg-white text-sm font-semibold text-[#E26D5C] transition hover:bg-[#edf1ed]"
          type="button"
          onClick={onOpenReport}
        >
          오늘 리포트 보기
        </button>
      </section>

      {/* SH2: 공유·연결 허브 section은 우상단 ⚙ 설정으로 이동했습니다(설정은 데모상 placeholder).
          따라서 홈 본문에서는 제거합니다. */}

      {/* SH3: 브리핑 — 최근 3개 몸소 리포트 요약 + 최근 인바디 데이터 요약 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1F3F5B]">브리핑</p>
          <span className="rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2.5 py-1 text-[10px] font-semibold text-[#5F7690]">
            모미가 정리
          </span>
        </div>

        <div className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
          <p className="text-xs font-semibold text-[#5F7690]">최근 3개의 몸소 리포트 요약</p>
          <div className="mt-3 space-y-2.5">
            {studentBriefingReports.map((report) => (
              <div key={`${report.date}-${report.className}`} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-full border border-[#DCE4EA] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
                  {report.date}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#252D34]">{report.className}</p>
                  <p className="mt-0.5 text-xs font-normal leading-5 text-[#687682]">
                    {report.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] bg-[#EEF5FA] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#5F7690]">최근 인바디 데이터 요약</p>
            <span className="text-[10px] font-semibold text-[#9aa19a]">
              {studentInbodyBriefing.measuredAt}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[studentInbodyBriefing.muscle, studentInbodyBriefing.fat].map((metric) => (
              <div key={metric.label} className="rounded-[8px] bg-white px-3 py-3">
                <p className="text-[11px] font-semibold text-[#687D91]">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#1F3F5B]">{metric.value}</p>
                <p
                  className={[
                    'mt-0.5 text-[11px] font-semibold',
                    metric.up ? 'text-[#2F5F8F]' : 'text-[#B0432F]',
                  ].join(' ')}
                >
                  {metric.up ? '▲' : '▼'} {metric.delta}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-[#D4E0EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
            {inbodyDisclaimer}
          </p>
        </div>
      </section>

      {/* SH4: 최근 아카이브 list 제거 (아카이브 탭·브리핑 리포트와 중복) */}

      {/* SH5: 다음 수업 제안 — 다음 수업에서 집중할 포인트 제안 */}
      <section className="rounded-[8px] border border-[#CFDDEA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">다음 수업 제안</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#1F3F5B]">
          다음 수업에서 이것에 집중해보세요
        </p>
        <div className="mt-3 space-y-2">
          {[
            '내쉬는 호흡에서 골반 정렬을 천천히 확인하기',
            '오른발 접지가 무너지지 않는지 다시 살펴보기',
            '전굴 진입 전 햄스트링 긴장을 무릎 굽힘으로 낮추기',
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E26D5C]" />
              <p className="text-sm font-normal leading-6 text-[#2c332c]">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SH6: 연동 센터 수업 예약 스케줄표 + 가장 가까운(다음) 수업 안내.
          프라이버시: 참여 인원은 '수'만 노출, 회원 명단 모달 없음. */}
      <section className="space-y-3">
        <p className="text-sm font-semibold text-[#1F3F5B]">빅블루 요가 · 수업 예약</p>

        {/* 가장 가까운(다음) 수업 안내 */}
        <div className="rounded-[8px] bg-[#1F3F5B] p-4 text-white">
          <p className="text-xs font-semibold text-[#DCEBFA]">다음 수업</p>
          <p className="mt-1.5 text-lg font-semibold">
            {nextClass.date} {nextClass.time} · {nextClass.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal text-[#C9DDF0]">
            <span>강사 {nextClass.teacher}</span>
            <span>·</span>
            {/* 참여 인원: 수만 표시 (명단 비공개) */}
            <span>참여 {nextClass.count}명</span>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
            {nextClass.reserved ? '예약 완료' : '예약 가능'}
          </span>
        </div>

        {/* 예약 스케줄표 — 다가오는 수업 목록 */}
        <div className="rounded-[8px] border border-[#DCE4EA] bg-white">
          {studentUpcomingClasses.map((cls, index) => (
            <div
              key={cls.id}
              className={[
                'flex items-center justify-between gap-3 px-4 py-3',
                index > 0 ? 'border-t border-[#EEF1F4]' : '',
              ].join(' ')}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#252D34]">
                  {cls.time} · {cls.title}
                </p>
                <p className="mt-0.5 text-[11px] font-normal text-[#687682]">
                  {cls.day} {cls.date} · {cls.teacher} · 참여 {cls.count}명
                </p>
              </div>
              {cls.reserved ? (
                <span className="shrink-0 rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-3 py-1.5 text-[11px] font-semibold text-[#5F7690]">
                  예약됨
                </span>
              ) : (
                <button
                  className="shrink-0 rounded-full bg-[#E26D5C] px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#D15A48]"
                  type="button"
                >
                  예약
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] font-normal leading-5 text-[#9aa19a]">
          참여 인원은 수만 표시되며, 다른 회원의 이름은 공개되지 않습니다.
        </p>
      </section>
    </div>
  )
}

function StudentReportScreen({ reportTexts }: { reportTexts: string[] }) {
  // 인바디 레이어 토글 — 회원의 인바디가 연동돼 있다고 가정 (데모)
  const [inbodyLayer, setInbodyLayer] = useState(false)
  // 리포트 내용에서 자극 포인트 영역을 도출 (우측 어깨·골반·햄스트링·접지 등)
  const bodyParts = regionsFromTexts(reportTexts)

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold tracking-[0.01em] text-[#5D7EA1]">momso personal report</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          김하린님의 개인 리포트가 도착했어요.
        </h2>
        <p className="mt-3 text-xs font-normal leading-5 text-[#697682]">
          {studentShareUrl} · 검수된 기록만 표시
        </p>
      </section>

      {/* 기능1: 자극 포인트 — 헤드라인 비주얼. 바디맵 + 인바디 레이어 토글 */}
      <section className="rounded-[10px] border border-[#F0D5CE] bg-[#FFF7F4] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1F3F5B]">자극 포인트</p>
          <button
            type="button"
            onClick={() => setInbodyLayer((v) => !v)}
            aria-pressed={inbodyLayer}
            className={[
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition',
              inbodyLayer
                ? 'border-[#1F3F5B] bg-[#1F3F5B] text-white'
                : 'border-[#DCE4EA] bg-white text-[#5F7690]',
            ].join(' ')}
          >
            📊 인바디 레이어
          </button>
        </div>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          오늘 수업에서 집중한 부위를 몸 위에 표시했어요.
          {inbodyLayer ? ' 내 인바디 근육 밸런스를 함께 봅니다.' : ' 인바디 레이어를 켜면 좌우 균형도 함께 보여요.'}
        </p>
        <div className="mt-3 rounded-[8px] bg-white p-3">
          <BodyMap parts={bodyParts} showInbody={inbodyLayer} size="full" />
        </div>
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">인바디 참고 지표</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {inbodyReferenceMetrics.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#687D91]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#D4E0EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          {inbodyDisclaimer}
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">오늘 받은 기록</p>
        {reportTexts.map((text) => (
          <p
            key={text}
            className="border-b border-[#E1E6EA] pb-3 text-sm font-normal leading-7 text-[#2c332c]"
          >
            {text}
          </p>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">수련생 감각 메모</p>
        <p className="mt-1 text-[11px] font-normal text-[#747F89]">
          수업 후 수련생이 남긴 감각을 강사가 확인한 기록
        </p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#3a423a]">
          오른발 엄지 아래쪽에 무게가 더 잘 실렸고, 내쉬는 호흡에서 허벅지 뒤쪽 긴장이 조금
          줄었다고 기록했습니다.
        </p>
      </section>

      <section className="rounded-[8px] bg-[#E26D5C] p-4 text-white">
        <p className="text-xs font-semibold text-[#DCEBFA]">공유 범위</p>
        <div className="mt-3 space-y-2">
          {[
            '검수된 개인 리포트만 표시',
            '원본 녹음과 전체 전사본은 비공개',
            '외부 API나 SNS 연결은 수련생 동의 후 확장',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DCEBFA]" />
              <p className="text-sm font-normal leading-6 text-[#EEF7FF]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">연결 가능한 표면</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {connectionChannels.map(([label, value]) => (
            <div key={label} className="rounded-[8px] bg-white px-3 py-3">
              <p className="text-xs font-semibold text-[#252D34]">{label}</p>
              <p className="mt-1 text-[11px] font-normal text-[#697682]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#DCE4EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          검수된 기록만 연결 대상으로 표시되고, 원본 음성과 전체 전사는 연결되지 않습니다.
        </p>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">다음 수업에서 이어볼 것</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#2c332c]">
          내쉬는 호흡에서 골반 정렬을 천천히 확인하고, 오른발 접지가 무너지지 않는지 다시
          살펴봅니다.
        </p>
      </section>
    </div>
  )
}

function StudentArchiveScreen({ onOpenReport }: { onOpenReport: () => void }) {
  // SA2/SA4: 근육량(골격근량) 추이를 그래프로 렌더 — 김하린 실데이터 추이 재사용
  const inbodyTrend = getMemberTrend('김하린')

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6F7780]">personal archive</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          검수된 수업 기록만 시간순으로 쌓입니다.
        </h2>
      </section>

      {/* SA1: 수련 통계 — 누적 수련 횟수 · 누적 시간 · 개선율 */}
      <section className="space-y-3">
        <p className="text-sm font-semibold text-[#1F3F5B]">수련 통계</p>
        <div className="grid grid-cols-3 gap-2">
          {studentTrainingStats.map(([label, value, note]) => (
            <div key={label} className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-3">
              <p className="text-[11px] font-semibold text-[#718293]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[#1F3F5B]">{value}</p>
              <p className="mt-0.5 text-[10px] font-normal leading-4 text-[#9aa19a]">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SA2: 인바디 추이 그래프 — 근육량(골격근량)·체지방률 시계열 */}
      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">인바디 추이 그래프</p>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          근육량(골격근량)과 체지방률의 월별 변화입니다.
        </p>
        <MemberInbodyChart trend={inbodyTrend} />
        {/* 근육량을 막대 그래프로도 표시 — 변화가 한눈에 보이도록 */}
        <div className="mt-3 rounded-[8px] bg-white p-3">
          <p className="text-xs font-semibold text-[#2F5F8F]">골격근량 (kg)</p>
          <div className="mt-3 flex h-28 items-end justify-between gap-2">
            {inbodyTrend.muscle.map((value, index) => {
              const max = Math.max(...inbodyTrend.muscle)
              const min = Math.min(...inbodyTrend.muscle)
              const ratio = max === min ? 1 : (value - min) / (max - min)
              const height = 30 + ratio * 70 // 30%~100%
              return (
                <div key={inbodyTrend.months[index]} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-[#2F5F8F]">{value}</span>
                  <div
                    className="w-full rounded-t-[4px] bg-[#2F5F8F]"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] font-semibold text-[#9aa19a]">
                    {inbodyTrend.months[index]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="mt-3 border-t border-[#D4E0EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          {inbodyDisclaimer}
        </p>
      </section>

      {/* SA3: 히스토리 — 받은 리포트 · 수업 이력 시간순 (자극 포인트 미니 바디맵 썸네일) */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-[#1F3F5B]">히스토리</p>
        {studentHistoryEntries.map((entry, index) => (
          <button
            key={`${entry.date}-${entry.title}`}
            className="flex w-full items-center gap-3 border-b border-[#E1E6EA] py-3 text-left"
            type="button"
            onClick={index === 0 ? onOpenReport : undefined}
          >
            {/* 기능3: 미니 바디맵 썸네일 — 그 기록의 자극 포인트 */}
            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-[8px] border border-[#EEF1F4]">
              <BodyMap parts={regionsFromTexts([entry.title, entry.detail])} size="mini" />
            </div>
            <div className="flex flex-1 items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span
                  className={[
                    'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    entry.kind === '리포트'
                      ? 'border border-[#C2553F] bg-[#FBE8E3] text-[#B0432F]'
                      : 'border border-[#1F3F5B] bg-[#EEF5FA] text-[#1F3F5B]',
                  ].join(' ')}
                >
                  {entry.kind}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#252D34]">{entry.title}</p>
                  <p className="mt-0.5 text-xs font-normal leading-5 text-[#687682]">
                    {entry.detail}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-[#737F8A]">{entry.date}</span>
            </div>
          </button>
        ))}
      </section>

      {/* SA4: 통합 조회 — 개인 수업기록 + 발행 리포트 + 인바디를 한 곳에서 */}
      <section className="rounded-[8px] border border-[#CFDDEA] bg-[#F7FAFD] p-4">
        <p className="text-sm font-semibold text-[#1F3F5B]">통합 조회</p>
        <p className="mt-1 text-[11px] font-normal leading-5 text-[#687682]">
          개인 수업기록 · 발행 리포트 · 인바디를 한 화면에서 함께 봅니다.
        </p>
        <div className="mt-3 space-y-2">
          {[
            ['수업 기록', `${studentHistoryEntries.filter((e) => e.kind === '수업').length}건`, '최근 수업 이력 시간순'],
            ['발행 리포트', `${studentHistoryEntries.filter((e) => e.kind === '리포트').length}건`, '강사 검수 후 공유된 기록'],
            ['인바디', `골격근량 ${inbodyTrend.muscle[inbodyTrend.muscle.length - 1]}kg`, `${inbodyTrend.months.length}개월 추이`],
          ].map(([label, value, note]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-[#252D34]">{label}</p>
                <p className="mt-0.5 text-[11px] font-normal text-[#687682]">{note}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2.5 py-1 text-[11px] font-semibold text-[#5F7690]">
                {value}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#DCE4EA] pt-3 text-xs font-normal leading-5 text-[#5e6d64]">
          원본은 비공개로 남고, 강사가 공유로 확정한 기록과 인바디 참고 데이터만 모입니다.
        </p>
      </section>
    </div>
  )
}

function StudentConnectScreen() {
  return (
    <div className="space-y-5">
      <section className="rounded-[10px] bg-[#E26D5C] p-5 text-white">
        <p className="text-xs font-semibold text-[#DCEBFA]">공유 계층</p>
        <h2 className="mt-2 text-[26px] font-semibold leading-tight">
          내 기록을 어디에 연결할지 내가 정합니다.
        </h2>
        <p className="mt-3 text-sm font-normal leading-7 text-[#cfe2d7]">
          momso는 원본을 공개하지 않고, 검수된 리포트만 동의 범위 안에서 AI·저장소·피드·API로
          연결할 수 있게 준비합니다.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">연결 후보</p>
        {connectionChannels.map(([label, value, detail]) => (
          <article key={label} className="rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#252D34]">{label}</p>
                <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{detail}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EEF5FA] px-3 py-1.5 text-xs font-semibold text-[#1F3F5B]">
                {value}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">공유 흐름</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {connectionFlow.map((step, index) => (
            <div key={step} className="rounded-[8px] bg-white px-2 py-3 text-center">
              <p className="text-[11px] font-semibold text-[#687D91]">0{index + 1}</p>
              <p className="mt-1 text-xs font-semibold leading-4 text-[#1F3F5B]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">권한 범위</p>
        <div className="mt-3 space-y-2">
          {permissionScopes.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-[#E1E6EA] py-2 last:border-b-0">
              <p className="text-xs font-semibold text-[#718293]">{label}</p>
              <p className="max-w-[12rem] text-right text-sm font-semibold leading-5 text-[#1F3F5B]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#6F7780]">동의 설정</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          동의와 철회 상태를 함께 관리합니다.
        </h2>
      </section>

      <section className="space-y-2">
        {[
          ['녹음 동의', '완료', '수업 기록 시작 전 동의한 상태입니다.'],
          ['전사 동의', '완료', 'AI 초안 생성을 위한 전사에 동의했습니다.'],
          ['리포트 공유', '완료', '강사가 검수한 개인 리포트만 공유됩니다.'],
          ['외부 연결', '동의 후', 'API나 SNS형 공유는 별도 동의 후 연결합니다.'],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-[8px] border border-[#E1E6EA] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#252D34]">{label}</p>
                <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{detail}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EEF5FA] px-3 py-1.5 text-xs font-semibold text-[#1F3F5B]">
                {value}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#f8edd9] p-4">
        <p className="text-xs font-semibold text-[#8a6a3b]">철회 안내</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#4f3a1c]">
          동의 철회 요청이 있으면 새 리포트 발행을 보류하고, 이미 공유된 기록의 공개 범위를
          다시 확인합니다.
        </p>
      </section>
    </div>
  )
}

// InBody 타이포 로고 배지 — 인바디 데이터 보유 회원 표시용
function InBodyLogo() {
  return (
    <span className="inline-flex items-center rounded-[4px] border border-[#7BA3C7] bg-[#EEF5FA] px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-tight">
      <span className="text-[#1F3F5B]">In</span>
      <span className="text-[#E26D5C]">Body</span>
    </span>
  )
}

// 인바디 상세 요약 표 (최신 vs 첫 측정 델타)
function buildInbodyTable(trend: MemberTrend): Array<[string, string]> {
  const m0 = trend.muscle[0]
  const mN = trend.muscle[trend.muscle.length - 1]
  const f0 = trend.fat[0]
  const fN = trend.fat[trend.fat.length - 1]
  const mDelta = Number((mN - m0).toFixed(1))
  const fDelta = Number((fN - f0).toFixed(1))
  return [
    ['골격근량 (최신)', `${mN}kg (${mDelta >= 0 ? '+' : ''}${mDelta}kg)`],
    ['체지방률 (최신)', `${fN}% (${fDelta >= 0 ? '+' : ''}${fDelta}%p)`],
    ['측정 횟수', `${trend.months.length}회 (${trend.months[0]}~${trend.months[trend.months.length - 1]})`],
  ]
}

// 이번 달(2026-06) 달력 — 초안 작성일(draftDate) 기준으로 마킹
function TeacherArchiveCalendar({
  reports,
  selectedDate,
  onSelectDate,
}: {
  reports: ArchiveReport[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}) {
  const year = 2026
  const month = 6 // 6월
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0=일
  const daysInMonth = new Date(year, month, 0).getDate()
  const draftDays = new Set(
    reports.filter((r) => r.draftDate.startsWith(monthStr)).map((r) => Number(r.draftDate.slice(8, 10))),
  )
  const weekHeads = ['일', '월', '화', '수', '목', '금', '토']
  const cells: Array<number | null> = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)

  return (
    <section className="rounded-[10px] border border-[#DCE4EA] bg-[#FBFCFF] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1F3F5B]">2026년 6월</p>
        <span className="rounded-full bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
          초안 작성일 기준
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#9aa19a]">
        {weekHeads.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />
          const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`
          const hasDraft = draftDays.has(d)
          const isSelected = selectedDate === dateStr
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : hasDraft ? dateStr : null)}
              className={[
                'relative flex h-8 flex-col items-center justify-center rounded-[6px] text-xs font-semibold',
                isSelected
                  ? 'bg-[#E26D5C] text-white'
                  : hasDraft
                    ? 'bg-[#FBE9E5] text-[#B0432F]'
                    : 'text-[#5D6874]',
              ].join(' ')}
            >
              {d}
              {hasDraft && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#E26D5C]" />
              )}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <p className="mt-2 text-[11px] font-semibold text-[#5F7690]">
          {selectedDate.slice(5).replace('-', '.')} 초안 {reports.filter((r) => r.draftDate === selectedDate).length}건
        </p>
      )}
    </section>
  )
}

// 리포트 카드 (기본 카드 뷰)
function ArchiveReportCard({ report }: { report: ArchiveReport }) {
  // 기능3: 사진 첨부가 있으면 사진 썸네일, 없으면 자극 포인트 바디맵 미니 썸네일
  const cardRegions = regionsFromTexts([report.title, report.summary, ...report.tags])
  return (
    <article className="overflow-hidden rounded-[10px] border border-[#E1E6EA] bg-white">
      {/* 썸네일 — 강사 사진 or 바디맵 */}
      <div className="relative h-24 w-full overflow-hidden border-b border-[#EEF1F4]">
        {report.photo ? (
          <div className="flex h-full w-full items-center justify-center bg-[#EEF5FA] text-2xl">
            🖼️
            <span className="absolute bottom-1 left-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-[#5F7690]">
              강사 사진
            </span>
          </div>
        ) : (
          <>
            <BodyMap parts={cardRegions} size="mini" />
            <span className="absolute bottom-1 left-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-[#B0432F]">
              자극 포인트
            </span>
          </>
        )}
      </div>
      <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#737F8A]">{report.dateLabel} 초안</span>
        <div className="flex items-center gap-1">
          {report.forTeacher && (
            <span className="rounded-full bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
              강사용
            </span>
          )}
          {report.saved && <span className="text-xs">📌</span>}
        </div>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-[#5F7690]">
        {report.className} · {report.member}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#252D34]">{report.title}</p>
      <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{report.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {report.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#DCE4EA] bg-[#FBFCFF] px-2 py-0.5 text-[10px] font-semibold text-[#5D6874]"
          >
            #{tag}
          </span>
        ))}
      </div>
      </div>
    </article>
  )
}

// 리포트 컴팩트 목록 행
function ArchiveReportRow({ report }: { report: ArchiveReport }) {
  return (
    <article className="flex items-center gap-3 border-b border-[#E1E6EA] py-3">
      <span className="w-12 shrink-0 text-xs font-semibold text-[#737F8A]">{report.dateLabel}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#252D34]">{report.title}</p>
        <p className="truncate text-[11px] font-normal text-[#687682]">
          {report.className} · {report.member}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {report.forTeacher && (
          <span className="rounded-full bg-[#EEF5FA] px-1.5 py-0.5 text-[10px] font-semibold text-[#5F7690]">
            강사용
          </span>
        )}
        {report.saved && <span className="text-xs">📌</span>}
      </div>
    </article>
  )
}

// 회원 인바디 상세 + 발행 리포트 목록 (드릴다운)
function ArchiveMemberDetail({
  member,
  reports,
  onBack,
}: {
  member: ArchiveMember
  reports: ArchiveReport[]
  onBack: () => void
}) {
  const trend = getMemberTrend(member.name)
  const memberReports = reports.filter((r) => r.member === member.name)
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-[#5F7690]"
      >
        ← 회원 목록
      </button>

      <section>
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-semibold leading-tight text-[#1F2933]">{member.name}</h2>
          {member.hasInbody && <InBodyLogo />}
        </div>
        <p className="mt-1 text-xs font-normal text-[#687682]">{member.className}</p>
      </section>

      {member.hasInbody ? (
        <section className="rounded-[10px] border border-[#DCE4EA] bg-[#FBFCFF] p-3">
          <p className="text-xs font-semibold text-[#5F7690]">인바디 상세 데이터</p>
          <MemberInbodyChart trend={trend} />
          <div className="mt-3 rounded-[8px] bg-white p-3">
            {buildInbodyTable(trend).map(([label, value], index, arr) => (
              <div
                key={label}
                className={[
                  'flex items-center justify-between gap-3 py-2',
                  index === arr.length - 1 ? '' : 'border-b border-[#E1E6EA]',
                ].join(' ')}
              >
                <p className="text-xs font-semibold text-[#718293]">{label}</p>
                <p className="text-sm font-semibold text-[#1F3F5B]">{value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-[10px] border border-dashed border-[#DCE4EA] bg-[#FBFCFF] p-4">
          <p className="text-xs font-normal leading-5 text-[#687682]">
            아직 인바디 데이터가 연동되지 않은 회원입니다. 측정 후 골격근량·체지방률 추이가 표시됩니다.
          </p>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-xs font-semibold text-[#6F7780]">momso가 발행한 리포트</p>
        {memberReports.length > 0 ? (
          memberReports.map((report) => <ArchiveReportCard key={report.id} report={report} />)
        ) : (
          <p className="text-xs font-normal text-[#9aa19a]">아직 발행된 리포트가 없습니다.</p>
        )}
      </section>
    </div>
  )
}

function TeacherArchiveScreen() {
  const [activeFilter, setActiveFilter] = useState<ArchiveFilterId>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card') // 기본 카드 뷰
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 필터별로 표시할 리포트 계산 (검색어는 회원명·동작/제목·초점/요약에 적용)
  const visibleReports = useMemo(() => {
    let list = teacherArchiveReports
    if (activeFilter === 'teacher') list = list.filter((r) => r.forTeacher)
    else if (activeFilter === 'saved') list = list.filter((r) => r.saved)
    // 'all' / 'class' 는 전체 리포트 (수업은 수업명으로 그룹핑)
    if (calendarOpen && selectedDate) list = list.filter((r) => r.draftDate === selectedDate)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [r.member, r.title, r.summary, r.className, ...r.tags]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    return list
  }, [activeFilter, calendarOpen, selectedDate, searchQuery])

  // 수업 필터: 수업명으로 그룹핑
  const groupedByClass = useMemo(() => {
    const map = new Map<string, ArchiveReport[]>()
    for (const r of visibleReports) {
      const arr = map.get(r.className) ?? []
      arr.push(r)
      map.set(r.className, arr)
    }
    return Array.from(map.entries())
  }, [visibleReports])

  const activeMember = selectedMember
    ? archiveMembers.find((m) => m.name === selectedMember) ?? null
    : null

  // 회원 드릴다운 화면
  if (activeFilter === 'member' && activeMember) {
    return (
      <ArchiveMemberDetail
        member={activeMember}
        reports={teacherArchiveReports}
        onBack={() => setSelectedMember(null)}
      />
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6F7780]">report archive</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h2 className="text-[26px] font-semibold leading-tight text-[#1F2933]">
            발행된 리포트 아카이브
          </h2>
          <button
            type="button"
            onClick={() => {
              setCalendarOpen((v) => !v)
              setSelectedDate(null)
            }}
            aria-label="달력 보기"
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border text-base',
              calendarOpen
                ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                : 'border-[#E1E6EA] bg-[#FBFCFF]',
            ].join(' ')}
          >
            📅
          </button>
        </div>
        <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">
          지금까지 1,024개의 검수 리포트가 회원·초점별로 쌓였습니다.
        </p>
      </section>

      {calendarOpen && (
        <TeacherArchiveCalendar
          reports={teacherArchiveReports}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      <input
        className="h-12 w-full rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] px-4 text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a] focus:border-[#7BA3C7]"
        type="text"
        placeholder="회원명, 동작, 초점 검색"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* 5개 필터 (수업·회원·강사·보관·전체) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {teacherArchiveFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setActiveFilter(filter.id)
              setSelectedMember(null)
            }}
            className={[
              'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold',
              activeFilter === filter.id
                ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                : 'border-[#DCE4EA] bg-[#FBFCFF] text-[#5D6874]',
            ].join(' ')}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {activeFilter === 'member' ? (
        // 회원 목록 (인바디 보유 시 InBody 로고)
        <section className="space-y-2">
          <p className="text-xs font-semibold text-[#6F7780]">회원 선택</p>
          {archiveMembers.map((member) => (
            <button
              key={member.name}
              type="button"
              onClick={() => setSelectedMember(member.name)}
              className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#E1E6EA] bg-white px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#252D34]">{member.name}</span>
                {member.hasInbody && <InBodyLogo />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#5F7690]">
                  리포트 {member.reportCount}
                </span>
                <span className="text-[#9aa19a]">›</span>
              </div>
            </button>
          ))}
        </section>
      ) : (
        <>
          {/* 목록 ↔ 카드 뷰 토글 */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6F7780]">
              {activeFilter === 'saved'
                ? '📌 보관 항목'
                : activeFilter === 'teacher'
                  ? '강사용(내부) 리포트'
                  : activeFilter === 'class'
                    ? '수업별 보기'
                    : '최근 초안'}
            </p>
            <div className="flex gap-1 rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                aria-label="카드 뷰"
                className={[
                  'rounded-[6px] px-2 py-1 text-xs font-semibold',
                  viewMode === 'card' ? 'bg-[#E26D5C] text-white' : 'text-[#5D6874]',
                ].join(' ')}
              >
                ▥ 카드
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="목록 뷰"
                className={[
                  'rounded-[6px] px-2 py-1 text-xs font-semibold',
                  viewMode === 'list' ? 'bg-[#E26D5C] text-white' : 'text-[#5D6874]',
                ].join(' ')}
              >
                ☰ 목록
              </button>
            </div>
          </div>

          {visibleReports.length === 0 ? (
            <p className="py-6 text-center text-xs font-normal text-[#9aa19a]">
              해당하는 리포트가 없습니다.
            </p>
          ) : activeFilter === 'class' ? (
            // 수업별 그룹핑
            <div className="space-y-4">
              {groupedByClass.map(([className, reports]) => (
                <section key={className} className="space-y-2">
                  <p className="text-xs font-semibold text-[#1F3F5B]">
                    {className}
                    <span className="ml-1 text-[#9aa19a]">· {reports.length}건</span>
                  </p>
                  {viewMode === 'card' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {reports.map((report) => (
                        <ArchiveReportCard key={report.id} report={report} />
                      ))}
                    </div>
                  ) : (
                    reports.map((report) => <ArchiveReportRow key={report.id} report={report} />)
                  )}
                </section>
              ))}
            </div>
          ) : viewMode === 'card' ? (
            <section className="grid grid-cols-2 gap-3">
              {visibleReports.map((report) => (
                <ArchiveReportCard key={report.id} report={report} />
              ))}
            </section>
          ) : (
            <section>
              {visibleReports.map((report) => (
                <ArchiveReportRow key={report.id} report={report} />
              ))}
            </section>
          )}
        </>
      )}

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">보관 원칙</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#1F3F5B]">
          shareable로 발행한 리포트만 축적되고, 원본 음성과 전체 전사는 비공개로 남습니다.
          다음 수업으로의 회수는 모미 탭이 맡습니다.
        </p>
      </section>
    </div>
  )
}

// 강사 모미 — 데이터 선택(아카이브 분류 칩 + 검색 + 멀티선택) 패널.
// 선택한 데이터로 새 채팅방을 만든다 (Claude 프로젝트 유사).
type MomiDataItem = { id: string; label: string; sub: string; filter: ArchiveFilterId }

// 아카이브 리포트·회원을 선택 가능한 데이터 항목으로 재사용
const momiDataItems: MomiDataItem[] = [
  ...archiveMembers.map((m) => ({
    id: `mem-${m.name}`,
    label: m.name,
    sub: `회원 · ${m.className} · 리포트 ${m.reportCount}`,
    filter: 'member' as ArchiveFilterId,
  })),
  ...teacherArchiveReports.map((r) => ({
    id: `rep-${r.id}`,
    label: r.title,
    sub: `${r.forTeacher ? '강사' : '수업'} · ${r.className} · ${r.member}`,
    filter: (r.forTeacher ? 'teacher' : 'class') as ArchiveFilterId,
  })),
  ...teacherArchiveReports
    .filter((r) => r.saved)
    .map((r) => ({
      id: `saved-${r.id}`,
      label: `📌 ${r.title}`,
      sub: `보관 · ${r.className} · ${r.member}`,
      filter: 'saved' as ArchiveFilterId,
    })),
]

type MomiRoom = { id: string; name: string; sub: string }

const momiInitialRooms: MomiRoom[] = [
  { id: 'room-harin', name: '김하린 · 어깨 정렬', sub: '회원 1 · 리포트 2' },
  { id: 'room-hatha', name: '하타 베이직 · 지난 3회', sub: '수업 · 리포트 3' },
  { id: 'room-rx', name: '박지연 · 리포머 처방', sub: '강사 메모 · 보관 1' },
]

function TeacherAiScreen() {
  const [rooms, setRooms] = useState<MomiRoom[]>(momiInitialRooms)
  const [activeRoomId, setActiveRoomId] = useState<string>(momiInitialRooms[0].id)
  const [dataPanelOpen, setDataPanelOpen] = useState(false)
  const [dataFilter, setDataFilter] = useState<ArchiveFilterId>('all')
  const [dataSearch, setDataSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0]

  const filteredDataItems = momiDataItems.filter((item) => {
    if (dataFilter !== 'all' && item.filter !== dataFilter) return false
    const q = dataSearch.trim().toLowerCase()
    if (q && !`${item.label} ${item.sub}`.toLowerCase().includes(q)) return false
    return true
  })

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const createRoom = () => {
    if (selectedIds.length === 0) return
    const picked = momiDataItems.filter((i) => selectedIds.includes(i.id))
    const labels = picked.map((p) => p.label.replace('📌 ', ''))
    const name = labels.length <= 2 ? labels.join(' · ') : `${labels[0]} 외 ${labels.length - 1}`
    const newRoom: MomiRoom = {
      id: `room-${Date.now()}`,
      name,
      sub: `선택 데이터 ${picked.length}건`,
    }
    setRooms((prev) => [newRoom, ...prev])
    setActiveRoomId(newRoom.id)
    setSelectedIds([])
    setDataSearch('')
    setDataPanelOpen(false)
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#6F7780]">모미 · momi</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
            모미에게, 나만의 프라이빗 위키에 묻습니다.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDataPanelOpen((v) => !v)}
          aria-label="데이터/문서 선택"
          aria-pressed={dataPanelOpen}
          className={[
            'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border text-base',
            dataPanelOpen
              ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
              : 'border-[#DCE4EA] bg-[#FBFCFF]',
          ].join(' ')}
        >
          🗂
        </button>
      </section>

      {/* 데이터/문서 선택 패널 — 아카이브 분류 칩 + 검색 + 멀티선택 → 채팅방 만들기 */}
      {dataPanelOpen && (
        <section className="rounded-[10px] border border-[#DCE4EA] bg-[#FBFCFF] p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F3F5B]">데이터로 채팅방 만들기</p>
            <span className="rounded-full bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
              여러 개 선택 가능
            </span>
          </div>

          <input
            className="mt-3 h-10 w-full rounded-[8px] border border-[#E1E6EA] bg-white px-3 text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a] focus:border-[#7BA3C7]"
            type="text"
            placeholder="회원명, 리포트, 초점 검색"
            value={dataSearch}
            onChange={(e) => setDataSearch(e.target.value)}
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {teacherArchiveFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDataFilter(filter.id)}
                className={[
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold',
                  dataFilter === filter.id
                    ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                    : 'border-[#DCE4EA] bg-white text-[#5D6874]',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
            {filteredDataItems.length === 0 ? (
              <p className="py-4 text-center text-xs font-normal text-[#9aa19a]">
                해당하는 데이터가 없습니다.
              </p>
            ) : (
              filteredDataItems.map((item) => {
                const checked = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    aria-pressed={checked}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2 text-left transition',
                      checked
                        ? 'border-[#E26D5C] bg-[#FBE9E5]'
                        : 'border-[#E1E6EA] bg-white hover:bg-[#f8faf5]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border text-[11px] font-bold',
                        checked
                          ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                          : 'border-[#CDD6DE] bg-white text-transparent',
                      ].join(' ')}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#252D34]">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] font-normal text-[#687682]">
                        {item.sub}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <button
            type="button"
            onClick={createRoom}
            disabled={selectedIds.length === 0}
            className={[
              'mt-3 h-11 w-full rounded-[6px] text-sm font-semibold transition',
              selectedIds.length === 0
                ? 'cursor-not-allowed bg-[#EDE9E6] text-[#9aa19a]'
                : 'bg-[#E26D5C] text-white hover:bg-[#D15A48]',
            ].join(' ')}
          >
            {selectedIds.length === 0
              ? '데이터를 선택하세요'
              : `채팅방 만들기 (${selectedIds.length}건)`}
          </button>
        </section>
      )}

      {/* 채팅방 목록 — 클릭하면 해당 방이 열린다 (열린 방 = 아래 대화) */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-[#6F7780]">채팅방</p>
        <div className="space-y-1.5">
          {rooms.map((room) => {
            const isActive = room.id === activeRoom.id
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition',
                  isActive
                    ? 'border-[#E26D5C] bg-[#FBE9E5]'
                    : 'border-[#E1E6EA] bg-white hover:bg-[#f8faf5]',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#252D34]">
                    💬 {room.name}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-[#687682]">
                    {room.sub}
                  </span>
                </span>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-[#E26D5C] px-2 py-0.5 text-[10px] font-semibold text-white">
                    열림
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 현재 열린 채팅방의 대화 내용 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-[#6F7780]">{activeRoom.name}</p>
          <span className="rounded-full border border-[#DCE4EA] bg-[#FBFCFF] px-2 py-0.5 text-[10px] font-semibold text-[#5D6874]">
            BYOK Vault
          </span>
        </div>
        <div className="ml-auto max-w-[88%] rounded-[14px] rounded-br-[4px] bg-[#E26D5C] px-4 py-3 text-sm font-normal leading-6 text-white">
          최근 3개월간 김하린 회원의 우측 어깨·골반 불균형 개선 추이를 데이터 기반으로 요약해 줘.
        </div>

        <div className="max-w-[92%] rounded-[14px] rounded-bl-[4px] border border-[#DCE4EA] bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase text-[#5F7690]">모미 · Momi</p>
          <p className="mt-2 text-sm font-normal leading-6 text-[#3a423a]">
            최근 12회 수업 리포트와 3건의 인바디 데이터를 분석한 결과입니다.
          </p>
          <div className="mt-3 rounded-[8px] bg-[#F7FAFD] px-3 py-2">
            {teacherAiAnswerTable.map(([label, value], index) => (
              <div
                key={label}
                className={[
                  'flex items-start justify-between gap-3 py-2',
                  index === teacherAiAnswerTable.length - 1
                    ? ''
                    : 'border-b border-[#E1E6EA]',
                ].join(' ')}
              >
                <p className="text-xs font-semibold text-[#718293]">{label}</p>
                <p className="max-w-[12rem] text-right text-sm font-semibold leading-5 text-[#1F3F5B]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">AI 위키 회수 루프</p>
        <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">
          검수 결과는 한 번 보고 끝나지 않고 다음 수업에서 다시 회수됩니다.
        </p>
        <div className="mt-3 space-y-2">
          {nextLoopSteps.map(([label, value], index) => (
            <div
              key={label}
              className="flex items-start gap-3 border-b border-[#E1E6EA] py-2 last:border-b-0"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#5F7690]">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#252D34]">{label}</p>
                <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] px-4 py-3">
        <input
          className="w-full bg-transparent text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a]"
          type="text"
          placeholder="모미에게 이 채팅방의 데이터로 질문하세요"
          readOnly
        />
      </div>
    </div>
  )
}

// 플레이스 — 커스텀 Leaflet divIcon 핀. 기본 Leaflet 마커(번들 아이콘 경로 이슈)를
// 피하고, 레이어 색으로 칠한 깔끔한 핀을 직접 그린다.
//  - 몸소만 활성 → coral, 인바디만 활성 → navy
//  - 둘 다 해당(양 레이어 켜짐) → 코랄/네이비 듀얼(반반) 핀
// 핀 안에는 종류 이모지(🧘/🤸/💪/🏋️)를 넣는다.
const PLACE_CORAL = '#E26D5C'
const PLACE_NAVY = '#1F3F5B'

function makePlaceIcon(emoji: string, showMomso: boolean, showInbody: boolean) {
  // 듀얼: 좌-코랄 / 우-네이비 그라데이션, 단일: 단색
  const fill =
    showMomso && showInbody
      ? `linear-gradient(135deg, ${PLACE_CORAL} 0 50%, ${PLACE_NAVY} 50% 100%)`
      : showMomso
        ? PLACE_CORAL
        : PLACE_NAVY
  const ring = showInbody ? PLACE_NAVY : PLACE_CORAL
  const html = `
    <div style="position:relative;width:40px;height:52px;">
      <div style="
        position:absolute;left:50%;top:0;transform:translateX(-50%) rotate(45deg);
        width:34px;height:34px;border-radius:50% 50% 50% 0;
        background:${fill};
        border:2px solid #ffffff;
        box-shadow:0 3px 6px rgba(0,0,0,0.30);
      "></div>
      <div style="
        position:absolute;left:50%;top:14px;transform:translateX(-50%);
        width:22px;height:22px;border-radius:50%;
        background:#ffffff;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;line-height:1;
        box-shadow:inset 0 0 0 1.5px ${ring}33;
      ">${emoji}</div>
    </div>`
  return L.divIcon({
    html,
    className: 'momso-place-pin',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -46],
  })
}

function StudentPlaceScreen() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof placeCategories)[number]>('전체')
  const [showMomso, setShowMomso] = useState(true)
  const [showInbody, setShowInbody] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedId, setFeedId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reportEntry, setReportEntry] = useState<PlaceHistoryEntry | null>(null)

  const kindByCategory: Record<string, PlaceKind | null> = {
    전체: null,
    요가원: '요가원',
    필라테스: '필라테스',
    PT샵: 'PT샵',
    헬스장: '헬스장',
  }

  // 검색(센터/강사) + 카테고리 + 레이어 토글 필터
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const wantedKind = kindByCategory[category]
    return placeCenters.filter((c) => {
      if (wantedKind && c.kind !== wantedKind) return false
      // 레이어: 어느 레이어에도 안 걸리면 숨김
      const layerMatch =
        (showMomso && c.hasMomso) || (showInbody && c.hasInbody)
      if (!layerMatch) return false
      if (!q) return true
      const inName = c.name.toLowerCase().includes(q)
      const inInstructor = c.instructors.some((n) => n.toLowerCase().includes(q))
      return inName || inInstructor
    })
  }, [query, category, showMomso, showInbody])

  const selected = filtered.find((c) => c.id === selectedId) ?? null
  const feedCenter = placeCenters.find((c) => c.id === feedId) ?? null

  const kindEmoji: Record<PlaceKind, string> = {
    요가원: '🧘',
    필라테스: '🤸',
    PT샵: '💪',
    헬스장: '🏋️',
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#6F7780]">place</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
            내 주변의 요가 플레이스
          </h2>
          <p className="mt-1 text-xs font-normal text-[#737F8A]">연희동 · 반경 1km</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="mt-1 shrink-0 rounded-[8px] border border-[#E26D5C] bg-[#FDEEEA] px-3 py-2 text-xs font-semibold text-[#C0503D] transition hover:bg-[#FBE0D9]"
        >
          🐾 내 발자취
        </button>
      </section>

      {/* PP2. 검색 — 센터 또는 강사 */}
      <div className="flex gap-2">
        <div className="flex h-12 flex-1 items-center gap-2 rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] px-3 focus-within:border-[#7BA3C7]">
          <span className="text-base">🔍</span>
          <input
            className="h-full flex-1 bg-transparent text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a]"
            type="text"
            placeholder="센터 이름, 강사명 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedId(null)
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-[#9aa19a]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {placeCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c)
              setSelectedId(null)
            }}
            className={[
              'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              category === c
                ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                : 'border-[#DCE4EA] bg-[#FBFCFF] text-[#5D6874]',
            ].join(' ')}
          >
            {c}
          </button>
        ))}
      </div>

      {/* PP3. 레이어 토글 — 켜고 끄면 지도 오버레이가 보였다 사라짐 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowMomso((v) => !v)}
          aria-pressed={showMomso}
          className={[
            'flex flex-1 flex-col items-start gap-0.5 rounded-[10px] border px-3 py-2.5 text-left transition',
            showMomso
              ? 'border-[#E26D5C] bg-[#E26D5C] text-white shadow-sm'
              : 'border-[#DCE4EA] bg-[#FBFCFF] text-[#9aa19a]',
          ].join(' ')}
        >
          <span className="text-xs font-semibold">🌿 몸소 레이어</span>
          <span
            className={[
              'text-[10px] font-medium leading-3',
              showMomso ? 'text-white/80' : 'text-[#B6BDC4]',
            ].join(' ')}
          >
            공개 리뷰·블로그
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowInbody((v) => !v)}
          aria-pressed={showInbody}
          className={[
            'flex flex-1 flex-col items-start gap-0.5 rounded-[10px] border px-3 py-2.5 text-left transition',
            showInbody
              ? 'border-[#1F3F5B] bg-[#1F3F5B] text-white shadow-sm'
              : 'border-[#DCE4EA] bg-[#FBFCFF] text-[#9aa19a]',
          ].join(' ')}
        >
          <span className="text-xs font-semibold">📊 인바디 레이어</span>
          <span
            className={[
              'text-[10px] font-medium leading-3',
              showInbody ? 'text-white/80' : 'text-[#B6BDC4]',
            ].join(' ')}
          >
            인바디 보유 센터
          </span>
        </button>
      </div>

      {/* PP1. 지도 뷰 — Leaflet + OpenStreetMap (실제 연희동 좌표) */}
      <section className="overflow-hidden rounded-[12px] border border-[#DCE4EA] bg-[#FBFCFF]">
        <div className="relative h-[300px] w-full">
          <MapContainer
            center={[37.5665, 126.927]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: 300, width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {filtered.map((c) => {
              // 이 센터가 켜진 레이어에 해당하는지 — 마커 색을 결정한다.
              const momsoOn = c.hasMomso && showMomso
              const inbodyOn = c.hasInbody && showInbody
              const top =
                c.posts.length > 0
                  ? [...c.posts].sort((a, b) => b.likes - a.likes)[0]
                  : null
              return (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={makePlaceIcon(kindEmoji[c.kind], momsoOn, inbodyOn)}
                  eventHandlers={{ click: () => setSelectedId(c.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2933' }}>
                        {kindEmoji[c.kind]} {c.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ color: PLACE_NAVY }}>
                          ⭐ {c.rating.toFixed(1)} ({c.reviewCount})
                        </span>
                        <span style={{ marginLeft: 8, color: PLACE_CORAL }}>
                          ❤️ {c.hearts}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              borderRadius: 999,
                              background: '#EEF5FA',
                              color: '#2F5F8F',
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {c.hasInbody && (
                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: PLACE_NAVY }}>
                          📊 인바디 보유 · 비교 측정 가능
                        </div>
                      )}
                      {c.hasMomso && top && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              fontSize: 11,
                              lineHeight: 1.4,
                              color: '#3a423a',
                              borderLeft: `3px solid ${PLACE_CORAL}`,
                              paddingLeft: 6,
                            }}
                          >
                            <strong>{top.title}</strong>
                            <br />
                            {top.snippet}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFeedId(c.id)}
                            style={{
                              marginTop: 8,
                              width: '100%',
                              borderRadius: 6,
                              background: PLACE_CORAL,
                              color: '#ffffff',
                              padding: '6px 0',
                              fontSize: 12,
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            🌿 리뷰·블로그 {c.posts.length}건 보기
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* 연희동 라벨 — 지도 위 오버레이 (지도보다 위, z-index 높게) */}
          <span className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#1F3F5B] shadow-sm">
            연희동
          </span>

          {filtered.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center text-xs font-semibold text-[#7B8A7E]">
              <span className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm">조건에 맞는 센터가 없어요</span>
            </div>
          )}
        </div>

        {/* 범례 — 두 레이어를 구분해 설명 */}
        <div className="space-y-1.5 border-t border-[#E1E6EA] bg-white px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#5D6874]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rotate-45 rounded-[50%_50%_50%_0] border-2 border-white bg-[#1F3F5B] shadow" />
              인바디 보유
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rotate-45 rounded-[50%_50%_50%_0] border-2 border-white bg-[#E26D5C] shadow" />
              몸소 공개글
            </span>
          </div>
          <p className="text-[10px] font-medium text-[#9aa19a]">
            핀을 누르면 센터 정보 · 리뷰/블로그로 이동 · 레이어 토글로 표시 전환
          </p>
        </div>
      </section>

      {/* 센터 상세 (핀 클릭 시) */}
      {selected && (
        <section className="rounded-[12px] border border-[#E26D5C] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-[#1F2933]">{selected.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#737F8A]">
                {selected.kind} · {selected.distance}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-sm font-semibold text-[#9aa19a]"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-1.5 text-sm font-normal text-[#3a423a]">
            <p>📍 {selected.address}</p>
            <p>🕗 {selected.hours}</p>
            <p>👩‍🏫 {selected.instructors.join(', ')}</p>
          </div>

          {/* 인바디 레이어 — 인바디 보유 라인 */}
          {selected.hasInbody && (
            <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#D6E0EA] bg-[#F2F6FA] px-3 py-2">
              <span className="rounded-full bg-[#1F3F5B] px-1.5 py-0.5 text-[9px] font-bold text-white">
                InBody
              </span>
              <span className="text-xs font-semibold text-[#1F3F5B]">
                인바디 보유 · 내 인바디 데이터와 비교 측정 가능
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
            <span className="text-[#1F3F5B]">⭐ {selected.rating.toFixed(1)} ({selected.reviewCount})</span>
            <span className="text-[#E26D5C]">❤️ {selected.hearts}</span>
          </div>

          {/* 몸소 레이어 — 공개 리뷰/블로그 피드 진입 */}
          {selected.hasMomso && selected.posts.length > 0 && (
            <button
              type="button"
              onClick={() => setFeedId(selected.id)}
              className="mt-3 flex w-full items-center justify-between rounded-[8px] border border-[#F2C3B8] bg-[#FDEEEA] px-3 py-2.5 text-left transition hover:bg-[#FBE0D9]"
            >
              <span className="text-xs font-semibold text-[#C0503D]">
                🌿 공개 리뷰·블로그 {selected.posts.length}건 보기
              </span>
              <span className="text-xs font-semibold text-[#C0503D]">›</span>
            </button>
          )}

          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold text-[#5F7690]">후기</p>
            {selected.reviews.map((r, i) => (
              <p key={i} className="rounded-[6px] bg-[#F7FAFD] px-3 py-2 text-xs font-normal leading-5 text-[#3a423a]">
                “{r}”
              </p>
            ))}
          </div>

          <button
            className="mt-4 h-11 w-full rounded-[6px] bg-[#E26D5C] text-sm font-semibold text-white transition hover:bg-[#D15A48]"
            type="button"
          >
            정보 및 예약
          </button>
        </section>
      )}

      {/* PP4. 플레이스 카드 */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#5F7690]">
          플레이스 {filtered.length}곳
        </p>
        {filtered.map((c) => (
          <article
            key={c.id}
            className="overflow-hidden rounded-[12px] border border-[#E1E6EA] bg-white"
          >
            <div className="flex h-32 items-center justify-center bg-[#EEF5FA] text-3xl">
              {kindEmoji[c.kind]}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#1F3F5B]">
                  ⭐ {c.rating.toFixed(1)} · ❤️ {c.hearts}
                </span>
                <span className="text-xs font-semibold text-[#737F8A]">{c.distance}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-lg font-semibold text-[#1F2933]">{c.name}</p>
                {c.hasMomso && (
                  <span className="rounded-full bg-[#FDEEEA] px-2 py-0.5 text-[10px] font-bold text-[#C0503D]">
                    몸소
                  </span>
                )}
                {c.hasInbody && (
                  <span className="rounded-full bg-[#E9EFF5] px-2 py-0.5 text-[10px] font-bold text-[#1F3F5B]">
                    인바디
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2.5 py-1 text-[11px] font-semibold text-[#2F5F8F]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className="mt-4 h-11 w-full rounded-[6px] bg-[#E26D5C] text-sm font-semibold text-white transition hover:bg-[#D15A48]"
                type="button"
                onClick={() => setSelectedId(c.id)}
              >
                정보 · 예약
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-[8px] border border-dashed border-[#CDD6DE] bg-[#F7FAFD] px-4 py-6 text-center text-xs font-semibold text-[#9aa19a]">
            검색/레이어 조건에 맞는 플레이스가 없습니다.
          </p>
        )}
      </section>

      {/* 몸소 레이어 — 센터별 공개 리뷰/블로그 피드 (강사·수련생, 리뷰·블로그 혼합) */}
      {feedCenter && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-4">
          <div className="max-h-[80%] w-full max-w-[420px] overflow-y-auto rounded-[16px] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#C0503D]">momso layer · 리뷰/블로그</p>
                <h3 className="mt-0.5 text-xl font-semibold text-[#1F2933]">{feedCenter.name}</h3>
                <p className="mt-0.5 text-[11px] font-semibold text-[#737F8A]">
                  전체공개로 발행된 글 {feedCenter.posts.length}건
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedId(null)}
                className="text-sm font-semibold text-[#9aa19a]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {feedCenter.posts.map((p) => (
                <article
                  key={p.id}
                  className="rounded-[10px] border border-[#E1E6EA] bg-[#FBFCFF] p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={[
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        p.kind === '리뷰'
                          ? 'bg-[#FDEEEA] text-[#C0503D]'
                          : 'bg-[#EDE7F6] text-[#5E4B8B]',
                      ].join(' ')}
                    >
                      {p.kind}
                    </span>
                    <span
                      className={[
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        p.authorType === '강사'
                          ? 'bg-[#E9EFF5] text-[#1F3F5B]'
                          : 'bg-[#EAF2EC] text-[#3F7A55]',
                      ].join(' ')}
                    >
                      {p.authorType}
                    </span>
                    <span className="text-[11px] font-semibold text-[#5D6874]">{p.author}</span>
                    <span className="ml-auto text-[11px] font-semibold text-[#E26D5C]">❤️ {p.likes}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#1F2933]">{p.title}</p>
                  <p className="mt-1 text-xs font-normal leading-5 text-[#3a423a]">{p.snippet}</p>
                </article>
              ))}
            </div>

            {feedCenter.hasInbody && (
              <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-[#D6E0EA] bg-[#F2F6FA] px-3 py-2">
                <span className="rounded-full bg-[#1F3F5B] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  InBody
                </span>
                <span className="text-[11px] font-semibold text-[#1F3F5B]">
                  이 센터는 인바디도 보유 — 두 레이어가 함께 켜집니다
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PP5. 공간×시계열 탐색 — 내 발자취 모달 */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-4">
          <div className="max-h-[80%] w-full max-w-[420px] overflow-y-auto rounded-[16px] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[#6F7780]">time × place</p>
                <h3 className="mt-0.5 text-xl font-semibold text-[#1F2933]">내 발자취</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryOpen(false)
                  setReportEntry(null)
                }}
                className="text-sm font-semibold text-[#9aa19a]"
              >
                ✕
              </button>
            </div>

            {!reportEntry ? (
              <>
                <p className="mt-2 text-xs font-normal leading-5 text-[#737F8A]">
                  어느 시기에 어느 센터에서 무엇을 했는지 나 중심으로 탐색합니다.
                </p>
                <div className="mt-4 space-y-3">
                  {placeHistory.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setReportEntry(h)}
                      className="flex w-full items-start gap-3 rounded-[10px] border border-[#E1E6EA] bg-[#FBFCFF] p-3 text-left transition hover:border-[#E26D5C]"
                    >
                      <span className="rounded-[6px] bg-[#1F3F5B] px-2 py-1 text-[11px] font-bold text-white">
                        {h.period}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#1F2933]">
                          {h.centerName}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-[#E26D5C]">
                          {h.kind}
                        </span>
                        <span className="mt-1 block text-xs font-normal leading-5 text-[#3a423a]">
                          {h.activity}
                        </span>
                      </span>
                      <span className="self-center text-xs font-semibold text-[#9aa19a]">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setReportEntry(null)}
                  className="text-xs font-semibold text-[#5F7690]"
                >
                  ‹ 발자취로
                </button>
                <div className="mt-3 rounded-[10px] bg-[#EEF5FA] p-4">
                  <p className="text-xs font-semibold text-[#5F7690]">
                    {reportEntry.kind} 분류별 내 수업 리포트
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#1F3F5B]">
                    {reportEntry.centerName} · {reportEntry.period}
                  </p>
                  <p className="mt-3 text-sm font-normal leading-7 text-[#1F3F5B]">
                    {reportEntry.reportSummary}
                  </p>
                  <p className="mt-3 rounded-[6px] bg-white px-3 py-2 text-xs font-normal leading-5 text-[#3a423a]">
                    {reportEntry.activity}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 회원 모미 — 강사 모미와 같은 프로젝트/채팅방 패턴의 회원 버전.
// 회원의 데이터(센터별 수업 · 인바디 데이터)를 멀티선택해 채팅방을 만들고,
// 정보형 템플릿으로 모미에게 바로 질문한다.
type MemberMomiCategoryId = 'all' | 'center' | 'inbody'

const memberMomiCategories: Array<{ id: MemberMomiCategoryId; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'center', label: '센터별 수업' },
  { id: 'inbody', label: '인바디 데이터' },
]

type MemberMomiDataItem = {
  id: string
  label: string
  sub: string
  category: Exclude<MemberMomiCategoryId, 'all'>
}

// 센터별 수업 = 회원이 다니는(몸소 연동) 센터 / 인바디 데이터 = 받은 리포트·내 추이
const memberMomiDataItems: MemberMomiDataItem[] = [
  ...placeCenters
    .filter((c) => c.hasMomso)
    .map((c) => ({
      id: `center-${c.id}`,
      label: c.name,
      sub: `센터 · ${c.kind} · ${c.instructors[0]} 수업`,
      category: 'center' as const,
    })),
  { id: 'inbody-trend', label: '내 인바디 추이', sub: '인바디 · 최근 3회 · 골격근량·체지방률', category: 'inbody' },
  { id: 'inbody-0601', label: '인바디 리포트 06.01', sub: '인바디 · 바디PT 연희 · 좌우 균형', category: 'inbody' },
  { id: 'inbody-0415', label: '인바디 리포트 04.15', sub: '인바디 · 연희 피트니스 · 기초대사량', category: 'inbody' },
]

type MemberMomiRoom = { id: string; name: string; sub: string }

const memberMomiInitialRooms: MemberMomiRoom[] = [
  { id: 'mroom-shoulder', name: '오요가 · 어깨 회복', sub: '센터 1 · 수업 리포트 4' },
  { id: 'mroom-inbody', name: '내 인바디 변화', sub: '인바디 데이터 3건' },
  { id: 'mroom-month', name: '이번 달 수련', sub: '센터 2 · 인바디 1' },
]

type MemberMomiTemplate = {
  id: string
  emoji: string
  label: string
  prompt: string
  answer: string
  // 루틴 카드형 답변일 때만 채워진다 (수련생 친화 데모)
  routine?: { title: string; meta: string }
}

const memberMomiTemplates: MemberMomiTemplate[] = [
  {
    id: 't-routine',
    emoji: '🧘',
    label: '나에게 맞는 루틴',
    prompt: '내 수련·인바디 데이터를 바탕으로 나에게 맞는 루틴을 추천해줘.',
    answer:
      '최근 수업 리포트와 인바디 추이를 보면 우측 어깨 말림과 햄스트링 긴장이 반복돼요. 이 둘을 함께 풀어줄 맞춤 루틴을 준비했어요.',
    routine: { title: '나에게 맞는 어깨·하체 밸런스 루틴', meta: '총 12분 · 4가지 동작 · 좌우 균형' },
  },
  {
    id: 't-body',
    emoji: '🩻',
    label: '나의 몸 상태 파악',
    prompt: '지금 내 몸 상태가 전반적으로 어떤지 데이터로 알려줘.',
    answer:
      '최근 6회 수련에서 골반 정렬과 호흡 길이가 꾸준히 좋아졌어요. 다만 우측 어깨 가동성은 평균보다 낮게 관찰돼 회복 루틴이 도움이 됩니다.',
  },
  {
    id: 't-pain',
    emoji: '🌿',
    label: '통증 완화 루틴',
    prompt: '어깨·목이 뻐근할 때 할 수 있는 통증 완화 루틴 알려줘.',
    answer:
      '오늘 수련에서 관찰된 우측 어깨 긴장을 부드럽게 풀어줄 8분 루틴이에요. 통증이 느껴지면 호흡에 맞춰 천천히 진행하세요.',
    routine: { title: '어깨·목 통증 완화 루틴', meta: '총 8분 · 3가지 동작 · 저강도' },
  },
  {
    id: 't-week',
    emoji: '📅',
    label: '이번 주 수련 추천',
    prompt: '이번 주 내 컨디션에 맞춰 수련 계획을 짜줘.',
    answer:
      '이번 주는 회복에 무게를 두는 걸 추천해요. 월·수는 가벼운 하타, 금요일은 어깨 가동성 클래스, 주말은 인요가로 마무리하면 좋아요.',
  },
  {
    id: 't-inbody',
    emoji: '📊',
    label: '인바디 변화 해석',
    prompt: '내 인바디 데이터가 어떻게 변했는지 쉽게 풀어서 설명해줘.',
    answer:
      '최근 3회 인바디를 비교하면 골격근량이 늘고 체지방률이 내려가는 흐름이에요. 좌우 균형도 개선되고 있어 수련 방향이 잘 맞고 있다는 신호예요.',
  },
  {
    id: 't-sleep',
    emoji: '🌙',
    label: '수면·회복 루틴',
    prompt: '자기 전에 할 수 있는 수면·회복 루틴 만들어줘.',
    answer:
      '하루의 긴장을 내려놓고 깊은 수면을 도와줄 10분 루틴이에요. 우측 어깨 이완과 느린 호흡으로 마무리합니다.',
    routine: { title: '우측 어깨 이완 굿나잇 루틴', meta: '총 10분 · 3가지 동작 · 수면 유도' },
  },
  {
    id: 't-life',
    emoji: '🥗',
    label: '생활·식단 팁',
    prompt: '내 몸 상태에 도움이 되는 생활·식단 팁을 알려줘.',
    answer:
      '근육 회복을 위해 수련 후 30분 내 단백질 섭취가 좋아요. 어깨 긴장 완화에는 수분과 마그네슘이 도움이 되고, 장시간 앉을 땐 1시간마다 가볍게 풀어주세요.',
  },
]

type MemberMomiMsg = {
  role: 'momi' | 'me'
  text: string
  routine?: { title: string; meta: string }
}

// 방을 처음 열었을 때 기본으로 보이는 인사/루틴 대화 (기존 루틴 카드 아이디어 유지)
const memberMomiDefaultThread: MemberMomiMsg[] = [
  {
    role: 'momi',
    text: '오늘 하루도 고생 많으셨어요 하린님. 오늘 수련 리포트를 바탕으로 피로를 풀어줄 가벼운 루틴을 만들어 드릴까요?',
  },
  { role: 'me', text: '네, 리포트에 있던 대로 오른쪽 어깨랑 목 위주로 짧게 부탁해.' },
  {
    role: 'momi',
    text: '오늘 수련에서 발견된 우측 어깨 말림을 이완시켜 줄 10분 맞춤형 루틴입니다. 편안한 환경에서 따라해 보세요.',
    routine: { title: '우측 어깨 이완 굿나잇 루틴', meta: '총 10분 · 3가지 동작 · 수면 유도' },
  },
]

function StudentAiScreen() {
  const [rooms, setRooms] = useState<MemberMomiRoom[]>(memberMomiInitialRooms)
  const [activeRoomId, setActiveRoomId] = useState<string>(memberMomiInitialRooms[0].id)
  const [dataPanelOpen, setDataPanelOpen] = useState(false)
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false)
  const [category, setCategory] = useState<MemberMomiCategoryId>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // 방마다 별도 대화 흐름. 기본 방은 인사/루틴 스레드로 시작한다.
  const [threads, setThreads] = useState<Record<string, MemberMomiMsg[]>>({
    [memberMomiInitialRooms[0].id]: memberMomiDefaultThread,
  })
  const [draft, setDraft] = useState('')

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0]
  const messages = threads[activeRoom.id] ?? memberMomiDefaultThread

  const filteredDataItems = memberMomiDataItems.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    const q = search.trim().toLowerCase()
    if (q && !`${item.label} ${item.sub}`.toLowerCase().includes(q)) return false
    return true
  })

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const setThread = (roomId: string, next: MemberMomiMsg[]) =>
    setThreads((prev) => ({ ...prev, [roomId]: next }))

  const createRoom = () => {
    if (selectedIds.length === 0) return
    const picked = memberMomiDataItems.filter((i) => selectedIds.includes(i.id))
    const labels = picked.map((p) => p.label)
    const name = labels.length <= 2 ? labels.join(' · ') : `${labels[0]} 외 ${labels.length - 1}`
    const hasInbody = picked.some((p) => p.category === 'inbody')
    const newRoom: MemberMomiRoom = {
      id: `mroom-${Date.now()}`,
      name,
      sub: `선택 데이터 ${picked.length}건`,
    }
    setRooms((prev) => [newRoom, ...prev])
    setActiveRoomId(newRoom.id)
    setThread(newRoom.id, [
      {
        role: 'momi',
        text: `${name} 데이터로 채팅방을 만들었어요. ${
          hasInbody ? '수련 리포트와 인바디 데이터를' : '선택한 센터 수업 리포트를'
        } 함께 보고 무엇이든 물어보세요.`,
      },
    ])
    setSelectedIds([])
    setSearch('')
    setDataPanelOpen(false)
  }

  // 템플릿 선택 → 내 질문 + 모미 샘플 답변을 현재 방 대화에 추가
  const runTemplate = (t: MemberMomiTemplate) => {
    const next: MemberMomiMsg[] = [
      ...messages,
      { role: 'me', text: t.prompt },
      { role: 'momi', text: t.answer, routine: t.routine },
    ]
    setThread(activeRoom.id, next)
    setTemplatePanelOpen(false)
  }

  // 입력창 전송 → 내 질문 + 간단한 모미 응답 (데모)
  const sendDraft = () => {
    const q = draft.trim()
    if (!q) return
    setThread(activeRoom.id, [
      ...messages,
      { role: 'me', text: q },
      {
        role: 'momi',
        text: '이 채팅방의 데이터를 기준으로 답변을 준비했어요. 내 수련·인바디 흐름에 맞춰 정리해 드릴게요.',
      },
    ])
    setDraft('')
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#6F7780]">모미 · momi</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
            나를 가장 잘 아는 웰니스 메이트, 모미
          </h2>
        </div>
        <div className="mt-1 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setTemplatePanelOpen((v) => !v)
              setDataPanelOpen(false)
            }}
            aria-label="템플릿"
            aria-pressed={templatePanelOpen}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-[8px] border text-base',
              templatePanelOpen
                ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                : 'border-[#EBD3CD] bg-[#FDF3F0] text-[#C0503D]',
            ].join(' ')}
          >
            ✨
          </button>
          <button
            type="button"
            onClick={() => {
              setDataPanelOpen((v) => !v)
              setTemplatePanelOpen(false)
            }}
            aria-label="데이터/문서 선택"
            aria-pressed={dataPanelOpen}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-[8px] border text-base',
              dataPanelOpen
                ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                : 'border-[#EBD3CD] bg-[#FDF3F0] text-[#C0503D]',
            ].join(' ')}
          >
            🗂
          </button>
        </div>
      </section>

      {/* SM2. 템플릿 도구 — 정보형 프롬프트를 골라 모미에게 바로 질문 */}
      {templatePanelOpen && (
        <section className="rounded-[10px] border border-[#EBD3CD] bg-[#FDF6F4] p-3">
          <p className="text-sm font-semibold text-[#C0503D]">템플릿으로 물어보기</p>
          <p className="mt-1 text-[11px] font-normal text-[#8a7d79]">
            골라서 누르면 모미에게 바로 질문이 전달돼요.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {memberMomiTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => runTemplate(t)}
                className="flex items-center gap-2 rounded-[8px] border border-[#EBD3CD] bg-white px-3 py-2.5 text-left transition hover:bg-[#FDEEEA]"
              >
                <span className="text-base">{t.emoji}</span>
                <span className="min-w-0 text-sm font-semibold text-[#3a423a]">{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* SM1. 데이터(센터별 수업·인바디) 멀티선택 → 채팅방 만들기 */}
      {dataPanelOpen && (
        <section className="rounded-[10px] border border-[#EBD3CD] bg-[#FDF6F4] p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#C0503D]">내 데이터로 채팅방 만들기</p>
            <span className="rounded-full bg-[#FDEEEA] px-2 py-0.5 text-[10px] font-semibold text-[#C0503D]">
              여러 개 선택 가능
            </span>
          </div>

          <input
            className="mt-3 h-10 w-full rounded-[8px] border border-[#EBD3CD] bg-white px-3 text-sm font-normal text-[#252D34] outline-none placeholder:text-[#b79a93] focus:border-[#E26D5C]"
            type="text"
            placeholder="센터, 수업, 인바디 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {memberMomiCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={[
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold',
                  category === c.id
                    ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                    : 'border-[#EBD3CD] bg-white text-[#8a6a62]',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
            {filteredDataItems.length === 0 ? (
              <p className="py-4 text-center text-xs font-normal text-[#b79a93]">
                해당하는 데이터가 없습니다.
              </p>
            ) : (
              filteredDataItems.map((item) => {
                const checked = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    aria-pressed={checked}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2 text-left transition',
                      checked
                        ? 'border-[#E26D5C] bg-[#FBE9E5]'
                        : 'border-[#EBD3CD] bg-white hover:bg-[#FDEEEA]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border text-[11px] font-bold',
                        checked
                          ? 'border-[#E26D5C] bg-[#E26D5C] text-white'
                          : 'border-[#E0C7C0] bg-white text-transparent',
                      ].join(' ')}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#252D34]">
                        {item.category === 'inbody' ? '📊 ' : '🧘 '}
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] font-normal text-[#8a7d79]">
                        {item.sub}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <button
            type="button"
            onClick={createRoom}
            disabled={selectedIds.length === 0}
            className={[
              'mt-3 h-11 w-full rounded-[6px] text-sm font-semibold transition',
              selectedIds.length === 0
                ? 'cursor-not-allowed bg-[#EDE0DC] text-[#b79a93]'
                : 'bg-[#E26D5C] text-white hover:bg-[#D15A48]',
            ].join(' ')}
          >
            {selectedIds.length === 0
              ? '데이터를 선택하세요'
              : `채팅방 만들기 (${selectedIds.length}건)`}
          </button>
        </section>
      )}

      {/* SM1. 채팅방 목록 — 클릭하면 해당 방의 대화가 열린다 */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-[#6F7780]">채팅방</p>
        <div className="space-y-1.5">
          {rooms.map((room) => {
            const isActive = room.id === activeRoom.id
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition',
                  isActive
                    ? 'border-[#E26D5C] bg-[#FBE9E5]'
                    : 'border-[#EBD3CD] bg-white hover:bg-[#FDEEEA]',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#252D34]">
                    💬 {room.name}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-[#8a7d79]">
                    {room.sub}
                  </span>
                </span>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-[#E26D5C] px-2 py-0.5 text-[10px] font-semibold text-white">
                    열림
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* SM3. 열린 채팅방의 대화 — warm/light 회원 스타일 */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">{activeRoom.name}</p>
        {messages.map((m, i) =>
          m.role === 'me' ? (
            <div
              key={i}
              className="ml-auto max-w-[88%] rounded-[14px] rounded-br-[4px] bg-[#E26D5C] px-4 py-3 text-sm font-normal leading-6 text-white"
            >
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[92%] rounded-[14px] rounded-bl-[4px] border border-[#DCE4EA] bg-white px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase text-[#5F7690]">모미</p>
              <p className="mt-1.5 text-sm font-normal leading-6 text-[#3a423a]">{m.text}</p>
              {m.routine && (
                <div className="mt-3 rounded-[8px] bg-[#F7FAFD] p-4">
                  <div className="flex h-24 items-center justify-center rounded-[8px] bg-[#EEF5FA] text-2xl">
                    🧘
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#1F3F5B]">{m.routine.title}</p>
                  <p className="mt-1 text-xs font-normal text-[#687682]">{m.routine.meta}</p>
                  <button
                    className="mt-3 h-10 w-full rounded-[6px] bg-[#E26D5C] text-sm font-semibold text-white transition hover:bg-[#D15A48]"
                    type="button"
                  >
                    루틴 시작하기
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </section>

      <div className="flex items-center gap-2 rounded-[8px] border border-[#E1E6EA] bg-[#FBFCFF] px-4 py-2.5">
        <input
          className="w-full bg-transparent text-sm font-normal text-[#252D34] outline-none placeholder:text-[#9aa19a]"
          type="text"
          placeholder="모미에게 이 채팅방의 데이터로 질문하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendDraft()
          }}
        />
        <button
          type="button"
          onClick={sendDraft}
          aria-label="전송"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E26D5C] text-sm text-white transition hover:bg-[#D15A48]"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

export function InbodylikePrototype() {
  const [activeRole, setActiveRole] = useState<AppRole>('teacher')
  const [activeScreen, setActiveScreen] = useState<PrototypeScreen>('today')
  const [activeStudentScreen, setActiveStudentScreen] = useState<StudentScreen>('home')
  const [seconds, setSeconds] = useState(0)
  // 홈(오늘의 수업)에서의 인플레이스 녹음 상태
  const [homeRecording, setHomeRecording] = useState(false)
  const [focusViewMode, setFocusViewMode] = useState<FocusViewMode>('cards')
  const [reviewItems, setReviewItems] = useState(initialReviewItems)
  const [publishedTo, setPublishedTo] = useState<PublishTarget | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 타이머는 홈에서 인플레이스 녹음 중일 때만 동작한다.
    const homeRunning = activeScreen === 'today' && homeRecording
    if (!homeRunning) {
      return
    }

    const timerId = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [activeScreen, homeRecording])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeRole, activeScreen, activeStudentScreen])

  // 회원-tagged 항목 = 수련생(회원) 리포트로 발행되는 항목
  const shareableItems = useMemo(
    () => reviewItems.filter((item) => item.toMember),
    [reviewItems],
  )

  const studentReportTexts = useMemo(
    () =>
      shareableItems.length > 0
        ? shareableItems.map((item) => item.text)
        : sampleStudentReportItems,
    [shareableItems],
  )

  const asideContext =
    activeRole === 'teacher'
      ? teacherAsideContexts[activeScreen]
      : studentAsideContexts[activeStudentScreen]

  function handleToggleMember(id: string) {
    setPublishedTo(null)
    setReviewItems((items) =>
      items.map((item) => (item.id === id ? { ...item, toMember: !item.toMember } : item)),
    )
  }

  function handleToggleTeacher(id: string) {
    setPublishedTo(null)
    setReviewItems((items) =>
      items.map((item) => (item.id === id ? { ...item, toTeacher: !item.toTeacher } : item)),
    )
  }

  function handleToggleKept(id: string) {
    setReviewItems((items) =>
      items.map((item) => (item.id === id ? { ...item, kept: !item.kept } : item)),
    )
  }

  // 검수 화면의 "발행 화면으로 이동" — 발행 자체는 ReportScreen 의 두 버튼에서 한다.
  function handleGoPublish() {
    setActiveRole('teacher')
    setActiveScreen('report')
  }

  function handlePublishMember() {
    setPublishedTo('member')
    setActiveRole('teacher')
    setActiveScreen('report')
  }

  function handlePublishTeacher() {
    setPublishedTo('teacher')
    setActiveRole('teacher')
    setActiveScreen('report')
  }

  function handleChangeRole(role: AppRole) {
    setActiveRole(role)
  }

  function handleOpenStudentReport() {
    setActiveRole('student')
    setActiveStudentScreen('report')
  }

  // 홈 인플레이스 녹음: 시작 시 타이머 리셋, AI 초안 만들기 → 검수 화면으로
  function handleHomeStart() {
    setSeconds(0)
    setHomeRecording(true)
  }

  function handleHomeFinish() {
    setHomeRecording(false)
    setActiveScreen('review')
  }

  return (
    <main className="min-h-screen break-keep bg-[#E7EBF0] text-[#202B36]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-stretch justify-center gap-10 px-0 py-0 md:px-8 md:py-2">
        <aside className="hidden w-[24rem] flex-col justify-between py-8 md:flex">
          <div className="space-y-7">
            <div>
              <p className="text-xs font-semibold uppercase text-[#6F7780]">demo control</p>
              <div className="mt-3">
                <RoleToggle activeRole={activeRole} onChangeRole={handleChangeRole} />
              </div>
            </div>

            <div>
            <p className="text-xs font-semibold tracking-[0.01em] text-[#5D7EA1]">momso prototype</p>
            <h1 className="mt-4 text-[34px] font-semibold leading-tight text-[#172638]">
              {asideContext.title}
            </h1>
            <p className="mt-4 text-[15px] font-normal leading-7 text-[#566055]">
              {asideContext.description}
            </p>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#CDD6DE] pt-6">
            {asideContext.points.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#747D86]">{label}</p>
                <p className="mt-1 text-[15px] font-normal leading-6 text-[#2c332c]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex w-full items-center justify-center py-6 md:w-auto">
          <div className="relative" style={{ width: 384, height: 812 }}>
            {/* 측면 버튼 (무음/볼륨업/볼륨다운 · 전원) */}
            <div className="absolute -left-[3px] top-[110px] z-10 h-7 w-[3px] rounded-l bg-[#2b2b30]" />
            <div className="absolute -left-[3px] top-[162px] z-10 h-14 w-[3px] rounded-l bg-[#2b2b30]" />
            <div className="absolute -left-[3px] top-[232px] z-10 h-14 w-[3px] rounded-l bg-[#2b2b30]" />
            <div className="absolute -right-[3px] top-[200px] z-10 h-24 w-[3px] rounded-r bg-[#2b2b30]" />

            {/* 베젤 */}
            <div className="absolute inset-0 rounded-[3rem] bg-[#3a3b41] p-[7px] shadow-xl shadow-[#b6bfca]">
              {/* 화면 */}
              <div className="relative h-full w-full overflow-hidden rounded-[2.6rem] bg-[#FBFCFF]">
                {/* 다이내믹 아일랜드 (전면 카메라) */}
                <div className="absolute left-1/2 top-[10px] z-30 h-[27px] w-[104px] -translate-x-1/2 rounded-full bg-black" />

                <div className="flex h-full flex-col">
            <header
              className={[
                'border-b transition-colors',
                activeRole === 'student'
                  ? 'border-[#2E638F] bg-[#E26D5C] text-white'
                  : 'border-[#E1E6EA] bg-[#FBFCFF] text-[#1F2933]',
              ].join(' ')}
            >
              {/* 상태바 */}
              <div
                className={[
                  'flex items-center justify-between px-6 pt-2.5 pb-1 text-[11px] font-semibold',
                  activeRole === 'student' ? 'text-[#DCEBFA]' : 'text-[#1F2933]',
                ].join(' ')}
              >
                <span className="tracking-tight">9:41</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px]">
                    <span className="h-[4px] w-[2px] rounded-sm bg-current" />
                    <span className="h-[6px] w-[2px] rounded-sm bg-current" />
                    <span className="h-[8px] w-[2px] rounded-sm bg-current" />
                    <span className="h-[11px] w-[2px] rounded-sm bg-current" />
                  </span>
                  <span className="relative inline-flex h-[11px] w-[20px] items-center rounded-[3px] border border-current px-[1.5px]">
                    <span className="h-[6px] w-[13px] rounded-[1px] bg-current" />
                    <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r bg-current" />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-1">
                <div>
                  <p
                    className={[
                      'text-[13px] font-semibold tracking-[0.01em]',
                      activeRole === 'student' ? 'text-[#DCEBFA]' : 'text-[#5D7EA1]',
                    ].join(' ')}
                  >
                    momso
                  </p>
                  <h1 className="mt-1 text-xl font-semibold">
                    {activeRole === 'student'
                      ? studentTopLabel(activeStudentScreen)
                      : teacherTopLabel(activeScreen)}
                  </h1>
                </div>
                <button
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base transition',
                    activeRole === 'student'
                      ? 'text-[#DCEBFA] hover:bg-[#225B88]'
                      : 'text-[#6F7780] hover:bg-[#edf1ed]',
                  ].join(' ')}
                  type="button"
                  aria-label="설정"
                  title="설정"
                >
                  ⚙
                </button>
              </div>
            </header>

            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeRole === 'teacher' && activeScreen === 'today' && (
                <TodayScreen
                  recording={homeRecording}
                  seconds={seconds}
                  onStart={handleHomeStart}
                  onFinish={handleHomeFinish}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'review' && (
                <ReviewScreen
                  items={reviewItems}
                  focusViewMode={focusViewMode}
                  onChangeFocusViewMode={setFocusViewMode}
                  onToggleMember={handleToggleMember}
                  onToggleTeacher={handleToggleTeacher}
                  onToggleKept={handleToggleKept}
                  onPublish={handleGoPublish}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'report' && (
                <ReportScreen
                  items={reviewItems}
                  shareableItems={shareableItems}
                  publishedTo={publishedTo}
                  onPublishMember={handlePublishMember}
                  onPublishTeacher={handlePublishTeacher}
                  onGoReview={() => setActiveScreen('review')}
                  onOpenStudent={handleOpenStudentReport}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'archive' && <TeacherArchiveScreen />}
              {activeRole === 'teacher' && activeScreen === 'ai' && <TeacherAiScreen />}
              {activeRole === 'student' && activeStudentScreen === 'home' && (
                <StudentHomeScreen
                  onOpenReport={() => setActiveStudentScreen('report')}
                />
              )}
              {activeRole === 'student' && activeStudentScreen === 'report' && (
                <StudentReportScreen reportTexts={studentReportTexts} />
              )}
              {activeRole === 'student' && activeStudentScreen === 'archive' && (
                <StudentArchiveScreen onOpenReport={() => setActiveStudentScreen('report')} />
              )}
              {activeRole === 'student' && activeStudentScreen === 'connect' && (
                <StudentConnectScreen />
              )}
              {activeRole === 'student' && activeStudentScreen === 'place' && (
                <StudentPlaceScreen />
              )}
              {activeRole === 'student' && activeStudentScreen === 'ai' && <StudentAiScreen />}
            </div>

            <nav
              className={[
                'shrink-0 border-t px-2 py-2 backdrop-blur md:rounded-b-[28px]',
                activeRole === 'student'
                  ? 'border-[#2E638F] bg-[#E26D5C]/95'
                  : 'border-[#DDE3E8] bg-[#FBFCFF]/95',
              ].join(' ')}
            >
              <div className="flex gap-1">
                {activeRole === 'teacher'
                  ? teacherTabs.map((tab) => (
                      <NavButton
                        key={tab.id}
                        tab={tab}
                        activeTabId={teacherActiveTab(activeScreen)}
                        onSelect={setActiveScreen}
                      />
                    ))
                  : studentTabs.map((tab) => (
                      <NavButton
                        key={tab.id}
                        tab={tab}
                        activeTabId={studentActiveTab(activeStudentScreen)}
                        onSelect={setActiveStudentScreen}
                        tone="student"
                      />
                    ))}
              </div>
            </nav>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
