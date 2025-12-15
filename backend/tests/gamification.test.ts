import { GamificationService } from '../src/services/gamification.service';
import { prisma } from '../src/db';

// Mock Prisma
jest.mock('../src/db', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback(prisma)),
    xPTransaction: { create: jest.fn() },
    user: { 
      findUnique: jest.fn(), 
      update: jest.fn() 
    },
  },
}));

describe('GamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('awardXP', () => {
    it('should award XP and level up user if threshold reached', async () => {
      const mockUser = {
        id: 'user1',
        currentXP: 90,
        level: 1,
        currentStreak: 1,
        lastActivity: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Award 10 minutes (100 XP). 90 + 100 = 190. Threshold for Level 1 is 100.
      // New XP = 90. Level 2.
      await GamificationService.awardXP('user1', 600, 'SESSION');

      expect(prisma.xPTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ amount: 100 })
      }));

      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user1' },
        data: { currentXP: 90, level: 2 }
      }));
    });
  });
});
