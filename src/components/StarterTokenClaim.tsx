'use client'

import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function StarterTokenClaim() {
  const { address, isConnected } = useAccount()

  const { data: claimed } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'claimedStarterTokens',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: isConnected,
      refetchInterval: 3000,
    },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  if (!isConnected) {
    return null
  }

  const handleClaim = () => {
    writeContract({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'claimStarterTokens',
    })
  }

  return (
    <section className="token-request-card">
      <h2>스타터 토큰 받기</h2>
      <p>
        처음 이용하는 사용자는 계정당 1회에 한해 <strong>100 VT</strong>를 받을
        수 있습니다. 투표 생성에는 100 VT가 필요합니다.
      </p>

      {claimed ? (
        <p className="success-message">이미 스타터 토큰을 받았습니다.</p>
      ) : (
        <button
          type="button"
          onClick={handleClaim}
          disabled={isPending || isConfirming}
        >
          {isPending
            ? '지갑 확인 중...'
            : isConfirming
              ? '토큰 받는 중...'
              : '100 VT 받기'}
        </button>
      )}

      {isPending && <p>MetaMask에서 토큰 받기를 확인해주세요.</p>}
      {isConfirming && <p>블록체인에 토큰 지급을 기록하는 중입니다...</p>}
      {isConfirmed && <p className="success-message">100 VT를 받았습니다.</p>}
      {error && <p className="error-message">토큰 받기에 실패했습니다.</p>}
    </section>
  )
}
