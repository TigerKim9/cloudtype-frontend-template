<h1 align="center">AI 저작권 연동 시스템 ⚖️</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT License" src="https://img.shields.io/badge/License-MIT License-yellow.svg" />
  </a>
</p>

> AI가 생성한 콘텐츠(텍스트·이미지·음악·코드)를 등록된 저작물 DB와 대조하여
> 저작권 침해 위험을 진단하고, 라이선스에 맞는 저작자 표시 문구를 자동 생성합니다.
> 클라우드타입 React 프론트엔드 템플릿을 기반으로 합니다.

## ✨ 주요 기능

- **콘텐츠 유형별 유사도 검사** — 텍스트/코드(n-gram Jaccard), 이미지(pHash 해밍 거리), 음악(음표 시퀀스), **영상(4구간 MD5 핑거프린트)**
- **파일 업로드 검사** — 이미지/오디오/영상 파일을 올리면 서버가 지문(pHash·핑거프린트)을 자동 계산
- **라이선스 기반 위험도** — Public Domain은 완화, MIT/All Rights Reserved 등은 유사도에 따라 위험 등급 상향
- **저작자 표시 자동 생성** — 라이선스(PD/CC0/CC-BY/MIT/GPL-2.0/All Rights Reserved)별 인용 문구 생성
- **일괄 검사** — 여러 콘텐츠를 한 번에 (최대 50개) 검사
- **검사 이력 & 통계** — 검사 기록 저장 및 위험도별 집계
- **🆕 임베드 위젯** — 외부 영상 플랫폼이 `<script>` 한 줄로 자기 페이지에 저작권 검사 모듈을 삽입
- **🆕 API 키 인증** — 임베드/외부 호출자 식별 + 분당 호출 제한

## 🏗️ 구조

```
server/                     # Express 백엔드 API
  index.js                  # 서버 진입점 (포트 4000)
  routes/copyright.js       # /api/copyright/* 라우트
  utils/
    similarity.js           # 유형별 유사도 + 위험도 산정
    imageHash.js            # Jimp 기반 pHash 계산
    audioHash.js            # SHA-256 기반 음표 시퀀스 핑거프린트
    attribution.js          # 라이선스별 저작자 표시 생성
    history.js              # 검사 이력 영속화 (data/history.json)
  data/copyrightDB.json     # 샘플 저작물 DB
  test/similarity.test.js   # 백엔드 유닛 테스트
src/
  components/
    CopyrightChecker.js     # 단건 검사 + 파일 업로드 UI
    BatchChecker.js         # 일괄 검사 UI
    HistoryPage.js          # 이력/통계 UI
    ResultDisplay.js        # 결과 표시 (저작자 표시 복사 포함)
  services/CopyrightService.js  # API 클라이언트
```

## 🚀 실행

```bash
npm install

# 백엔드 (포트 4000)
npm run server

# 프론트엔드 (포트 3000, package.json proxy로 백엔드 연결)
npm start
```

백엔드 유닛 테스트:

```bash
npm run test:server
```

## 📡 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/health` | 헬스 체크 |
| `GET` | `/api/copyright/db/:type` | 유형별 등록 저작물 목록 |
| `POST` | `/api/copyright/check` | 단건 검사 `{ type, content }` |
| `POST` | `/api/copyright/check-batch` | 일괄 검사 `{ items: [{ type, content, label }] }` |
| `POST` | `/api/copyright/upload` | 파일 업로드 검사 (multipart: `type`, `file`) |
| `GET` | `/api/copyright/history` | 검사 이력 |
| `DELETE` | `/api/copyright/history` | 이력 삭제 |
| `GET` | `/api/copyright/stats` | 위험도/유형별 통계 |

`type` 값: `text` · `image` · `audio` · `video` · `code`

API 키는 `X-API-Key` 헤더 또는 `?apiKey=` 쿼리로 전달합니다. 데모 키: `embed-test-key-001`, `demo-key-public-2025`.

## 🧩 임베드 위젯

외부 호스트(예: 영상 업로드 플랫폼) 페이지에 한 줄로 삽입할 수 있습니다.

```html
<div data-aicw-widget
     data-api-key="embed-test-key-001"
     data-types="video,image,audio"
     data-block-on-high-risk="true"></div>
<script src="https://YOUR_HOST/embed/copyright-widget.js"></script>
```

발생 이벤트: `aicw:result`, `aicw:passed`, `aicw:blocked` (DOM CustomEvent). 호스트 페이지는 이를 받아 업로드 버튼을 활성화/비활성화합니다.

라이브 데모: `http://localhost:4000/embed/demo.html` (백엔드 실행 중일 때).
React 앱 내 `/embed` 경로에서 통합 가이드와 실시간 미리보기를 볼 수 있습니다.

### 검사 응답 예시

```json
{
  "type": "code",
  "overallRisk": "HIGH",
  "matchCount": 1,
  "matches": [
    { "id": "C-0001", "title": "React useState 표준 패턴",
      "author": "Meta (React)", "license": "MIT", "score": 1, "risk": "HIGH" }
  ],
  "suggestion": "…매우 유사합니다. 그대로 사용 시 저작권 침해 위험이 큽니다…",
  "attribution": "Based on \"React useState 표준 패턴\" by Meta (React) (2018), licensed under the MIT License. 라이선스 전문 포함 필수."
}
```

## ⚠️ 한계 및 다음 단계

현재 저작물 DB는 **데모용 샘플**이며, 유사도 알고리즘도 교육용 수준입니다. 실제 서비스에는 다음이 필요합니다.

- 실제 저작권 협회/상용 API 연동 (KOMCA, KCISA, Audible Magic 등)
- 음원 핑거프린팅 라이브러리(Chromaprint 등) 적용
- 검사 이력용 실제 데이터베이스(PostgreSQL 등) 연동
- 본 도구의 결과는 참고용이며, 최종 저작권 판단의 법적 책임은 사용자에게 있습니다.

***
_클라우드타입 React 템플릿 기반으로 제작되었습니다._
