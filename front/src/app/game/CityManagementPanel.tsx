"use client";

import React, { useState } from "react";
import { City } from "./page";
import CitySummary from "./city-management/CitySummary";
import CityProduction from "./city-management/CityProduction";
import CityPopulation from "./city-management/CityPopulation";
import CityBuildings from "./city-management/CityBuildings";
import CityDefense from "./city-management/CityDefense";
import CityBorder from "./city-management/CityBorder";

interface CityManagementPanelProps {
  cities: City[];
}

export default function CityManagementPanel({ cities }: CityManagementPanelProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(cities[0]?.id ?? null);
  const selectedCity = cities.find((city) => city.id === selectedCityId);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/4">
        <h3 className="text-xl font-bold mb-4">도시 목록</h3>
        <div className="space-y-2">
          {cities.map((city) => (
            <button
              key={city.id}
              className={`w-full text-left p-2 rounded transition-all ${selectedCityId === city.id ? "bg-blue-700" : "bg-gray-700 hover:bg-gray-600"}`}
              onClick={() => setSelectedCityId(city.id)}
            >
              {city.name} <span className="ml-2 text-xs">(인구: {city.population})</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        {selectedCity ? (
          <div className="space-y-4">
            <CitySummary city={selectedCity} />
            <CityProduction city={selectedCity} />
            <CityPopulation city={selectedCity} />
            <CityBuildings city={selectedCity} />
            <CityDefense city={selectedCity} />
            <CityBorder city={selectedCity} />
          </div>
        ) : (
          <div className="p-4 text-gray-400">도시를 선택하세요.</div>
        )}
      </div>
    </div>
  );
}
