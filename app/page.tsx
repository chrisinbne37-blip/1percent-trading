'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Activity, DollarSign, Clock, X, Loader2, Sparkles, AlertCircle, Target, RefreshCw, Search, BookOpen } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const trainingData = [
  // 카테고리 1: 📖 기초/시황 용어
  { term: '공매도', category: '📖 기초/시황 용어', description: '주가가 하락할 것을 예상하고 주식을 빌려서 판 뒤, 주가가 떨어지면 싼값에 사서 갚아 차익을 얻는 투자 기법.' },
  { term: '상한가', category: '📖 기초/시황 용어', description: '하루 동안 주가가 오를 수 있는 최고 한도 (한국 기준 +30%).' },
  { term: '하한가', category: '📖 기초/시황 용어', description: '하루 동안 주가가 내릴 수 있는 최저 한도 (한국 기준 -30%).' },
  { term: 'VI', category: '📖 기초/시황 용어', description: '주가가 급격하게 변동할 때 2분간 단일가 매매로 전환하여 열기를 식히는 안전 장치.' },
  { term: '변동성완화장치', category: '📖 기초/시황 용어', description: '주가가 급격하게 변동할 때 2분간 단일가 매매로 전환하여 열기를 식히는 안전 장치 (VI와 동일).' },
  { term: '시간외 단일가', category: '📖 기초/시황 용어', description: '16시~18시까지 10분 단위로 주문을 모아 체결시키는 정규장 이후의 시장.' },
  { term: '갭상승', category: '📖 기초/시황 용어', description: '개장 시초가가 전일 종가보다 훌쩍 뛰어서 시작하는 현상. (강한 호재 반영)' },
  { term: '갭하락', category: '📖 기초/시황 용어', description: '개장 시초가가 전일 종가보다 크게 떨어져서 시작하는 현상. (강한 악재 반영)' },
  { term: '예수금', category: '📖 기초/시황 용어', description: '주식을 사기 위해 증권 계좌에 넣어둔 현금.' },
  { term: '미수금', category: '📖 기초/시황 용어', description: '주식을 살 때 돈이 부족해 증권사에서 빌린 돈. 3일 내에 갚지 않으면 반대매매가 나감.' },
  { term: '반대매매', category: '📖 기초/시황 용어', description: '미수금이나 신용융자를 기한 내 갚지 못했을 때, 증권사가 강제로 주식을 팔아버리는 것.' },
  
  // 카테고리 2: 📈 차트/지표 보는 법
  { term: '양봉', category: '📈 차트/지표 보는 법', description: '종가가 시초가보다 높게 끝난 캔들. (보통 빨간색)' },
  { term: '음봉', category: '📈 차트/지표 보는 법', description: '종가가 시초가보다 낮게 끝난 캔들. (보통 파란색)' },
  { term: '윗꼬리', category: '📈 차트/지표 보는 법', description: '장중 고점까지 올랐다가 매도세에 밀려 가격이 내려온 흔적.' },
  { term: '밑꼬리', category: '📈 차트/지표 보는 법', description: '장중 저점까지 내렸다가 매수세가 들어와 가격이 올라간 흔적.' },
  { term: '이동평균선', category: '📈 차트/지표 보는 법', description: '일정 기간 동안의 주가 평균을 연결한 선. (이평선)' },
  { term: '이평선', category: '📈 차트/지표 보는 법', description: '일정 기간 동안의 주가 평균을 연결한 선. (이동평균선)' },
  { term: '정배열', category: '📈 차트/지표 보는 법', description: '단기 이동평균선이 장기 이동평균선 위에 차례대로 놓인 상태. (강한 상승 추세)' },
  { term: '역배열', category: '📈 차트/지표 보는 법', description: '단기 이동평균선이 장기 이동평균선 아래에 차례대로 놓인 상태. (강한 하락 추세)' },
  { term: '골든크로스', category: '📈 차트/지표 보는 법', description: '단기 이동평균선이 장기 이동평균선을 아래에서 위로 뚫고 올라가는 강세 신호.' },
  { term: '데드크로스', category: '📈 차트/지표 보는 법', description: '단기 이동평균선이 장기 이동평균선을 위에서 아래로 뚫고 내려가는 약세 신호.' },
  { term: '지지선', category: '📈 차트/지표 보는 법', description: '주가가 하락하다가 더 이상 떨어지지 않고 버티는 가격대.' },
  { term: '저항선', category: '📈 차트/지표 보는 법', description: '주가가 상승하다가 더 이상 오르지 못하고 부딪히는 가격대.' },
  { term: '거래량', category: '📈 차트/지표 보는 법', description: '주식이 매매된 수량. 주가의 신뢰도를 판단하는 핵심 지표.' },

  // 카테고리 3: ⚔️ 실전 매매 기법
  { term: '스캘핑', category: '⚔️ 실전 매매 기법', description: '수 초~수 분 단위로 극히 짧은 시간에 매매를 반복해 얇은 수익을 챙기는 극초단타 기법.' },
  { term: '눌림목', category: '⚔️ 실전 매매 기법', description: '주가가 상승 추세에서 이익 실현 매물로 인해 일시적으로 하락하며 쉬어가는 구간. (매수 적기)' },
  { term: '돌파매매', category: '⚔️ 실전 매매 기법', description: '주가가 의미 있는 저항선(이전 고점 등)을 강한 거래량과 함께 뚫고 올라갈 때 매수하는 기법.' },
  { term: '돌파', category: '⚔️ 실전 매매 기법', description: '주가가 의미 있는 저항선을 강한 거래량과 함께 뚫고 올라가는 현상.' },
  { term: '종가배팅', category: '⚔️ 실전 매매 기법', description: '장이 끝나기 직전(종가 부근)에 주식을 사서 다음 날 아침 시초가에 파는 기법. (종베)' },
  { term: '종베', category: '⚔️ 실전 매매 기법', description: '장이 끝나기 직전(종가 부근)에 주식을 사서 다음 날 아침 시초가에 파는 기법. (종가배팅)' },
  { term: '뇌동매매', category: '⚔️ 실전 매매 기법', description: '자신의 원칙 없이 남들이 사니까 따라 사거나, 급등하는 주식을 충동적으로 추격 매수하는 행위.' },
  { term: '손절매', category: '⚔️ 실전 매매 기법', description: '주가가 떨어져 손해를 보고 있지만, 더 큰 손실을 막기 위해 주식을 파는 행위. (손절)' },
  { term: '손절', category: '⚔️ 실전 매매 기법', description: '주가가 떨어져 손해를 보고 있지만, 더 큰 손실을 막기 위해 주식을 파는 행위. (손절매)' },
  { term: '물타기', category: '⚔️ 실전 매매 기법', description: '내가 산 주식의 가격이 떨어질 때, 평균 매수 단가를 낮추기 위해 추가로 매수하는 행위.' },
  { term: '불타기', category: '⚔️ 실전 매매 기법', description: '내가 산 주식의 가격이 오를 때, 수익금을 극대화하기 위해 추가로 매수하는 행위.' }
];

const renderTextWithTooltips = (text: string) => {
  if (!text) return null;
  
  const dict: Record<string, string> = {};
  trainingData.forEach(item => {
    dict[item.term] = item.description;
  });

  // Sort keys by length descending to match longer phrases first
  const terms = Object.keys(dict).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${terms.join('|')})`, 'g');
  
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (dict[part]) {
          return (
            <span key={i} className="underline decoration-dotted decoration-slate-400 cursor-help relative group inline-block">
              {part}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-lg">
                {dict[part]}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
              </span>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

interface StockData {
  id: string;
  name: string;
  price: number;
  changePrice: number;
  changeRate: number;
  volIncr: number;
  volume: number;
  highLow: number;
  high52: number;
  dayHigh: number;
  dayLow: number;
  afterHoursPrice?: number;
  afterHoursRate?: number;
  afterHoursVol?: number;
}

interface AiAnalysisResult {
  companyOverview?: string;
  todayMomentum?: string;
  afterHoursPrice?: number;
  afterHoursRate?: number;
  afterHoursVol?: number;
  strategy: string;
  score: number;
  status: '빨간불' | '노란불' | '초록불';
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  analysis: string;
}

type TabType = 'volume' | 'recommended' | 'gainers' | 'under10k' | 'afterHours' | 'search' | 'newsPick' | 'etf' | 'training';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('volume');
  const [keyword, setKeyword] = useState('');
  const [searchStockId, setSearchStockId] = useState('');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{name: string, id: string}[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [budget, setBudget] = useState<number | ''>('');

  const [timeLeft, setTimeLeft] = useState(60);
  const [news, setNews] = useState<string[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsPicksCache, setNewsPicksCache] = useState<{name: string, code: string}[]>([]);

  const [error, setError] = useState<string>('');
  
  const [etfBudget, setEtfBudget] = useState<number | ''>('');
  const [etfPortfolio, setEtfPortfolio] = useState<any>(null);
  const [isEtfLoading, setIsEtfLoading] = useState(false);

  const [trainingSearchTerm, setTrainingSearchTerm] = useState('');
  const [trainingCategory, setTrainingCategory] = useState<string>('전체');

  const filteredTrainingData = trainingData.filter(item => {
    const matchesSearch = item.term.includes(trainingSearchTerm) || item.description.includes(trainingSearchTerm);
    const matchesCategory = trainingCategory === '전체' || item.category === trainingCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    { id: 'volume', label: '거래량 급증', icon: Activity },
    { id: 'recommended', label: '당일 추천주', icon: Target },
    { id: 'gainers', label: '당일 급등주', icon: TrendingUp },
    { id: 'under10k', label: '1만원 이하 타점', icon: DollarSign },
    { id: 'afterHours', label: '시간외 급등(NXT)', icon: Clock },
    { id: 'newsPick', label: '📰 AI 뉴스 픽', icon: Sparkles },
    { id: 'etf', label: '💰 월배당 ETF 포트폴리오', icon: DollarSign },
    { id: 'training', label: '🎓 실전 훈련소', icon: BookOpen },
  ] as const;

  useEffect(() => {
    if (activeTab === 'etf' || activeTab === 'training') return;
    fetchStocks(activeTab, activeTab === 'search' ? (searchStockId || keyword) : '', activeTab === 'search' ? keyword : '');
    setTimeLeft(60);
  }, [activeTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (activeTab !== 'etf' && activeTab !== 'training') {
            fetchStocks(activeTab, activeTab === 'search' ? (searchStockId || keyword) : '', activeTab === 'search' ? keyword : '');
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab, keyword, searchStockId]);

  const fetchNews = async () => {
    setIsNewsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "너는 네이버 증권 등 국내 주요 금융 포털의 데스크 편집장이야. 최근 1시간 이내에 발생한 속보 중에서, 현재 한국 증시(코스피/코스닥) 수급과 테마주 흐름에 가장 강력한 영향을 미치는 핵심 경제/산업 뉴스 딱 3가지만 선정해. 찌라시는 제외하고 팩트 기반으로 1줄씩 아주 간결하고 임팩트 있게 요약해 줘.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["news"]
          }
        }
      });
      let jsonStr = response.text || "{}";
      const parsed = JSON.parse(jsonStr);
      if (parsed.news && Array.isArray(parsed.news)) {
        setNews(parsed.news);
      }
    } catch (e) {
      console.error('Failed to fetch news', e);
      setNews(["뉴스 데이터를 불러오는데 실패했습니다."]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [news]);

  const fetchStocks = async (type: TabType, searchKeyword: string = '', searchName: string = '') => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/stock?type=${type}&keyword=${encodeURIComponent(searchKeyword)}&name=${encodeURIComponent(searchName)}`;
      
      if (type === 'newsPick') {
        let picks = [...newsPicksCache];
        
        if (picks.length === 0) {
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error('Gemini API 키가 설정되지 않았습니다.');
          }
          const ai = new GoogleGenAI({ apiKey });
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "현재 한국 증시에 가장 큰 영향을 미치는 최신 경제/산업/테마 뉴스 3~4가지를 폭넓게 분석해. 그리고 그 뉴스들과 직접적으로 연관되어 오늘 당장 수급이 몰릴 수 있는 수혜주(단타에 적합한 변동성 있는 종목)를 최소 20개에서 최대 25개까지 넉넉하게 발굴해. 반드시 종목명과 6자리 종목 코드를 짝지어서 JSON 배열로 출력해.",
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  picks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        code: { type: Type.STRING }
                      },
                      required: ["name", "code"]
                    }
                  }
                },
                required: ["picks"]
              }
            }
          });

          let jsonStr = response.text || "{}";
          const parsed = JSON.parse(jsonStr);
          picks = parsed.picks || [];
          
          if (picks.length > 0) {
            setNewsPicksCache(picks);
          }
        }
        
        if (picks.length === 0) {
          setStocks([]);
          setLoading(false);
          return;
        }
        
        url = `/api/stock?type=newsPick&keyword=${encodeURIComponent(JSON.stringify(picks))}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch');
      }
      const data = await res.json();
      setStocks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!keyword.trim()) return;
    setActiveTab('search');
    fetchStocks('search', keyword, keyword);
    setTimeLeft(60);
  };

  const handleAnalyze = async (stock: StockData) => {
    setSelectedStock(stock);
    setAiAnalysis(null);
    setAiError('');
    setAiLoading(true);
    setBudget('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
당신은 여의도와 월스트리트에서 10년 이상 살아남은 상위 0.1% 실전 단타(Scalping & Day Trading) 전문 퀀트 트레이더입니다.
아래 제공된 실시간 데이터를 바탕으로, 두루뭉술한 설명은 철저히 배제하고 '1% 단타'에 특화된 극도로 구체적인 차트 흐름 유추와 실전 매매 기법을 제시하세요.

종목명: ${stock.name} (종목코드: ${stock.id})
현재가: ${stock.price.toLocaleString()}원
등락률: ${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%
거래량 증가율: ${stock.volIncr}%

[필수 지시사항]
1. 분석 대상 종목이 무엇을 생산/서비스하는 회사인지, 핵심 기술이나 주요 고객사는 어디인지 파악하여 'companyOverview' 필드에 2줄로 요약해 주세요.
2. 이 종목이 최근 시장에서 어떤 테마나 뉴스로 엮여서 수급(거래량)이 몰리고 있는지, '오늘의 상승 명분(모멘텀)'을 파악하여 'todayMomentum' 필드에 1줄 핵심 키워드 위주로 요약해 주세요.
3. 반드시 아래 4가지 전략 중 1가지만을 선택하여 "strategy" 필드에 기입:
   - "수급 돌파 매매", "눌림목 매매", "종가 배팅", "관망"
4. 'analysis' 필드 작성 가이드: 뻔한 소리는 배제하고, 반드시 아래 3단락 구조로 300자 이상 상세히 작성할 것. (마크다운 불릿 사용)
   - 📊 [수급/차트 분석]: 현재 주가와 거래량 급증을 토대로 분봉상의 지지/저항선 돌파 여부, 세력 매집/이탈 흐름 논리적 유추.
   - 🎯 [추천 단타 기법]: 예) "오전장 전고점 돌파 시 시장가 진입", "단기 이평선 이탈 후 투매 나올 때 밑꼬리 매수" 등 구체적 기법 제시.
   - ⚠️ [실전 시나리오]: 돌파 실패 시 손절 타이밍, 분할 매수/매도 등 정확한 액션 플랜.

응답은 반드시 아래의 JSON 구조와 정확히 일치해야 합니다:
{
  "companyOverview": "기업 개요 요약 텍스트",
  "todayMomentum": "오늘의 급등 테마 및 상승 명분 텍스트",
  "strategy": "전략명",
  "score": 85,
  "status": "빨간불/노란불/초록불",
  "entryPrice": "00,000원",
  "targetPrice": "00,000원",
  "stopLoss": "00,000원",
  "analysis": "위에서 지시한 3단락 구조의 상세한 분석 내용"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              companyOverview: { type: Type.STRING },
              todayMomentum: { type: Type.STRING },
              strategy: { type: Type.STRING },
              score: { type: Type.INTEGER },
              status: { type: Type.STRING },
              entryPrice: { type: Type.STRING },
              targetPrice: { type: Type.STRING },
              stopLoss: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["companyOverview", "todayMomentum", "strategy", "score", "status", "entryPrice", "targetPrice", "stopLoss", "analysis"]
          }
        }
      });

      let text = response.text || '{}';
      text = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(text);
        if (!['빨간불', '노란불', '초록불'].includes(jsonResponse.status)) {
          jsonResponse.status = jsonResponse.score >= 80 ? '빨간불' : (jsonResponse.score >= 50 ? '노란불' : '초록불');
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw text:', text);
        jsonResponse = {
          strategy: "분석 불가",
          score: 0,
          status: "노란불",
          entryPrice: "분석 불가",
          targetPrice: "분석 불가",
          stopLoss: "분석 불가",
          analysis: "AI 응답을 파싱하는 데 실패했습니다. 다시 시도해 주세요."
        };
      }
      
      jsonResponse.afterHoursPrice = stock.afterHoursPrice || 0;
      jsonResponse.afterHoursRate = stock.afterHoursRate || 0;
      jsonResponse.afterHoursVol = stock.afterHoursVol || 0;
      
      setAiAnalysis(jsonResponse);
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      setAiError(error.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEtfSubmit = async () => {
    if (!etfBudget) return;
    setIsEtfLoading(true);
    setEtfPortfolio(null);
    setError('');
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
당신은 월스트리트의 고배당(High Yield) 및 인컴(Income) 투자 전문 포트폴리오 매니저입니다.
고객이 제시한 투자 자본금은 ${etfBudget}원입니다. 고객은 이미 S&P500에 별도로 장기 투자를 하고 있으므로, 이 자본금은 철저하게 '매월 극대화된 현금 흐름'을 창출하는 데 쓰여야 합니다.

[필수 종목 선정 가이드]
1. 연배당률 7% ~ 12% (월 0.6% ~ 1.0%) 수준의 고배당 월배당 ETF로만 구성하세요.
2. 한국 증권사 앱에서 원화로 쉽게 매수할 수 있는 '국내 상장 해외 ETF' (예: TIGER 미국배당+7%프리미엄다우존스, KODEX 미국배당프리미엄액티브, TIGER 미국테크TOP10+10%프리미엄 등)를 최우선으로 추천하세요.
3. 단순 배당 성장이 아닌 '커버드콜(Covered Call)' 전략이나 '프리미엄'이 붙은 고배당 종목 3개를 조합해 배분 비율(allocationPercent)을 정해주세요.

응답은 반드시 아래 JSON 스키마를 정확히 지켜야 합니다:
{
  "portfolio": [
    {
      "ticker": "종목코드 6자리 (예: 458730)",
      "name": "ETF 정확한 한글 명칭",
      "allocationPercent": 40,
      "amount": (자본금 기준 배정 금액),
      "monthlyDividendEstimate": (해당 금액 매수 시 예상되는 세전 '월' 배당금 원화)
    }
  ],
  "totalMonthlyDividend": (전체 포트폴리오의 총 예상 월 배당금 원화),
  "strategySummary": "이 고배당 커버드콜 포트폴리오의 장점과, 기존 S&P500 투자와 시너지를 내는 이유 (3줄 요약)"
}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              portfolio: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ticker: { type: Type.STRING },
                    name: { type: Type.STRING },
                    allocationPercent: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                    monthlyDividendEstimate: { type: Type.NUMBER }
                  },
                  required: ["ticker", "name", "allocationPercent", "amount", "monthlyDividendEstimate"]
                }
              },
              totalMonthlyDividend: { type: Type.NUMBER },
              strategySummary: { type: Type.STRING }
            },
            required: ["portfolio", "totalMonthlyDividend", "strategySummary"]
          }
        }
      });

      let jsonStr = response.text || "{}";
      const parsedData = JSON.parse(jsonStr);
      setEtfPortfolio(parsedData);
    } catch (err: any) {
      setError(err.message || 'ETF 포트폴리오 생성 중 오류가 발생했습니다.');
    } finally {
      setIsEtfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">매일 1% 단타 추적기</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                setTimeLeft(60);
                fetchStocks(activeTab, activeTab === 'search' ? (searchStockId || keyword) : '', activeTab === 'search' ? keyword : '');
              }}
              className="text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
            >
              ⏳ 자동 갱신: {timeLeft}초
            </button>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
              초보자 맞춤형 안전 제일주의
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Real-time Stock Briefing */}
        {(news.length > 0 || isNewsLoading) && (
          <div className="mb-6 bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-bold tracking-tight">📰 AI 실시간 증시 브리핑</h2>
              <button
                onClick={fetchNews}
                disabled={isNewsLoading}
                className="p-1.5 rounded-full hover:bg-slate-800 transition-colors ml-1 disabled:opacity-50"
                title="뉴스 새로고침"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${isNewsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="h-6 border-l border-slate-700 mx-2 hidden sm:block"></div>
            <div className="text-slate-300 text-sm truncate flex-1 transition-opacity duration-500 w-full sm:w-auto">
              {news.length > 0 ? news[currentNewsIndex] : "뉴스를 불러오는 중입니다..."}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 flex gap-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="종목명 또는 6자리 종목코드 입력"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setSearchStockId('');
                if (e.target.value) {
                  fetch(`/api/stock?type=autocomplete&keyword=${encodeURIComponent(e.target.value)}`)
                    .then(res => res.json())
                    .then(data => {
                      setSuggestions(data);
                      setIsDropdownOpen(true);
                    })
                    .catch(() => setSuggestions([]));
                } else {
                  setSuggestions([]);
                  setIsDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setIsDropdownOpen(true);
              }}
              onBlur={() => {
                setTimeout(() => setIsDropdownOpen(false), 200);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {isDropdownOpen && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <li
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      setKeyword(item.name);
                      setSearchStockId(item.id);
                      setIsDropdownOpen(false);
                      setActiveTab('search');
                      fetchStocks('search', item.id, item.name);
                    }}
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{item.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            검색
          </button>
        </div>

        {/* Tabs and Autocomplete Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap justify-start gap-2 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'training' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">🎓 실전 훈련소</h2>
              <p className="text-slate-500 text-sm">단타 핵심 용어와 매매 기법을 정독하고 실전에 대비하세요.</p>
            </div>
            
            {/* Search and Filter */}
            <div className="mb-8 max-w-3xl mx-auto space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={trainingSearchTerm}
                  onChange={(e) => setTrainingSearchTerm(e.target.value)}
                  placeholder="궁금한 주식 용어나 기법을 검색해보세요 (예: 눌림목, 공매도)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['전체', '📖 기초/시황 용어', '📈 차트/지표 보는 법', '⚔️ 실전 매매 기법'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTrainingCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      trainingCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredTrainingData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainingData.map((item) => (
                  <div key={item.term} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300 group flex flex-col h-full">
                    <div className="text-xs font-bold text-slate-400 mb-2">{item.category}</div>
                    <h3 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      {item.term}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">검색 결과가 없습니다.</p>
                <p className="text-sm mt-1">다른 검색어를 입력하거나 카테고리를 변경해보세요.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'etf' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">월배당 ETF 포트폴리오 생성기</h2>
              <p className="text-slate-500 text-sm">투자 자본금을 입력하시면 AI가 최적의 월배당 ETF 조합을 추천해 드립니다.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-10">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={etfBudget}
                  onChange={(e) => setEtfBudget(e.target.value ? Number(e.target.value) : '')}
                  placeholder="투자 자본금 입력 (원)"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleEtfSubmit()}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">원</span>
              </div>
              <button
                onClick={handleEtfSubmit}
                disabled={isEtfLoading || !etfBudget}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isEtfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI 포트폴리오 구성하기
              </button>
            </div>

            {isEtfLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="font-medium text-lg">Gemini AI가 최적의 월배당 ETF 조합을 계산 중입니다...</p>
                <p className="text-sm mt-2 opacity-70">안정적인 현금 흐름을 위한 포트폴리오를 설계하고 있어요.</p>
              </div>
            )}

            {error && !isEtfLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <AlertCircle className="w-8 h-8 mb-4" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {etfPortfolio && !isEtfLoading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {etfPortfolio.portfolio.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 line-clamp-1" title={item.name}>{item.name}</h3>
                          <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">{item.ticker}</span>
                        </div>
                        <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {item.allocationPercent}%
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">매수 배정 금액</span>
                          <span className="font-bold text-slate-900 font-mono">{item.amount.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200">
                          <span className="text-slate-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" />예상 월 배당금</span>
                          <span className="font-bold text-emerald-600 font-mono">+{item.monthlyDividendEstimate.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-indigo-900 font-bold mb-1 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      총 예상 월 배당금
                    </h3>
                    <p className="text-indigo-600/80 text-sm">투자금 {Number(etfBudget).toLocaleString()}원 기준 세전 예상액</p>
                  </div>
                  <div className="text-3xl font-black text-indigo-700 font-mono bg-white px-6 py-3 rounded-xl shadow-sm border border-indigo-100">
                    {etfPortfolio.totalMonthlyDividend.toLocaleString()}원
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    포트폴리오 전략 요약
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                    {etfPortfolio.strategySummary}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">종목명</th>
                  <th className="p-4 text-right">현재가</th>
                  <th className="p-4 text-right">전일비</th>
                  <th className="p-4 text-right">등락률</th>
                  <th className="p-4 text-right">거래량</th>
                  <th className="p-4 text-center">분석</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {activeTab === 'newsPick' 
                        ? 'AI가 실시간 뉴스를 분석하여 숨겨진 수혜주를 발굴하고 있습니다...' 
                        : '데이터를 불러오는 중입니다...'}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-red-500">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-bold mb-2">{error}</div>
                      {error.includes('KIS_APP_KEY') && (
                        <div className="text-sm text-slate-600 mt-4 bg-red-50 p-4 rounded-lg inline-block text-left border border-red-100">
                          <p className="font-bold text-red-700 mb-2">🛠️ API 키 설정 가이드:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>한국투자증권(KIS) 개발자 센터에서 API Key 발급</li>
                            <li>AI Studio 우측 상단의 <strong>Settings (톱니바퀴)</strong> 클릭</li>
                            <li><strong>Secrets</strong> 섹션에 다음 환경변수 추가:
                              <ul className="list-disc list-inside ml-4 mt-1 text-slate-500 font-mono text-xs">
                                <li>KIS_APP_KEY = 발급받은 App Key</li>
                                <li>KIS_APP_SECRET = 발급받은 App Secret</li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      해당 조건에 맞는 종목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{stock.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{stock.id}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono font-medium text-slate-900">{stock.price.toLocaleString()}원</div>
                        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>{stock.dayLow.toLocaleString()}</span>
                          <div className="relative w-16 h-1.5 bg-slate-200 rounded-full">
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-sm" 
                              style={{ 
                                left: `calc(${Math.max(0, Math.min(100, stock.dayHigh === stock.dayLow ? 50 : ((stock.price - stock.dayLow) / (stock.dayHigh - stock.dayLow)) * 100))}% - 4px)` 
                              }} 
                            />
                          </div>
                          <span>{stock.dayHigh.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono font-medium ${
                        stock.changePrice > 0 ? 'text-red-600' : stock.changePrice < 0 ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        {stock.changePrice > 0 ? '▲ ' : stock.changePrice < 0 ? '▼ ' : '- '}
                        {Math.abs(stock.changePrice).toLocaleString()}원
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${
                        stock.changeRate > 0 ? 'text-red-600' : stock.changeRate < 0 ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-red-500 font-bold font-mono">{stock.volIncr}%</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">{stock.volume?.toLocaleString() || 0}주</div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleAnalyze(stock)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI 족집게 분석
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </main>

      {/* AI Analysis Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-1.5 rounded-md">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{selectedStock.name} <span className="text-sm font-normal text-slate-500 font-mono ml-1">{selectedStock.id}</span></h2>
                  <p className="text-xs text-slate-500">AI 족집게 단타 분석 리포트</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                  <p className="font-medium">Gemini AI가 실시간 수급과 차트를 분석 중입니다...</p>
                  <p className="text-sm mt-2 opacity-70">초보자를 위한 안전한 타점을 계산하고 있어요.</p>
                </div>
              ) : aiError ? (
                <div className="flex flex-col items-center justify-center py-12 text-red-500">
                  <AlertCircle className="w-8 h-8 mb-4" />
                  <p className="font-medium">{aiError}</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-6">
                  {/* Score & Status */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full animate-pulse ${
                          aiAnalysis.score >= 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' :
                          aiAnalysis.score >= 40 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' :
                          'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.6)]'
                        }`} />
                        <span className="font-bold text-slate-700 text-lg">
                          {aiAnalysis.score >= 80 ? '🔴 빨간불 (과열/추격 금지)' :
                           aiAnalysis.score >= 40 ? '🟢 초록불 (타점/매수 적기)' :
                           '⚪ 회색불 (관망/수급 부족)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900">{aiAnalysis.score}</span>
                        <span className="text-sm text-slate-500 ml-1">/ 100점</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          aiAnalysis.score >= 80 ? 'bg-red-500' :
                          aiAnalysis.score >= 40 ? 'bg-green-500' :
                          'bg-slate-400'
                        }`}
                        style={{ width: `${aiAnalysis.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-slate-400 font-bold">관망 (0~39)</span>
                      <span className="text-green-500 font-bold">타점 (40~79)</span>
                      <span className="text-red-500 font-bold">과열 (80~100)</span>
                    </div>
                    
                    {/* Strategy Badge */}
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200">
                      <Target className="w-4 h-4" /> AI 추천 타점 전략: {renderTextWithTooltips(aiAnalysis.strategy)}
                    </div>
                  </div>

                  {(aiAnalysis.companyOverview || aiAnalysis.todayMomentum) && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 flex flex-col gap-3">
                      {aiAnalysis.companyOverview && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-1 flex items-center">
                            🏢 기업 핵심 엑스레이
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {renderTextWithTooltips(aiAnalysis.companyOverview)}
                          </p>
                        </div>
                      )}
                      {aiAnalysis.todayMomentum && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-100">
                          <h4 className="text-xs font-bold text-blue-700 mb-1 flex items-center">
                            🔥 오늘의 급등 모멘텀 (테마)
                          </h4>
                          <p className="text-sm text-blue-800 font-medium">
                            {renderTextWithTooltips(aiAnalysis.todayMomentum)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real-time Dual Charts */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      📈 실시간 듀얼 차트 분석
                    </h3>
                    <div className="flex flex-col gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2">📈 당일 분봉 흐름</h4>
                        <img 
                          src={`https://ssl.pstatic.net/imgfinance/chart/item/area/day/${selectedStock.id}.png`} 
                          alt="당일 분봉 흐름" 
                          className="w-full h-auto rounded-xl border border-slate-200 object-contain bg-white p-2" 
                        />
                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold px-2 py-1 bg-indigo-600 text-white rounded-md shadow-sm">🌙 야간/시간외 단일가</span>
                            <span className="text-sm font-semibold text-slate-700">실시간 흐름</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xl font-bold ${aiAnalysis.afterHoursRate! > 0 ? 'text-red-600' : aiAnalysis.afterHoursRate! < 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                              {aiAnalysis.afterHoursPrice! > 0 ? `${aiAnalysis.afterHoursPrice!.toLocaleString()}원` : '데이터 집계중'}
                              {aiAnalysis.afterHoursRate !== 0 ? <span className="text-sm ml-1">({aiAnalysis.afterHoursRate! > 0 ? '+' : ''}{aiAnalysis.afterHoursRate}%)</span> : null}
                            </span>
                            <div className="text-xs text-slate-500 mt-1 font-mono">
                              {aiAnalysis.afterHoursVol! > 0 ? `${aiAnalysis.afterHoursVol!.toLocaleString()}주 거래됨` : '현재 거래량 없음'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2">📊 일봉 캔들 추세</h4>
                        <img 
                          src={`https://ssl.pstatic.net/imgfinance/chart/item/candle/day/${selectedStock.id}.png`} 
                          alt="일봉 캔들 추세" 
                          className="w-full h-auto rounded-xl border border-slate-200 object-contain bg-white p-2" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="text-indigo-600 text-xs font-bold mb-1 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> 진입 타점
                      </div>
                      <div className="text-xl font-black text-slate-900">{aiAnalysis.entryPrice}</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-emerald-600 text-xs font-bold mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> 1% 익절가
                      </div>
                      <div className="text-xl font-black text-slate-900">{aiAnalysis.targetPrice}</div>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <div className="text-rose-600 text-xs font-bold mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> 절대 손절가
                      </div>
                      <div className="text-xl font-black text-slate-900">{aiAnalysis.stopLoss}</div>
                    </div>
                  </div>

                  {/* Budget Calculator */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      소액 투자금 계산기
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative w-full sm:w-1/2">
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                          placeholder="나의 1회 매수 예산 (원)"
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">원</span>
                      </div>
                      <div className="w-full sm:w-1/2 bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100 flex items-center justify-center min-h-[46px]">
                        {budget && aiAnalysis.entryPrice ? (
                          <span className="text-indigo-700 font-bold text-sm">
                            👉 안전 진입 물량: 딱 <span className="text-lg text-indigo-900 mx-1">
                              {Math.floor(Number(budget) / (Number(aiAnalysis.entryPrice.replace(/[^0-9]/g, '')) || 1)).toLocaleString()}
                            </span>주만 매수하세요!
                          </span>
                        ) : (
                          <span className="text-indigo-400 text-sm font-medium">예산을 입력하면 매수 물량을 계산해드려요.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Text */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      AI 뼈때리는 분석
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {renderTextWithTooltips(aiAnalysis.analysis)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
              본 분석은 Gemini AI에 의해 생성되었으며, 투자의 최종 책임은 본인에게 있습니다. 뇌동매매를 주의하세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
