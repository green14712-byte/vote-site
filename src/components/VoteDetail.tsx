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
import VoteResult from './VoteResult'
import DeleteVoteButton from './DeleteVoteButton'

interface VoteDetailProps {
  voteId: number
  onBack: () => void
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function VoteDetail({ voteId, onBack }: VoteDetailProps) {
  const { address, isConnected } = useAccount()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  )
  const [password, setPassword] = useState('')
  const [enteredPassword, setEnteredPassword] = useState('')
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const { data: summary } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'getVoteSummary',
    args: [BigInt(voteId)],
  })

  const { data: options } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'getOptions',
    args: [BigInt(voteId)],
  })

  const { data: active } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'isVoteActive',
    args: [BigInt(voteId)],
  })

  const { data: alreadyVoted } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'hasVoted',
    args: [BigInt(voteId), address ?? ZERO_ADDRESS],
    query: {
      enabled: isConnected,
    },
  })

  const { data: passwordCheckResult, refetch: checkPassword } = useReadContract(
    {
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'checkPassword',
      args: [BigInt(voteId), enteredPassword],
      query: {
        enabled: false,
      },
    },
  )

  if (!summary || !options) {
    return <p>투표 정보를 불러오는 중...</p>
  }

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
  ] = summary

  const deadlineDate = new Date(Number(deadline) * 1000).toLocaleString()
  const createdDate = new Date(Number(createdAt) * 1000).toLocaleString()

  const handleEnterPrivateVote = async () => {
    if (!enteredPassword.trim()) {
      setPasswordError('비밀번호를 입력해주세요.')
      return
    }

    setPasswordError('')

    const result = await checkPassword()
    const isCorrect = result.data ?? passwordCheckResult

    if (isCorrect) {
      setIsPrivateUnlocked(true)
      setPassword(enteredPassword)
      setPasswordError('')
    } else {
      setIsPrivateUnlocked(false)
      setPasswordError('비밀번호가 틀렸습니다.')
    }
  }

  const handleVote = () => {
    if (!isConnected) {
      alert('먼저 지갑을 연결해주세요.')
      return
    }

    if (deleted) {
      alert('삭제된 투표입니다.')
      return
    }

    if (!active) {
      alert('이미 종료된 투표입니다.')
      return
    }

    if (alreadyVoted) {
      alert('이미 투표했습니다.')
      return
    }

    if (isPrivate && !isPrivateUnlocked) {
      alert('비공개 투표는 비밀번호 확인 후 참여할 수 있습니다.')
      return
    }

    if (selectedOptionIndex === null) {
      alert('투표 항목을 선택해주세요.')
      return
    }

    writeContract({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'vote',
      args: [BigInt(voteId), BigInt(selectedOptionIndex), password],
    })
  }

  if (isPrivate && !isPrivateUnlocked) {
    return (
      <section className="private-gate">
        <button type="button" onClick={onBack}>
          목록으로 돌아가기
        </button>

        <div className="lock-card">
          <p className="badge">Private Vote</p>
          <h2>비공개 투표입니다</h2>
          <p>
            이 투표는 비밀번호가 필요한 비공개 투표입니다. 투표 생성자에게 받은
            비밀번호를 입력해주세요.
          </p>

          <div className="private-summary">
            <strong>{title}</strong>
            <span>{category}</span>
          </div>

          <label>비밀번호</label>
          <input
            type="password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            placeholder="비밀번호 입력"
          />

          {passwordError && <p className="error-message">{passwordError}</p>}

          <button type="button" onClick={handleEnterPrivateVote}>
            입장하기
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <button type="button" onClick={onBack}>
        목록으로 돌아가기
      </button>

      <div className="detail-head">
        <span className="category-pill">{category}</span>
        <span className={isPrivate ? 'private-pill' : 'public-pill'}>
          {isPrivate ? '비공개' : '공개'}
        </span>
        <span className={active ? 'active-pill' : 'ended-pill'}>
          {active ? '진행 중' : '종료됨'}
        </span>
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <div className="detail-grid">
        <p>
          <strong>생성자</strong>
          <br />
          {creator}
        </p>

        <p>
          <strong>생성일</strong>
          <br />
          {createdDate}
        </p>

        <p>
          <strong>마감일</strong>
          <br />
          {deadlineDate}
        </p>

        <p>
          <strong>결과 공개</strong>
          <br />
          {showResultImmediately ? '실시간 공개' : '종료 후 공개'}
        </p>
      </div>

      {deleted && <p className="error-message">삭제된 투표입니다.</p>}
      {!active && <p className="error-message">종료된 투표입니다.</p>}
      {alreadyVoted && <p>이미 투표한 투표입니다.</p>}

      <DeleteVoteButton voteId={voteId} creator={creator} />

      <hr />

      <h3>투표 항목</h3>

      <div className="option-list">
        {options.map((option, index) => (
          <label key={index} className="option-item">
            <input
              type="radio"
              name="vote-option"
              checked={selectedOptionIndex === index}
              onChange={() => setSelectedOptionIndex(index)}
              disabled={!active || deleted || alreadyVoted === true}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleVote}
        disabled={isPending || isConfirming}
      >
        {isPending
          ? '지갑 확인 중...'
          : isConfirming
            ? '투표 확인 중...'
            : '투표하기'}
      </button>

      {isPending && <p>MetaMask에서 투표 요청을 확인해주세요.</p>}
      {isConfirming && <p>블록체인에 투표를 기록하는 중입니다...</p>}
      {isConfirmed && <p className="success-message">투표가 완료되었습니다.</p>}
      {error && <p className="error-message">투표에 실패했습니다.</p>}

      <hr />

      <VoteResult voteId={voteId} options={options} />
    </section>
  )
}
