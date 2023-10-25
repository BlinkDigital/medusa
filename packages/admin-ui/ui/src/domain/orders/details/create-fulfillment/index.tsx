import {
  AdminPostOrdersOrderClaimsClaimFulfillmentsReq,
  AdminPostOrdersOrderFulfillmentsReq,
  AdminPostOrdersOrderSwapsSwapFulfillmentsReq,
  ClaimOrder,
  Order,
  Swap,
} from "@medusajs/medusa"
import { useTranslation } from "react-i18next"
import CreateFulfillmentItemsTable, {
  getFulfillableQuantity,
} from "./item-table"
import Metadata, {
  MetadataField,
} from "../../../../components/organisms/metadata"
import React, {useCallback, useEffect, useMemo, useState} from "react"
import {
  useAdminCreateFulfillment,
  useAdminFulfillClaim,
  useAdminFulfillSwap,
  useAdminStockLocations, useAdminUpdateOrder,
} from "medusa-react"

import Button from "../../../../components/fundamentals/button"
import CrossIcon from "../../../../components/fundamentals/icons/cross-icon"
import FeatureToggle from "../../../../components/fundamentals/feature-toggle"
import FocusModal from "../../../../components/molecules/modal/focus-modal"
import Select from "../../../../components/molecules/select/next-select/select"
import Switch from "../../../../components/atoms/switch"
import { getErrorMessage } from "../../../../utils/error-messages"
import { useFeatureFlag } from "../../../../providers/feature-flag-provider"
import useNotification from "../../../../hooks/use-notification"
import InputField from '../../../../components/molecules/input'
import DatePicker from '../../../../components/atoms/date-picker/date-picker'
import InputHeader from '../../../../components/fundamentals/input-header'
import moment from "moment"

type CreateFulfillmentModalProps = {
  handleCancel: () => void
  address?: object
  email?: string
  orderToFulfill: Order | ClaimOrder | Swap
  orderId: string
  onComplete?: () => void
}

const CreateFulfillmentModal: React.FC<CreateFulfillmentModalProps> = ({
  handleCancel,
  orderToFulfill,
  orderId,
  onComplete,
}) => {
  const { t } = useTranslation()
  const { isFeatureEnabled } = useFeatureFlag()
  const isLocationFulfillmentEnabled =
    isFeatureEnabled("inventoryService") &&
    isFeatureEnabled("stockLocationService")
  const [quantities, setQuantities] = useState<Record<string, number>>(
    "items" in orderToFulfill
      ? (orderToFulfill as Order).items.reduce((acc, next) => {
          return {
            ...acc,
            [next.id]: getFulfillableQuantity(next),
          }
        }, {})
      : {}
  )
  const [noNotis, setNoNotis] = useState(false)
  const [errors, setErrors] = useState({})
  const [locationSelectValue, setLocationSelectValue] = useState<{
    value?: string
    label?: string
  }>({})

  const [metadata, setMetadata] = useState<MetadataField[]>([
    { key: "", value: "" },
  ])

  const { stock_locations, refetch } = useAdminStockLocations(
    orderToFulfill?.metadata?.location_id ? {
      id: orderToFulfill.metadata.location_id as string
    } : {},
    {
      enabled: isLocationFulfillmentEnabled,
    }
  )

  React.useEffect(() => {
    if (isLocationFulfillmentEnabled) {
      refetch()
    }
  }, [isLocationFulfillmentEnabled, refetch])

  const locationOptions = React.useMemo(() => {
    if (!stock_locations) {
      return []
    }
    return stock_locations.map((sl) => ({
      value: sl.id,
      label: sl.name,
    }))
  }, [stock_locations])

  React.useEffect(() => {
    if (locationOptions.length === 1) {
      setLocationSelectValue(locationOptions[0])
    } else {
      setLocationSelectValue({})
    }
  }, [locationOptions])

  const items =
    "items" in orderToFulfill
      ? orderToFulfill.items
      : orderToFulfill.additional_items

  const createOrderFulfillment = useAdminCreateFulfillment(orderId)
  const createSwapFulfillment = useAdminFulfillSwap(orderId)
  const createClaimFulfillment = useAdminFulfillClaim(orderId)

  const isSubmitting =
    createOrderFulfillment.isLoading ||
    createSwapFulfillment.isLoading ||
    createClaimFulfillment.isLoading

  const notification = useNotification()

  const orderType = useMemo(() => orderToFulfill.id.split("_")[0], [orderToFulfill?.id])

  const retrievePickupKey = (key: string) => {
    if (orderType !== 'order') return null
    const value = (orderToFulfill?.metadata?.pickup_info as Record<string, string> | undefined)?.[key];
    if (!value?.length) return null
    return key.includes('date') ? new Date(value) : value;
  }

  let [appointmentDate, setAppointmentDate] = useState(retrievePickupKey('pickup_date') as Date | null)
  let [pickupMoment, setPickupMoment] = useState(retrievePickupKey('pickup_moment') as string | null)

  useEffect(
    () => {
      setAppointmentDate(retrievePickupKey('pickup_date') as Date | null)
      setPickupMoment(retrievePickupKey('pickup_moment') as string | null)
    },
    [orderToFulfill?.metadata?.pickup_info]
  )


  let mutateOrder : unknown | undefined;
  if (orderType === 'order') {
    mutateOrder = useAdminUpdateOrder(orderId).mutate
  }


  const updateOrder = useCallback((orderData: Record<string, any>) => {
    return new Promise((res, rej) => {
      if (!mutateOrder) res({order: orderData});

      mutateOrder(orderData, {
        onSuccess(data) {
          res(data)
        },
        onError(err) {
          rej(err)
        }
      });
    });
  }, [])

  const createFulfillment = async () => {
    if (isLocationFulfillmentEnabled && !locationSelectValue.value) {
      notification(
        t("create-fulfillment-error", "Error"),
        t(
          "create-fulfillment-please-select-a-location-to-fulfill-from",
          "Please select a location to fulfill from"
        ),
        "error"
      )
      return
    }

    if (Object.keys(errors).length > 0) {
      notification(
        t(
          "create-fulfillment-cant-allow-this-action",
          "Can't allow this action"
        ),
        t(
          "create-fulfillment-trying-to-fulfill-more-than-in-stock",
          "Trying to fulfill more than in stock"
        ),
        "error"
      )
      return
    }

    const [type] = orderToFulfill.id.split("_")

    type actionType =
      | typeof createOrderFulfillment
      | typeof createSwapFulfillment
      | typeof createClaimFulfillment

    let action: actionType = createOrderFulfillment
    let successText = t(
      "create-fulfillment-successfully-fulfilled-order",
      "Successfully fulfilled order"
    )
    let requestObj

    const preparedMetadata = metadata.reduce((acc, next) => {
      if (next.key) {
        return {
          ...acc,
          [next.key]: next.value,
        }
      } else {
        return acc
      }
    }, {})

    switch (type) {
      case "swap":
        action = createSwapFulfillment
        successText = t(
          "create-fulfillment-successfully-fulfilled-swap",
          "Successfully fulfilled swap"
        )
        requestObj = {
          swap_id: orderToFulfill.id,
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderSwapsSwapFulfillmentsReq
        break

      case "claim":
        action = createClaimFulfillment
        successText = t(
          "create-fulfillment-successfully-fulfilled-claim",
          "Successfully fulfilled claim"
        )
        requestObj = {
          claim_id: orderToFulfill.id,
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderClaimsClaimFulfillmentsReq
        break

      default:
        requestObj = {
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderFulfillmentsReq

        requestObj.items = Object.entries(quantities)
          .filter(([, value]) => !!value)
          .map(([key, value]) => ({
            item_id: key,
            quantity: value,
          }))
        break
    }

    if (isLocationFulfillmentEnabled) {
      requestObj.location_id = locationSelectValue.value
    }

    try {
      const { order } = await updateOrder({
        metadata: {
          ...orderToFulfill.metadata || {},
          pickup_info: {
            ...orderToFulfill.metadata?.pickup_info || {},
            pickup_date: moment(appointmentDate).format('YYYY-MM-DD'),
            pickup_moment: pickupMoment,
          }
        }
      });

      notification(
          t("update-order-success", "Success"),
          t("update-order-update-pickup-info", "Pickup info of order successfully modified"),
          "success"
      );
    } catch(err) {
      notification(
          t("update-order-error", "Error"),
          getErrorMessage(err),
          "error"
      );

      return;
    }

    action.mutate(requestObj, {
      onSuccess: () => {
        notification(
          t("create-fulfillment-success", "Success"),
          successText,
          "success"
        )
        handleCancel()
        onComplete && onComplete()
      },
      onError: (err) =>
        notification(
          t("create-fulfillment-error", "Error"),
          getErrorMessage(err),
          "error"
        ),
    })
  }

  return (
    <FocusModal>
      <FocusModal.Header>
        <div className="medium:w-8/12 flex w-full justify-between px-8">
          <Button
            size="small"
            variant="ghost"
            type="button"
            onClick={handleCancel}
          >
            <CrossIcon size={20} />
          </Button>
          <div className="gap-x-small flex">
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={handleCancel}
            >
              {t("create-fulfillment-cancel", "Cancel")}
            </Button>
            <Button
              size="small"
              variant="primary"
              type="submit"
              loading={isSubmitting}
              onClick={createFulfillment}
              disabled={
                !Object.values(quantities).some((quantity) => quantity > 0)
              }
            >
              {t("create-fulfillment-approve-appointment", "Approve appointment")}
            </Button>
          </div>
        </div>
      </FocusModal.Header>
      <FocusModal.Main className="medium:w-6/12">
        <div className="pt-16">
          <h1 className="inter-xlarge-semibold">
            {t(
              "create-fulfillment-approve-appointment-title",
              "Approve appointment"
            )}
          </h1>
          <div className="grid-col-1 grid gap-y-8 divide-y [&>*]:pt-8">
            <div className="flex flex-col">
              <span className="inter-base-semibold ">
                {t("create-fulfillment-appointment-details", "Appointment details")}
              </span>
              <span className="text-grey-50 mb-6">
                {t(
                  "create-fulfillment-select-when-the-customer-should-come-to-pick-up-their-order",
                  "Select when the customer should come to pick up their order."
                )}
              </span>
              <div className="gap-x-xsmall flex w-full items-center">
                <div className="maw-w-[200px]">
                  <InputHeader
                    label='Appointment date'
                    required
                    className="mb-xsmall"
                  />
                  <DatePicker
                    label={''}
                    date={appointmentDate as Date | null}
                    onSubmitDate={setAppointmentDate}
                    required
                  />
                </div>
                <div className="flex-grow">
                  <InputField
                    label="Appointment time"
                    value={(pickupMoment as string | null) || ''}
                    onChange={(e) => setPickupMoment(e.target?.value || '')}
                  />
                </div>
              </div>
            </div>
            <FeatureToggle featureFlag="inventoryService">
              <div className="grid grid-cols-2">
                <div>
                  <h2 className="inter-base-semibold">
                    {t("create-fulfillment-locations", "Locations")}
                  </h2>
                  <span className="text-grey-50">
                    {t(
                      "create-fulfillment-choose-where-you-wish-to-fulfill-from",
                      "Choose where you wish to fulfill from."
                    )}
                  </span>
                </div>
                <Select
                  isMulti={false}
                  options={locationOptions}
                  value={locationSelectValue}
                  onChange={(option) => {
                    setLocationSelectValue({
                      value: option?.value,
                      label: option?.label,
                    })
                  }}
                />
              </div>
            </FeatureToggle>
            <div className="flex flex-col">
              <span className="inter-base-semibold ">
                {t("create-fulfillment-items-to-fulfill", "Items to fulfill")}
              </span>
              <span className="text-grey-50 mb-6">
                {t(
                  "create-fulfillment-select-the-number-of-items-that-you-wish-to-fulfill",
                  "Select the number of items that you wish to fulfill."
                )}
              </span>
              <CreateFulfillmentItemsTable
                items={items}
                quantities={quantities}
                setQuantities={setQuantities}
                locationId={locationSelectValue.value}
                setErrors={setErrors}
              />
            </div>
            <div className="mt-4">
              <Metadata metadata={metadata} setMetadata={setMetadata} />
            </div>
            <div>
              <div className="mb-2xsmall flex items-center justify-between">
                <h2 className="inter-base-semibold">
                  {t(
                    "create-fulfillment-send-notifications",
                    "Send notifications"
                  )}
                </h2>
                <Switch
                  checked={!noNotis}
                  onCheckedChange={(checked) => setNoNotis(!checked)}
                />
              </div>
              <p className="inter-base-regular text-grey-50">
                {t(
                  "create-fulfillment-when-toggled-notification-emails-will-be-sent",
                  "When toggled, notification emails will be sent."
                )}
              </p>
            </div>
          </div>
        </div>
      </FocusModal.Main>
    </FocusModal>
  )
}

export default CreateFulfillmentModal
