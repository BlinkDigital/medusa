import { Route, Routes } from "react-router-dom"

import InventoryView from "./inventory"
import Locations from "./locations"
import Reservations from "./reservations"
import {useIsLocationManager} from '../../hooks/use-is-location-manager'

const Inventory = () => {
  const isLocManager = useIsLocationManager();

  return (
    <Routes>
      <Route index element={<InventoryView />} />
      {!isLocManager && <Route path="/locations/*" element={<Locations />} />}
      <Route path="/reservations/*" element={<Reservations />} />
    </Routes>
  )
}

export default Inventory
