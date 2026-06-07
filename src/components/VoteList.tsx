'use client'

import { useMemo, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'
import type { VoteSummary } from '@/types/vote'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import VoteCard from './VoteCard'

interface VoteListProps {
  onSelectVote: (voteId: number) => void
}

export default function VoteList({ onSelectVote }: VoteListProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const { data: voteIdsData, isLoading: isVoteIdsLoading } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'getAllVoteIds',
  })

  const voteIds = useMemo(() => {
    if (!voteIdsData) return []
    return [...voteIdsData]
  }, [voteIdsData])

  const contracts = useMemo(() => {
    return voteIds.map((voteId) => ({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'getVoteSummary',
      args: [voteId],
    }))
  }, [voteIds])

  const { data: voteSummariesData, isLoading: isSummariesLoading } =
    useReadContracts({
      contracts,
      query: {
        enabled: voteIds.length > 0,
      },
    })

  const votes = useMemo<VoteSummary[]>(() => {
    if (!voteSummariesData) return []

    const resultVotes: VoteSummary[] = []

    voteSummariesData.forEach((result, index) => {
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

      resultVotes.push({
        id: Number(voteIds[index]),
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

    return resultVotes
  }, [voteSummariesData, voteIds])

  const categories = useMemo(() => {
    return Array.from(new Set(votes.map((vote) => vote.category)))
  }, [votes])

  const filteredVotes = useMemo(() => {
    return votes.filter((vote) => {
      if (vote.deleted) return false

      const keyword = searchKeyword.toLowerCase()

      const matchesSearch =
        vote.title.toLowerCase().includes(keyword) ||
        vote.description.toLowerCase().includes(keyword) ||
        vote.category.toLowerCase().includes(keyword)

      const matchesCategory =
        selectedCategory === '' || vote.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [votes, searchKeyword, selectedCategory])

  if (isVoteIdsLoading || isSummariesLoading) {
    return <p>투표 목록 불러오는 중...</p>
  }

  return (
    <section>
      <h2>투표 목록</h2>

      <SearchBar
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <CategoryFilter
        selectedCategory={selectedCategory}
        categories={categories}
        onCategoryChange={setSelectedCategory}
      />

      {filteredVotes.length === 0 ? (
        <p>표시할 투표가 없습니다.</p>
      ) : (
        filteredVotes.map((vote) => (
          <VoteCard key={vote.id} vote={vote} onSelect={onSelectVote} />
        ))
      )}
    </section>
  )
}
