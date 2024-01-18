import moment from "moment"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { getColor } from "../../../utils/color"
import CustomerAvatarItem from "../../molecules/customer-avatar-item"
import {formatAmountWithSymbol} from '../../../utils/prices'

export const useCustomerColumns = () => {
  const { t } = useTranslation()
  const columns = useMemo(
    () => [
      // {
      //   Header: t("customer-table-date-added", "Date added"),
      //   accessor: "created_at", // accessor is the "key" in the data
      //   Cell: ({ cell: { value } }) => moment(value).format("DD MMM YYYY"),
      // },
      {
        Header: t("customer-table-name", "Name"),
        accessor: "customer",
        Cell: ({ row }) => (
          <CustomerAvatarItem
            customer={row.original}
            color={getColor(row.index)}
          />
        ),
      },
      {
        Header: t("customer-table-email", "Email"),
        accessor: "email",
      },
      {
        accessor: "orders",
        Header: t("customer-table-orders", "Orders"),
        Cell: ({ cell: { value } }) => (
          <div>{value?.length || 0}</div>
        ),
      },
      {
        Header: t("customer-table-revenue", "Omzet"),
        accessor: "revenue",
        Cell: ({ cell: { value } }) => (
          <div>
            {formatAmountWithSymbol(({
              amount: value,
              currency: 'EUR',
              digits: 2
            }))}
          </div>
        )
      },
      {
        Header: "",
        accessor: "col",
      },
      {
        Header: () => (
          <div className='text-right'>
            {t("customer-table-last-order-date", "Laatste Orderdatum")}
          </div>
        ),
        accessor: "last_order_date",
        Cell: ({ cell: { value }}) => (
          <div className="text-right">
            {value || "-"}
          </div>
        )
      },
      {
        Header: "",
        accessor: "col-2",
      },
    ],
    []
  )

  return [columns]
}
