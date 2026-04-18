import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: api.history.list,
  });
}

export function useSessionContacts(id: string | null) {
  return useQuery({
    queryKey: ['history', id, 'contacts'],
    queryFn: () => api.history.contacts(id!),
    enabled: !!id,
  });
}
