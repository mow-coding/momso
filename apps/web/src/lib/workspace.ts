import type {
  MemoType,
  Thread,
  ThreadMemo,
  WorkspaceSnapshot,
} from '@momso/schema'

export function getMemoDraftKey(
  threadId: string,
  memoType: MemoType,
  frame: number | null,
) {
  return memoType === 'global'
    ? `${threadId}:global`
    : `${threadId}:keyframed:${frame ?? 'none'}`
}

export function findMemoForThread(
  memos: ThreadMemo[],
  threadId: string,
  memoType: MemoType,
  frame: number,
) {
  if (memoType === 'global') {
    return memos.find(
      (memo) => memo.threadId === threadId && memo.memoType === 'global',
    )
  }

  return memos.find(
    (memo) =>
      memo.threadId === threadId &&
      memo.memoType === 'keyframed' &&
      memo.frame === frame,
  )
}

export function getThreadById(
  snapshot: WorkspaceSnapshot | null,
  threadId: string | null,
) {
  if (!snapshot || !threadId) {
    return null
  }

  return snapshot.threads.find((thread) => thread.id === threadId) ?? null
}

export function getThreadsForEntity(threads: Thread[], entityId: string | null) {
  if (!entityId) {
    return []
  }

  return threads.filter((thread) => thread.targetEntityId === entityId)
}

export function sortThreads(threads: Thread[]) {
  return [...threads].sort((left, right) =>
    left.updatedAt < right.updatedAt ? 1 : -1,
  )
}
