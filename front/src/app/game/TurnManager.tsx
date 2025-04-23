import React, { useState } from "react";
import Toast from "./ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

interface TurnManagerProps {
  children: React.ReactNode;
}

export type TurnPhase = "player" | "ai" | "resolve";

export default function TurnManager({ children }: TurnManagerProps) {
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<TurnPhase>("player");
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [log, setLog] = useState<string[]>([]);

  // Toast 메시지 상태
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  // 이펙트 상태(간단한 예시: 도시 성장/유닛 진급 등)
  const [effect, setEffect] = useState<string | null>(null);

  // Toast 메시지 노출 함수
  function showToast(message: string, duration = 2000) {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), duration);
  }

  // 실제 서버가 없으므로, 모의 async 처리
  async function endTurn() {
    setPhase("resolve");
    showToast(`턴 ${turn} 종료! AI 처리 중...`, 1500);
    setLog(l => [...l, `턴 ${turn} 종료: AI 처리 중...`]);
    // 1초 후 AI 처리 결과 반환 (모의)
    await new Promise(res => setTimeout(res, 1000));
    const aiEvents = [
      `AI 문명${turn % 2 + 1}이 도시를 확장했습니다!`,
      `도시국가${turn % 3 + 1}가 우호적 행동을 했습니다.`
    ];
    setPendingActions(aiEvents);
    setLog(l => [...l, ...aiEvents]);
    // 주요 이벤트에 이펙트 및 Toast 노출 예시
    setEffect("city-growth");
    showToast(aiEvents[0], 1800);
    setTimeout(() => setEffect(null), 1200);
    setTurn(t => t + 1);
    setPhase("player");
  }

  return (
    <div>
      {/* Toast 메시지 상단 노출 */}
      <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      {/* Framer Motion을 활용한 간단한 효과 예시 */}
      <AnimatePresence>
        {effect === "city-growth" && (
          <motion.div
            key="city-growth"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 text-yellow-200 text-3xl font-bold drop-shadow-lg z-[9998] pointer-events-none"
          >
            도시 성장!
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-2">현재 턴: {turn} / Phase: {phase}</div>
      <button onClick={endTurn} disabled={phase !== "player"} className="mb-2 bg-indigo-700 px-3 py-1 rounded text-white">턴 종료</button>
      {children}
      <div className="mt-4 bg-slate-800 p-2 rounded text-xs">
        <div className="font-bold mb-1">[턴 이벤트 로그]</div>
        {log.slice(-8).map((entry, idx) => <div key={idx}>{entry}</div>)}
      </div>
    </div>
  );
}
