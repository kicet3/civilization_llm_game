import React, { useState, useCallback } from "react";
import { useGameState } from "../globalGameState";
import CitySummary from "./CitySummary";
import CityProduction from "./CityProduction";
import CityPopulation from "./CityPopulation";
import CityBuildings from "./CityBuildings";
import CityDefense from "./CityDefense";
import CityBorder from "./CityBorder";
import gameService, { City as GameCity } from "@/services/gameService";
import Toast from "../ui/Toast";

interface CityManagementPanelProps {
  cities: GameCity[];
  onProductionSelect?: (cityId: number, item: string) => void;
}

export default function CityManagementPanel({ 
  cities, 
  onProductionSelect 
}: CityManagementPanelProps) {
  // 선택된 도시 상태
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    cities.length > 0 ? cities[0].id : null
  );

  // 토스트 메시지 상태
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });

  // 전역 게임 상태에서 도시 관련 함수 가져오기
  const applySpecialization = useGameState(state => state.specializeCityFocus);

  // 선택된 도시 찾기
  const selectedCity = cities.find((city) => city.id === selectedCityId);

  // 도시 특화 설정 핸들러
  const handleCitySpecialization = useCallback(async (cityId: number, spec: string) => {
    try {
      await gameService.specializeCityFocus(cityId, spec);
      applySpecialization(spec);
      
      showToast(`${spec} 특화 설정 완료`, 'success');
    } catch (error) {
      showToast('특화 설정 실패', 'error');
    }
  }, [applySpecialization]);

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  // 도시 생산 선택 핸들러
  const handleProductionSelect = useCallback(async (cityId: number, item: string) => {
    try {
      if (onProductionSelect) {
        onProductionSelect(cityId, item);
      } else {
        await gameService.setCityProduction(cityId, item);
        showToast(`${item} 생산 시작`, 'success');
      }
    } catch (error) {
      showToast('생산 설정 실패', 'error');
    }
  }, [onProductionSelect]);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* 토스트 메시지 */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* 도시 목록 */}
      <div className="w-full md:w-1/4">
        <h3 className="text-xl font-bold mb-4">도시 목록</h3>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {cities.map((city) => (
            <button
              key={city.id}
              className={`w-full text-left p-2 rounded transition-all ${
                selectedCityId === city.id 
                  ? "bg-blue-700" 
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => setSelectedCityId(city.id)}
            >
              {city.name} 
              <span className="ml-2 text-xs text-gray-300">
                (인구: {city.population})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 도시 세부 정보 */}
      <div className="flex-1">
        {selectedCity ? (
          <div className="space-y-4">
            <CitySummary 
              city={selectedCity} 
              onSpecializationSelect={(spec) => handleCitySpecialization(selectedCity.id, spec)}
            />
            <CityProduction 
              city={selectedCity} 
              onProductionSelect={(item) => handleProductionSelect(selectedCity.id, item)}
            />
            <CityPopulation city={selectedCity} />
            <CityBuildings city={selectedCity} />
            <CityDefense city={selectedCity} />
            <CityBorder city={selectedCity} />
          </div>
        ) : (
          <div className="p-4 text-gray-400 text-center">
            도시를 선택하세요.
          </div>
        )}
      </div>
    </div>
  );
}