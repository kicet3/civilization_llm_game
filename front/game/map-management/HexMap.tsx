            // API 응답 검증
            if (!result || !result.hexagons || !Array.isArray(result.hexagons)) {
              throw new Error('유효하지 않은 맵 데이터');
            }
            
            setMapData(result.hexagons);
            setIsLoading(false);
            showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
          } catch (err) {
            if (!isMounted) return;
            
            console.error('맵 로딩 오류:', err);
            
            // 간단한 대체 맵 데이터 생성 (폴백)
            const fallbackMapData = Array.from({ length: 25 }, (_, index) => {
              const row = Math.floor(index / 5);
              const col = index % 5;
              return {
                q: col,
                r: row,
                s: -(col + row),
                terrain: 'plains',
                explored: true,
                visible: true,
              };
            });
            
            setError(err instanceof Error ? err.message : '맵 데이터 로드 실패 - 기본 맵으로 대체합니다');
            setMapData(fallbackMapData);
            setIsLoading(false);
            showToast("오류가 발생했습니다. 기본 맵으로 대체합니다.", "error"); 