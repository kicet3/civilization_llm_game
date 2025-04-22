import { create } from 'zustand';
import { 
  GameState, 
  HexTile, 
  Unit, 
  City, 
  Position, 
  Technology,
  Building,
  ResourceProduction,
  UnitType,
  NpcDialog,
  GameEvent,
} from './types';
import { 
  mockGameState, 
  generateHexMap, 
  mockUnits, 
  mockCities,
  mockTechnologies,
  mockBuildings,
  mockUnitTypes,
  mockNpcDialogs,
  mockEvents
} from './mockData';
import { getNeighbors, isSamePosition, getRelationshipStatus } from './utils';

interface GameStore extends GameState {
  // Map state
  hexMap: HexTile[];
  selectedTile: HexTile | null;
  
  // Units, cities and technologies
  units: Unit[];
  cities: City[];
  technologies: Technology[];
  buildings: Building[];
  unitTypes: UnitType[];
  
  // NPC and Events
  npcs: NpcDialog[];
  events: GameEvent[];
  
  // Actions
  selectTile: (tile: HexTile | null) => void;
  moveUnit: (unitId: number, destination: Position) => void;
  buildCity: (position: Position, name: string) => void;
  constructBuilding: (cityId: number, buildingId: string) => void;
  researchTechnology: (techId: string) => void;
  trainUnit: (cityId: number, unitTypeId: string) => void;
  
  // 도시 관련 액션
  updateCity: (cityId: number, updates: Partial<City>) => void;
  updateCityWorkforce: (cityId: number, workforce: { 
    food?: number;
    production?: number;
    science?: number;
    gold?: number;
    culture?: number;
  }) => void;
  updateCityProduction: (cityId: number, productionId: string) => void;
  cancelProduction: (cityId: number) => void;
  
  // 외교 관련 액션
  updateDiplomacyRelationship: (nationId: number, change: number) => void;
  
  // 턴 종료
  endTurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initialize with mock data
  ...mockGameState,
  hexMap: generateHexMap(),
  selectedTile: null,
  units: mockUnits,
  cities: mockCities,
  technologies: mockTechnologies,
  buildings: mockBuildings,
  unitTypes: mockUnitTypes,
  npcs: mockNpcDialogs,
  events: mockEvents,
  
  // Select a tile on the map
  selectTile: (tile) => set({ selectedTile: tile }),
  
  // Move unit to a new position
  moveUnit: (unitId, destination) => {
    const { units, hexMap } = get();
    const unitIndex = units.findIndex(unit => unit.id === unitId);
    
    if (unitIndex === -1) return; // Unit not found
    
    const unit = units[unitIndex];
    const distance = Math.max(
      Math.abs(unit.position.q - destination.q),
      Math.abs(unit.position.r - destination.r)
    );
    
    // Check if the move is valid (within movement range)
    if (distance > unit.movement) return;
    
    // Check if destination is valid (not water for land units, etc)
    const destTile = hexMap.find(tile => tile.q === destination.q && tile.r === destination.r);
    if (!destTile || (unit.type === 'military' && destTile.terrain === 'water')) return;
    
    // Update the unit position
    const updatedUnits = [...units];
    updatedUnits[unitIndex] = {
      ...unit,
      position: destination,
      movementLeft: unit.movementLeft ? unit.movementLeft - distance : 0,
    };
    
    // 이동한 타일에 유닛이 있음을 표시
    const updatedHexMap = hexMap.map(tile => {
      if (tile.q === destination.q && tile.r === destination.r) {
        return { ...tile, hasUnit: true };
      }
      if (tile.q === unit.position.q && tile.r === unit.position.r) {
        // 기존 위치에서는 유닛 제거 (다른 유닛이 없다고 가정)
        return { ...tile, hasUnit: false };
      }
      return tile;
    });
    
    set({ units: updatedUnits, hexMap: updatedHexMap });
  },
  
  // Build a new city
  buildCity: (position, name) => {
    const { cities, units, hexMap, playerInfo } = get();
    
    // Check if there's a settler at this position
    const settlerIndex = units.findIndex(unit => 
      unit.type === 'civilian' && 
      unit.name === '정착민' && 
      isSamePosition(unit.position, position)
    );
    
    if (settlerIndex === -1) return; // No settler found
    
    // Check if the position is valid for city building
    const tile = hexMap.find(t => t.q === position.q && t.r === position.r);
    if (!tile || tile.terrain === 'water' || tile.hasCity) return;
    
    // Check if player has enough resources
    if (playerInfo.gold < 50) return; // Not enough gold
    
    // Create the new city
    const newCity: City = {
      id: Date.now(), // Simple unique ID
      name,
      owner: 'player',
      population: 1,
      buildings: [],
      position,
      foodProduction: 2,
      productionPoints: 0,
      currentProduction: null,
      food: 0,
      foodToGrow: 10,
      health: 100,
      happiness: 90,
      workforce: {
        food: 1,
        production: 0,
        science: 0,
        gold: 0,
        culture: 0
      },
      borderGrowth: 0,
      borderGrowthRequired: 100,
      cityRadius: 1,
      workingTiles: [position]
    };
    
    // Remove the settler
    const updatedUnits = units.filter((_, index) => index !== settlerIndex);
    
    // Update the tile to have a city
    const updatedHexMap = hexMap.map(t => 
      t.q === position.q && t.r === position.r
        ? { ...t, hasCity: true, owner: 'player' }
        : t
    );
    
    // Update tiles around the city as owned by player
    const cityNeighbors = getNeighbors(position);
    const finalHexMap = updatedHexMap.map(t => {
      if (cityNeighbors.some(n => n.q === t.q && n.r === t.r)) {
        return { ...t, owner: 'player' };
      }
      return t;
    });
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold - 50,
    };
    
    set({ 
      cities: [...cities, newCity],
      units: updatedUnits,
      hexMap: finalHexMap,
      playerInfo: updatedPlayerInfo,
    });
  },
  
  // Construct a building in a city
  constructBuilding: (cityId, buildingId) => {
    const { cities, buildings, playerInfo } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return; // Building not found
    
    const city = cities[cityIndex];
    
    // Check if building already exists in the city
    if (city.buildings.includes(buildingId)) return;
    
    // Check if player has enough resources
    if (playerInfo.gold < building.goldCost) return;
    if (playerInfo.resources.wood < (building.woodCost || 0)) return;
    if (playerInfo.resources.iron < (building.ironCost || 0)) return;
    
    // Update city buildings
    const updatedCities = [...cities];
    updatedCities[cityIndex] = {
      ...city,
      buildings: [...city.buildings, buildingId],
    };
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold - building.goldCost,
      resources: {
        ...playerInfo.resources,
        wood: playerInfo.resources.wood - (building.woodCost || 0),
        iron: playerInfo.resources.iron - (building.ironCost || 0),
      }
    };
    
    set({ 
      cities: updatedCities,
      playerInfo: updatedPlayerInfo,
    });
  },
  
  // Research a technology
  researchTechnology: (techId) => {
    const { technologies, playerInfo } = get();
    const techIndex = technologies.findIndex(tech => tech.id === techId);
    
    if (techIndex === -1) return; // Technology not found
    
    const tech = technologies[techIndex];
    
    // Check if tech is already researched
    if (tech.researched) return;
    
    // Check prerequisites
    if (tech.prerequisites.some(prereq => {
      const prereqTech = technologies.find(t => t.id === prereq);
      return !prereqTech || !prereqTech.researched;
    })) return; // Prerequisites not met
    
    // Check if player has enough science points
    if (playerInfo.science < tech.cost) return;
    
    // Update technology status
    const updatedTechnologies = [...technologies];
    updatedTechnologies[techIndex] = {
      ...tech,
      researched: true,
    };
    
    // Update player science points
    const updatedPlayerInfo = {
      ...playerInfo,
      science: playerInfo.science - tech.cost,
    };
    
    set({ 
      technologies: updatedTechnologies,
      playerInfo: updatedPlayerInfo,
    });
  },
  
  // Train a new unit in a city
  trainUnit: (cityId, unitTypeId) => {
    const { cities, units, unitTypes, playerInfo } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const unitType = unitTypes.find(ut => ut.id === unitTypeId);
    if (!unitType) return; // Unit type not found
    
    const city = cities[cityIndex];
    
    // Check if player has enough resources
    if (playerInfo.gold < unitType.goldCost) return;
    if (playerInfo.resources.iron < (unitType.ironCost || 0)) return;
    
    // Create the new unit
    const newUnit: Unit = {
      id: Date.now(), // Simple unique ID
      name: unitType.name,
      type: unitType.category,
      strength: unitType.strength || 0,
      movement: unitType.movement,
      movementLeft: unitType.movement,
      position: { ...city.position },
      owner: "player",
      level: 1,
      experience: 0,
      abilities: unitType.abilities,
      visionRange: 2
    };
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold - unitType.goldCost,
      resources: {
        ...playerInfo.resources,
        iron: playerInfo.resources.iron - (unitType.ironCost || 0),
      }
    };
    
    // Update hexMap to show unit
    const updatedHexMap = get().hexMap.map(tile => {
      if (tile.q === city.position.q && tile.r === city.position.r) {
        return { ...tile, hasUnit: true };
      }
      return tile;
    });
    
    set({ 
      units: [...units, newUnit],
      playerInfo: updatedPlayerInfo,
      hexMap: updatedHexMap
    });
  },
  
  // 도시 정보 업데이트
  updateCity: (cityId, updates) => {
    const { cities } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const updatedCities = [...cities];
    updatedCities[cityIndex] = {
      ...updatedCities[cityIndex],
      ...updates
    };
    
    set({ cities: updatedCities });
  },
  
  // 도시 시민 배치 업데이트
  updateCityWorkforce: (cityId, workforce) => {
    const { cities } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const city = cities[cityIndex];
    
    const updatedCities = [...cities];
    updatedCities[cityIndex] = {
      ...city,
      workforce: {
        ...city.workforce,
        ...workforce
      }
    };
    
    set({ cities: updatedCities });
  },
  
  // 도시 생산 아이템 업데이트
  updateCityProduction: (cityId, productionId) => {
    const { cities } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const city = cities[cityIndex];
    
    // 생산 아이템 변경 및 생산 포인트 초기화
    const updatedCities = [...cities];
    updatedCities[cityIndex] = {
      ...city,
      currentProduction: productionId,
      productionPoints: 0
    };
    
    set({ cities: updatedCities });
  },
  
  // 생산 취소
  cancelProduction: (cityId) => {
    const { cities } = get();
    const cityIndex = cities.findIndex(city => city.id === cityId);
    
    if (cityIndex === -1) return; // City not found
    
    const city = cities[cityIndex];
    
    // 생산 취소 및 생산 포인트 초기화
    const updatedCities = [...cities];
    updatedCities[cityIndex] = {
      ...city,
      currentProduction: null,
      productionPoints: 0
    };
    
    set({ cities: updatedCities });
  },
  
  // 외교 관계 업데이트
  updateDiplomacyRelationship: (nationId, change) => {
    const { diplomacy } = get();
    const nationIndex = diplomacy.findIndex(nation => nation.nationId === nationId);
    
    if (nationIndex === -1) return; // Nation not found
    
    const nation = diplomacy[nationIndex];
    const newRelationship = Math.min(100, Math.max(-100, nation.relationship + change));
    
    const updatedDiplomacy = [...diplomacy];
    updatedDiplomacy[nationIndex] = {
      ...nation,
      relationship: newRelationship,
      status: getRelationshipStatus(newRelationship)
    };
    
    set({ diplomacy: updatedDiplomacy });
  },
  
  // End the current turn and process game state updates
  endTurn: () => {
    const { turn, year, playerInfo, cities, units, hexMap, diplomacy } = get();
    
    // Calculate resource production from cities
    let foodProduction = 0;
    let woodProduction = 0;
    let ironProduction = 0;
    let scienceProduction = 0;
    let goldProduction = 0;
    let cultureProduction = 0;
    
    // 업데이트된 도시 배열
    const updatedCities = [...cities].map(city => {
      if (city.owner === 'player') {
        // 도시 생산량 계산
        let cityFoodProduction = 0;
        let cityProductionPoints = 0;
        let cityScienceProduction = 0;
        let cityGoldProduction = 0;
        let cityCultureProduction = 0;
        
        // 기본 생산량
        cityFoodProduction += city.population * 2;
        cityProductionPoints += city.population;
        cityScienceProduction += city.population;
        cityGoldProduction += city.population * 2;
        
        // 시민 배치에 따른 추가 생산량
        if (city.workforce) {
          cityFoodProduction += city.workforce.food ? city.workforce.food * 2 : 0;
          cityProductionPoints += city.workforce.production ? city.workforce.production * 2 : 0;
          cityScienceProduction += city.workforce.science ? city.workforce.science * 3 : 0;
          cityGoldProduction += city.workforce.gold ? city.workforce.gold * 3 : 0;
          cityCultureProduction += city.workforce.culture ? city.workforce.culture * 2 : 0;
        }
        
        // 건물 추가 생산량
        city.buildings.forEach(buildingId => {
          const building = get().buildings.find(b => b.id === buildingId);
          if (building) {
            cityFoodProduction += building.foodBonus || 0;
            cityProductionPoints += building.productionBonus || 0;
            cityScienceProduction += building.scienceBonus || 0;
            cityGoldProduction += building.goldBonus || 0;
            cityCultureProduction += building.cultureBonus || 0;
          }
        });
        
        // 글로벌 생산량에 추가
        foodProduction += cityFoodProduction;
        woodProduction += cityProductionPoints / 2; // 생산력의 일부는 목재 생산으로 가정
        scienceProduction += cityScienceProduction;
        goldProduction += cityGoldProduction;
        cultureProduction += cityCultureProduction;
        
        // 도시 식량 및 성장 업데이트
        let newFood = (city.food || 0) + cityFoodProduction;
        let newPopulation = city.population;
        let newFoodToGrow = city.foodToGrow || 10;
        
        // 인구 성장 체크
        if (newFood >= newFoodToGrow) {
          newPopulation += 1;
          newFood -= newFoodToGrow;
          newFoodToGrow = 10 + (newPopulation * 5); // 인구가 많을수록 더 많은 식량 필요
        }
        
        // 영토 확장 체크
        let newBorderGrowth = (city.borderGrowth || 0) + cityCultureProduction;
        let newBorderGrowthRequired = city.borderGrowthRequired || 100;
        let newCityRadius = city.cityRadius || 1;
        
        if (newBorderGrowth >= newBorderGrowthRequired) {
          newCityRadius += 1;
          newBorderGrowth -= newBorderGrowthRequired;
          newBorderGrowthRequired = 100 + (newCityRadius * 50); // 영토가 클수록 확장에 더 많은 문화 필요
        }
        
        // 생산 진행
        let newProductionPoints = city.productionPoints || 0;
        if (city.currentProduction) {
          newProductionPoints += cityProductionPoints;
          
          // 생산 완료 체크
          const buildingProduction = get().buildings.find(b => b.id === city.currentProduction);
          const unitProduction = get().unitTypes.find(u => u.id === city.currentProduction);
          
          const productionCost = buildingProduction 
            ? buildingProduction.productionCost || 30
            : unitProduction 
              ? unitProduction.goldCost
              : 0;
          
          if (newProductionPoints >= productionCost) {
            // 생산 완료
            if (buildingProduction) {
              // 건물 완성
              return {
                ...city,
                food: newFood,
                foodToGrow: newFoodToGrow,
                population: newPopulation,
                borderGrowth: newBorderGrowth,
                borderGrowthRequired: newBorderGrowthRequired,
                cityRadius: newCityRadius,
                productionPoints: 0,
                currentProduction: null,
                buildings: [...city.buildings, city.currentProduction]
              };
            } else if (unitProduction) {
              // 유닛 생산 완료 - 게임 스토어에서 별도로 처리
              // (trainUnit 함수를 여기서 직접 호출할 수 없으므로 외부에서 처리)
              return {
                ...city,
                food: newFood,
                foodToGrow: newFoodToGrow,
                population: newPopulation,
                borderGrowth: newBorderGrowth,
                borderGrowthRequired: newBorderGrowthRequired,
                cityRadius: newCityRadius,
                productionPoints: 0,
                currentProduction: null
              };
            }
          }
        }
        
        // 일반 업데이트
        return {
          ...city,
          food: newFood,
          foodToGrow: newFoodToGrow,
          population: newPopulation,
          borderGrowth: newBorderGrowth,
          borderGrowthRequired: newBorderGrowthRequired,
          cityRadius: newCityRadius,
          productionPoints: newProductionPoints
        };
      }
      
      return city;
    });
    
    // 유닛 생산 처리
    const citiesToProduceUnits = cities.filter(city => 
      city.owner === 'player' && 
      city.currentProduction && 
      get().unitTypes.some(ut => ut.id === city.currentProduction) &&
      (city.productionPoints || 0) >= (
        get().unitTypes.find(ut => ut.id === city.currentProduction)?.goldCost || 0
      )
    );
    
    // 각 도시에서 유닛 생산
    citiesToProduceUnits.forEach(city => {
      const unitTypeId = city.currentProduction!;
      const unitType = get().unitTypes.find(ut => ut.id === unitTypeId);
      
      if (unitType) {
        const newUnit: Unit = {
          id: Date.now() + Math.floor(Math.random() * 1000), // Unique ID
          name: unitType.name,
          type: unitType.category,
          strength: unitType.strength || 0,
          movement: unitType.movement,
          movementLeft: unitType.movement,
          position: { ...city.position },
          owner: "player",
          level: 1,
          experience: 0,
          abilities: unitType.abilities,
          visionRange: 2
        };
        
        units.push(newUnit);
        
        // 해당 타일에 유닛 표시
        const tileIndex = hexMap.findIndex(t => t.q === city.position.q && t.r === city.position.r);
        if (tileIndex !== -1) {
          hexMap[tileIndex] = {
            ...hexMap[tileIndex],
            hasUnit: true
          };
        }
      }
    });
    
    // 외교 관계 자연 변화
    const updatedDiplomacy = diplomacy.map(relation => {
      let change = 0;
      
      // 랜덤 요소 추가 (현실적인 외교 관계 변화를 위해)
      if (Math.random() < 0.3) { // 30% 확률로 관계 변화
        change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1 중 하나
        
        // 관계가 이미 매우 좋거나 나쁘면 평균으로 회귀하는 경향
        if (relation.relationship > 80) change -= 1;
        else if (relation.relationship < -80) change += 1;
      }
      
      const newRelationship = Math.min(100, Math.max(-100, relation.relationship + change));
      
      return {
        ...relation,
        relationship: newRelationship,
        status: getRelationshipStatus(newRelationship)
      };
    });
    
    // Reset unit movement for next turn
    const updatedUnits = units.map(unit => ({
      ...unit,
      movementLeft: unit.movement,
    }));
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold + goldProduction,
      science: playerInfo.science + scienceProduction,
      culture: playerInfo.culture + cultureProduction,
      resources: {
        food: playerInfo.resources.food + foodProduction,
        wood: playerInfo.resources.wood + woodProduction,
        iron: playerInfo.resources.iron + ironProduction,
      }
    };
    
    // Increment turn counter
    const newTurn = turn + 1;
    
    // Update year every 5 turns (for example)
    let newYear = year;
    if (newTurn % 5 === 0) {
      // Extract the year number and check if it's BC or AD
      const yearMatch = year.match(/([0-9]+)년/);
      const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 400;
      
      if (year.includes('기원전')) {
        const newYearNumber = yearNumber - 50;
        if (newYearNumber <= 0) {
          newYear = '서기 1년';
        } else {
          newYear = `기원전 ${newYearNumber}년`;
        }
      } else {
        const newYearNumber = yearNumber + 50;
        newYear = `서기 ${newYearNumber}년`;
      }
    }
    
    set({
      turn: newTurn,
      year: newYear,
      playerInfo: updatedPlayerInfo,
      units: updatedUnits,
      cities: updatedCities,
      diplomacy: updatedDiplomacy
    });
  },
}));