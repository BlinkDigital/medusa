import {useMemo} from "react"
import {useAdminGetSession} from "medusa-react"

export const useIsLocationManager = () => {
    const { user } = useAdminGetSession()

    const isLocationManager = useMemo(() => {
        return user?.role === 'location_manager'
    }, [user])

    return isLocationManager;
}