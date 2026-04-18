import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useContacts() {
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['contacts'],
    queryFn: api.contacts.list,
  });
  return { contacts, isLoading, refetch };
}

export function useClearContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.contacts.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
