import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics.get,
    staleTime: 30_000,
  });
}
