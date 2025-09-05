export interface User {
  _id: string;
  name: string;
  email: string;
  country: string;
  coins: number;
  totalCoinsEarned: number;
  totalEngagementTime: number;
  isActive: boolean;
  role: 'user' | 'admin';
  registrationDate: string;
  lastActiveAt: string;
  paypalEmail?: string;
}

export interface GameSession {
  _id: string;
  userId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  coinsEarned: number;
  gameStats: {
    ballsDropped: number;
    successfulHits: number;
    highestScore: number;
    levelsCompleted: number;
  };
  isCompleted: boolean;
}

export interface Payout {
  _id: string;
  userId: User;
  amount: number;
  coinsDeducted: number;
  paypalEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paypalTransactionId?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  netAmount: number;
  conversionRate: number;
  adminNotes?: string;
  fees: {
    paypalFee: number;
    platformFee: number;
  };
}

export interface AdReward {
  _id: string;
  adType: 'rewarded_video' | 'interstitial' | 'banner';
  adUnitId: string;
  adUnitName: string;
  coinReward: number;
  isActive: boolean;
  description?: string;
  minimumWatchTime?: number;
  dailyLimit?: number;
  createdAt: string;
  requirements?: {
    minLevel?: number;
    cooldownMinutes?: number;
  };
  analytics?: {
    totalViews: number;
    totalRewardsGiven: number;
    totalCoinsDistributed: number;
  };
}

export interface CoinTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newYesterday: number;
    growthRate: number;
  };
  coins: {
    totalDistributed: number;
    distributedToday: number;
    distributedThisMonth: number;
    conversionRate: number;
  };
  payouts: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
  gaming: {
    activeSessions: number;
    totalSessions: number;
  };
  topCountries: Array<{
    country: string;
    users: number;
  }>;
  system: {
    activeAdRewards: number;
    todayAdViews: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
