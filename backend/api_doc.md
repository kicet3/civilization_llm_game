# Civilization LLM Game Backend API 명세서

## 개요
이 문서는 프론트엔드 전체 기능(맵, 도시, 유닛, 연구, 외교, 종교, 정책, 턴 관리 등)에 기반하여 구현되어야 할 백엔드 엔드포인트, 데이터 양식, 주요 기능 및 요구사항을 정리한 명세서입니다.

---

## 1. 공통 데이터 타입

### 1.1. Hexagon (타일)
```json
{
  "q": int, // 축 좌표
  "r": int, // 축 좌표
  "s": int, // 축 좌표
  "terrain": "grassland" | "forest" | "hills" | "mountain" | "ocean" | "plains" | ...,
  "resource": string | null,
  "city": City | null,
  "unit": Unit | null
}
```

### 1.2. City (도시)
```json
{
  "id": int,
  "name": string,
  "population": int,
  "production": string,
  "turnsLeft": int,
  "food": int,
  "gold": int,
  "science": int,
  "culture": int,
  "faith": int,
  "happiness": int,
  "hp": int,
  "defense": int,
  "garrisonedUnit": string | null,
  "productionQueue": [ { "name": string, "turnsLeft": int } ],
  "foodToNextPop": int,
  "cultureToNextBorder": int
}
```

### 1.3. Unit (유닛)
```json
{
  "id": int,
  "name": string,
  "type": string, // ex: "warrior", "settler"
  "typeName": string,
  "hp": int,
  "movement": int,
  "maxMovement": int,
  "status": string,
  "location": { "q": int, "r": int, "s": int }
}
```

### 1.4. ResearchState (연구 상태)
```json
{
  "currentTechId": string | null,
  "researchedTechIds": [string],
  "progress": { [techId: string]: int }
}
```

### 1.5. PolicyState (정책 상태)
```json
{
  "adoptedPolicies": [string],
  "culture": int
}
```

### 1.6. ReligionState (종교 상태)
```json
{
  "faith": int,
  "religions": [ { "name": string, "founder": string, ... } ],
  "selectedDoctrines": [string]
}
```

---

## 2. 엔드포인트 및 기능 명세

### 2.1. 게임 세션 관리
- **POST /api/game/start**
  - 게임 세션 생성 (맵 타입, 플레이어 정보 등 전달)
  - Request: `{ "mapType": string, "playerName": string, ... }`
  - Response: `{ "gameId": string, "initialState": GameState }`

- **GET /api/game/state?gameId=**
  - 현재 전체 게임 상태 반환
  - Response: `GameState`

- **POST /api/game/endturn**
  - 턴 종료 처리 및 AI 진행
  - Request: `{ "gameId": string }`
  - Response: `{ "newState": GameState, "events": [string] }`

---

### 2.2. 맵/타일
- **GET /api/map?gameId=**
  - 현재 맵 전체 정보 반환
  - Response: `{ "hexagons": [Hexagon] }`

- **POST /api/map/select**
  - 타일 선택 및 정보 조회
  - Request: `{ "gameId": string, "q": int, "r": int }`
  - Response: `{ "hexagon": Hexagon }`

---

### 2.3. 도시 관리
- **GET /api/cities?gameId=**
  - 모든 도시 정보 반환
  - Response: `{ "cities": [City] }`

- **POST /api/city/produce**
  - 도시 생산 큐에 항목 추가
  - Request: `{ "gameId": string, "cityId": int, "item": string }`
  - Response: `{ "city": City }`

- **POST /api/city/specialize**
  - 도시 특화(과학/생산/골드 등) 변경
  - Request: `{ "gameId": string, "cityId": int, "specialization": string }`
  - Response: `{ "city": City }`

---

### 2.4. 유닛 관리
- **GET /api/units?gameId=**
  - 모든 유닛 정보 반환
  - Response: `{ "units": [Unit] }`

- **POST /api/unit/move**
  - 유닛 이동
  - Request: `{ "gameId": string, "unitId": int, "to": { "q": int, "r": int } }`
  - Response: `{ "unit": Unit }`

- **POST /api/unit/command**
  - 유닛 커맨드(경계, 정착 등)
  - Request: `{ "gameId": string, "unitId": int, "command": string }`
  - Response: `{ "unit": Unit }`

---

### 2.5. 연구/기술
- **GET /api/research/state?gameId=**
  - 연구 상태 반환
  - Response: `ResearchState`

- **POST /api/research/start**
  - 연구 시작/변경
  - Request: `{ "gameId": string, "techId": string }`
  - Response: `ResearchState`

---

### 2.6. 정책
- **GET /api/policy/state?gameId=**
  - 정책 상태 반환
  - Response: `PolicyState`

- **POST /api/policy/adopt**
  - 정책 채택
  - Request: `{ "gameId": string, "policyId": string }`
  - Response: `PolicyState`

---

### 2.7. 종교
- **GET /api/religion/state?gameId=**
  - 종교 상태 반환
  - Response: `ReligionState`

- **POST /api/religion/found**
  - 종교 창시
  - Request: `{ "gameId": string, "religionName": string }`
  - Response: `ReligionState`

- **POST /api/religion/doctrine**
  - 교리 선택/변경
  - Request: `{ "gameId": string, "doctrineId": string }`
  - Response: `ReligionState`

---

### 2.8. 외교
- **GET /api/diplomacy/state?gameId=**
  - 외교 상태 반환
  - Response: `{ "civs": [...], "cityStates": [...], ... }`

- **POST /api/diplomacy/command**
  - 외교 명령(무역, 동맹, 전쟁 등)
  - Request: `{ "gameId": string, "targetId": string, "command": string }`
  - Response: `{ "result": string, ... }`

---

## 3. 공통 응답 예시
- 모든 엔드포인트는 실패 시 `{ "error": "메시지" }` 반환
- 인증/세션 관리 필요 시 `Authorization` 헤더 등 추가

---

## 4. 확장 및 참고
- 각 엔드포인트는 실제 게임 로직/AI/상태 동기화에 맞게 세부 구현 필요
- 추가 요청사항(랭킹, 멀티플레이, 이벤트 로그 등)은 추후 확장 가능

---

## 5. 담당자/문의
- 담당: 프론트엔드/백엔드 개발팀
- 문의: ...
