import { useEffect, useMemo, useRef, useState } from 'react'

type PrototypeScreen = 'today' | 'recording' | 'review' | 'report' | 'next'

type ReviewStatus = 'draft' | 'shareable' | 'internal' | 'hold' | 'excluded'

type ReviewItem = {
  id: string
  text: string
  detail: string
  status: ReviewStatus
  suggestedStatus: ReviewStatus
  needsTermReview?: boolean
}

const screenLabels: Array<{ id: PrototypeScreen; label: string }> = [
  { id: 'today', label: '수업' },
  { id: 'recording', label: '녹음' },
  { id: 'review', label: '검수' },
  { id: 'report', label: '리포트' },
  { id: 'next', label: '다음' },
]

const statusLabels: Record<ReviewStatus, string> = {
  draft: '검토',
  shareable: '공유',
  internal: '내부',
  hold: '보류',
  excluded: '제외',
}

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

const initialReviewItems: ReviewItem[] = [
  {
    id: 'grounding',
    text: '오른발 접지와 내쉬는 호흡에서 골반 정렬을 함께 확인했습니다.',
    detail: '개인 리포트에 포함',
    status: 'draft',
    suggestedStatus: 'shareable',
  },
  {
    id: 'privacy',
    text: '수업 전 개인 상담에서 나온 피로 원인은 공유 전 확인이 필요합니다.',
    detail: '민감 대화',
    status: 'draft',
    suggestedStatus: 'hold',
  },
  {
    id: 'asana-term',
    text: '파스치모타나사나 진입 전 햄스트링 긴장을 낮추는 큐가 필요했습니다.',
    detail: '요가 용어',
    status: 'draft',
    suggestedStatus: 'hold',
    needsTermReview: true,
  },
  {
    id: 'sequence',
    text: 'TTC 수준의 시퀀스 설명과 지도자 노하우는 내부 기록으로 유지합니다.',
    detail: '지도자 노하우',
    status: 'draft',
    suggestedStatus: 'internal',
  },
  {
    id: 'other-student',
    text: '다른 수련생 이름이 언급된 문장은 리포트에서 제외합니다.',
    detail: '타인 정보',
    status: 'draft',
    suggestedStatus: 'excluded',
  },
]

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}

function topLabel(screen: PrototypeScreen) {
  if (screen === 'recording') return '보호 녹음 중'
  if (screen === 'review') return '발행 전 검수'
  if (screen === 'report') return '공유 미리보기'
  if (screen === 'next') return '다음 수업 준비'
  return '오늘의 수업'
}

function NavButton({
  screen,
  activeScreen,
  onSelect,
}: {
  screen: { id: PrototypeScreen; label: string }
  activeScreen: PrototypeScreen
  onSelect: (screen: PrototypeScreen) => void
}) {
  const isActive = activeScreen === screen.id

  return (
    <button
      className={[
        'flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[6px] text-xs font-semibold transition',
        isActive ? 'bg-[#163f38] text-white' : 'text-[#6c716b] hover:bg-[#edf1ed]',
      ].join(' ')}
      type="button"
      onClick={() => onSelect(screen.id)}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-[#d9f0db]' : 'bg-[#bdc7bd]',
        ].join(' ')}
      />
      {screen.label}
    </button>
  )
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const styleByStatus: Record<ReviewStatus, string> = {
    draft: 'border-[#9aa19a] bg-[#f3f4ef] text-[#626960]',
    shareable: 'border-[#2f725e] bg-[#e6f2ec] text-[#245746]',
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

function TodayScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#6f766f]">BigBlue Yoga</p>
            <h2 className="mt-1 text-[28px] font-semibold leading-tight text-[#1f2620]">
              하타 베이직
            </h2>
          </div>
          <span className="rounded-full bg-[#e9f0ea] px-3 py-1.5 text-xs font-semibold text-[#27483c]">
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
              <p className="text-[11px] font-semibold text-[#767c73]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#202720]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6f766f]">동의 상태</p>
        <div className="grid grid-cols-3 gap-2">
          {consentStates.map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-[#e4e6de] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#767c73]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f4236]">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-semibold leading-5 text-[#747b72]">
          동의 일시 2026.06.02 18:40 · 철회 요청 시 리포트 공유를 보류합니다.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6f766f]">오늘 이어볼 관찰</p>
        <div className="space-y-2">
          {['오른발 접지', '내쉬는 호흡의 길이', '골반 정렬과 햄스트링 긴장'].map(
            (item) => (
              <div
                key={item}
                className="flex items-center justify-between border-b border-[#e4e6de] py-3"
              >
                <span className="text-sm font-semibold text-[#262d27]">{item}</span>
                <span className="text-xs text-[#7a8078]">지난 기록</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[8px] bg-[#eef5f1] p-4">
        <p className="text-xs font-semibold text-[#527164]">최근 인바디 참고 지표</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {inbodyReferenceMetrics.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#6f7e76]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f4236]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#d5e2da] pt-3 text-[11px] font-semibold leading-5 text-[#65756c]">
          {inbodyDisclaimer}
        </p>
      </section>

      <button
        className="h-13 w-full rounded-[6px] bg-[#163f38] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d5148]"
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
        <p className="text-xs font-semibold text-[#6f766f]">기록 권한</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#252c26]">
          강사만 기록을 시작합니다. 수련생의 무단 녹음은 허용하지 않습니다.
        </p>
      </section>

      <section className="text-center">
        <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-[#c7d8cc] bg-[#edf5ef]">
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#163f38] text-white shadow-xl shadow-[#c7d8cc]">
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
                paused ? 'bg-[#c9cbc5]' : 'bg-[#3c7a65]',
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
            <p className="text-[11px] font-semibold text-[#757b72]">원본 음성</p>
            <p className="mt-1 text-sm font-semibold text-[#202720]">기본 비공개</p>
          </div>
          <div className="rounded-[8px] bg-[#f3f4ef] p-3">
            <p className="text-[11px] font-semibold text-[#757b72]">공유 방식</p>
            <p className="mt-1 text-sm font-semibold text-[#202720]">검수 후 발행</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          className={[
            'h-12 rounded-[6px] text-sm font-semibold transition',
            paused
              ? 'bg-[#eadcc7] text-[#6e4b1d] hover:bg-[#e3cfaf]'
              : 'bg-[#f3f4ef] text-[#30372f] hover:bg-[#e8ebe4]',
          ].join(' ')}
          type="button"
          onClick={onTogglePause}
        >
          {paused ? '기록 재개' : '민감 대화 제외'}
        </button>
        <button
          className="h-12 rounded-[6px] bg-[#163f38] text-sm font-semibold text-white hover:bg-[#1d5148]"
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
  published,
  onChangeStatus,
  onPublish,
}: {
  items: ReviewItem[]
  published: boolean
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
        <div className="rounded-[8px] bg-[#e8f2ec] p-3">
          <p className="text-[11px] font-semibold text-[#537464]">공유 확정</p>
          <p className="mt-1 text-2xl font-semibold text-[#1f4236]">{shareableCount}</p>
        </div>
        <div className="rounded-[8px] bg-[#f8edd9] p-3">
          <p className="text-[11px] font-semibold text-[#8a6a3b]">확인 필요</p>
          <p className="mt-1 text-2xl font-semibold text-[#6e4b1d]">{holdCount}</p>
        </div>
        <div className="rounded-[8px] bg-[#f3f4ef] p-3">
          <p className="text-[11px] font-semibold text-[#747b72]">검토 대기</p>
          <p className="mt-1 text-2xl font-semibold text-[#1f2620]">{draftCount}</p>
        </div>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6f766f]">AI 제안</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#252c26]">
          AI는 공유 범위를 제안만 합니다. 수련생 리포트에는 강사가 확정한 항목만 발행됩니다.
        </p>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="border-b border-[#e4e6de] pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#767c73]">{item.detail}</p>
                  <span className="rounded-full border border-[#cfd5cc] bg-[#f8faf5] px-2 py-0.5 text-[10px] font-semibold text-[#5f6a60]">
                    AI 제안: {statusLabels[item.suggestedStatus]}
                  </span>
                  {item.needsTermReview && (
                    <span className="rounded-full border border-[#a27637] bg-[#f8edd9] px-2 py-0.5 text-[10px] font-semibold text-[#6e4b1d]">
                      요가 용어 확인 필요
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#242b25]">
                  {item.text}
                </p>
              </div>
              <StatusPill status={item.status} />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {(['shareable', 'internal', 'hold', 'excluded'] as ReviewStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    className={[
                      'h-8 rounded-[5px] text-[11px] font-semibold transition',
                      item.status === status
                        ? 'bg-[#163f38] text-white'
                        : 'bg-[#f3f4ef] text-[#626960] hover:bg-[#e8ebe4]',
                    ].join(' ')}
                    type="button"
                    onClick={() => onChangeStatus(item.id, status)}
                  >
                    {statusLabels[status]}
                  </button>
                ),
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6f766f]">수련생 공유 미리보기</p>
        {shareableItems.length > 0 ? (
          <p className="mt-2 text-sm font-semibold leading-6 text-[#252c26]">
            {shareableItems[0].text}
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6c716b]">
            공유 가능으로 검수된 문장이 있을 때만 리포트에 표시됩니다.
          </p>
        )}
      </section>

      <button
        className={[
          'h-13 w-full rounded-[6px] text-sm font-semibold transition',
          canPublish
            ? 'bg-[#163f38] text-white hover:bg-[#1d5148]'
            : 'cursor-not-allowed bg-[#d9ded7] text-[#747b72]',
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
}: {
  shareableItems: ReviewItem[]
  published: boolean
  onGoReview: () => void
}) {
  if (!published) {
    return (
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase text-[#6f766f]">수련생 리포트</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1f2620]">
            아직 발행되지 않았습니다.
          </h2>
        </section>

        <section className="rounded-[8px] bg-[#f8edd9] p-4">
          <p className="text-xs font-semibold text-[#8a6a3b]">발행 대기</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#4f3a1c]">
            AI 초안은 자동으로 공유되지 않습니다. 강사가 공유 가능 항목을 검수하고 발행해야
            수련생 리포트가 열립니다.
          </p>
        </section>

        <button
          className="h-13 w-full rounded-[6px] bg-[#163f38] text-sm font-semibold text-white hover:bg-[#1d5148]"
          type="button"
          onClick={onGoReview}
        >
          검수 화면으로 이동
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6f766f]">김하린 수련 기록</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1f2620]">
          오늘은 접지와 호흡 리듬을 함께 관찰한 수업으로 기록됐어요.
        </h2>
      </section>

      <section className="rounded-[8px] border border-[#dbe3da] bg-[#f7faf5] p-4">
        <p className="text-xs font-semibold text-[#527164]">내 기록 보관</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {studentArchiveStates.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-[#768177]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f4236]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[8px] bg-[#eef5f1] p-4">
        <p className="text-xs font-semibold text-[#527164]">인바디 참고 지표</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {inbodyReferenceMetrics.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#6f7e76]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f4236]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#d5e2da] pt-3 text-[11px] font-semibold leading-5 text-[#65756c]">
          {inbodyDisclaimer}
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-[#6f766f]">강사가 공유한 기록</p>
        {shareableItems.length > 0 ? (
          shareableItems.map((item) => (
            <p
              key={item.id}
              className="border-b border-[#e4e6de] pb-3 text-sm font-semibold leading-6 text-[#252c26]"
            >
              {item.text}
            </p>
          ))
        ) : (
          <p className="rounded-[8px] bg-[#f3f4ef] p-4 text-sm font-semibold text-[#6c716b]">
            아직 공유 후보가 없습니다.
          </p>
        )}
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6f766f]">수련생 감각 메모</p>
        <p className="mt-1 text-[11px] font-semibold text-[#7b827a]">
          수업 후 수련생이 남긴 감각을 강사가 확인한 기록
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#252c26]">
          오른발 엄지 아래쪽에 무게가 더 잘 실렸고, 내쉬는 호흡에서 허벅지 뒤쪽 긴장이 조금
          줄었다고 기록했습니다.
        </p>
      </section>

      <section className="rounded-[8px] bg-[#f3f4ef] p-4">
        <p className="text-xs font-semibold text-[#6f766f]">다음 수업에서 이어볼 것</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#252c26]">
          내쉬는 호흡에서 골반 정렬을 천천히 확인하고, 오른발 접지가 무너지지
          않는지 다시 살펴봅니다.
        </p>
      </section>
    </div>
  )
}

function NextContextScreen() {
  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase text-[#6f766f]">다음 수업 준비</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-[#1f2620]">
          지난 기록이 다음 수업의 관찰 포인트로 돌아옵니다.
        </h2>
      </section>

      <section className="space-y-2">
        {[
          ['05.29 하타 베이직', '오른발 접지와 내쉬는 호흡 리듬'],
          ['06.01 인바디 참고', '좌우 균형과 골반 정렬 함께 관찰'],
          ['다음 수업', '골반 정렬과 햄스트링 긴장 확인'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[#e4e6de] py-4"
          >
            <p className="text-xs font-semibold text-[#767c73]">{label}</p>
            <p className="max-w-[12rem] text-right text-sm font-semibold leading-6 text-[#252c26]">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] bg-[#eef5f1] p-4">
        <p className="text-xs font-semibold text-[#527164]">아카이브 상태</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#1f4236]">
          원본은 비공개로 남고, 검수된 기록만 개인 아카이브와 다음 수업 맥락으로 이어집니다.
        </p>
      </section>
    </div>
  )
}

export function InbodylikePrototype() {
  const [activeScreen, setActiveScreen] = useState<PrototypeScreen>('today')
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
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
  }, [activeScreen])

  const shareableItems = useMemo(
    () => reviewItems.filter((item) => item.status === 'shareable'),
    [reviewItems],
  )

  function handleChangeStatus(id: string, status: ReviewStatus) {
    setPublished(false)
    setReviewItems((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  function handlePublish() {
    setPublished(true)
    setActiveScreen('report')
  }

  return (
    <main className="min-h-screen bg-[#e5e8e1] text-[#202720]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-stretch justify-center gap-10 px-0 py-0 md:px-8 md:py-2">
        <aside className="hidden w-[21rem] flex-col justify-between py-10 md:flex">
          <div>
            <p className="text-xs font-semibold uppercase text-[#6f766f]">momso prototype</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.04] text-[#18231f]">
              수업 기록을 검수된 개인 리포트로.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#596159]">
              관리자용 기록 계층을 먼저 만들고, 수련생에게는 검수된 기록만 안전하게 연결합니다.
            </p>
          </div>

          <div className="space-y-4 border-t border-[#cfd5cc] pt-6">
            <div>
              <p className="text-xs font-semibold text-[#747b72]">P0 흐름</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2620]">
                수업 선택 / 보호 녹음 / AI 검수 / 리포트 발행
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#747b72]">공유 원칙</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2620]">
                원본 비공개, 자동 발송 금지, 강사 검수 우선
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#747b72]">PoC 확장</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2620]">
                개인 아카이브 / API 연결 / 관계 기반 공유
              </p>
            </div>
          </div>
        </aside>

        <section className="min-h-screen w-full bg-[#fbfbf7] shadow-2xl shadow-[#c9d0c5] md:h-[calc(100vh-1rem)] md:min-h-0 md:w-[26rem] md:overflow-hidden md:rounded-[28px]">
          <div className="flex min-h-screen flex-col md:h-full md:min-h-0">
            <header className="border-b border-[#e4e6de] px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#6f766f]">momso</p>
                  <h1 className="mt-1 text-xl font-semibold text-[#1f2620]">
                    {topLabel(activeScreen)}
                  </h1>
                </div>
                <span className="rounded-full bg-[#edf1ed] px-3 py-1.5 text-xs font-semibold text-[#526052]">
                  데모
                </span>
              </div>
              <div className="mt-4 space-y-2 md:hidden">
                <p className="text-sm font-semibold leading-6 text-[#263128]">
                  수업 기록을 검수된 개인 리포트로.
                </p>
                <p className="text-[11px] font-semibold leading-5 text-[#697169]">
                  수업 선택 / 보호 녹음 / AI 초안 / 강사 검수 / 리포트 발행
                </p>
              </div>
            </header>

            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-6">
              {activeScreen === 'today' && (
                <TodayScreen onStart={() => setActiveScreen('recording')} />
              )}
              {activeScreen === 'recording' && (
                <RecordingScreen
                  seconds={seconds}
                  paused={paused}
                  onTogglePause={() => setPaused((current) => !current)}
                  onFinish={() => setActiveScreen('review')}
                />
              )}
              {activeScreen === 'review' && (
                <ReviewScreen
                  items={reviewItems}
                  published={published}
                  onChangeStatus={handleChangeStatus}
                  onPublish={handlePublish}
                />
              )}
              {activeScreen === 'report' && (
                <ReportScreen
                  shareableItems={shareableItems}
                  published={published}
                  onGoReview={() => setActiveScreen('review')}
                />
              )}
              {activeScreen === 'next' && <NextContextScreen />}
            </div>

            <nav className="shrink-0 border-t border-[#e0e3da] bg-[#fbfbf7]/95 px-2 py-2 backdrop-blur md:rounded-b-[28px]">
              <div className="flex gap-1">
                {screenLabels.map((screen) => (
                  <NavButton
                    key={screen.id}
                    screen={screen}
                    activeScreen={activeScreen}
                    onSelect={setActiveScreen}
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
