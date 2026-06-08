import type { Mention, RegistryBundle, RegistryEntity } from '@momso/schema'
import { anatomyRegistry } from '@momso/schema'

export interface MentionSuggestion {
  entityId: string
  token: string
  label: string
  layerId: RegistryEntity['layerId']
  authorityGrade: RegistryEntity['authorityGrade']
  anchorId: string
  description: string
}

const mentionPattern = /@([A-Za-z0-9._-]+)/g

function normalizeMentionQuery(value: string) {
  return value.trim().replace(/^@/, '').toLowerCase()
}

export function resolveAlias(
  rawValue: string,
  registry: RegistryBundle = anatomyRegistry,
) {
  const normalized = normalizeMentionQuery(rawValue)
  return (
    registry.entities.find((entity) => {
      if (entity.id.toLowerCase() === normalized) {
        return true
      }

      return entity.aliases.some((alias) => alias.toLowerCase() === normalized)
    }) ?? null
  )
}

export function parseMentions(
  text: string,
  registry: RegistryBundle = anatomyRegistry,
): Mention[] {
  const mentions: Mention[] = []

  for (const match of text.matchAll(mentionPattern)) {
    const token = match[0]
    const query = match[1]
    const entity = resolveAlias(query, registry)

    if (!entity || typeof match.index !== 'number') {
      continue
    }

    mentions.push({
      token,
      entityId: entity.id,
      label: entity.label,
      anchorId: entity.anchorId,
      start: match.index,
      end: match.index + token.length,
    })
  }

  return mentions
}

export function getActiveMention(text: string, cursorIndex: number) {
  const safeCursorIndex = Math.max(0, Math.min(text.length, cursorIndex))
  const beforeCursor = text.slice(0, safeCursorIndex)
  const start = beforeCursor.lastIndexOf('@')

  if (start === -1) {
    return null
  }

  const query = beforeCursor.slice(start + 1)

  if (!query || /[\s\n]/.test(query)) {
    return null
  }

  return {
    start,
    end: safeCursorIndex,
    query: normalizeMentionQuery(query),
    raw: `@${query}`,
  }
}

export function replaceActiveMention(
  text: string,
  cursorIndex: number,
  suggestion: string,
) {
  const activeMention = getActiveMention(text, cursorIndex)

  if (!activeMention) {
    return {
      nextValue: text,
      nextCursorIndex: cursorIndex,
    }
  }

  const replacement = `@${suggestion} `
  const nextValue =
    text.slice(0, activeMention.start) + replacement + text.slice(activeMention.end)
  const nextCursorIndex = activeMention.start + replacement.length

  return {
    nextValue,
    nextCursorIndex,
  }
}

export function suggestMentions(
  query: string,
  registry: RegistryBundle = anatomyRegistry,
): MentionSuggestion[] {
  const normalized = normalizeMentionQuery(query)

  if (!normalized) {
    return []
  }

  return registry.entities
    .map((entity) => {
      const haystacks = [entity.id, ...entity.aliases].map((value) =>
        value.toLowerCase(),
      )
      const exactId = entity.id.toLowerCase() === normalized ? 3 : 0
      const startsWithScore = haystacks.some((value) => value.startsWith(normalized))
        ? 2
        : 0
      const includesScore = haystacks.some((value) => value.includes(normalized))
        ? 1
        : 0
      const score = exactId + startsWithScore + includesScore

      return {
        entity,
        score,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.entity.label.localeCompare(right.entity.label),
    )
    .slice(0, 6)
    .map(({ entity }) => ({
      entityId: entity.id,
      token: `@${entity.id}`,
      label: entity.label,
      layerId: entity.layerId,
      authorityGrade: entity.authorityGrade,
      anchorId: entity.anchorId,
      description: entity.description,
    }))
}
