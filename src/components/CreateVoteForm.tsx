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

const CATEGORIES = [
  '학교',
  '게임',
  '스포츠',
  '연예',
  '정치/사회',
  '기술/IT',
  '기타',
]

const CREATE_VOTE_COST = 100n
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function CreateVoteForm() {
  const { address, isConnected } = useAccount()

  const { data: tokenBalance } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'tokenBalance',
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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [durationMinutes, setDurationMinutes] = useState('1')
  const [showResultImmediately, setShowResultImmediately] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')

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

  const handleCreateVote = () => {
    if (!isConnected) {
      alert('먼저 지갑을 연결해주세요.')
      return
    }

    if ((tokenBalance ?? 0n) < CREATE_VOTE_COST) {
      alert(
        '투표를 만들려면 100토큰이 필요합니다. 운영자에게 토큰을 요청하세요.',
      )
      return
    }

    if (!title.trim()) {
      alert('투표 제목을 입력해주세요.')
      return
    }

    if (!description.trim()) {
      alert('투표 설명을 입력해주세요.')
      return
    }

    if (!category) {
      alert('카테고리를 선택해주세요.')
      return
    }

    const cleanedOptions = options.map((option) => option.trim())

    if (cleanedOptions.some((option) => option === '')) {
      alert('빈 투표 항목이 있습니다.')
      return
    }

    if (Number(durationMinutes) < 1) {
      alert('투표 기간은 최소 1분 이상이어야 합니다.')
      return
    }

    if (isPrivate && !password.trim()) {
      alert('비공개 투표는 비밀번호가 필요합니다.')
      return
    }

    writeContract({
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

  return (
    <section>
      <h2>투표 만들기</h2>
      <p>
        투표를 생성하려면 <strong>100 VT</strong>가 필요합니다. 투표에 참여하면{' '}
        <strong>10 VT</strong>를 보상으로 받을 수 있습니다.
      </p>

      <p className="token-notice">
        현재 보유 토큰: {tokenBalance?.toString() ?? '0'} VT
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

      <button
        type="button"
        onClick={handleCreateVote}
        disabled={isPending || isConfirming}
      >
        {isPending
          ? '지갑 확인 중...'
          : isConfirming
            ? '등록 확인 중...'
            : '투표 생성'}
      </button>

      {isPending && <p>MetaMask에서 투표 생성 요청을 확인해주세요.</p>}
      {isConfirming && <p>블록체인에 투표를 등록하는 중입니다...</p>}
      {isConfirmed && (
        <p className="success-message">투표가 성공적으로 생성되었습니다.</p>
      )}
      {error && <p className="error-message">투표 생성에 실패했습니다.</p>}
    </section>
  )
}
