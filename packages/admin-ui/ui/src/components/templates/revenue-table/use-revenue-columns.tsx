import {useTranslation} from 'react-i18next'
import {useMemo} from 'react'
import {formatAmountWithSymbol} from '../../../utils/prices'


export function useRevenueColumns() {
  const {t} = useTranslation();
  const columns = useMemo(() => [
    {
      Header: t('revenue-table-category', "Product categorie"),
      accessor: 'category'
    },
    {
      Header: t('revenue-table-sales', 'Afzet'),
      accessor: 'sales',
      // Cell: ({cell: {value}}) => (
      //   <div className=''>
      //     {formatAmountWithSymbol({
      //       amount: value,
      //       currency: 'EUR',
      //       digits: 2
      //     })}
      //   </div>
      // )
    },
    {
      Header: t('revenue-table-revenue', 'Omzet'),
      accessor: 'revenue',
      Cell: ({cell: {value}}) => (
        <div className=''>
          {formatAmountWithSymbol({
            amount: value,
            currency: 'EUR',
            digits: 2
          })}
        </div>
      )
    },
    {
      Header: '',
      accessor: 'col'
    },
  ], [])

  return [columns];
}
