import TableViewHeader from "../../components/organisms/custom-table-header"
import { useNavigate } from "react-router-dom"
import {useIsLocationManager} from '../../hooks/use-is-location-manager'

type P = {
  activeView: "inventory" | "locations" | "reservations"
}

/*
 * Shared header component for "inventory" and "locations" page
 */

function InventoryPageTableHeader(props: P) {
  const navigate = useNavigate()
  const isLocManager = useIsLocationManager()

  const views = ["inventory", "reservations"]

  if(!isLocManager) {
    views.push("locations")
  }

  return (
    <TableViewHeader
      setActiveView={(v) => {
        if (v === "inventory") {
          navigate(`/a/inventory`)
        } else {
          navigate(`/a/inventory/${v}`)
        }
      }}
      views={views}
      activeView={props.activeView}
    />
  )
}

export default InventoryPageTableHeader
