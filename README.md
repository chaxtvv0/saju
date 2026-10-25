# saju-analysis

[orrery](https://github.com/rath/orrery)의 계산 엔진 `@orrery/core` 위에 사주 **해석** 레이어를 얹는 프로젝트입니다.

- 오행 분포 (위치 가중, 지장간 비율 분배, 원국 지지 합 보정)
- 일간 강약 (득령·득지·득세, 통근, 신강/중화/신약)
- 억부 용신 + 궁통보감 조후 용신 표 (조후상 필요한 오행은 '조건부'로 분리)
- 특수 구도 (庚劈甲引丁, 斧斤成器, 江暉相映: 구도 안의 천간충은 흉으로 보지 않음)
- 현재 대운과 세운 평가 (용신 관점 + 육합·반합·삼합·충·형 가중치, 기신 충·통관 예외)
- 마크다운 리포트 생성 (AI에게 붙여넣기용 복사 버튼)

React + Vite 웹앱이며 서버 없이 브라우저에서 모두 계산합니다.

```bash
npm install
npm run dev     # 개발 서버 (http://localhost:5173)
npm run build   # dist/ 에 정적 사이트 생성
npm test
npm run demo    # 터미널에 예제 리포트 출력
```

## 구조

- `src/analysis.ts` 해석 엔진 (오행·강약·용신·운 평가)
- `src/classics.ts` 궁통보감 조후 표와 특수 구도 규칙
- `src/report.ts` 마크다운 리포트
- `src/ui/` 화면 컴포넌트

강약·용신 판단은 규칙 기반 추정입니다.

## 라이선스

`@orrery/core`가 AGPL-3.0이므로 이 프로젝트도 AGPL-3.0을 따릅니다.
