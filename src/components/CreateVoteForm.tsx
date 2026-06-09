'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'
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
import {
  CREATE_VOTE_COST,
  VOTE_TOKEN_ABI,
  VOTE_TOKEN_ADDRESS,
} from '@/contracts/VoteToken'

const CATEGORIES = [
  '학교',
  '게임',
  '스포츠',
  '연예',
  '정치/사회',
  '기술/IT',
  '음식',
  '여행',
  '기타',
]

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function CreateVoteForm() {
  const { address, isConnected } = useAccount()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [durationMinutes, setDurationMinutes] = useState('1')
  const [showResultImmediately, setShowResultImmediately] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [stepMessage, setStepMessage] = useState('')

  const { data: tokenBalance } = useReadContract({
    address: VOTE_TOKEN_ADDRESS,
    abi: VOTE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: isConnected,
      refetchInterval: 3000,
    },
  })

  const { data: allowance } = useReadContract({
    address: VOTE_TOKEN_ADDRESS,
    abi: VOTE_TOKEN_ABI,
    functionName: 'allowance',
    args: [address ?? ZERO_ADDRESS, VOTING_PLATFORM_ADDRESS],
    query: {
      enabled: isConnected,
      refetchInterval: 3000,
    },
  })

  const {
    writeContract: approveToken,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract()

  const {
    writeContract: createVote,
    data: createHash,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    })

  const { isLoading: isCreateConfirming, isSuccess: isCreateConfirmed } =
    useWaitForTransactionReceipt({
      hash: createHash,
    })

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      alert('투표 항목은 최소 2개 이상이어야 합니다.')
      return
    }

    setOptions(options.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!isConnected) {
      alert('먼저 지갑을 연결해주세요.')
      return false
    }

    if ((tokenBalance ?? 0n) < CREATE_VOTE_COST) {
      alert(
        '투표를 만들려면 100 VT가 필요합니다. 스타터 토큰을 받거나 투표에 참여해 토큰을 모아주세요.',
      )
      return false
    }

    if (!title.trim()) {
      alert('투표 제목을 입력해주세요.')
      return false
    }

    if (!description.trim()) {
      alert('투표 설명을 입력해주세요.')
      return false
    }

    if (!category) {
      alert('카테고리를 선택해주세요.')
      return false
    }

    const cleanedOptions = options.map((option) => option.trim())

    if (cleanedOptions.some((option) => option === '')) {
      alert('빈 투표 항목이 있습니다.')
      return false
    }

    if (Number(durationMinutes) < 1) {
      alert('투표 기간은 최소 1분 이상이어야 합니다.')
      return false
    }

    if (isPrivate && !password.trim()) {
      alert('비공개 투표는 비밀번호가 필요합니다.')
      return false
    }

    return true
  }

  const handleApprove = () => {
    if (!validateForm()) return

    setStepMessage(
      'ERC-20 토큰 방식이므로 먼저 VotingPlatform 컨트랙트가 100 VT를 사용할 수 있도록 승인합니다.',
    )

    approveToken({
      address: VOTE_TOKEN_ADDRESS,
      abi: VOTE_TOKEN_ABI,
      functionName: 'approve',
      args: [VOTING_PLATFORM_ADDRESS, CREATE_VOTE_COST],
    })
  }

  const handleCreateVote = () => {
    if (!validateForm()) return

    if ((allowance ?? 0n) < CREATE_VOTE_COST) {
      alert('먼저 100 VT 사용 승인을 해주세요.')
      return
    }

    const cleanedOptions = options.map((option) => option.trim())

    setStepMessage('승인이 완료되어 투표 생성 트랜잭션을 진행합니다.')

    createVote({
      address: VOTING_PLATFORM_ADDRESS,
      abi: VOTING_PLATFORM_ABI,
      functionName: 'createVote',
      args: [
        title,
        description,
        category,
        cleanedOptions,
        BigInt(durationMinutes),
        showResultImmediately,
        isPrivate,
        password,
      ],
    })
  }

  const hasEnoughAllowance = (allowance ?? 0n) >= CREATE_VOTE_COST

  const isBusy =
    isApprovePending ||
    isApproveConfirming ||
    isCreatePending ||
    isCreateConfirming

  const handleMainButtonClick = () => {
    if (hasEnoughAllowance) {
      handleCreateVote()
    } else {
      handleApprove()
    }
  }

  const goToVoteList = () => {
    window.location.reload()
  }

  return (
    <section>
      <h2>투표 만들기</h2>

      <p>
        투표를 생성하려면 <strong>100 VT</strong>가 필요합니다. 처음 생성할 때는
        토큰 사용 승인이 먼저 진행되고, 승인 후 같은 버튼으로 투표를 생성할 수
        있습니다.
      </p>

      <p className="token-notice">
        현재 보유 토큰: {tokenBalance ? formatUnits(tokenBalance, 18) : '0'} VT
      </p>

      <p className="token-notice">
        승인된 토큰: {allowance ? formatUnits(allowance, 18) : '0'} VT
      </p>

      <div>
        <label>투표 제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 학생회장 선거"
        />
      </div>

      <div>
        <label>투표 설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="투표에 대한 설명을 입력하세요."
        />
      </div>

      <div>
        <label>카테고리</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">카테고리 선택</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>투표 항목</label>

        {options.map((option, index) => (
          <div className="option-row" key={index}>
            <input
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`항목 ${index + 1}`}
            />

            <button type="button" onClick={() => removeOption(index)}>
              삭제
            </button>
          </div>
        ))}

        <button type="button" onClick={addOption}>
          항목 추가
        </button>
      </div>

      <div>
        <label>투표 기간(분)</label>
        <input
          type="number"
          min="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />
      </div>

      <div>
        <label>득표수 공개 방식</label>

        <label>
          <input
            type="radio"
            checked={showResultImmediately}
            onChange={() => setShowResultImmediately(true)}
          />
          실시간 공개
        </label>

        <label>
          <input
            type="radio"
            checked={!showResultImmediately}
            onChange={() => setShowResultImmediately(false)}
          />
          투표 종료 후 공개
        </label>
      </div>

      <div>
        <label>투표 공개 여부</label>

        <label>
          <input
            type="radio"
            checked={!isPrivate}
            onChange={() => setIsPrivate(false)}
          />
          공개 투표
        </label>

        <label>
          <input
            type="radio"
            checked={isPrivate}
            onChange={() => setIsPrivate(true)}
          />
          비공개 투표
        </label>
      </div>

      {isPrivate && (
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="투표 참여자에게 알려줄 비밀번호"
          />
        </div>
      )}

      <button type="button" onClick={handleMainButtonClick} disabled={isBusy}>
        {isApprovePending
          ? '토큰 사용 승인 요청 중...'
          : isApproveConfirming
            ? '토큰 사용 승인 확인 중...'
            : isCreatePending
              ? '투표 생성 지갑 확인 중...'
              : isCreateConfirming
                ? '투표 등록 확인 중...'
                : hasEnoughAllowance
                  ? '투표 생성하기'
                  : '투표 생성 준비하기'}
      </button>

      {stepMessage && <p>{stepMessage}</p>}

      {isApproveConfirmed && (
        <p className="success-message">
          100 VT 사용 승인이 완료되었습니다. 이제 같은 버튼으로 투표를 생성할 수
          있습니다.
        </p>
      )}

      {isCreateConfirmed && (
        <div className="success-panel">
          <p className="success-message">투표가 성공적으로 생성되었습니다.</p>
          <p>전체 투표 목록에서 방금 생성한 투표를 확인할 수 있습니다.</p>
          <button type="button" onClick={goToVoteList}>
            전체 투표 보기
          </button>
        </div>
      )}

      {approveError && (
        <p className="error-message">토큰 승인에 실패했습니다.</p>
      )}

      {createError && (
        <p className="error-message">투표 생성에 실패했습니다.</p>
      )}
    </section>
  )
}
