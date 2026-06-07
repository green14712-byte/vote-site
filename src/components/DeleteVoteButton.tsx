'use client'

import { useAccount, useWriteContract } from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'

interface DeleteVoteButtonProps {
  voteId: number
  creator: string
}

export default function DeleteVoteButton({
  voteId,
  creator,
}: DeleteVoteButtonProps) {
  const { address } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  const isCreator = address?.toLowerCase() === creator.toLowerCase()

  if (!isCreator) {
    return null
  }

  const handleDelete = () => {
    const ok = confirm('정말 이 투표를 삭제하시겠습니까?')

    if (!ok) return

    writeContract({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'deleteVote',
      args: [BigInt(voteId)],
    })
  }

  return (
    <button type="button" onClick={handleDelete} disabled={isPending}>
      {isPending ? '삭제 중...' : '투표 삭제'}
    </button>
  )
}
