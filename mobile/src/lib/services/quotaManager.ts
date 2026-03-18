import AsyncStorage from '@react-native-async-storage/async-storage';

const QUOTA_STORE_KEY = '@vf_quota_tracker';

const LIMITS = {
  OCR_MONTHLY: 200,
  AI_MONTHLY: 10,
};

interface QuotaData {
  month: string;
  ocrCount: number;
  aiCount: number;
  pro: boolean;
}

async function getQuotaData(): Promise<QuotaData> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const raw = await AsyncStorage.getItem(QUOTA_STORE_KEY);
    if (raw) {
      const data: QuotaData = JSON.parse(raw);
      if (data.month !== currentMonth) {
        return { month: currentMonth, ocrCount: 0, aiCount: 0, pro: data.pro ?? false };
      }
      return data;
    }
  } catch (e) {
    console.warn('Quota check failed', e);
  }

  return { month: currentMonth, ocrCount: 0, aiCount: 0, pro: false };
}

async function saveQuotaData(data: QuotaData): Promise<void> {
  await AsyncStorage.setItem(QUOTA_STORE_KEY, JSON.stringify(data));
}

export async function canMakeOcrCall(): Promise<boolean> {
  const data = await getQuotaData();
  if (data.pro) return true;
  return data.ocrCount < LIMITS.OCR_MONTHLY;
}

export async function incrementOcrCall(): Promise<void> {
  const data = await getQuotaData();
  data.ocrCount += 1;
  await saveQuotaData(data);
}

export async function canMakeAiCall(): Promise<boolean> {
  const data = await getQuotaData();
  if (data.pro) return true;
  return data.aiCount < LIMITS.AI_MONTHLY;
}

export async function incrementAiCall(): Promise<void> {
  const data = await getQuotaData();
  data.aiCount += 1;
  await saveQuotaData(data);
}

export async function getRemainingQuotas(): Promise<{
  ocrRemaining: number;
  aiRemaining: number;
  pro: boolean;
}> {
  const data = await getQuotaData();
  return {
    ocrRemaining: data.pro ? 999 : Math.max(0, LIMITS.OCR_MONTHLY - data.ocrCount),
    aiRemaining: data.pro ? 999 : Math.max(0, LIMITS.AI_MONTHLY - data.aiCount),
    pro: data.pro,
  };
}
