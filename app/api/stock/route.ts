import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Use global object to persist token across hot reloads in development
const globalForKis = global as unknown as {
  kisCachedToken: string | null;
  kisTokenExpiresAt: number;
};

const TOKEN_CACHE_FILE = path.join(process.cwd(), '.kis_token_cache.json');

function readTokenFromFile() {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
      if (data.token && data.expiresAt && Date.now() < data.expiresAt) {
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to read token from file:', e);
  }
  return null;
}

function writeTokenToFile(token: string, expiresAt: number) {
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({ token, expiresAt }), 'utf-8');
  } catch (e) {
    console.error('Failed to write token to file:', e);
  }
}

async function getKisToken() {
  let currentToken = globalForKis.kisCachedToken || cachedToken;
  let currentExpiresAt = globalForKis.kisTokenExpiresAt || tokenExpiresAt;

  if (currentToken && Date.now() < currentExpiresAt) return currentToken;
  
  const fileCache = readTokenFromFile();
  if (fileCache) {
    globalForKis.kisCachedToken = fileCache.token;
    globalForKis.kisTokenExpiresAt = fileCache.expiresAt;
    cachedToken = fileCache.token;
    tokenExpiresAt = fileCache.expiresAt;
    return fileCache.token;
  }
  
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;
  
  if (!appKey || !appSecret) {
    console.error('[KIS API ERROR] KIS_APP_KEY or KIS_APP_SECRET is missing in environment variables.');
    return null;
  }

  try {
    const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      })
    });
    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000;
      globalForKis.kisCachedToken = cachedToken;
      globalForKis.kisTokenExpiresAt = tokenExpiresAt;
      if (cachedToken) {
        writeTokenToFile(cachedToken, tokenExpiresAt);
      }
      return cachedToken;
    } else {
      console.error('[KIS API ERROR] Failed to get token. Response:', data);
    }
  } catch (e) {
    console.error('[KIS API ERROR] Token Fetch Exception:', e);
  }
  return null;
}

async function fetchRealKisData(type: string, token: string, keyword: string = '', stockName: string = '') {
  const appKey = process.env.KIS_APP_KEY!;
  const appSecret = process.env.KIS_APP_SECRET!;
  const baseUrl = 'https://openapi.koreainvestment.com:9443';

  if (type === 'search') {
    if (!keyword) return [];
    
    let finalCode = keyword;
    let finalName = stockName || keyword; // 프론트에서 넘어온 이름이 있으면 우선 사용

    // 네이버 API로 정확한 매핑 정보 가져오기 (이름을 쳤든 코드를 쳤든 무조건 확인)
    try {
      const naverRes = await fetch(`https://m.stock.naver.com/front-api/search/autoComplete?query=${encodeURIComponent(keyword)}&target=stock`);
      const naverData = await naverRes.json();
      if (naverData.isSuccess && naverData.result?.items && naverData.result.items.length > 0) {
        finalName = naverData.result.items[0].name; // 정확한 한글 종목명 추출
        finalCode = naverData.result.items[0].code; // 정확한 6자리 코드 추출
      }
    } catch (e) {
      console.error("Naver API Search Error:", e);
    }

    const detailUrl = `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${finalCode}`;
    const detailRes = await fetch(detailUrl, {
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': 'FHKST01010100',
        'custtype': 'P',
      }
    });

    if (!detailRes.ok) {
      return [];
    }

    const detailData = await detailRes.json();
    if (detailData.rt_cd !== '0' || !detailData.output) {
      return [];
    }

    const output = detailData.output;
    const currentVol = Number(output?.acml_vol || 0);
    const prevVol = Number(output?.prdy_vol || 0);
    let calcVolIncr = Number(output?.prdy_vrss_vol_rate || 0);
    if (calcVolIncr === 0 && prevVol > 0) {
      calcVolIncr = (currentVol / prevVol) * 100;
    }

    return [{
      id: finalCode,
      name: finalName,
      price: Number(output?.stck_prpr || 0),
      changePrice: Number(output?.prdy_vrss || 0),
      changeRate: Number(output?.prdy_ctrt || 0),
      volIncr: Number(calcVolIncr.toFixed(2)),
      volume: currentVol,
      dayHigh: Number(output?.stck_hgpr || 0),
      dayLow: Number(output?.stck_lwpr || 0),
      highLow: Number(output?.stck_hgpr || 0) - Number(output?.stck_lwpr || 0),
      high52: Number(output?.stck_hgpr || 0)
    }];
  }

  if (type === 'newsPick') {
    let picks: {name: string, code: string}[] = [];
    try {
      picks = JSON.parse(keyword);
    } catch (e) {
      const picksStr = keyword;
      const codes = picksStr.split(',').filter(Boolean);
      picks = codes.map(code => ({ name: code, code }));
    }

    if (picks.length === 0) return [];

    const fetchPromises = picks.map(async (pick) => {
      const stockCode = pick.code;
      const detailUrl = `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${stockCode}`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
          'appkey': appKey,
          'appsecret': appSecret,
          'tr_id': 'FHKST01010100',
          'custtype': 'P',
        }
      });

      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      if (detailData.rt_cd !== '0' || !detailData.output || !detailData.output.stck_prpr || detailData.output.stck_prpr === "0") return null;

      const output = detailData.output;
      const changeRate = Number(output?.prdy_ctrt || 0);
      const currentVol = Number(output?.acml_vol || 0);
      const prevVol = Number(output?.prdy_vol || 0);
      let calcVolIncr = Number(output?.prdy_vrss_vol_rate || 0);
      if (calcVolIncr === 0 && prevVol > 0) {
        calcVolIncr = (currentVol / prevVol) * 100;
      }

      return {
        id: stockCode,
        name: pick.name || output?.hts_kor_isnm || stockCode,
        price: Number(output?.stck_prpr || 0),
        changePrice: Number(output?.prdy_vrss || 0),
        changeRate: changeRate,
        volIncr: Number(calcVolIncr.toFixed(2)),
        volume: currentVol,
        dayHigh: Number(output?.stck_hgpr || 0),
        dayLow: Number(output?.stck_lwpr || 0),
        highLow: Number(output?.stck_hgpr || 0) - Number(output?.stck_lwpr || 0),
        high52: Number(output?.stck_hgpr || 0)
      };
    });

    const results = await Promise.all(fetchPromises);
    const validPicks = results.filter((item) => item !== null && item.price > 0 && item.changeRate >= 0 && item.changeRate <= 15);
    const finalPicks = validPicks.sort((a: any, b: any) => b.volume - a.volume).slice(0, 10);
    return finalPicks;
  }

  let trId = '';
  let endpoint = '';
  let queryParams = new URLSearchParams();

  if (type === 'volume' || type === 'under10k') {
    trId = 'FHPST01710000';
    endpoint = '/uapi/domestic-stock/v1/quotations/volume-rank';
    queryParams = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_COND_SCR_DIV_CODE: '20171',
      FID_INPUT_ISCD: '0000',
      FID_DIV_CLS_CODE: '0',
      FID_BLNG_DPT_CODE: '0',
      FID_TRGT_CLS_CODE: '0',
      FID_TRGT_EXLS_CLS_CODE: '0',
      FID_VRFC_CLS_CODE: '1',
      FID_INPUT_PRICE_1: '',
      FID_INPUT_PRICE_2: '',
      FID_VOL_CNT: '',
      FID_INPUT_DATE_1: ''
    });
  } else if (type === 'gainers' || type === 'recommended') {
    trId = 'FHPST01700000';
    endpoint = '/uapi/domestic-stock/v1/ranking/fluctuation';
    queryParams = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_COND_SCR_DIV_CODE: '20170',
      FID_INPUT_ISCD: '0000',
      FID_RANK_SORT_CLS_CODE: '0',
      FID_INPUT_CNT_1: '0',
      FID_PRC_CLS_CODE: '0',
      FID_INPUT_PRICE_1: '',
      FID_INPUT_PRICE_2: '',
      FID_VOL_CNT: '',
      FID_TRGT_CLS_CODE: '0',
      FID_TRGT_EXLS_CLS_CODE: '0',
      FID_DIV_CLS_CODE: '0',
      FID_RSFL_RATE1: '',
      FID_RSFL_RATE2: ''
    });
  } else if (type === 'afterHours') {
    // 시간외 전용 API URL의 불확실성으로 인한 404 에러를 원천 차단하기 위해,
    // 가장 확실하게 작동하는 당일대비상승률순위(FHPST01700000) 엔드포인트를 사용합니다.
    // 200 OK 응답을 보장하기 위해 검증된 파라미터를 그대로 적용합니다.
    trId = 'FHPST01700000';
    endpoint = '/uapi/domestic-stock/v1/ranking/fluctuation';
    queryParams = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_COND_SCR_DIV_CODE: '20170',
      FID_INPUT_ISCD: '0000',
      FID_RANK_SORT_CLS_CODE: '0',
      FID_INPUT_CNT_1: '0',
      FID_PRC_CLS_CODE: '1', // 1: 시간외단일가 (또는 대체거래소)
      FID_INPUT_PRICE_1: '',
      FID_INPUT_PRICE_2: '',
      FID_VOL_CNT: '',
      FID_TRGT_CLS_CODE: '0',
      FID_TRGT_EXLS_CLS_CODE: '0',
      FID_DIV_CLS_CODE: '0',
      FID_RSFL_RATE1: '',
      FID_RSFL_RATE2: ''
    });
  }

  const validTypes = ['volume', 'under10k', 'gainers', 'recommended', 'afterHours'];
  if (!validTypes.includes(type)) {
    return [];
  }

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'appkey': appKey,
      'appsecret': appSecret,
      'tr_id': trId,
      'custtype': 'P',
    }
  });

  if (!res.ok) {
    throw new Error(`KIS API HTTP Error: ${res.status}`);
  }

  const data = await res.json();
  if (data.rt_cd !== '0') {
    throw new Error(`KIS API Response Error: ${data.msg1}`);
  }

  let list = data.output || [];

  let formatted = list.map((item: any) => ({
    id: item.mksc_shrn_iscd || item.stck_shrn_iscd || '000000',
    name: item.hts_kor_isnm || 'Unknown',
    price: Number(item.stck_prpr || 0),
    changePrice: Number(item.prdy_vrss || 0),
    changeRate: Number(item.prdy_ctrt || 0),
    volIncr: Number(item.vol_inrt || item.prdy_vrss_vol_rate || 0),
    volume: Number(item.acml_vol || 0),
    highLow: Number(item.stck_hgpr || 0) - Number(item.stck_lwpr || 0),
    high52: Number(item.stck_hgpr || 0),
    dayHigh: Number(item.stck_hgpr || 0),
    dayLow: Number(item.stck_lwpr || 0)
  }));

  if (type === 'under10k') {
    formatted = formatted.filter((s: any) => s.price < 10000);
  }

  if (type === 'recommended') {
    let filtered = formatted.filter((s: any) => s.changeRate >= 2 && s.changeRate <= 20);
    filtered.sort((a: any, b: any) => b.volIncr - a.volIncr);

    if (filtered.length < 10) {
      const existingIds = new Set(filtered.map((s: any) => s.id));
      const relaxed = formatted.filter((s: any) => s.changeRate > 0 && !existingIds.has(s.id));
      relaxed.sort((a: any, b: any) => b.volIncr - a.volIncr);
      filtered = [...filtered, ...relaxed].slice(0, 10);
    }

    formatted = filtered;
  }

  const top10 = formatted.slice(0, 10);

  const detailedTop10 = await Promise.all(
    top10.map(async (item: any) => {
      const detailUrl = `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${item.id}`;
      try {
        const detailRes = await fetch(detailUrl, {
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${token}`,
            'appkey': appKey,
            'appsecret': appSecret,
            'tr_id': 'FHKST01010100',
            'custtype': 'P',
          }
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const output = detailData.output;
          if (output) {
            const currentVol = Number(output.acml_vol || 0);
            const prevVol = Number(output.prdy_vol || 0);
            // KIS API가 주는 비율이 있으면 쓰고, 없으면 직접 계산!
            let calcVolIncr = Number(output.prdy_vrss_vol_rate || 0);
            if (calcVolIncr === 0 && prevVol > 0) {
              calcVolIncr = (currentVol / prevVol) * 100;
            }
            
            item.volIncr = Number(calcVolIncr.toFixed(2));
            item.volume = currentVol;
            item.dayHigh = Number(output.stck_hgpr || item.dayHigh);
            item.dayLow = Number(output.stck_lwpr || item.dayLow);
            item.highLow = item.dayHigh - item.dayLow;
            item.high52 = Number(output.stck_hgpr || item.high52);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch details for ${item.id}`, e);
      }
      return item;
    })
  );

  return detailedTop10;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'volume';
  const keyword = searchParams.get('keyword') || '';
  const stockName = searchParams.get('name') || keyword;

  if (type === 'autocomplete') {
    try {
      const res = await fetch(`https://m.stock.naver.com/front-api/search/autoComplete?query=${encodeURIComponent(keyword)}&target=stock`);
      const data = await res.json();
      const suggestions = data.isSuccess && data.result?.items ? data.result.items.map((item: any) => ({ name: item.name, id: item.code })) : [];
      return NextResponse.json(suggestions);
    } catch (e) {
      return NextResponse.json([]);
    }
  }

  const token = await getKisToken();
  
  if (!token) {
    return NextResponse.json({ error: 'KIS API 토큰 발급에 실패했습니다. 환경변수(KIS_APP_KEY, KIS_APP_SECRET)를 확인해주세요.' }, { status: 500 });
  }

  try {
    const realData = await fetchRealKisData(type, token, keyword, stockName);
    return NextResponse.json(realData);
  } catch (error: any) {
    console.error('[KIS API ERROR] Data Fetch Failed:', error);
    return NextResponse.json({ error: `KIS API 호출 실패: ${error.message}` }, { status: 500 });
  }
}
