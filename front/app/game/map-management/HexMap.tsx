import React, { useEffect, useState } from 'react';
import { gameService } from '../../services/GameService';
import { showToast } from '../../utils/ToastUtils';

const HexMap: React.FC = () => {
  const [gameId, setGameId] = useState('');
  const [mapData, setMapData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 맵 데이터 로드 - 페이지 렌더링 후 로드
  useEffect(() => {
    let isMounted = true;

    // 렌더링이 완료된 후 맵 데이터를 로드하기 위해 requestAnimationFrame 사용
    const loadMapDelayed = () => {
      window.requestAnimationFrame(() => {
        const loadMapData = async () => {
          try {
            if (!isMounted) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
              // 맵 데이터 로드 (gameService는 내부적으로 fallback 맵을 제공함)
              const result = await gameService.getMap();
              
              if (!isMounted) return;
              
              // 결과 확인
              if (result && Array.isArray(result.hexagons) && result.hexagons.length > 0) {
                setMapData(result.hexagons);
                setIsLoading(false);
                showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
              } else {
                // 유효하지 않은 맵 데이터인 경우 fallback 사용
                throw new Error('서버에서 유효한 맵 데이터를 받지 못했습니다');
              }
            } catch (apiError) {
              console.error('맵 API 호출 오류:', apiError);
              
              // 간단한 로컬 fallback 맵 데이터 생성
              const fallbackMapData = Array.from({ length: 36 }, (_, index) => {
                const r = Math.floor(index / 6);
                const q = index % 6;
                const s = -q - r;
                
                // 중심에서의 거리 계산 (내륙 바다 스타일)
                const distance = Math.max(
                  Math.abs(q - 2),
                  Math.abs(r - 2),
                  Math.abs(s - (-2 - 2))
                );
                
                // 중심은 바다, 주변은 육지로 설정
                const terrain = distance <= 1 ? 'ocean' : 'plains';
                
                // 플레이어 시작 위치 설정
                const isPlayerStart = q === 4 && r === 1;
                
                return {
                  q, r, s,
                  terrain,
                  explored: true,
                  visible: true,
                  resource: Math.random() > 0.8 ? 'wheat' : undefined,
                  unit_id: isPlayerStart ? 'player_settler_1' : undefined,
                  city_id: undefined,
                  occupant: isPlayerStart ? 'Korea' : undefined,
                  unit_type: isPlayerStart ? 'settler' : undefined
                };
              });
              
              if (!isMounted) return;
              
              setMapData(fallbackMapData);
              setError('맵 데이터 로드 실패 - 기본 맵으로 대체합니다');
              setIsLoading(false);
              showToast("오류가 발생했습니다. 기본 맵으로 대체합니다.", "warning");
            }
          } catch (err) {
            if (!isMounted) return;
            
            console.error('맵 로딩 과정 중 치명적 오류:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
            setIsLoading(false);
            showToast("맵을 로드할 수 없습니다.", "error");
          }
        };

        loadMapData();
      });
    };

    // 초기 로드 시 딜레이 추가하여 렌더링이 완료된 후 맵 데이터 로드
    setTimeout(loadMapDelayed, 100);

    return () => {
      isMounted = false;
    };
  }, [gameId]);
  
  // 맵 데이터 새로고침 함수
  const handleRefreshMap = () => {
    setIsLoading(true);
    setError(null);
    
    // 렌더링이 완료된 후 맵 데이터를 로드하기 위해 requestAnimationFrame 사용
    window.requestAnimationFrame(async () => {
      try {
        // 맵 데이터 로드 (gameService는 내부적으로 fallback 맵을 제공함)
        const result = await gameService.getMap();
        
        // 결과 확인
        if (result && Array.isArray(result.hexagons) && result.hexagons.length > 0) {
          setMapData(result.hexagons);
          setIsLoading(false);
          showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
        } else {
          // 유효하지 않은 맵 데이터인 경우
          throw new Error('서버에서 유효한 맵 데이터를 받지 못했습니다');
        }
      } catch (err) {
        console.error('맵 새로고침 오류:', err);
        
        setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
        setIsLoading(false);
        showToast("맵 데이터 로드에 실패했습니다. 다시 시도해주세요.", "error");
      }
    });
  };

  return (
    <div>
      {/* 맵 데이터 로드 및 새로고침 함수 호출을 위한 컨트롤 */}
    </div>
  );
};

export default HexMap; 