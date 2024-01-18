import {useState} from 'react'

export type RevenueFilters = {
  customer?: string;
  category?: string;
}

export const useRevenueFilters = (defaultValues: RevenueFilters = {}) => {
  const [activeFilters, setActiveFilters] = useState(defaultValues);

  const setCustomer = (customer: string) => {
    setActiveFilters((v) => ({...v, customer}))
  }

  const setCategory = (search: string) => {
    setActiveFilters((v) => ({...v, category: search}))
  }

  return {
    activeFilters,
    setCategory,
    setCustomer
  }
}
