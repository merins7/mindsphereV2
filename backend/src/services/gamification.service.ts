import { prisma } from '../db';

export class GamificationService {
  private static readonly XP_PER_MINUTE = 10;
  private static readonly LEVEL_base_XP = 100;

  static async awardXP(userId: string, durationSeconds: number, source: string) {
    // 10 XP per minute
    const amount = Math.round((durationSeconds / 60) * this.XP_PER_MINUTE);
    if (amount <= 0) return;

    await prisma.$transaction(async (tx) => {
      // 1. Log Transaction
      await tx.xPTransaction.create({
        data: {
          userId,
          amount,
          source
        }
      });

      // 2. Update User XP and Level
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) return;

      let newXP = user.currentXP + amount;
      let newLevel = user.level;
      let xpForNextLevel = newLevel * this.LEVEL_base_XP;

      // Level Up Logic
      while (newXP >= xpForNextLevel) {
        newXP -= xpForNextLevel;
        newLevel++;
        xpForNextLevel = newLevel * this.LEVEL_base_XP;
        // TODO: Create Notification for Level Up
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          currentXP: newXP,
          level: newLevel,
        }
      });
    });
  }

  static async updateStreak(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const lastActivity = new Date(user.lastActivity);
    
    // Normalize to dates (ignore time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = user.currentStreak;

    if (diffDays === 0) {
      // Already active today, do nothing (or maybe check min time?)
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak++;
    } else {
      // Missed a day or more
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActivity: now,
        currentStreak: newStreak
      }
    });

    return newStreak;
  }
}
