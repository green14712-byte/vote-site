'use client'

import { formatUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { VOTE_TOKEN_ABI, VOTE_TOKEN_ADDRESS } from '@/contracts/VoteToken'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function TokenInfo() {
  const { address, isConnected } = useAccount()

  const { data: balance } = useReadContract({
    address: VOTE_TOKEN_ADDRESS,
    abi: VOTE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: isConnected,
      refetchInterval: 3000,
    },
  })

  if (!isConnected) {
    return null
  }

  return (
    <div className="token-box">
      <span>내 토큰</span>
      <strong>{balance ? formatUnits(balance, 18) : '0'} VT</strong>
    </div>
  )
}
