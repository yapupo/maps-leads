import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AutomationConfig } from '../lib/api';

export function useAutomation() {
  return useQuery({
    queryKey: ['automation'],
    queryFn: api.automation.get,
  });
}

export function useSaveAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<AutomationConfig>) => api.automation.save(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
    },
  });
}

export function useRunAutomation() {
  return useMutation({
    mutationFn: api.automation.runNow,
  });
}
