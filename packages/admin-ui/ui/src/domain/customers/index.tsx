import {Route, Routes, useNavigation} from "react-router-dom"
import Spacer from "../../components/atoms/spacer"
import RouteContainer from "../../components/extensions/route-container"
import WidgetContainer from "../../components/extensions/widget-container"
import BodyCard from "../../components/organisms/body-card"
import CustomerTable from "../../components/templates/customer-table"
import {useRoutes} from "../../providers/route-provider"
import {useWidgets} from "../../providers/widget-provider"
import Details from "./details"
import CustomerGroups from "./groups"
import CustomersPageTableHeader from "./header"
import PlusIcon from '../../components/fundamentals/icons/plus-icon'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import CreateCustomerModal from './modals/create-customer-modal'
import RevenueTable from '../../components/templates/revenue-table'
import {useAdminGetSession} from 'medusa-react'

const CustomerIndex = () => {
  const {getWidgets} = useWidgets()
  const {t} = useTranslation()
  const {user} = useAdminGetSession({networkMode: "offlineFirst"})
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)

  const actions = [
    {
      label: t("customers-new-customer", "New customer"),
      onClick: () => setShowAddCustomerModal(true),
      icon: (
        <span className="text-grey-90">
          <PlusIcon size={20}/>
        </span>
      ),
    },
  ];

  const onClose = () => {
    setShowAddCustomerModal(false);
  }

  return (
    <>
      <div className="gap-y-xsmall flex flex-col">
        {getWidgets("customer.list.before").map((w, index) => {
          return (
            <WidgetContainer
              key={index}
              entity={null}
              widget={w}
              injectionZone="customer.list.before"
            />
          )
        })}

        <BodyCard
          customHeader={<CustomersPageTableHeader activeView="customers"/>}
          className="h-fit"
          actionables={actions}
        >
          <div className="relative mb-6">
            <CustomerTable/>
          </div>

          <h1 className="inter-xlarge-semibold text-grey-90">{t('customers-revenue-table', "Productafzet")}</h1>
          <RevenueTable filterable />
        </BodyCard>

        {getWidgets("customer.list.after").map((w, index) => {
          return (
            <WidgetContainer
              key={index}
              entity={null}
              widget={w}
              injectionZone="customer.list.after"
            />
          )
        })}
        <Spacer/>
      </div>

        {showAddCustomerModal && <CreateCustomerModal handleClose={onClose}/>}
    </>
  )
}

const Customers = () => {
  const {getNestedRoutes} = useRoutes()

  const nestedRoutes = getNestedRoutes("/customers")

  return (
    <Routes>
      <Route index element={<CustomerIndex/>}/>
      <Route path="/groups/*" element={<CustomerGroups/>}/>
      <Route path="/:id" element={<Details/>}/>
      {nestedRoutes.map((r, i) => {
        return (
          <Route
            path={r.path}
            key={i}
            element={<RouteContainer route={r} previousPath={"/customers"}/>}
          />
        )
      })}
    </Routes>
  )
}

export default Customers
