import {useAdminCustomQuery} from 'medusa-react'

export function useCustomAdminUsers(role?: 'location_manager' | 'admin', options = {}) {
  const result = useAdminCustomQuery('/users', ['users', role], { role }, options)

  return { ...result, users: (result.data as Record<string, []> | undefined)?.users || []}
}
