'use client';

import React, { useState, useEffect } from 'react';
import TechnologyList from '@/components/TechnologyList';

export default function TechDemoPage() {
  const [data, setData] = useState<{
    technologies: any[];
    eras: string[];
  } | null>(null);

  useEffect(() => {
    // 예시 데이터
    const techData = {
      technologies: [
        {
          id: "Ballistics",
          name: "Ballistics",
          era: "Industrial",
          cost: 2,
          description: "Enables Cannon unit",
          prerequisites: ["Ballistics"],
          unlocks: ["Ballistics"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Banking",
          name: "Banking",
          era: "Industrial",
          cost: 2,
          description: "City building; +3 Gold",
          prerequisites: [],
          unlocks: ["Banking"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Combustion",
          name: "Combustion",
          era: "Modern",
          cost: 3,
          description: "Enables Tank unit",
          prerequisites: [],
          unlocks: ["Combustion"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Economics",
          name: "Economics",
          era: "Industrial",
          cost: 2,
          description: "Unlocks Bank; boosts gold income",
          prerequisites: ["Economics"],
          unlocks: ["Economics"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Electricity",
          name: "Electricity",
          era: "Modern",
          cost: 2,
          description: "Unlocks Broadcast Tower; boosts culture",
          prerequisites: ["Electricity"],
          unlocks: ["Electricity"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Factory",
          name: "Factory",
          era: "Industrial",
          cost: 2,
          description: "City building; +3 Production",
          prerequisites: ["Factory"],
          unlocks: ["Factory"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Flight",
          name: "Flight",
          era: "Modern",
          cost: 2,
          description: "Enables Fighter unit",
          prerequisites: [],
          unlocks: ["Flight"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Gunpowder",
          name: "Gunpowder",
          era: "Industrial",
          cost: 3,
          description: "Enables Musketman unit",
          prerequisites: ["Gunpowder"],
          unlocks: ["Gunpowder"],
          is_researched: false,
          is_current: null
        },
        {
          id: "HorsebackRiding",
          name: "Horseback Riding",
          era: "Medieval",
          cost: 3,
          description: "Enables Knight unit",
          prerequisites: [],
          unlocks: [],
          is_researched: false,
          is_current: null
        },
        {
          id: "Industrialization",
          name: "Industrialization",
          era: "Industrial",
          cost: 3,
          description: "Unlocks Factory; boosts production in all cities",
          prerequisites: ["Industrialization"],
          unlocks: ["Industrialization"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Market",
          name: "Market",
          era: "Medieval",
          cost: 2,
          description: "Unlocks Market; +2 gold",
          prerequisites: ["Market"],
          unlocks: ["Market"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Masonry",
          name: "Masonry",
          era: "Medieval",
          cost: 2,
          description: "Allows Walls construction (city defense +1)",
          prerequisites: ["Masonry"],
          unlocks: ["Masonry"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Mining",
          name: "Mining",
          era: "Medieval",
          cost: 2,
          description: "Allows mines; +1 production",
          prerequisites: ["Mining"],
          unlocks: [],
          is_researched: false,
          is_current: null
        },
        {
          id: "ModernPhysics",
          name: "Modern Physics",
          era: "Modern",
          cost: 3,
          description: "Unlocks Research Lab; +2 Science",
          prerequisites: ["ModernPhysics"],
          unlocks: ["ModernPhysics"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Monastery",
          name: "Monastery",
          era: "Medieval",
          cost: 2,
          description: "Faith +1 and Culture +1 in adjacent cities",
          prerequisites: ["Monastery"],
          unlocks: ["Monastery"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Pottery",
          name: "Pottery",
          era: "Medieval",
          cost: 2,
          description: "Allows farms; +1 food on farm tiles",
          prerequisites: ["Pottery", "Pottery"],
          unlocks: [],
          is_researched: false,
          is_current: null
        },
        {
          id: "Radio",
          name: "Radio",
          era: "Modern",
          cost: 2,
          description: "+1 diplomacy influence; enables Propaganda Center",
          prerequisites: ["Radio"],
          unlocks: ["Radio"],
          is_researched: false,
          is_current: null
        },
        {
          id: "ScientificMethod",
          name: "Scientific Method",
          era: "Industrial",
          cost: 3,
          description: "+1 Science/turn; enables research-focused strategies",
          prerequisites: ["ScientificMethod", "ScientificMethod", "ScientificMethod"],
          unlocks: ["ScientificMethod"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Telecommunications",
          name: "Telecommunications",
          era: "Modern",
          cost: 3,
          description: "Victory condition tech for diplomacy",
          prerequisites: [],
          unlocks: ["Telecommunications", "Telecommunications"],
          is_researched: false,
          is_current: null
        },
        {
          id: "Theology",
          name: "Theology",
          era: "Medieval",
          cost: 3,
          description: "Unlocks Faith production, foundation of religion",
          prerequisites: ["Theology"],
          unlocks: ["Theology"],
          is_researched: false,
          is_current: null
        }
      ],
      eras: ["Industrial", "Medieval", "Modern"]
    };
    
    setData(techData);
  }, []);

  if (!data) {
    return <div className="p-4">데이터 로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">기술 연구 데모</h1>
      <TechnologyList technologies={data.technologies} eras={data.eras} />
    </div>
  );
} 