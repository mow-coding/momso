import { useEffect, useMemo, useRef, useState } from 'react'

type AppRole = 'teacher' | 'student'

type PrototypeScreen = 'today' | 'recording' | 'review' | 'report' | 'next'

type StudentScreen = 'home' | 'report' | 'archive' | 'connect'

type ReviewStatus = 'draft' | 'shareable' | 'internal' | 'hold' | 'excluded'

type FocusViewMode = 'cards' | 'paragraph' | 'cloud' | 'map'

type AsideContext = {
  title: string
  description: string
  points: Array<[string, string]>
}

type ReviewItem = {
  id: string
  focus: string
  text: string
  detail: string
  source: string
  cloudTerms: string[]
  status: ReviewStatus
  suggestedStatus: ReviewStatus
  needsTermReview?: boolean
}

const teacherScreenLabels: Array<{ id: PrototypeScreen; label: string }> = [
  { id: 'today', label: '수업' },
  { id: 'recording', label: '녹음' },
  { id: 'review', label: '검수' },
  { id: 'report', label: '리포트' },
  { id: 'next', label: '다음' },
]

const studentScreenLabels: Array<{ id: StudentScreen; label: string }> = [
  { id: 'home', label: '홈' },
  { id: 'report', label: '리포트' },
  { id: 'archive', label: '아카이브' },
  { id: 'connect', label: '연결' },
]

const statusLabels: Record<ReviewStatus, string> = {
  draft: '검토',
  shareable: '공유',
  internal: '내부',
  hold: '보류',
  excluded: '제외',
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

const consentStates = [
  ['녹음 동의', '완료'],
  ['전사 동의', '완료'],
  ['리포트 공유', '완료'],
]

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

const archiveEntries = [
  ['오늘', '하타 베이직', '접지와 호흡 리듬'],
  ['06.01', '인바디 참고', '좌우 균형과 골반 정렬'],
  ['05.29', '하타 베이직', '내쉬는 호흡의 길이'],
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

const recordingFocusOptions = [
  ['수련생 감각', '오른발 접지와 호흡 변화 중심'],
  ['다음 수업 준비', '골반 정렬과 햄스트링 긴장 회수'],
  ['공유 후보 정리', '개인 리포트로 남길 문장 우선'],
]

const aiWikiSources = [
  ['지난 3회 기록', '김하린 · 접지/호흡 반복'],
  ['요가원 지식', '골반·호흡 시퀀스 교재'],
  ['공유 기준', '사적 상담·타인 정보 제외'],
]

const dataLayerFlow = [
  ['raw', '원본', '음성·전체 전사 비공개'],
  ['metadata', '정리', '초점·태그·다음 수업'],
  ['shareable', '공유', '강사 검수본만 발행'],
]

const nextLoopSteps = [
  ['검수 결과', '공유/내부/제외 확정'],
  ['metadata 적립', '초점·용어·관찰 태그'],
  ['다음 수업 검색', 'AI 위키가 관련 기록 회수'],
]

const focusCloudTerms = [
  {
    itemId: 'grounding',
    word: '호흡',
    left: '46%',
    top: '24%',
    rotate: '-4deg',
    className: 'text-[30px] text-[#174A7C]',
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
    text: '오른발 접지와 내쉬는 호흡에서 골반 정렬을 함께 확인했습니다.',
    detail: '개인 리포트에 포함',
    source: '전사 12:40-16:05 · 오른발 접지, 내쉬는 호흡, 골반 정렬이 반복됨',
    cloudTerms: ['호흡', '오른발', '접지', '골반 정렬'],
    status: 'draft',
    suggestedStatus: 'shareable',
  },
  {
    id: 'privacy',
    focus: '민감 대화 초점',
    text: '수업 전 개인 상담에서 나온 피로 원인은 공유 전 확인이 필요합니다.',
    detail: '민감 대화',
    source: '전사 03:18-05:02 · 수련생의 개인 사정과 컨디션 원인이 언급됨',
    cloudTerms: ['사적 고민', '피로 원인', '공유 전 확인'],
    status: 'draft',
    suggestedStatus: 'hold',
  },
  {
    id: 'asana-term',
    focus: '요가 용어 초점',
    text: '파스치모타나사나 진입 전 햄스트링 긴장을 낮추는 큐가 필요했습니다.',
    detail: '요가 용어',
    source: '전사 21:08-23:44 · 산스크리트 자세명과 햄스트링 큐가 함께 등장',
    cloudTerms: ['파스치모타나사나', '햄스트링', '요가 용어'],
    status: 'draft',
    suggestedStatus: 'hold',
    needsTermReview: true,
  },
  {
    id: 'sequence',
    focus: '지도자 노하우 초점',
    text: 'TTC 수준의 시퀀스 설명과 지도자 노하우는 내부 기록으로 유지합니다.',
    detail: '지도자 노하우',
    source: '요가원 지식 DB · 지도자 교육용 시퀀스 설명과 연결됨',
    cloudTerms: ['지도자 노하우', '시퀀스', 'TTC'],
    status: 'draft',
    suggestedStatus: 'internal',
  },
  {
    id: 'other-student',
    focus: '타인 정보 초점',
    text: '다른 수련생 이름이 언급된 문장은 리포트에서 제외합니다.',
    detail: '타인 정보',
    source: '전사 32:12-32:40 · 다른 수련생 이름과 비교 표현이 감지됨',
    cloudTerms: ['타인 이름', '비교 표현', '제외'],
    status: 'draft',
    suggestedStatus: 'excluded',
  },
]

const teacherAsideContexts: Record<PrototypeScreen, AsideContext> = {
  today: {
    title: '수업 전 초점을 먼저 고릅니다.',
    description:
      '강사가 오늘 무엇을 기록할지 정하는 출발점입니다. 선택한 초점이 이후 AI 초안의 기준이 됩니다.',
    points: [
      ['사용자 행동', '수업 선택, 동의 상태 확인, 기록 초점 확인'],
      ['제품 의도', '녹음 전에 관찰 의도를 명확히 남김'],
      ['주의', '인바디 수치는 수업 관찰 참고 정보로만 표시'],
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
    title: '검수 탭은 초점 단위 작업대입니다.',
    description:
      '전사본 전체를 편집하는 화면이 아니라, AI가 나눈 대화 초점을 보고 무엇을 공유 데이터로 보낼지 결정하는 화면입니다.',
    points: [
      ['사용자 행동', '초점을 눌러 공유, 내부, 보류, 제외를 확정'],
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
  next: {
    title: '검수 결과가 다음 수업으로 돌아옵니다.',
    description:
      'momso의 기록은 한 번 보고 끝나는 회의록이 아니라 다음 수업에서 다시 회수되는 수업 지식입니다.',
    points: [
      ['회수 루프', '검수 결과 -> metadata 적립 -> 다음 수업 검색'],
      ['AI 위키', '지난 기록과 요가원 지식을 수업 맥락으로 연결'],
      ['사용자 가치', '강사가 다음 수업 준비 시간을 줄임'],
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
  if (screen === 'next') return '다음 수업 준비'
  return '오늘의 수업'
}

function studentTopLabel(screen: StudentScreen) {
  if (screen === 'report') return '오늘 리포트'
  if (screen === 'archive') return '개인 아카이브'
  if (screen === 'connect') return '공유와 연결'
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
                  ? 'bg-[#174A7C] text-white shadow-sm'
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

function NavButton<TScreen extends string>({
  screen,
  activeScreen,
  onSelect,
  tone = 'teacher',
}: {
  screen: { id: TScreen; label: string }
  activeScreen: TScreen
  onSelect: (screen: TScreen) => void
  tone?: AppRole
}) {
  const isActive = activeScreen === screen.id
  const isStudentTone = tone === 'student'

  return (
    <button
      className={[
        'flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[6px] text-xs font-semibold transition',
        isActive
          ? isStudentTone
            ? 'bg-white text-[#174A7C]'
            : 'bg-[#174A7C] text-white'
          : isStudentTone
            ? 'text-[#C9DDF0] hover:bg-[#225B88]'
            : 'text-[#6c716b] hover:bg-[#edf1ed]',
      ].join(' ')}
      type="button"
      onClick={() => onSelect(screen.id)}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          isActive
            ? isStudentTone
              ? 'bg-[#174A7C]'
              : 'bg-[#DCEBFA]'
            : isStudentTone
              ? 'bg-[#6F95B8]'
              : 'bg-[#bdc7bd]',
        ].join(' ')}
      />
      {screen.label}
    </button>
  )
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const styleByStatus: Record<ReviewStatus, string> = {
    draft: 'border-[#9aa19a] bg-[#f3f4ef] text-[#626D78]',
    shareable: 'border-[#2F6FA3] bg-[#E6F0FA] text-[#2A638C]',
    internal: 'border-[#6c7180] bg-[#eef0f3] text-[#4c5360]',
    hold: 'border-[#a27637] bg-[#f8edd9] text-[#6e4b1d]',
    excluded: 'border-[#a96767] bg-[#f5e4e1] text-[#7d3b39]',
  }

  return (
    <span
      className={[
        'shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        styleByStatus[status],
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  )
}

function ReviewStatusButtons({
  item,
  onChangeStatus,
}: {
  item: ReviewItem
  onChangeStatus: (id: string, status: ReviewStatus) => void
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {(['shareable', 'internal', 'hold', 'excluded'] as ReviewStatus[]).map((status) => (
        <button
          key={status}
          className={[
            'h-10 rounded-[5px] text-xs font-semibold transition',
            item.status === status
              ? 'bg-[#174A7C] text-white'
              : 'bg-[#f3f4ef] text-[#626D78] hover:bg-[#e8ebe4]',
          ].join(' ')}
          type="button"
          onClick={() => onChangeStatus(item.id, status)}
        >
          {statusLabels[status]}
        </button>
      ))}
    </div>
  )
}

function FocusDecisionPanel({
  item,
  onChangeStatus,
}: {
  item: ReviewItem
  onChangeStatus: (id: string, status: ReviewStatus) => void
}) {
  return (
    <div className="mt-3 rounded-[8px] border border-[#DCE4EA] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#718293]">선택한 초점</p>
          <p className="mt-1 text-sm font-semibold text-[#252D34]">{item.focus}</p>
          <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{item.detail}</p>
        </div>
        <StatusPill status={item.status} />
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
      <ReviewStatusButtons item={item} onChangeStatus={onChangeStatus} />
    </div>
  )
}

function FocusCardView({
  items,
  onChangeStatus,
}: {
  items: ReviewItem[]
  onChangeStatus: (id: string, status: ReviewStatus) => void
}) {
  return (
    <section className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="border-b border-[#E1E6EA] pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-semibold text-[#747F89]">초점 · {item.focus}</p>
                <span className="rounded-full border border-[#DCE4EA] bg-[#EEF5FA] px-2 py-0.5 text-[10px] font-semibold text-[#5F7690]">
                  metadata: {item.detail}
                </span>
                <span className="rounded-full border border-[#CDD6DE] bg-[#f8faf5] px-2 py-0.5 text-[10px] font-semibold text-[#5f6a60]">
                  AI 제안: {statusLabels[item.suggestedStatus]}
                </span>
                {item.needsTermReview && (
                  <span className="rounded-full border border-[#a27637] bg-[#f8edd9] px-2 py-0.5 text-[10px] font-semibold text-[#6e4b1d]">
                    요가 용어 확인 필요
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#242b25]">{item.text}</p>
              <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">{item.source}</p>
            </div>
            <StatusPill status={item.status} />
          </div>
          <ReviewStatusButtons item={item} onChangeStatus={onChangeStatus} />
        </article>
      ))}
    </section>
  )
}

function FocusParagraphView({
  items,
  selectedItemId,
  onSelectItem,
  onChangeStatus,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onChangeStatus: (id: string, status: ReviewStatus) => void
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
              ? 'bg-white ring-2 ring-[#174A7C]'
              : 'bg-white hover:bg-[#f8faf5]',
          ].join(' ')}
          type="button"
          onClick={() => onSelectItem(item.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#747F89]">초점 · {item.focus}</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#252D34]">{item.text}</p>
              <p className="mt-2 text-xs font-normal leading-5 text-[#687682]">{item.source}</p>
            </div>
            <StatusPill status={item.status} />
          </div>
        </button>
      ))}
      {selectedItem && <FocusDecisionPanel item={selectedItem} onChangeStatus={onChangeStatus} />}
    </section>
  )
}

function FocusCloudView({
  items,
  selectedItemId,
  onSelectItem,
  onChangeStatus,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onChangeStatus: (id: string, status: ReviewStatus) => void
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
                  ? 'border-[#174A7C] bg-[#174A7C] text-white'
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
      {selectedItem && <FocusDecisionPanel item={selectedItem} onChangeStatus={onChangeStatus} />}
    </section>
  )
}

function FocusMindMapView({
  items,
  selectedItemId,
  onSelectItem,
  onChangeStatus,
}: {
  items: ReviewItem[]
  selectedItemId: string
  onSelectItem: (id: string) => void
  onChangeStatus: (id: string, status: ReviewStatus) => void
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
        <div className="absolute left-1/2 top-[16%] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#174A7C] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
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
                  ? 'border-[#174A7C] bg-[#E8F1FA]'
                  : 'border-[#DCE4EA] bg-[#FBFCFF] hover:border-[#7BA3C7] hover:bg-white',
              ].join(' ')}
              style={{ left: `${x}%`, top: `${y}%` }}
              type="button"
              onClick={() => onSelectItem(itemId)}
            >
              <p className="text-[10px] font-semibold text-[#5F7690]">{label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#252D34]">{item.focus}</p>
              <div className="mt-2">
                <StatusPill status={item.status} />
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-3 rounded-[8px] bg-white px-3 py-2">
        <p className="text-[11px] font-normal leading-5 text-[#687682]">
          노드를 누르면 해당 초점을 공유 데이터에 반영할지, 보류할지, 제외할지 결정합니다.
        </p>
      </div>
      {selectedItem && <FocusDecisionPanel item={selectedItem} onChangeStatus={onChangeStatus} />}
    </section>
  )
}

function FocusReviewModePanel({
  items,
  mode,
  onChangeMode,
  onChangeStatus,
}: {
  items: ReviewItem[]
  mode: FocusViewMode
  onChangeMode: (mode: FocusViewMode) => void
  onChangeStatus: (id: string, status: ReviewStatus) => void
}) {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? '')

  return (
    <section className="space-y-3">
      <div className="rounded-[8px] border border-[#DCE4EA] bg-[#FBFCFF] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">대화 초점 보기</p>
        <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
          같은 초점을 원하는 방식으로 펼쳐 보고, 각 조각마다 공유 범위를 바로 확정합니다.
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
                    ? 'bg-[#174A7C] text-white shadow-sm'
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

      {mode === 'cards' && <FocusCardView items={items} onChangeStatus={onChangeStatus} />}
      {mode === 'paragraph' && (
        <FocusParagraphView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onChangeStatus={onChangeStatus}
        />
      )}
      {mode === 'cloud' && (
        <FocusCloudView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onChangeStatus={onChangeStatus}
        />
      )}
      {mode === 'map' && (
        <FocusMindMapView
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onChangeStatus={onChangeStatus}
        />
      )}
    </section>
  )
}

function TodayScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#6F7780]">BigBlue Yoga</p>
            <h2 className="mt-1 text-[28px] font-semibold leading-tight text-[#1F2933]">
              하타 베이직
            </h2>
          </div>
          <span className="rounded-full bg-[#E9F0F6] px-3 py-1.5 text-xs font-semibold text-[#314E68]">
            19:30
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            ['참여', '3명'],
            ['대표', '김하린'],
            ['기록', '대기'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] bg-[#f3f4ef] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#747F89]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#202B36]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">동의 상태</p>
        <div className="grid grid-cols-3 gap-2">
          {consentStates.map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-[#E1E6EA] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#747F89]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-normal leading-5 text-[#6F7780]">
          동의 일시 2026.06.02 18:40 · 철회 요청 시 리포트 공유를 보류합니다.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6F7780]">오늘 이어볼 관찰</p>
        <div className="space-y-2">
          {['오른발 접지', '내쉬는 호흡의 길이', '골반 정렬과 햄스트링 긴장'].map(
            (item) => (
              <div
                key={item}
                className="flex items-center justify-between border-b border-[#E1E6EA] py-3"
              >
                <span className="text-sm font-semibold text-[#26303A]">{item}</span>
                <span className="text-xs text-[#737F8A]">지난 기록</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">오늘의 기록 초점</p>
            <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
              녹음 전 강사가 남길 의도를 고르면 AI 위키가 오늘 수업과 관련된 기록만 좁혀 봅니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2F5F8F]">
            초점
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {recordingFocusOptions.map(([label, value]) => (
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
        <p className="text-xs font-semibold text-[#5F7690]">최근 인바디 참고 지표</p>
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

      <button
        className="h-13 w-full rounded-[6px] bg-[#174A7C] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D5F99]"
        type="button"
        onClick={onStart}
      >
        수업 기록 시작
      </button>
    </div>
  )
}

function RecordingScreen({
  seconds,
  paused,
  onTogglePause,
  onFinish,
}: {
  seconds: number
  paused: boolean
  onTogglePause: () => void
  onFinish: () => void
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">기록 권한</p>
        <p className="mt-2 text-sm font-normal leading-6 text-[#252D34]">
          강사만 기록을 시작합니다. 수련생의 무단 녹음은 허용하지 않습니다.
        </p>
      </section>

      <section className="text-center">
        <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-[#c7d8cc] bg-[#edf5ef]">
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#174A7C] text-white shadow-xl shadow-[#c7d8cc]">
            <p className="text-xs font-semibold text-[#cce4d4]">
              {paused ? '제외 구간 표시' : '음성 입력 안정적'}
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">
              {formatTimer(seconds)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex h-24 items-end justify-between gap-1 rounded-[8px] bg-[#f3f4ef] px-4 py-5">
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              className={[
                'w-1.5 rounded-full transition-all duration-300',
                paused ? 'bg-[#C8CED6]' : 'bg-[#3B7FB1]',
              ].join(' ')}
              style={{
                height: `${18 + ((index * 17 + seconds * 3) % 54)}px`,
                opacity: paused ? 0.45 : 0.75 + ((index % 4) * 0.05),
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[8px] bg-[#f3f4ef] p-3">
            <p className="text-[11px] font-semibold text-[#747F89]">원본 음성</p>
            <p className="mt-1 text-sm font-semibold text-[#202B36]">기본 비공개</p>
          </div>
          <div className="rounded-[8px] bg-[#f3f4ef] p-3">
            <p className="text-[11px] font-semibold text-[#747F89]">공유 방식</p>
            <p className="mt-1 text-sm font-semibold text-[#202B36]">검수 후 발행</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          className={[
            'h-12 rounded-[6px] text-sm font-semibold transition',
            paused
              ? 'bg-[#eadcc7] text-[#6e4b1d] hover:bg-[#e3cfaf]'
              : 'bg-[#f3f4ef] text-[#303A45] hover:bg-[#e8ebe4]',
          ].join(' ')}
          type="button"
          onClick={onTogglePause}
        >
          {paused ? '기록 재개' : '민감 대화 제외'}
        </button>
        <button
          className="h-12 rounded-[6px] bg-[#174A7C] text-sm font-semibold text-white hover:bg-[#1D5F99]"
          type="button"
          onClick={onFinish}
        >
          AI 초안 만들기
        </button>
      </div>
    </div>
  )
}

function ReviewScreen({
  items,
  focusViewMode,
  published,
  onChangeFocusViewMode,
  onChangeStatus,
  onPublish,
}: {
  items: ReviewItem[]
  focusViewMode: FocusViewMode
  published: boolean
  onChangeFocusViewMode: (mode: FocusViewMode) => void
  onChangeStatus: (id: string, status: ReviewStatus) => void
  onPublish: () => void
}) {
  const shareableCount = items.filter((item) => item.status === 'shareable').length
  const holdCount = items.filter((item) => item.status === 'hold').length
  const draftCount = items.filter((item) => item.status === 'draft').length
  const shareableItems = items.filter((item) => item.status === 'shareable')
  const canPublish = shareableCount > 0

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-[8px] bg-[#E8F1FA] p-3">
          <p className="text-[11px] font-semibold text-[#537464]">공유 확정</p>
          <p className="mt-1 text-2xl font-semibold text-[#1F3F5B]">{shareableCount}</p>
        </div>
        <div className="rounded-[8px] bg-[#f8edd9] p-3">
          <p className="text-[11px] font-semibold text-[#8a6a3b]">확인 필요</p>
          <p className="mt-1 text-2xl font-semibold text-[#6e4b1d]">{holdCount}</p>
        </div>
        <div className="rounded-[8px] bg-[#f3f4ef] p-3">
          <p className="text-[11px] font-semibold text-[#747D86]">검토 대기</p>
          <p className="mt-1 text-2xl font-semibold text-[#1F2933]">{draftCount}</p>
        </div>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">AI 제안</p>
        <p className="mt-2 text-sm font-normal leading-6 text-[#252D34]">
          AI는 원본을 곧바로 공유하지 않고, 수업 초점에 맞는 metadata와 공유 범위를 제안만 합니다.
          수련생 리포트에는 강사가 확정한 항목만 발행됩니다.
        </p>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">이번 초안에 참조된 AI 위키</p>
            <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
              오늘 선택한 수업과 수련생에 연결된 지식 소스만 좁혀 초안 근거로 사용합니다.
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
        onChangeStatus={onChangeStatus}
      />

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6F7780]">수련생 공유 미리보기</p>
        {shareableItems.length > 0 ? (
          <p className="mt-2 text-sm font-semibold leading-6 text-[#252D34]">
            {shareableItems[0].text}
          </p>
        ) : (
          <p className="mt-2 text-sm font-normal leading-6 text-[#6c716b]">
            공유 가능으로 검수된 문장이 있을 때만 리포트에 표시됩니다.
          </p>
        )}
      </section>

      <button
        className={[
          'h-13 w-full rounded-[6px] text-sm font-semibold transition',
          canPublish
            ? 'bg-[#174A7C] text-white hover:bg-[#1D5F99]'
            : 'cursor-not-allowed bg-[#d9ded7] text-[#747D86]',
        ].join(' ')}
        type="button"
        disabled={!canPublish}
        onClick={onPublish}
      >
        {canPublish
          ? published
            ? '수련생 리포트 다시 발행'
            : '수련생 리포트 발행'
          : '공유 항목을 확정하세요'}
      </button>
    </div>
  )
}

function ReportScreen({
  shareableItems,
  published,
  onGoReview,
  onOpenStudent,
}: {
  shareableItems: ReviewItem[]
  published: boolean
  onGoReview: () => void
  onOpenStudent: () => void
}) {
  if (!published) {
    return (
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase text-[#6F7780]">수련생 리포트</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
            아직 발행되지 않았습니다.
          </h2>
        </section>

        <section className="rounded-[8px] bg-[#f8edd9] p-4">
          <p className="text-xs font-semibold text-[#8a6a3b]">발행 대기</p>
          <p className="mt-2 text-sm font-normal leading-6 text-[#4f3a1c]">
            AI 초안은 자동으로 공유되지 않습니다. 강사가 공유 가능 항목을 검수하고 발행해야
            수련생 리포트가 열립니다.
          </p>
        </section>

        <button
          className="h-13 w-full rounded-[6px] bg-[#174A7C] text-sm font-semibold text-white hover:bg-[#1D5F99]"
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
      <section className="rounded-[8px] bg-[#EEF5FA] p-4 text-[#1F3F5B]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">공유 링크</p>
            <p className="mt-1 text-sm font-normal leading-6">
              발행된 리포트는 수련생용 앱에서 검수 기록만 보여줍니다.
            </p>
          </div>
          <button
            className="h-10 shrink-0 rounded-[6px] bg-[#174A7C] px-3 text-xs font-semibold text-white transition hover:bg-[#1D5F99]"
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
    </div>
  )
}

function StudentHomeScreen({
  onOpenReport,
  onOpenArchive,
  onOpenConnect,
}: {
  onOpenReport: () => void
  onOpenArchive: () => void
  onOpenConnect: () => void
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[10px] bg-[#174A7C] p-5 text-white">
        <p className="text-xs font-semibold text-[#DCEBFA]">김하린님의 momso</p>
        <h2 className="mt-2 text-[26px] font-semibold leading-tight">
          오늘 받은 리포트가 개인 아카이브에 보관됐어요.
        </h2>
        <p className="mt-3 text-sm font-normal leading-6 text-[#cfe2d7]">
          강사가 검수한 기록만 표시되고, 원본 음성과 전체 전사는 공개되지 않습니다.
        </p>
        <button
          className="mt-5 h-11 w-full rounded-[6px] bg-white text-sm font-semibold text-[#174A7C] transition hover:bg-[#edf1ed]"
          type="button"
          onClick={onOpenReport}
        >
          오늘 리포트 보기
        </button>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {studentArchiveStates.map(([label, value]) => (
          <div key={label} className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-3">
            <p className="text-[11px] font-semibold text-[#718293]">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[#1F3F5B]">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] border border-[#CFDDEA] bg-[#F7FAFD] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">공유·연결 허브</p>
            <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
              검수된 리포트만 내 AI, 개인 저장소, 요가원 피드, 읽기 API로 연결할 수 있게
              준비합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#EEF5FA] px-3 py-1.5 text-xs font-semibold text-[#2F5F8F]">
            준비
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {connectionChannels.slice(0, 4).map(([label, value]) => (
            <div key={label} className="rounded-[8px] bg-white px-3 py-3">
              <p className="text-xs font-semibold text-[#252D34]">{label}</p>
              <p className="mt-1 text-[11px] font-normal text-[#697682]">{value}</p>
            </div>
          ))}
        </div>
        <button
          className="mt-4 h-11 w-full rounded-[6px] bg-[#174A7C] text-sm font-semibold text-white transition hover:bg-[#1D5F99]"
          type="button"
          onClick={onOpenConnect}
        >
          연결 범위 확인
        </button>
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#5F7690]">다음 수업</p>
            <p className="mt-2 text-sm font-normal leading-6 text-[#1F3F5B]">
              오른발 접지와 내쉬는 호흡에서 골반 정렬을 다시 관찰합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2F5F8F]">
            06.05
          </span>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#6F7780]">최근 아카이브</p>
          <button
            className="text-xs font-semibold text-[#2F5F8F]"
            type="button"
            onClick={onOpenArchive}
          >
            모두 보기
          </button>
        </div>
        {archiveEntries.slice(0, 2).map(([date, title, detail]) => (
          <div key={`${date}-${title}`} className="border-b border-[#E1E6EA] py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#252D34]">{title}</p>
              <span className="text-xs font-semibold text-[#737F8A]">{date}</span>
            </div>
            <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{detail}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function StudentReportScreen({ reportTexts }: { reportTexts: string[] }) {
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

      <section className="rounded-[8px] bg-[#174A7C] p-4 text-white">
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
  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6F7780]">personal archive</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          검수된 수업 기록만 시간순으로 쌓입니다.
        </h2>
      </section>

      <section className="space-y-2">
        {archiveEntries.map(([date, title, detail], index) => (
          <button
            key={`${date}-${title}`}
            className="w-full border-b border-[#E1E6EA] py-4 text-left"
            type="button"
            onClick={index === 0 ? onOpenReport : undefined}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#252D34]">{title}</p>
                <p className="mt-1 text-xs font-normal leading-5 text-[#687682]">{detail}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-[#737F8A]">{date}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">보관 원칙</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#1F3F5B]">
          원본은 비공개로 남고, 강사가 공유로 확정한 문장과 수련생 감각 메모만 개인
          아카이브에 보관됩니다.
        </p>
      </section>
    </div>
  )
}

function StudentConnectScreen() {
  return (
    <div className="space-y-5">
      <section className="rounded-[10px] bg-[#174A7C] p-5 text-white">
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

function NextContextScreen() {
  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6F7780]">다음 수업 준비</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1F2933]">
          지난 기록이 다음 수업의 관찰 포인트로 돌아옵니다.
        </h2>
      </section>

      <section className="rounded-[8px] border border-[#DCE4EA] bg-[#F7FAFD] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">AI 위키 회수 루프</p>
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

      <section className="space-y-2">
        {[
          ['05.29 하타 베이직', '오른발 접지와 내쉬는 호흡 리듬'],
          ['06.01 인바디 참고', '좌우 균형과 골반 정렬 함께 관찰'],
          ['다음 수업', '골반 정렬과 햄스트링 긴장 확인'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[#E1E6EA] py-4"
          >
            <p className="text-xs font-semibold text-[#747F89]">{label}</p>
            <p className="max-w-[15rem] text-left text-sm font-semibold leading-6 text-[#252D34]">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#EEF5FA] p-4">
        <p className="text-xs font-semibold text-[#5F7690]">아카이브 상태</p>
        <p className="mt-2 text-sm font-normal leading-7 text-[#1F3F5B]">
          원본은 비공개로 남고, 검수된 기록만 개인 아카이브와 다음 수업 맥락으로 이어집니다.
        </p>
      </section>
    </div>
  )
}

export function InbodylikePrototype() {
  const [activeRole, setActiveRole] = useState<AppRole>('teacher')
  const [activeScreen, setActiveScreen] = useState<PrototypeScreen>('today')
  const [activeStudentScreen, setActiveStudentScreen] = useState<StudentScreen>('home')
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focusViewMode, setFocusViewMode] = useState<FocusViewMode>('cards')
  const [reviewItems, setReviewItems] = useState(initialReviewItems)
  const [published, setPublished] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeScreen !== 'recording' || paused) {
      return
    }

    const timerId = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [activeScreen, paused])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeRole, activeScreen, activeStudentScreen])

  const shareableItems = useMemo(
    () => reviewItems.filter((item) => item.status === 'shareable'),
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

  function handleChangeStatus(id: string, status: ReviewStatus) {
    setPublished(false)
    setReviewItems((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  function handlePublish() {
    setPublished(true)
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

        <section className="min-h-screen w-full bg-[#FBFCFF] shadow-2xl shadow-[#C9D3DF] md:h-[calc(100vh-1rem)] md:min-h-0 md:w-[26rem] md:overflow-hidden md:rounded-[28px]">
          <div className="flex min-h-screen flex-col md:h-full md:min-h-0">
            <header
              className={[
                'border-b px-5 pb-4 pt-5 transition-colors',
                activeRole === 'student'
                  ? 'border-[#2E638F] bg-[#174A7C] text-white'
                  : 'border-[#E1E6EA] bg-[#FBFCFF] text-[#1F2933]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4">
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
              </div>
            </header>

            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-6">
              {activeRole === 'teacher' && activeScreen === 'today' && (
                <TodayScreen onStart={() => setActiveScreen('recording')} />
              )}
              {activeRole === 'teacher' && activeScreen === 'recording' && (
                <RecordingScreen
                  seconds={seconds}
                  paused={paused}
                  onTogglePause={() => setPaused((current) => !current)}
                  onFinish={() => setActiveScreen('review')}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'review' && (
                <ReviewScreen
                  items={reviewItems}
                  focusViewMode={focusViewMode}
                  published={published}
                  onChangeFocusViewMode={setFocusViewMode}
                  onChangeStatus={handleChangeStatus}
                  onPublish={handlePublish}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'report' && (
                <ReportScreen
                  shareableItems={shareableItems}
                  published={published}
                  onGoReview={() => setActiveScreen('review')}
                  onOpenStudent={handleOpenStudentReport}
                />
              )}
              {activeRole === 'teacher' && activeScreen === 'next' && <NextContextScreen />}
              {activeRole === 'student' && activeStudentScreen === 'home' && (
                <StudentHomeScreen
                  onOpenReport={() => setActiveStudentScreen('report')}
                  onOpenArchive={() => setActiveStudentScreen('archive')}
                  onOpenConnect={() => setActiveStudentScreen('connect')}
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
            </div>

            <nav
              className={[
                'shrink-0 border-t px-2 py-2 backdrop-blur md:rounded-b-[28px]',
                activeRole === 'student'
                  ? 'border-[#2E638F] bg-[#174A7C]/95'
                  : 'border-[#DDE3E8] bg-[#FBFCFF]/95',
              ].join(' ')}
            >
              <div className="flex gap-1">
                {activeRole === 'teacher'
                  ? teacherScreenLabels.map((screen) => (
                      <NavButton
                        key={screen.id}
                        screen={screen}
                        activeScreen={activeScreen}
                        onSelect={setActiveScreen}
                      />
                    ))
                  : studentScreenLabels.map((screen) => (
                      <NavButton
                        key={screen.id}
                        screen={screen}
                        activeScreen={activeStudentScreen}
                        onSelect={setActiveStudentScreen}
                        tone="student"
                      />
                    ))}
              </div>
            </nav>
          </div>
        </section>
      </div>
    </main>
  )
}
