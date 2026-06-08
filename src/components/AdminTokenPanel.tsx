'use client'

import { useState } from 'react'
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

export default function AdminTokenPanel() {
  const { address, isConnected } = useAccount()

  const [userAddress, setUserAddress] = useState('')
  const [amount, setAmount] = useState('100')

  const { data: owner } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'owner',
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const isOwner =
    isConnected && owner && address?.toLowerCase() === owner.toLowerCase()

  if (!isOwner) {
    return null
  }

  const handleGrant = () => {
    if (!userAddress.trim()) {
      alert('사용자 주소를 입력해주세요.')
      return
    }

    if (Number(amount) <= 0) {
      alert('토큰 수량은 1 이상이어야 합니다.')
      return
    }

    writeContract({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'grantTokens',
      args: [userAddress as `0x${string}`, BigInt(amount)],
    })
  }

  const handleRemove = () => {
    if (!userAddress.trim()) {
      alert('사용자 주소를 입력해주세요.')
      return
    }

    if (Number(amount) <= 0) {
      alert('토큰 수량은 1 이상이어야 합니다.')
      return
    }

    writeContract({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'removeTokens',
      args: [userAddress as `0x${string}`, BigInt(amount)],
    })
  }

  return (
    <section>
      <h2>관리자 토큰 관리</h2>
      <p>배포자 계정만 사용자에게 토큰을 지급하거나 회수할 수 있습니다.</p>

      <div>
        <label>사용자 지갑 주소</label>
        <input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div>
        <label>토큰 수량</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="admin-button-row">
        <button
          type="button"
          onClick={handleGrant}
          disabled={isPending || isConfirming}
        >
          토큰 지급
        </button>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending || isConfirming}
        >
          토큰 회수
        </button>
      </div>

      {isPending && <p>MetaMask에서 요청을 확인해주세요.</p>}
      {isConfirming && <p>블록체인에 반영 중입니다...</p>}
      {isConfirmed && (
        <p className="success-message">토큰 관리 작업이 완료되었습니다.</p>
      )}
      {error && <p className="error-message">토큰 관리 작업에 실패했습니다.</p>}
    </section>
  )
}
