'use client'

import type { VoteSummary } from '@/types/vote'

interface VoteCardProps {
  vote: VoteSummary
  onSelect: (voteId: number) => void
}

export default function VoteCard({ vote, onSelect }: VoteCardProps) {
  const deadlineDate = new Date(Number(vote.deadline) * 1000).toLocaleString()
  const isEnded = Date.now() > Number(vote.deadline) * 1000

  return (
    <article className="vote-card" onClick={() => onSelect(vote.id)}>
      <div className="vote-card-top">
        <span className="category-pill">{vote.category}</span>

        <div className="pill-group">
          <span className={isEnded ? 'ended-pill' : 'active-pill'}>
            {isEnded ? '종료됨' : '진행 중'}
          </span>

          <span className={vote.isPrivate ? 'private-pill' : 'public-pill'}>
            {vote.isPrivate ? '비공개' : '공개'}
          </span>
        </div>
      </div>

      <h3>{vote.title}</h3>
      <p>{vote.description}</p>

      <div className="vote-meta">
        <span>항목 {vote.optionCount.toString()}개</span>
        <span>
          {vote.showResultImmediately ? '실시간 공개' : '종료 후 공개'}
        </span>
      </div>

      <div className="vote-deadline">마감: {deadlineDate}</div>
    </article>
  )
}
