import {useState} from 'react'

export type RevenueFilters = {
  customers?: string[];
  category?: string;
}

export const useRevenueFilters = (defaultValues: RevenueFilters = {}) => {
  const [activeFilters, setActiveFilters] = useState(defaultValues);

  const setCustomers = (customers: string[]) => {
    setActiveFilters((v) => ({...v, customers}))
  }

  const setCategory = (search: string) => {
    setActiveFilters((v) => ({...v, category: search}))
  }

  return {
    activeFilters,
    setCategory,
    setCustomers
  }
}
