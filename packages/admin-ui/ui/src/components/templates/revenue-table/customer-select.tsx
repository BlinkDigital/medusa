import {Customer} from '@medusajs/medusa'
import {NextSelect} from '../../molecules/select/next-select'
import React from 'react'
import {Option} from '../../../types/shared'

type CustomerSelectProps = {
  customers?: Customer[]
  onCustomerChange: (arg: Option) => void
  loading?: boolean
}

export const CustomerSelect = (props: CustomerSelectProps) => {
  const customerOptions: Option[] = React.useMemo(() => {
    if (!props.customers?.length) return []

    return props.customers.map((c) => ({label: (c.first_name + c.last_name) || c.email, value: c.id}))
  }, [props.customers])

  // @ts-ignore
  return (
    <NextSelect isClearable placeholder="Kies klant"
                onChange={props.onCustomerChange}
                isLoading={props.loading}
                options={customerOptions}
    />
  )
}
