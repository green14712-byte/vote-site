'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'
import type { VoteSummary } from '@/types/vote'
import VoteCard from './VoteCard'

interface MyVotesProps {
  onSelectVote: (voteId: number) => void
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function MyVotes({ onSelectVote }: MyVotesProps) {
  const { address, isConnected } = useAccount()

  const { data: myVoteIdsData, isLoading: isIdsLoading } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'getCreatorVoteIds',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: isConnected,
    },
  })

  const myVoteIds = useMemo(() => {
    if (!myVoteIdsData) return []
    return [...myVoteIdsData]
  }, [myVoteIdsData])

  const contracts = useMemo(() => {
    return myVoteIds.map((voteId) => ({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'getVoteSummary',
      args: [voteId],
    }))
  }, [myVoteIds])

  const { data: summariesData, isLoading: isSummariesLoading } =
    useReadContracts({
      contracts,
      query: {
        enabled: myVoteIds.length > 0,
      },
    })

  const myVotes = useMemo<VoteSummary[]>(() => {
    if (!summariesData) return []

    const votes: VoteSummary[] = []

    summariesData.forEach((result, index) => {
      if (result.status !== 'success' || !result.result) return

      const [
        creator,
        title,
        description,
        category,
        createdAt,
        deadline,
        showResultImmediately,
        isPrivate,
        deleted,
        optionCount,
      ] = result.result as readonly [
        `0x${string}`,
        string,
        string,
        string,
        bigint,
        bigint,
        boolean,
        boolean,
        boolean,
        bigint,
      ]

      votes.push({
        id: Number(myVoteIds[index]),
        creator,
        title,
        description,
        category,
        createdAt,
        deadline,
        showResultImmediately,
        isPrivate,
        deleted,
        optionCount,
      })
    })

    return votes
  }, [summariesData, myVoteIds])

  if (!isConnected) {
    return <p>내가 만든 투표를 보려면 지갑을 연결해주세요.</p>
  }

  if (isIdsLoading || isSummariesLoading) {
    return <p>내 투표 불러오는 중...</p>
  }

  return (
    <section>
      <h2>내가 만든 투표</h2>

      {myVotes.length === 0 ? (
        <p>아직 만든 투표가 없습니다.</p>
      ) : (
        myVotes.map((vote) => (
          <VoteCard key={vote.id} vote={vote} onSelect={onSelectVote} />
        ))
      )}
    </section>
  )
}
