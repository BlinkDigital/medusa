import {useTranslation} from 'react-i18next'
import {useTable,} from 'react-table'
import {useAdminCustomers, useAdminCustomQuery, useAdminGetSession} from 'medusa-react'
import Table from '../../molecules/table'
import TableContainer from '../../organisms/table-container'
import {useRevenueColumns} from './use-revenue-columns'
import qs from 'qs'
import {useRevenueFilters} from './use-revenue-filters'
import React, {useEffect, useRef} from 'react'
import {Option} from '../../../types/shared'
import {DealerSelect} from './dealer-select'
import {CustomerSelect} from './customer-select'
import {useCustomAdminUsers} from '../../../hooks/use-custom-admin-users'


type RevenueTableProps = {
  defaultValues?: {
    customers?: string[];
    category?: string;
  }
  filterable?: boolean;
}

const RevenueTable = (props: RevenueTableProps) => {
  const {t} = useTranslation();
  const {activeFilters, setCustomers, setCategory} = useRevenueFilters(props?.defaultValues)
  const currentTimeout = useRef<ReturnType<typeof setTimeout>>()
  const {user} = useAdminGetSession()

  const {users: dealers, isLoading: isLoadingDealers} = useCustomAdminUsers('location_manager', {enabled: user && user.role === 'admin' && props.filterable})
  // @ts-ignore
  const {customers, isLoading: loadingCustomers} = useAdminCustomers({ user_id: user.id }, {enabled: user && user.role === "location_manager" && props.filterable})

  const {isLoading, data: result, refetch} = useAdminRevenue(activeFilters)
  const [columns] = useRevenueColumns()

  useEffect(() => {
    refetch()
  }, [activeFilters]);

  const onCustomerChange = (customer?: Option) => {
    setCustomers([customer?.value] || [])
  }

  const setCustomersOfDealer = (selectedDealer?: Option) => {
    const dealer = dealers?.find(d => d.id === selectedDealer?.value || '');
    if(!dealer) {
      setCustomers([])
      return
    }
    const customers = dealer.customers.map(u => u.id);

    setCustomers(customers.length ? customers : ['_'])
  }

  const onCategorySearch = (term: string) => {
    if (currentTimeout.current) {
      clearTimeout(currentTimeout.current)
    }

    currentTimeout.current = setTimeout(() => {
      setCategory(term.toLowerCase());
    }, 500);
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,

  } = useTable({
    columns,
    data: result?.data || [],
  })

  return (
    <TableContainer
      isLoading={isLoading}
      {...getTableProps()}>
      <Table filteringOptions={props.filterable && (
        <div className='flex items-center gap-4 min-w-[280px]'>
          {user.role === "admin" ?
            <DealerSelect onDealerChange={setCustomersOfDealer} dealers={dealers} loading={isLoadingDealers}/> :
            <CustomerSelect loading={loadingCustomers} customers={customers} onCustomerChange={onCustomerChange}/>}
        </div>
      )}
             enableSearch={props.admin}
             handleSearch={onCategorySearch}
      >
        <Table.Head>
          {headerGroups?.map((headerGroup) => (
            <Table.HeadRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((col) => (
                <Table.HeadCell className="w-[100px]" {...col.getHeaderProps()}>
                  {col.render("Header")}
                </Table.HeadCell>
              ))}
            </Table.HeadRow>
          ))}
        </Table.Head>
        <Table.Body {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row)
            return (
              <Table.Row
                color={"inherit"}
                linkTo={row.original.id}
                {...row.getRowProps()}
              >
                {row.cells.map((cell, index) => {
                  return (
                    <Table.Cell {...cell.getCellProps()}>
                      {cell.render("Cell", {index})}
                    </Table.Cell>
                  )
                })}
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>

    </TableContainer>
  )
}

function useAdminRevenue(query: { customerIds?: string[], category?: string }, options = {}) {
  const path = `/revenue`;
  const search = qs.stringify(query, {skipNulls: true})
  return useAdminCustomQuery(path, ['revenue', search], query, options);
}

export default RevenueTable
