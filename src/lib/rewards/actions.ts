'use server';

// -----------------------------------------------------------------------------
// src/lib/rewards/actions.ts
// ShopSphere Rewards & Loyalty Program Server Actions
// -----------------------------------------------------------------------------

import { getDemoUserAction } from '@/lib/auth/actions';

export interface RewardTransaction {
  id: string;
  userId: string;
  title: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  points: number;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface RewardsSummary {
  availablePoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  tierProgress: number; // percentage to next tier
  nextTierPoints: number;
  monetaryValue: number; // 1 point = 1 INR
  transactions: RewardTransaction[];
}

// In-memory rewards store per user
const memoryRewardsStore: Map<string, RewardTransaction[]> = new Map([
  [
    'usr-demo-customer',
    [
      {
        id: 'tx-rew-001',
        userId: 'usr-demo-customer',
        title: 'Welcome Club Bonus Points',
        type: 'bonus',
        points: 100,
        createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      },
      {
        id: 'tx-rew-002',
        userId: 'usr-demo-customer',
        title: 'Purchase Reward (Order #ORD-20261018-001)',
        type: 'earned',
        points: 269,
        orderNumber: 'ORD-20261018-001',
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
    ],
  ],
]);

/**
 * Retrieve the authenticated customer's reward points summary
 */
export async function getRewardsSummaryAction(): Promise<{
  success: boolean;
  rewards: RewardsSummary;
}> {
  const user = await getDemoUserAction();
  const userId = user?.id || 'guest';

  // Seed default welcome bonus if new user
  if (!memoryRewardsStore.has(userId) && userId !== 'guest') {
    memoryRewardsStore.set(userId, [
      {
        id: `tx-rew-welcome-${Date.now()}`,
        userId,
        title: 'Welcome Club Bonus Points',
        type: 'bonus',
        points: 100,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  const txs = memoryRewardsStore.get(userId) || [];

  let earned = 0;
  let redeemed = 0;

  for (const tx of txs) {
    if (tx.type === 'earned' || tx.type === 'bonus') {
      earned += tx.points;
    } else if (tx.type === 'redeemed') {
      redeemed += Math.abs(tx.points);
    }
  }

  const available = Math.max(0, earned - redeemed);

  let tier: 'Silver' | 'Gold' | 'Platinum' = 'Silver';
  let tierProgress = Math.min(100, Math.round((earned / 500) * 100));
  let nextTierPoints = Math.max(0, 500 - earned);

  if (earned >= 2000) {
    tier = 'Platinum';
    tierProgress = 100;
    nextTierPoints = 0;
  } else if (earned >= 500) {
    tier = 'Gold';
    tierProgress = Math.min(100, Math.round(((earned - 500) / 1500) * 100));
    nextTierPoints = Math.max(0, 2000 - earned);
  }

  return {
    success: true,
    rewards: {
      availablePoints: available,
      pointsEarned: earned,
      pointsRedeemed: redeemed,
      tier,
      tierProgress,
      nextTierPoints,
      monetaryValue: available, // 1 point = ₹1
      transactions: [...txs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    },
  };
}

/**
 * Redeem points for an instant checkout discount code
 */
export async function redeemRewardPointsAction(pointsToRedeem: number): Promise<{
  success: boolean;
  message: string;
  voucherCode?: string;
  newBalance?: number;
}> {
  const user = await getDemoUserAction();
  if (!user) {
    return { success: false, message: 'Please sign in to redeem reward points.' };
  }

  if (pointsToRedeem < 50) {
    return { success: false, message: 'Minimum redemption is 50 reward points (₹50 discount).' };
  }

  const { rewards } = await getRewardsSummaryAction();
  if (rewards.availablePoints < pointsToRedeem) {
    return {
      success: false,
      message: `Insufficient points. You have ${rewards.availablePoints} points available.`,
    };
  }

  const voucherCode = `REW${pointsToRedeem}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const tx: RewardTransaction = {
    id: `tx-rew-${Date.now()}`,
    userId: user.id,
    title: `Redeemed for ${voucherCode} (₹${pointsToRedeem} Voucher)`,
    type: 'redeemed',
    points: -pointsToRedeem,
    createdAt: new Date().toISOString(),
  };

  const userTxs = memoryRewardsStore.get(user.id) || [];
  userTxs.unshift(tx);
  memoryRewardsStore.set(user.id, userTxs);

  return {
    success: true,
    message: `Successfully redeemed ${pointsToRedeem} points! Use voucher ${voucherCode} at checkout.`,
    voucherCode,
    newBalance: rewards.availablePoints - pointsToRedeem,
  };
}
