// User Rating Calculation Algorithms
// Based on the comprehensive user rating system design

export interface UserRatingParams {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  likes?: number;
  raterUserId: string;
  status: 'active' | 'deleted' | 'shadow_hidden' | 'moderation_hidden';
}

export interface RaterUserData {
  id: string;
  createdAt: Date;
  isVerified: boolean;
  readingMinutes30d?: number;
  booksAdded30d?: number;
}

export interface UserRatingAlgorithmConfig {
  // Bayesian parameters
  priorMean: number;              // μ0 - Global average (e.g., 7.5)
  priorStrength: number;          // m - Virtual votes (e.g., 20)
  
  // Confidence parameters
  confidenceThreshold: number;    // K - sum_w needed for full confidence (e.g., 30)
  
  // Rater weight parameters
  raterAgeThresholds: {
    youngDays: number;            // < 7 days
    youngMult: number;            // 0.3
    mediumDays: number;           // < 30 days
    mediumMult: number;           // 0.6
    matureMult: number;           // 1.0
  };
  raterVerifiedMult: number;      // 1.10
  raterActivityMult: number;      // 1.05
  raterActivityRules: {
    minReadingMinutes30d: number; // 60
    minBooksAdded30d: number;     // 3
  };
  raterWeightCap: number;         // 1.20
  raterWeightFloor: number;       // 0.20
  
  // Text quality weight parameters
  textEmptyMult: number;          // 0.85
  textLengthRules: {
    shortLength: number;          // 20
    shortMult: number;            // 0.60
    normalMaxLength: number;      // 1200
    normalMult: number;           // 1.00
    longMult: number;             // 0.90
  };
  textSpamMult: number;           // 0.30
  
  // Likes weight parameters
  likesEnabled: boolean;
  likesAlpha: number;             // 0.30
  likesCap: number;               // 2.00
  
  // Time decay parameters (for "recent" rating)
  timeDecayEnabled: boolean;
  timeDecayHalfLifeDays: number;  // 180
  timeDecayMinWeight: number;     // 3.0 - minimum effective weight to show recent rating
}

export const DEFAULT_USER_RATING_CONFIG: UserRatingAlgorithmConfig = {
  priorMean: 7.5,
  priorStrength: 20,
  confidenceThreshold: 30,
  raterAgeThresholds: {
    youngDays: 7,
    youngMult: 0.3,
    mediumDays: 30,
    mediumMult: 0.6,
    matureMult: 1.0,
  },
  raterVerifiedMult: 1.10,
  raterActivityMult: 1.05,
  raterActivityRules: {
    minReadingMinutes30d: 60,
    minBooksAdded30d: 3,
  },
  raterWeightCap: 1.20,
  raterWeightFloor: 0.20,
  textEmptyMult: 0.85,
  textLengthRules: {
    shortLength: 20,
    shortMult: 0.60,
    normalMaxLength: 1200,
    normalMult: 1.00,
    longMult: 0.90,
  },
  textSpamMult: 0.30,
  likesEnabled: true,
  likesAlpha: 0.30,
  likesCap: 2.00,
  timeDecayEnabled: false,
  timeDecayHalfLifeDays: 180,
  timeDecayMinWeight: 3.0,
};

/**
 * Calculate rater weight based on account age, verification, and activity
 */
export function calculateRaterWeight(
  rater: RaterUserData,
  config: UserRatingAlgorithmConfig
): number {
  const now = new Date();
  const accountAgeDays = (now.getTime() - rater.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  let weight = 1.0;
  
  // Account age weight
  if (accountAgeDays < config.raterAgeThresholds.youngDays) {
    weight = config.raterAgeThresholds.youngMult;
  } else if (accountAgeDays < config.raterAgeThresholds.mediumDays) {
    weight = config.raterAgeThresholds.mediumMult;
  } else {
    weight = config.raterAgeThresholds.matureMult;
  }
  
  // Verification bonus
  if (rater.isVerified) {
    weight *= config.raterVerifiedMult;
  }
  
  // Activity bonus
  const hasActivity = 
    (rater.readingMinutes30d || 0) >= config.raterActivityRules.minReadingMinutes30d ||
    (rater.booksAdded30d || 0) >= config.raterActivityRules.minBooksAdded30d;
  
  if (hasActivity) {
    weight *= config.raterActivityMult;
  }
  
  // Apply cap and floor
  weight = Math.max(config.raterWeightFloor, Math.min(weight, config.raterWeightCap));
  
  return weight;
}

/**
 * Calculate text quality weight based on content length and spam detection
 */
export function calculateTextQualityWeight(
  content: string,
  isSpamSuspected: boolean,
  config: UserRatingAlgorithmConfig
): number {
  let weight = 1.0;
  
  // Empty or very short content
  if (!content || content.trim().length === 0) {
    return config.textEmptyMult;
  }
  
  const length = content.trim().length;
  
  // Length-based weight
  if (length < config.textLengthRules.shortLength) {
    weight = config.textLengthRules.shortMult;
  } else if (length <= config.textLengthRules.normalMaxLength) {
    weight = config.textLengthRules.normalMult;
  } else {
    weight = config.textLengthRules.longMult;
  }
  
  // Spam penalty
  if (isSpamSuspected) {
    weight *= config.textSpamMult;
  }
  
  return weight;
}

/**
 * Calculate likes weight using logarithmic formula
 */
export function calculateLikesWeightForUser(
  likes: number,
  config: UserRatingAlgorithmConfig
): number {
  if (!config.likesEnabled) {
    return 1.0;
  }
  
  const weight = 1 + config.likesAlpha * Math.log(1 + likes);
  return Math.min(weight, config.likesCap);
}

/**
 * Calculate time decay weight for recent ratings
 */
export function calculateTimeDecayWeightForUser(
  createdAt: Date,
  config: UserRatingAlgorithmConfig
): number {
  if (!config.timeDecayEnabled) {
    return 1.0;
  }
  
  const now = new Date();
  const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const lambda = Math.log(2) / config.timeDecayHalfLifeDays;
  
  return Math.exp(-lambda * ageDays);
}

/**
 * Calculate combined weight for a single user rating
 */
export function calculateUserRatingWeight(
  rating: UserRatingParams,
  rater: RaterUserData,
  config: UserRatingAlgorithmConfig,
  isSpamSuspected: boolean = false
): number {
  // If rating is not active, weight is 0
  if (rating.status !== 'active') {
    return 0;
  }
  
  const raterWeight = calculateRaterWeight(rater, config);
  const textWeight = calculateTextQualityWeight(rating.content, isSpamSuspected, config);
  const likesWeight = calculateLikesWeightForUser(rating.likes || 0, config);
  const timeWeight = calculateTimeDecayWeightForUser(rating.createdAt, config);
  
  return raterWeight * textWeight * likesWeight * timeWeight;
}

/**
 * Calculate overall user rating using Bayesian weighted average
 */
export function calculateUserRatingOverall(
  ratings: Array<{ rating: UserRatingParams; rater: RaterUserData; weight: number }>,
  config: UserRatingAlgorithmConfig
): { rating: number | null; confidence: number; effectiveN: number } {
  if (ratings.length === 0) {
    return { rating: null, confidence: 0, effectiveN: 0 };
  }
  
  let sumW = 0;
  let sumWX = 0;
  
  for (const { rating, weight } of ratings) {
    sumW += weight;
    sumWX += weight * rating.rating;
  }
  
  // Calculate Bayesian average
  const { priorMean, priorStrength } = config;
  let finalRating: number;
  
  if (sumW <= 0) {
    finalRating = priorMean;
  } else {
    finalRating = (priorStrength * priorMean + sumWX) / (priorStrength + sumW);
  }
  
  // Round to 1 decimal place
  finalRating = Math.round(finalRating * 10) / 10;
  
  // Calculate confidence
  const confidence = Math.min(sumW / config.confidenceThreshold, 1);
  
  return {
    rating: finalRating,
    confidence: Math.round(confidence * 100) / 100,
    effectiveN: Math.round(sumW * 10) / 10,
  };
}

/**
 * Calculate confidence level label
 */
export function getConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence < 0.33) return 'low';
  if (confidence < 0.66) return 'medium';
  return 'high';
}

/**
 * Simple spam detection heuristic
 */
export function detectSpamInComment(content: string): boolean {
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  
  // Check for excessive links
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern) || [];
  if (urls.length > 2) return true;
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-ZА-Я]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) return true;
  
  // Check for repeated characters
  if (/(.)\1{5,}/.test(content)) return true;
  
  // Common spam keywords (expand as needed)
  const spamKeywords = ['купить', 'скидка', 'акция', 'промокод', 'заработок', 'buy', 'sale', 'discount', 'promo'];
  const hasSpamKeyword = spamKeywords.some(keyword => lowerContent.includes(keyword));
  if (hasSpamKeyword && content.length < 50) return true;
  
  return false;
}
