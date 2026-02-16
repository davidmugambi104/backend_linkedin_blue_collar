import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@services/analytics.service';

export const useDailyRevenue = (days: number = 30) => {
  return useQuery({
    queryKey: ['analytics', 'revenue', 'daily', days],
    queryFn: () => analyticsService.getDailyRevenue(days),
  });
};

export const useUserGrowth = (days: number = 30) => {
  return useQuery({
    queryKey: ['analytics', 'users', 'growth', days],
    queryFn: () => analyticsService.getUserGrowth(days),
  });
};

export const useUserRetention = (days: number = 90) => {
  return useQuery({
    queryKey: ['analytics', 'users', 'retention', days],
    queryFn: () => analyticsService.getUserRetention(days),
  });
};
