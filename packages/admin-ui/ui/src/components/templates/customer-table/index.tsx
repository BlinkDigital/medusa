import { isEmpty } from "lodash"
import {useAdminCustomers, useAdminGetSession} from "medusa-react"
import qs from "qs"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePagination, useTable } from "react-table"
import DetailsIcon from "../../fundamentals/details-icon"
import EditIcon from "../../fundamentals/icons/edit-icon"
import Table from "../../molecules/table"
import TableContainer from "../../organisms/table-container"
import { useCustomerColumns } from "./use-customer-columns"
import { useCustomerFilters } from "./use-customer-filters"
import moment from 'moment'
import {useCustomAdminUsers} from '../../../hooks/use-custom-admin-users'
import {DealerSelect} from '../revenue-table/dealer-select'
import {Option} from '../../../types/shared'

const DEFAULT_PAGE_SIZE = 15

const defaultQueryProps = {
  expand: "orders",
}

const formatOrderDate = (date: Date) => moment.utc(date).local().format('DD MMM YYYY, hh:mm');

const CustomerTable = () => {
  const navigate = useNavigate()
  const { user } = useAdminGetSession()

  const {users: dealers, isLoading: loadingDealers} = useCustomAdminUsers('location_manager', { enabled: !!user && user.role === 'admin'})

  const { t } = useTranslation()

  const {
    reset,
    paginate,
    setQuery: setFreeText,
    queryObject,
    representationObject,
    setUser
  } = useCustomerFilters(location.search, defaultQueryProps)

  const offs = parseInt(queryObject.offset) || 0
  const lim = parseInt(queryObject.limit) || DEFAULT_PAGE_SIZE

  const { customers, isLoading, count } = useAdminCustomers(
    {
      ...queryObject,
      expand: 'orders'
    },
    {
      keepPreviousData: true,
      onSuccess: data => {
        data.customers.forEach((cus) => {
          const sortedOrders = cus.orders?.sort((a, b ) => {
            return moment(a.created_at).isBefore(b.created_at) ? -1 : 1
          })
          cus['last_order_date'] = sortedOrders?.length ? formatOrderDate(sortedOrders[sortedOrders.length-1].created_at) : '-'
        })
      }
    }
  )

  const [query, setQuery] = useState(queryObject.query)
  const [numPages, setNumPages] = useState(0)

  useEffect(() => {
    if (typeof count !== "undefined") {
      const controlledPageCount = Math.ceil(count / lim)
      setNumPages(controlledPageCount)
    }
  }, [count])

  const [columns] = useCustomerColumns()

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    // Get the state from the instance
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: customers || [],
      manualPagination: true,
      initialState: {
        pageSize: lim,
        pageIndex: offs / lim,
      },
      pageCount: numPages,
      autoResetPage: false,
    },
    usePagination
  )

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        setFreeText(query)
        gotoPage(0)
      } else {
        if (typeof query !== "undefined") {
          // if we delete query string, we reset the table view
          reset()
        }
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleNext = () => {
    if (canNextPage) {
      paginate(1)
      nextPage()
    }
  }

  const handlePrev = () => {
    if (canPreviousPage) {
      paginate(-1)
      previousPage()
    }
  }

  const updateUrlFromFilter = (obj = {}) => {
    const stringified = qs.stringify(obj)
    window.history.replaceState(`/a/discounts`, "", `${`?${stringified}`}`)
  }

  const onDealerChange = (dealer?: Option) => {
    setUser(dealer?.value || null)
  }

  const refreshWithFilters = () => {
    const filterObj = representationObject

    if (isEmpty(filterObj)) {
      updateUrlFromFilter({ offset: 0, limit: DEFAULT_PAGE_SIZE })
    } else {
      updateUrlFromFilter(filterObj)
    }
  }

  useEffect(() => {
    refreshWithFilters()
  }, [representationObject])

  return (
    <TableContainer
      hasPagination
      numberOfRows={queryObject.limit}
      pagingState={{
        count: count!,
        offset: queryObject.offset,
        pageSize: queryObject.offset + rows.length,
        title: t("customer-table-customers", "Customers"),
        currentPage: pageIndex + 1,
        pageCount: pageCount,
        nextPage: handleNext,
        prevPage: handlePrev,
        hasNext: canNextPage,
        hasPrev: canPreviousPage,
      }}
      isLoading={isLoading}
    >
      <Table
        enableSearch
        handleSearch={setQuery}
        searchValue={query}
        {...getTableProps()}
        filteringOptions={user.role === 'admin' && (
          <div className='w-[280px]'>
            <DealerSelect onDealerChange={onDealerChange} dealers={dealers} loading={loadingDealers}/>
          </div>
        )}
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
                actions={[
                  {
                    label: t("customer-table-edit", "Edit"),
                    onClick: () => navigate(row.original.id),
                    icon: <EditIcon size={20} />,
                  },
                  {
                    label: t("customer-table-details", "Details"),
                    onClick: () => navigate(row.original.id),
                    icon: <DetailsIcon size={20} />,
                  },
                ]}
                linkTo={row.original.id}
                {...row.getRowProps()}
              >
                {row.cells.map((cell, index) => {
                  return (
                    <Table.Cell {...cell.getCellProps()}>
                      {cell.render("Cell", { index })}
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

export default CustomerTable
