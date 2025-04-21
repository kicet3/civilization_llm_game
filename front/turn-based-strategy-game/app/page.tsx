'use client'

import dynamic from 'next/dynamic'

// GameInterface 컴포넌트를 클라이언트 사이드에서만 로드
const GameInterface = dynamic(() => import('@/components/GameInterface'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-2xl">게임 로딩 중...</div>
    </div>
  )
})

export default function Home() {
  return (
    <main className="h-screen">
      <GameInterface />
    </main>
  )
}