/**
 * 출생 도시 → 계산 입력(위도·경도·타임존)
 *
 * orrery 도시 목록에는 타임존이 없어서 나라(여러 시간대를 쓰는 나라는 도시) 기준으로 붙인다.
 * 국내 도시는 타임존을 비워 두어 orrery 의 KST 벽시계 관례를 그대로 따른다.
 */
import { KOREAN_CITIES, WORLD_CITIES, SEOUL, formatCityName, type City } from '@orrery/core/cities'

const COUNTRY_TZ: Record<string, string> = {
  일본: 'Asia/Tokyo', 중국: 'Asia/Shanghai', 대만: 'Asia/Taipei', 몽골: 'Asia/Ulaanbaatar', 북한: 'Asia/Pyongyang',
  태국: 'Asia/Bangkok', 베트남: 'Asia/Ho_Chi_Minh', 싱가포르: 'Asia/Singapore', 말레이시아: 'Asia/Kuala_Lumpur',
  필리핀: 'Asia/Manila', 미얀마: 'Asia/Yangon', 캄보디아: 'Asia/Phnom_Penh', 라오스: 'Asia/Vientiane',
  인도: 'Asia/Kolkata', 방글라데시: 'Asia/Dhaka', 파키스탄: 'Asia/Karachi', 네팔: 'Asia/Kathmandu', 스리랑카: 'Asia/Colombo',
  우즈베키스탄: 'Asia/Tashkent', 키르기스스탄: 'Asia/Bishkek', 타지키스탄: 'Asia/Dushanbe', 투르크메니스탄: 'Asia/Ashgabat',
  이란: 'Asia/Tehran', 이라크: 'Asia/Baghdad', 사우디아라비아: 'Asia/Riyadh', 아랍에미리트: 'Asia/Dubai', 카타르: 'Asia/Qatar',
  쿠웨이트: 'Asia/Kuwait', 튀르키예: 'Europe/Istanbul', 이스라엘: 'Asia/Jerusalem', 레바논: 'Asia/Beirut', 요르단: 'Asia/Amman',
  시리아: 'Asia/Damascus', 조지아: 'Asia/Tbilisi', 아제르바이잔: 'Asia/Baku', 아르메니아: 'Asia/Yerevan',
  영국: 'Europe/London', 프랑스: 'Europe/Paris', 독일: 'Europe/Berlin', 네덜란드: 'Europe/Amsterdam', 벨기에: 'Europe/Brussels',
  룩셈부르크: 'Europe/Luxembourg', 스페인: 'Europe/Madrid', 이탈리아: 'Europe/Rome', 포르투갈: 'Europe/Lisbon', 그리스: 'Europe/Athens',
  오스트리아: 'Europe/Vienna', 스위스: 'Europe/Zurich', 체코: 'Europe/Prague', 폴란드: 'Europe/Warsaw', 헝가리: 'Europe/Budapest',
  루마니아: 'Europe/Bucharest', 불가리아: 'Europe/Sofia', 크로아티아: 'Europe/Zagreb', 슬로베니아: 'Europe/Ljubljana',
  세르비아: 'Europe/Belgrade', 보스니아: 'Europe/Sarajevo', 알바니아: 'Europe/Tirane', 핀란드: 'Europe/Helsinki',
  스웨덴: 'Europe/Stockholm', 노르웨이: 'Europe/Oslo', 덴마크: 'Europe/Copenhagen', 아이슬란드: 'Atlantic/Reykjavik',
  아일랜드: 'Europe/Dublin', 에스토니아: 'Europe/Tallinn', 라트비아: 'Europe/Riga', 리투아니아: 'Europe/Vilnius',
  우크라이나: 'Europe/Kyiv', 벨라루스: 'Europe/Minsk', 몰도바: 'Europe/Chisinau',
  쿠바: 'America/Havana', 도미니카공화국: 'America/Santo_Domingo', 과테말라: 'America/Guatemala', 코스타리카: 'America/Costa_Rica',
  파나마: 'America/Panama', 푸에르토리코: 'America/Puerto_Rico', 자메이카: 'America/Jamaica', 콜롬비아: 'America/Bogota',
  페루: 'America/Lima', 에콰도르: 'America/Guayaquil', 칠레: 'America/Santiago', 아르헨티나: 'America/Argentina/Buenos_Aires',
  우루과이: 'America/Montevideo', 파라과이: 'America/Asuncion', 볼리비아: 'America/La_Paz', 브라질: 'America/Sao_Paulo',
  베네수엘라: 'America/Caracas',
  이집트: 'Africa/Cairo', 케냐: 'Africa/Nairobi', 에티오피아: 'Africa/Addis_Ababa', 가나: 'Africa/Accra', 나이지리아: 'Africa/Lagos',
  탄자니아: 'Africa/Dar_es_Salaam', 남아프리카공화국: 'Africa/Johannesburg', 알제리: 'Africa/Algiers', 튀니지: 'Africa/Tunis',
  모로코: 'Africa/Casablanca', 우간다: 'Africa/Kampala', 잠비아: 'Africa/Lusaka', 짐바브웨: 'Africa/Harare', 모잠비크: 'Africa/Maputo',
  마다가스카르: 'Indian/Antananarivo', 뉴질랜드: 'Pacific/Auckland',
}

/** 한 나라 안에서 시간대가 갈리는 도시 */
const CITY_TZ: Record<string, string> = {
  '자카르타': 'Asia/Jakarta', '발리': 'Asia/Makassar',
  '아스타나': 'Asia/Almaty', '알마티': 'Asia/Almaty',
  '모스크바': 'Europe/Moscow', '상트페테르부르크': 'Europe/Moscow', '블라디보스토크': 'Asia/Vladivostok',
  '워싱턴 D.C.': 'America/New_York', '뉴욕': 'America/New_York', '보스턴': 'America/New_York', '마이애미': 'America/New_York',
  '애틀랜타': 'America/New_York', '시카고': 'America/Chicago', '휴스턴': 'America/Chicago', '댈러스': 'America/Chicago',
  '덴버': 'America/Denver', '로스앤젤레스': 'America/Los_Angeles', '샌프란시스코': 'America/Los_Angeles',
  '시애틀': 'America/Los_Angeles', '라스베이거스': 'America/Los_Angeles', '호놀룰루': 'Pacific/Honolulu',
  '오타와': 'America/Toronto', '토론토': 'America/Toronto', '몬트리올': 'America/Toronto', '밴쿠버': 'America/Vancouver',
  '멕시코시티': 'America/Mexico_City', '칸쿤': 'America/Cancun',
  '캔버라': 'Australia/Sydney', '시드니': 'Australia/Sydney', '멜버른': 'Australia/Melbourne',
  '브리즈번': 'Australia/Brisbane', '퍼스': 'Australia/Perth',
}

export interface BirthPlace {
  label: string
  latitude: number
  longitude: number
  /** 국내 도시는 undefined (KST 벽시계 기준) */
  timezone?: string
}

function toPlace(city: City): BirthPlace {
  const timezone = city.country ? CITY_TZ[city.name] ?? COUNTRY_TZ[city.country] : undefined
  return { label: formatCityName(city), latitude: city.lat, longitude: city.lon, timezone }
}

/** 고를 수 있는 출생지 (국내 먼저). 타임존을 알 수 없는 해외 도시는 뺀다. */
export const BIRTH_PLACES: BirthPlace[] = [...KOREAN_CITIES, ...WORLD_CITIES]
  .map(toPlace)
  .filter(p => p.timezone !== undefined || KOREAN_CITIES.some(c => formatCityName(c) === p.label))

export const DEFAULT_PLACE = toPlace(SEOUL)

export function findPlace(label: string): BirthPlace | undefined {
  return BIRTH_PLACES.find(p => p.label === label.trim())
}
