'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>연결된 지갑: {address}</p>
        <button onClick={() => disconnect()}>지갑 연결 해제</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.uid} onClick={() => connect({ connector })}>
          {connector.name} 연결
        </button>
      ))}
    </div>
  )
}
