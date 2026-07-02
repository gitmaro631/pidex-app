const KEYS = {
  ARB_COUNT:   'arb_count',
  ARB_DATE:    'arb_date',
  SUB_EXPIRY:  'sub_expiry',
};

export const FREE_DAILY_LIMIT = 30;
export const SUBSCRIBED_DAILY_LIMIT = 100;

export function getDailyArbCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(KEYS.ARB_DATE) !== today) {
    localStorage.setItem(KEYS.ARB_DATE, today);
    localStorage.setItem(KEYS.ARB_COUNT, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(KEYS.ARB_COUNT) ?? '0');
}

export function incrementArbCount() {
  const count = getDailyArbCount() + 1;
  localStorage.setItem(KEYS.ARB_COUNT, String(count));
  return count;
}

export function canUseArbitrage() {
  const count = getDailyArbCount();
  if (isSubscribed()) return count < SUBSCRIBED_DAILY_LIMIT;
  return count < FREE_DAILY_LIMIT;
}

export function remainingFreeUses() {
  const count = getDailyArbCount();
  if (isSubscribed()) return Math.max(0, SUBSCRIBED_DAILY_LIMIT - count);
  return Math.max(0, FREE_DAILY_LIMIT - count);
}

export function isSubscribed() {
  const expiry = localStorage.getItem(KEYS.SUB_EXPIRY);
  if (!expiry) return false;
  return new Date(expiry) > new Date();
}

export function setSubscription(months = 1) {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  localStorage.setItem(KEYS.SUB_EXPIRY, expiry.toISOString());
}

export function getSubscriptionExpiry() {
  return localStorage.getItem(KEYS.SUB_EXPIRY);
}
