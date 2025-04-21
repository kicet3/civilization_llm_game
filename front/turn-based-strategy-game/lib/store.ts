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
} from './types';
import { 
  mockGameState, 
  generateHexMap, 
  mockUnits, 
  mockCities,
  mockTechnologies,
  mockBuildings,
  mockUnitTypes,
} from './mockData';
import { getNeighbors, isSamePosition } from './utils';

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
  
  // Actions
  selectTile: (tile: HexTile | null) => void;
  moveUnit: (unitId: number, destination: Position) => void;
  buildCity: (position: Position, name: string) => void;
  constructBuilding: (cityId: number, buildingId: string) => void;
  researchTechnology: (techId: string) => void;
  trainUnit: (cityId: number, unitTypeId: string) => void;
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
      movementLeft: unit.movementLeft - distance,
    };
    
    set({ units: updatedUnits });
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
    };
    
    // Remove the settler
    const updatedUnits = units.filter((_, index) => index !== settlerIndex);
    
    // Update the tile to have a city
    const updatedHexMap = hexMap.map(t => 
      t.q === position.q && t.r === position.r
        ? { ...t, hasCity: true, owner: 'player' }
        : t
    );
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold - 50,
    };
    
    set({ 
      cities: [...cities, newCity],
      units: updatedUnits,
      hexMap: updatedHexMap,
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
    if (playerInfo.resources.wood < building.woodCost) return;
    if (playerInfo.resources.iron < building.ironCost) return;
    
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
        wood: playerInfo.resources.wood - building.woodCost,
        iron: playerInfo.resources.iron - building.ironCost,
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
    if (playerInfo.resources.iron < unitType.ironCost) return;
    
    // Create the new unit
    const newUnit: Unit = {
      id: Date.now(), // Simple unique ID
      name: unitType.name,
      type: unitType.category,
      strength: unitType.strength,
      movement: unitType.movement,
      movementLeft: unitType.movement,
      position: { ...city.position },
    };
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold - unitType.goldCost,
      resources: {
        ...playerInfo.resources,
        iron: playerInfo.resources.iron - unitType.ironCost,
      }
    };
    
    set({ 
      units: [...units, newUnit],
      playerInfo: updatedPlayerInfo,
    });
  },
  
  // End the current turn and process game state updates
  endTurn: () => {
    const { turn, year, playerInfo, cities, units, hexMap } = get();
    
    // Calculate resource production from cities
    let foodProduction = 0;
    let woodProduction = 0;
    let ironProduction = 0;
    let scienceProduction = 0;
    let goldProduction = 0;
    
    // Process city production
    cities.forEach(city => {
      if (city.owner === 'player') {
        // Base production from population
        foodProduction += city.foodProduction || city.population * 2;
        woodProduction += city.population;
        scienceProduction += city.population;
        goldProduction += city.population * 2;
        
        // Additional production from buildings
        city.buildings.forEach(buildingId => {
          const building = get().buildings.find(b => b.id === buildingId);
          if (building) {
            foodProduction += building.foodBonus || 0;
            woodProduction += building.woodBonus || 0;
            ironProduction += building.ironBonus || 0;
            scienceProduction += building.scienceBonus || 0;
            goldProduction += building.goldBonus || 0;
          }
        });
      }
    });
    
    // Update player resources
    const updatedPlayerInfo = {
      ...playerInfo,
      gold: playerInfo.gold + goldProduction,
      science: playerInfo.science + scienceProduction,
      resources: {
        food: playerInfo.resources.food + foodProduction,
        wood: playerInfo.resources.wood + woodProduction,
        iron: playerInfo.resources.iron + ironProduction,
      }
    };
    
    // Reset unit movement for next turn
    const updatedUnits = units.map(unit => ({
      ...unit,
      movementLeft: unit.movement,
    }));
    
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
    });
  },
}));