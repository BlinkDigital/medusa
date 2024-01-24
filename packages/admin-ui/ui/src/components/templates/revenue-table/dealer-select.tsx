import {User} from '@medusajs/medusa'
import {NextSelect} from '../../molecules/select/next-select'
import React from 'react'
import {Option} from '../../../types/shared'

type CustomerSelectProps = {
  dealers?: User[]
  onDealerChange: (arg: Option) => void
  loading?: boolean
}

export const DealerSelect = (props: CustomerSelectProps) => {
  const dealerOptions: Option[] = React.useMemo(() => {
    if (!props.dealers?.length) return []

    return props.dealers.map((c) => ({label: (c.first_name + c.last_name) || c.email, value: c.id}))
  }, [props.dealers])

  // @ts-ignore
  return (
    <NextSelect isClearable placeholder="Kies dealer"
                onChange={props.onDealerChange}
                isLoading={props.loading}
                options={dealerOptions}
    />
  )
}
