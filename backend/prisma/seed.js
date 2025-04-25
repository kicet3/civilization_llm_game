const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 기본 기술 데이터
  const techData = [
    { id: 'agriculture', name: '농업', era: 'ancient', cost: 20, description: '기본 식량 생산 +1' },
    { id: 'animal_husbandry', name: '목축', era: 'ancient', cost: 30, description: '말 자원 발견, 목장 개선 가능' },
    { id: 'archery', name: '궁술', era: 'ancient', cost: 35, description: '궁수 유닛 생산 가능' },
    { id: 'mining', name: '채광', era: 'ancient', cost: 35, description: '광산 개선 가능, 언덕 타일 생산량 +1' },
    { id: 'pottery', name: '도예', era: 'ancient', cost: 25, description: '창고 건물 건설 가능' },
    { id: 'sailing', name: '항해', era: 'ancient', cost: 30, description: '물 타일 이동 가능, 어선 유닛 생산 가능' },
    
    { id: 'bronze_working', name: '청동 세공', era: 'classical', cost: 55, description: '창병 유닛 생산 가능, 숲 제거 가능' },
    { id: 'calendar', name: '역법', era: 'classical', cost: 45, description: '농장 수확량 +1' },
    { id: 'masonry', name: '석공', era: 'classical', cost: 55, description: '석재 채석장 개선 가능, 성벽 건설 가능' },
    { id: 'wheel', name: '바퀴', era: 'classical', cost: 55, description: '도로 건설 가능, 전차 유닛 생산 가능' },
    { id: 'writing', name: '문자', era: 'classical', cost: 55, description: '도서관 건물 건설 가능, 외교 거래 가능' },
    
    { id: 'construction', name: '건축', era: 'medieval', cost: 100, description: '다리 건설 가능, 목재소 개선 가능' },
    { id: 'currency', name: '화폐', era: 'medieval', cost: 100, description: '시장 건물 건설 가능, 금과 은 자원 수익 +1' },
    { id: 'engineering', name: '공학', era: 'medieval', cost: 100, description: '아쿠아덕트 건설 가능, 공성 무기 생산 가능' },
    { id: 'iron_working', name: '제철', era: 'medieval', cost: 150, description: '검투사 유닛 생산 가능, 철 자원 활용' },
    { id: 'mathematics', name: '수학', era: 'medieval', cost: 100, description: '투석기 유닛 생산 가능, 과학 생산량 +1' },
    
    { id: 'education', name: '교육', era: 'renaissance', cost: 200, description: '대학 건물 건설 가능, 과학자 전문가 +1' },
    { id: 'gunpowder', name: '화약', era: 'renaissance', cost: 220, description: '머스킷병 유닛 생산 가능' },
    { id: 'metallurgy', name: '금속 공학', era: 'renaissance', cost: 240, description: '기사 유닛 생산량 +25%' },
    { id: 'printing_press', name: '인쇄기', era: 'renaissance', cost: 220, description: '신문사 건물 건설 가능, 문화 +3' },
    
    { id: 'industrialization', name: '산업화', era: 'industrial', cost: 320, description: '공장 건물 건설 가능, 생산 +4' },
    { id: 'rifling', name: '소총', era: 'industrial', cost: 300, description: '소총병 유닛 생산 가능' },
    { id: 'scientific_theory', name: '과학 이론', era: 'industrial', cost: 300, description: '연구소 건물 건설 가능, 과학 +5' },
    { id: 'steam_power', name: '증기 기관', era: 'industrial', cost: 340, description: '증기선 유닛 생산 가능' }
  ];

  // 기술 선행 관계 정의
  const techRelations = [
    // 고대 기술 관계
    { techId: 'animal_husbandry', prereqId: 'agriculture' },
    { techId: 'archery', prereqId: 'agriculture' },
    { techId: 'mining', prereqId: 'agriculture' },
    { techId: 'pottery', prereqId: 'agriculture' },
    { techId: 'sailing', prereqId: 'pottery' },
    
    // 고전 기술 관계
    { techId: 'bronze_working', prereqId: 'mining' },
    { techId: 'calendar', prereqId: 'pottery' },
    { techId: 'masonry', prereqId: 'mining' },
    { techId: 'wheel', prereqId: 'animal_husbandry' },
    { techId: 'writing', prereqId: 'pottery' },
    
    // 중세 기술 관계
    { techId: 'construction', prereqId: 'masonry' },
    { techId: 'currency', prereqId: 'writing' },
    { techId: 'engineering', prereqId: 'masonry' },
    { techId: 'engineering', prereqId: 'wheel' }, // 다중 선행 기술 예시
    { techId: 'iron_working', prereqId: 'bronze_working' },
    { techId: 'mathematics', prereqId: 'writing' },
    
    // 르네상스 기술 관계
    { techId: 'education', prereqId: 'mathematics' },
    { techId: 'gunpowder', prereqId: 'iron_working' },
    { techId: 'metallurgy', prereqId: 'iron_working' },
    { techId: 'printing_press', prereqId: 'education' },
    
    // 산업 시대 기술 관계
    { techId: 'industrialization', prereqId: 'printing_press' },
    { techId: 'rifling', prereqId: 'gunpowder' },
    { techId: 'scientific_theory', prereqId: 'education' },
    { techId: 'steam_power', prereqId: 'industrialization' }
  ];

  console.log('기술 데이터 삽입 시작...');

  // 기존 데이터가 있으면 삭제 (개발 목적)
  await prisma.techPrerequisite.deleteMany({});
  await prisma.tech.deleteMany({});

  // 기술 데이터 삽입
  for (const tech of techData) {
    await prisma.tech.create({ data: tech });
  }

  console.log(`${techData.length}개의 기본 기술 데이터가 삽입되었습니다.`);

  // 선행 관계 데이터 삽입
  for (const relation of techRelations) {
    await prisma.techPrerequisite.create({ data: relation });
  }

  console.log(`${techRelations.length}개의 기술 선행 관계가 설정되었습니다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 