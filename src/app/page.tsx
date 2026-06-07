'use client'

import { useState } from 'react'
import WalletConnectButton from '@/components/WalletConnectButton'
import CreateVoteForm from '@/components/CreateVoteForm'
import VoteList from '@/components/VoteList'
import VoteDetail from '@/components/VoteDetail'
import MyVotes from '@/components/MyVotes'

type ViewMode = 'list' | 'create' | 'myVotes'

export default function Home() {
  const [selectedVoteId, setSelectedVoteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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

        <WalletConnectButton />
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="badge">Web3 Voting Platform</p>
          <h2>투표를 만들고, 검색하고, 안전하게 참여하세요.</h2>
          <p>
            공개/비공개 투표, 주제별 분류, 결과 공개 방식 설정까지 지원하는
            블록체인 기반 투표 서비스입니다.
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
            <strong>공개/비공개</strong>
            <span>비밀번호 기반 참여 제한</span>
          </div>
          <div>
            <strong>실시간 결과</strong>
            <span>설정에 따라 득표수 공개</span>
          </div>
          <div>
            <strong>중복 방지</strong>
            <span>지갑 주소 기준 1회 투표</span>
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
      </nav>

      <div className="container">
        {viewMode === 'list' && <VoteList onSelectVote={setSelectedVoteId} />}
        {viewMode === 'myVotes' && <MyVotes onSelectVote={setSelectedVoteId} />}
        {viewMode === 'create' && <CreateVoteForm />}
      </div>
    </main>
  )
}
