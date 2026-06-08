'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import WalletConnectButton from '@/components/WalletConnectButton'
import CreateVoteForm from '@/components/CreateVoteForm'
import VoteList from '@/components/VoteList'
import VoteDetail from '@/components/VoteDetail'
import MyVotes from '@/components/MyVotes'
import TokenInfo from '@/components/TokenInfo'
import AdminTokenPanel from '@/components/AdminTokenPanel'
import StarterTokenClaim from '@/components/StarterTokenClaim'
import {
  VOTING_PLATFORM_ABI,
  VOTING_PLATFORM_ADDRESS,
} from '@/contracts/votingPlatform'

type ViewMode = 'list' | 'create' | 'myVotes' | 'admin'

export default function Home() {
  const [selectedVoteId, setSelectedVoteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const { address, isConnected } = useAccount()

  const { data: owner } = useReadContract({
    address: VOTING_PLATFORM_ADDRESS,
    abi: VOTING_PLATFORM_ABI,
    functionName: 'owner',
  })

  const isOwner =
    isConnected && owner && address?.toLowerCase() === owner.toLowerCase()

  if (selectedVoteId !== null) {
    return (
      <main className="app">
        <div className="container detail-container">
          <VoteDetail
            voteId={selectedVoteId}
            onBack={() => setSelectedVoteId(null)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <div>
            <h1 className="logo">VoteChain</h1>
            <p className="subtitle">MetaMask 기반 블록체인 투표 플랫폼</p>
          </div>
        </div>

        <div className="wallet-area">
          <TokenInfo />
          <WalletConnectButton />
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="badge">Web3 Voting Platform</p>
          <h2>투표를 만들고, 검색하고, 안전하게 참여하세요.</h2>
          <p>
            처음 이용자는 1회에 한해 100 VT를 받을 수 있고, 투표 생성에는 100
            VT가 필요합니다. 투표 참여 시에는 10 VT를 보상으로 받을 수 있습니다.
          </p>

          <div className="hero-actions">
            <button onClick={() => setViewMode('create')}>
              + 새 투표 만들기
            </button>
            <button
              className="ghost-button"
              onClick={() => setViewMode('list')}
            >
              투표 둘러보기
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <div>
            <strong>스타터 토큰</strong>
            <span>계정당 1회 100 VT 지급</span>
          </div>
          <div>
            <strong>투표 생성 비용</strong>
            <span>100 VT 사용</span>
          </div>
          <div>
            <strong>투표 참여 보상</strong>
            <span>10 VT 지급</span>
          </div>
        </div>
      </section>

      <nav className="tabbar">
        <button
          className={viewMode === 'list' ? 'tab active' : 'tab'}
          onClick={() => setViewMode('list')}
        >
          전체 투표
        </button>

        <button
          className={viewMode === 'myVotes' ? 'tab active' : 'tab'}
          onClick={() => setViewMode('myVotes')}
        >
          내 투표
        </button>

        <button
          className={viewMode === 'create' ? 'tab active' : 'tab'}
          onClick={() => setViewMode('create')}
        >
          투표 등록
        </button>

        {isOwner && (
          <button
            className={viewMode === 'admin' ? 'tab active' : 'tab'}
            onClick={() => setViewMode('admin')}
          >
            관리자
          </button>
        )}
      </nav>

      <div className="container">
        {viewMode === 'list' && <VoteList onSelectVote={setSelectedVoteId} />}
        {viewMode === 'myVotes' && <MyVotes onSelectVote={setSelectedVoteId} />}

        {viewMode === 'create' && (
          <>
            <StarterTokenClaim />
            <CreateVoteForm />
          </>
        )}

        {viewMode === 'admin' && isOwner && <AdminTokenPanel />}
      </div>
    </main>
  )
}
