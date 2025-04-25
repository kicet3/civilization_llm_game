# Mini Civ 게임 백엔드 API 명세서

## 개요

이 문서는 Mini Civ 게임의 백엔드 API에 대한 기술 명세를 제공합니다. API는 게임 맵 생성, 게임 상태 관리, 턴 진행 등의 기능을 제공합니다.

## 기본 정보

- 기본 URL: `http://localhost:8000`
- 응답 형식: JSON
- 모든 API 응답은 다음과 같은 기본 구조를 따릅니다:
  ```json
  {
    "success": true | false,
    "status_code": 200 | 404 | 500 | ...,
    "message": "응답 메시지",
    "data": { ... },      // 성공 시 데이터
    "error": { ... }      // 실패 시 오류 정보
  }
  ```

## 맵 관련 API

### 맵 데이터 조회

새 게임 맵을 생성하거나 기존 맵을 로드합니다.

- **URL**: `/map/data`
- **Method**: `GET`
- **Query Parameters**:
  - `user_id` (선택): 사용자 ID. 제공되지 않으면 임시 ID가 생성됩니다.

- **성공 응답**:
  ```json
  {
    "success": true,
    "status_code": 200,
    "message": "맵 데이터가 성공적으로 로드되었습니다.",
    "data": {
      "tiles": [...],        // 맵 타일 정보
      "civs": [...],         // 문명 정보
      "turn": 1,             // 현재 턴
      "game_id": "..."       // 게임 ID
    },
    "player_city": {         // 플레이어 도시 정보
      "name": "Seoul",
      "q": 4,
      "r": 3,
      "s": -7,
      "city_id": "city_korea"
    },
    "game_id": "...",        // 게임 ID
    "turn": 1,               // 현재 턴
    "is_new_game": true,     // 새 게임 여부
    "meta": {
      "width": 21,           // 맵 가로 크기
      "height": 19,          // 맵 세로 크기
      "tile_count": 399,     // 전체 타일 수
      "civ_count": 6         // 문명 수
    }
  }
  ```

- **동작 방식**:
  1. `user_id`가 제공되면 해당 사용자의 가장 최근 게임을 검색합니다.
  2. 기존 게임이 있으면 해당 게임의 최신 상태를 반환합니다.
  3. 기존 게임이 없으면 내륙 바다(Inland Sea) 형태의 새 맵을 생성합니다.
  4. 생성된 맵 데이터는 데이터베이스에 저장됩니다.

### 인접 타일 정보 조회

지정된 타일 주변의 인접 타일 정보를 반환합니다.

- **URL**: `/map/adjacent`
- **Method**: `GET`
- **Query Parameters**:
  - `q` (필수): 타일의 q 좌표 (육각형 좌표계)
  - `r` (필수): 타일의 r 좌표 (육각형 좌표계)

- **성공 응답**:
  ```json
  {
    "success": true,
    "status_code": 200,
    "message": "인접 타일 정보가 성공적으로 로드되었습니다.",
    "data": {
      "origin": {"q": 4, "r": 3, "s": -7},
      "hexagons": [
        {
          "q": 5,
          "r": 3,
          "s": -8,
          "terrain": "PLAINS",
          "resource": "WHEAT",
          "visible": true,
          "explored": true
        },
        // ... 더 많은 인접 타일 (총 6개)
      ]
    },
    "meta": {
      "count": 6
    }
  }
  ```

## 게임 진행 API

### 턴 진행

다음 턴으로 게임을 진행합니다.

- **URL**: `/map/turn/next`
- **Method**: `POST`
- **Query Parameters**:
  - `game_id` (필수): 게임 ID
  - `user_id` (필수): 사용자 ID

- **성공 응답**:
  ```json
  {
    "success": true,
    "status_code": 200,
    "message": "턴 2로 진행되었습니다.",
    "data": {
      "game_id": "...",
      "current_turn": 2,
      "state": {
        // 업데이트된 게임 상태
      }
    }
  }
  ```

- **실패 응답**:
  ```json
  {
    "success": false,
    "status_code": 404,
    "message": "해당 게임을 찾을 수 없습니다."
  }
  ```

### 게임 상태 조회

특정 게임의 상태를 조회합니다.

- **URL**: `/map/game/{game_id}`
- **Method**: `GET`
- **Path Parameters**:
  - `game_id` (필수): 게임 ID
- **Query Parameters**:
  - `user_id` (필수): 사용자 ID
  - `turn` (선택): 조회할 턴 번호 (제공되지 않으면 현재 턴)

- **성공 응답**:
  ```json
  {
    "success": true,
    "status_code": 200,
    "message": "턴 1의 게임 상태를 조회했습니다.",
    "data": {
      // 게임 상태 데이터
    },
    "meta": {
      "game_id": "...",
      "turn": 1,
      "current_turn": 1,
      "created_at": "2023-04-25T04:10:26.814Z"
    }
  }
  ```

## 데이터 모델

### 헥스 타일 (HexTile)

```json
{
  "q": 0,             // 육각형 그리드 q 좌표
  "r": 0,             // 육각형 그리드 r 좌표
  "s": 0,             // 육각형 그리드 s 좌표 (q + r + s = 0)
  "terrain": "PLAINS", // 지형 유형
  "resource": "WHEAT", // 자원 (있는 경우)
  "visible": true,    // 현재 보이는지 여부
  "explored": true,   // 탐험 여부
  "city_id": "city_1", // 도시 ID (있는 경우)
  "unit_id": "unit_1", // 유닛 ID (있는 경우)
  "occupant": "Korea"  // 점유 문명 (있는 경우)
}
```

### 문명 (Civilization)

```json
{
  "name": "Korea",
  "capital_tile": {"q": 4, "r": 3},
  "units": ["warrior-1", "settler-1"]
}
```

### 지형 유형 (TerrainType)

- `PLAINS`: 평원
- `GRASSLAND`: 초원
- `HILLS`: 언덕
- `FOREST`: 숲
- `DESERT`: 사막
- `COAST`: 해안
- `OCEAN`: 바다
- `MOUNTAIN`: 산

### 자원 유형 (ResourceType)

- `WHEAT`: 밀
- `HORSES`: 말
- `CATTLE`: 소
- `SHEEP`: 양
- `IRON`: 철
- `COAL`: 석탄
- `GOLD`: 금
- `FISH`: 물고기

## 오류 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 404 | 리소스를 찾을 수 없음 |
| 403 | 접근 권한 없음 |
| 422 | 요청 파라미터 오류 |
| 500 | 서버 내부 오류 |

## 예시 요청

### 맵 데이터 조회 요청
```
GET /map/data?user_id=0d201aaa3b0fa8d094318f6df4cf96354c267aeb55fe4fdf9c6ecbc12d396771
```

### 턴 진행 요청
```
POST /map/turn/next?game_id=123e4567-e89b-12d3-a456-426614174000&user_id=0d201aaa3b0fa8d094318f6df4cf96354c267aeb55fe4fdf9c6ecbc12d396771
```

### 게임 상태 조회 요청
```
GET /map/game/123e4567-e89b-12d3-a456-426614174000?user_id=0d201aaa3b0fa8d094318f6df4cf96354c267aeb55fe4fdf9c6ecbc12d396771&turn=2
``` 