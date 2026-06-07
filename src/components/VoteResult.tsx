'use client'

import { useReadContract } from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'

interface VoteResultProps {
  voteId: number
  options: readonly string[]
}

export default function VoteResult({ voteId, options }: VoteResultProps) {
  const { data: canViewResults, isLoading: isCanViewLoading } = useReadContract(
    {
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'canViewResults',
      args: [BigInt(voteId)],
    },
  )

  const { data: counts, isLoading: isCountsLoading } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'getCounts',
    args: [BigInt(voteId)],
    query: {
      enabled: canViewResults === true,
    },
  })

  if (isCanViewLoading || isCountsLoading) {
    return <p>결과 불러오는 중...</p>
  }

  if (!canViewResults) {
    return <p>이 투표는 종료 후 결과가 공개됩니다.</p>
  }

  if (!counts) {
    return <p>득표수 정보가 없습니다.</p>
  }

  return (
    <section>
      <h3>투표 결과</h3>

      {options.map((option, index) => (
        <div key={index}>
          <span>{option}</span>
          <strong> {counts[index]?.toString() ?? '0'}표</strong>
        </div>
      ))}
    </section>
  )
}
