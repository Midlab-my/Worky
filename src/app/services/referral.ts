export const MATCH_FREE_LIMIT = 3;
export const REFERRAL_GOAL = 3;
export const REFERRAL_BONUS_MATCHES = 2;

function storageKey(userId: string, suffix: string) {
  return `worky:${suffix}:${userId}`;
}

export function getReferralCode(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "worky";
}

export function getReferralLink(userId: string): string {
  const code = getReferralCode(userId);
  return `${window.location.origin}/auth?ref=${code}`;
}

export function getReferralProgress(userId: string): number {
  const raw = localStorage.getItem(storageKey(userId, "referral-progress"));
  return raw ? Math.min(REFERRAL_GOAL, Number(raw)) : 0;
}

export function registerReferralShare(userId: string): number {
  const next = Math.min(REFERRAL_GOAL, getReferralProgress(userId) + 1);
  localStorage.setItem(storageKey(userId, "referral-progress"), String(next));
  return next;
}

export type MatchQuota = { used: number; limit: number };

export function getMatchQuota(userId: string): MatchQuota {
  const used = Number(localStorage.getItem(storageKey(userId, "match-used")) || 0);
  const bonus = Number(localStorage.getItem(storageKey(userId, "match-bonus")) || 0);
  return { used, limit: MATCH_FREE_LIMIT + bonus };
}

export function registerMatchUsage(userId: string): MatchQuota {
  const { used } = getMatchQuota(userId);
  localStorage.setItem(storageKey(userId, "match-used"), String(used + 1));
  return getMatchQuota(userId);
}

export function grantBonusMatches(userId: string, amount: number = REFERRAL_BONUS_MATCHES): MatchQuota {
  const bonusKey = storageKey(userId, "match-bonus");
  const current = Number(localStorage.getItem(bonusKey) || 0);
  localStorage.setItem(bonusKey, String(current + amount));
  return getMatchQuota(userId);
}
