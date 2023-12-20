import {useMedusa} from 'medusa-react'
import {useMutation} from '@tanstack/react-query'
import {AddressCreatePayload} from '@medusajs/client-types'

export function useAdminCustomerAddAddress() {
  const {client: {client}} = useMedusa()

  return useMutation(
    (payload: { id: string, shipping_address: AddressCreatePayload }) => {
      const path = `/admin/customers/${payload.id}/addresses`
      return client.request("POST", path, {shipping_address: payload.shipping_address}, {}, {})
    }
  )
}

export function useAdminCreateCustomerInvite() {
  const {client: {client}} = useMedusa()

  return useMutation(
    (payload: { id: string }) => {
      const path = `/admin/customers/${payload.id}/invite`
      return client.request("POST", path)
    }
  )
}