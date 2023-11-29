import { useAdminProducts } from "medusa-react"
import React, { useEffect, useState } from "react"
import { Row, usePagination, useTable } from "react-table"
import { useTranslation } from "react-i18next"
import { useDebounce } from "../../../hooks/use-debounce"
import Medusa from "../../../services/api"
import Button from "../../fundamentals/button"
import TrashIcon from "../../fundamentals/icons/trash-icon"
import Table from "../../molecules/table"
import DeletePrompt from "../../organisms/delete-prompt"
import TableContainer from "../../organisms/table-container"
import useViewProductColumns from "./use-view-product-columns"
import Nestable from 'react-nestable'
import ReorderIcon from "../../fundamentals/icons/reorder-icon"
import TriangleMiniIcon from "../../fundamentals/icons/triangle-mini-icon"
import { Link } from 'react-router-dom'
import { decideStatus } from './utils'
import axios from "axios"

type ViewProductsTableProps = {
  collectionId: string
  refetchCollection: () => void
}

const ViewProductsTable: React.FC<ViewProductsTableProps> = ({
                                                               collectionId,
                                                               refetchCollection,
                                                             }) => {
  const limit = 10
  const [query, setQuery] = useState("")
  const [offset, setOffset] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const debouncedSearchTerm = useDebounce(query, 500)
  const {t} = useTranslation()

  const [showDelete, setShowDelete] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string | undefined>(undefined)

  const {isLoading, count, products, refetch} = useAdminProducts({
    q: debouncedSearchTerm,
    collection_id: [collectionId],
    limit: limit,
    offset,
    order: 'collection_rank'
  })

  useEffect(() => {
    refetch() // Ensure we get the latest data
  }, [collectionId])

  const handleRemoveProduct = () => {
    if (idToDelete) {
      Medusa.products
        .update(idToDelete, {
          collection_id: null,
        })
        .then(() => {
          refetch()
          refetchCollection()
        })
    }
  }

  const columns = useViewProductColumns()

  // const [sorted, sortingOptions] = useSortingOptions(products ?? []) TODO: Implement this with server side sorting

  const {
    rows,
    prepareRow,
    getTableBodyProps,
    getTableProps,
    canPreviousPage,
    canNextPage,
    pageCount,
    nextPage,
    previousPage,
    // Get the state from the instance
    state: { pageIndex, pageSize },
  } = useTable(
    {
      data: products || [],
      columns: columns,
      manualPagination: true,
      initialState: {
        pageIndex: currentPage,
        pageSize: limit,
      },
      pageCount: numPages,
      getRowId: (row) => row.id,
    },
    usePagination,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        ...columns,
        {
          id: "actions",
          Cell: ({ row }) => {
            return (
              <Table.Cell className="pr-2xsmall w-[0%]">
                <Button
                  variant="ghost"
                  size="small"
                  className="text-grey-40"
                  onClick={() => {
                    setIdToDelete(row.original.id)
                    setShowDelete(true)
                  }}
                >
                  <TrashIcon size={20} />
                </Button>
              </Table.Cell>
            )
          },
        },
      ])
    }
  )

  useEffect(() => {
    const controlledPageCount = Math.ceil(count! / limit)
    setNumPages(controlledPageCount)
  }, [products, count, limit])

  const handleNext = () => {
    if (canNextPage) {
      setOffset((old) => old + pageSize)
      setCurrentPage((old) => old + 1)
      nextPage()
    }
  }

  const handlePrev = () => {
    if (canPreviousPage) {
      setOffset((old) => old - pageSize)
      setCurrentPage((old) => old - 1)
      previousPage()
    }
  }

  const handleSearch = (q) => {
    setOffset(0)
    setQuery(q)
  }

  return (
    <>
      <TableContainer
        isLoading={isLoading}
        hasPagination
        numberOfRows={pageSize}
        pagingState={{
          count: count!,
          offset: offset,
          pageSize: offset + rows.length,
          title: "Products",
          currentPage: pageIndex + 1,
          pageCount: pageCount,
          nextPage: handleNext,
          prevPage: handlePrev,
          hasNext: canNextPage,
          hasPrev: canPreviousPage,
        }}
      >
        <Table
          enableSearch
          handleSearch={handleSearch}
          searchPlaceholder={t(
            "collection-product-table-search-products",
            "Search Products"
          )}
          {...getTableProps()}
          className="h-full"
        >
          <Table.Body {...getTableBodyProps()}>
            <Nestable
              items={products}
              collapsed={true}
              onChange={(items) => {
                axios.post(`${process.env.MEDUSA_BACKEND_URL}/admin/collections/${collectionId}/change-order`, {
                  items: items.items.map(i => i.id)
                }, { withCredentials: true })
              }}
              childrenProp="collection_children"
              maxDepth={1}
              renderItem={({item, depth, handler, collapseIcon}) => {
                return (
                  <div className="bg-white text-grey-90">
                    <div
                      style={{marginLeft: -8}}
                      className="flex h-[64px] items-center"
                    >
                      <div className="flex w-[32px] items-center justify-center">
                        {handler}
                      </div>

                      <div className="bg-grey-5 rounded-soft my-xsmall h-[40px] w-[30px] overflow-hidden mx-[10px]">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                      </div>



                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                        <span
                          className={"ml-2 select-none text-xs"}
                        ><Link to={`/a/products/${item.id}`}>{item.title}</Link></span>
                        </div>

                        <div className="flex items-center gap-2">
                          {decideStatus(item.status)}
                          <Button
                            variant="ghost"
                            size="small"
                            className="text-grey-40"
                            onClick={() => {
                              setIdToDelete(item.id)
                              setShowDelete(true)
                            }}
                          >
                            <TrashIcon size={20}/>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
              handler={<ReorderIcon className="cursor-grab" color="#889096"/>}
            />
          </Table.Body>
        </Table>
      </TableContainer>
      {showDelete && (
        <DeletePrompt
          onDelete={async () => handleRemoveProduct()}
          handleClose={() => setShowDelete(!showDelete)}
          heading={t(
            "collection-product-table-remove-product-from-collection",
            "Remove product from collection"
          )}
          successText={t(
            "collection-product-table-product-removed-from-collection",
            "Product removed from collection"
          )}
        />
      )}
    </>
  )
}

export default ViewProductsTable
