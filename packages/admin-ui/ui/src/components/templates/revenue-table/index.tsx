import {useTranslation} from 'react-i18next'
import {useTable,} from 'react-table'
import {useAdminCustomers, useAdminCustomQuery} from 'medusa-react'
import Table from '../../molecules/table'
import TableContainer from '../../organisms/table-container'
import {useRevenueColumns} from './use-revenue-columns'
import qs from 'qs'
import {useRevenueFilters} from './use-revenue-filters'
import React, {useEffect, useRef} from 'react'
import {NextSelect} from '../../molecules/select/next-select'
import {OnChangeValue} from 'react-select'
import {Option} from '../../../types/shared'


type RevenueTableProps = {
  defaultValues?: {
    customer?: string;
    category?: string;
  }
  filterable?: boolean;
}

const RevenueTable = (props: RevenueTableProps) => {
  const {t} = useTranslation();
  const {activeFilters, setCustomer, setCategory} = useRevenueFilters(props?.defaultValues)
  const currentTimeout = useRef<ReturnType<typeof setTimeout>>()

  // @ts-ignore
  const {customers, isLoading: loadingCustomers} = useAdminCustomers(null, {enabled: props.filterable})

  const {isLoading, data: result, refetch} = useAdminRevenue(activeFilters)
  const [columns] = useRevenueColumns()

  const customerOptions: Option[] = React.useMemo(() => {
    if (!customers?.length) return []

    return customers.map((c) => ({label: (c.first_name + c.last_name) || c.email, value: c.id}))
  }, [customers])

  useEffect(() => {
    refetch()
  }, [activeFilters]);

  const onCustomerChange = (customer?: Option) => {
    setCustomer(customer?.value || '')
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
          <NextSelect isClearable placeholder={t('revenue-table-choose-dealer', "Kies dealer")}
                      onChange={onCustomerChange}
                      isLoading={loadingCustomers}
                      options={customerOptions}
          />
        </div>
      )}
             enableSearch={props.filterable}
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

function useAdminRevenue(query: { customerId?: string, category?: string }, options = {}) {
  const path = `/revenue`;
  const search = qs.stringify(query, {skipNulls: true})
  return useAdminCustomQuery(path, ['revenue', search], query, options);
}

export default RevenueTable
