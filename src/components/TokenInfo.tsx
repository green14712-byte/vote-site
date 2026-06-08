'use client'

import { useAccount, useReadContract } from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function TokenInfo() {
  const { address, isConnected } = useAccount()

  const { data: balance } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'tokenBalance',
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
      <strong>{balance?.toString() ?? '0'} VT</strong>
    </div>
  )
}
