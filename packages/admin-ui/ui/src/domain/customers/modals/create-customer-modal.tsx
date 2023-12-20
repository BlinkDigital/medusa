import Modal from '../../../components/molecules/modal'
import {useForm} from 'react-hook-form'
import MetadataForm, {getSubmittableMetadata, MetadataFormType} from '../../../components/forms/general/metadata-form'
import {useAdminCreateCustomer, useAdminRegions} from 'medusa-react'
import InputField from '../../../components/molecules/input'
import {validateEmail} from '../../../utils/validate-email'
import {nestedForm} from '../../../utils/nested-form'
import Button from '../../../components/fundamentals/button'
import {useTranslation} from 'react-i18next'
import {getErrorMessage} from '../../../utils/error-messages'
import useNotification from '../../../hooks/use-notification'
import {Address, AddressCreatePayload, Customer} from '@medusajs/client-types'
import AddressForm, {AddressType} from '../../../components/templates/address-form'
import {useEffect, useMemo, useState} from 'react'
import Accordion from '../../../components/organisms/accordion'
import {Option} from '../../../types/shared'
import {useAdminCreateCustomerInvite, useAdminCustomerAddAddress} from '../mutations'

type CreateCustomerProps = {
  handleClose: () => void
}

type CreateCustomerFormType = {
  email: string
  first_name: string
  last_name: string
  phone: string | null
  metadata: MetadataFormType
  address: Address
}

function CreateCustomerModal(props: CreateCustomerProps) {
  const [customerId, setCustomerId] = useState(null)
  const [address, setAddress] = useState<AddressCreatePayload | null>(null)
  const form = useForm<CreateCustomerFormType>()
  const {t} = useTranslation()
  const {regions, isLoading} = useAdminRegions()
  const notification = useNotification()
  const createCustomerAdmin = useAdminCreateCustomer()
  const createCustomerInvite = useAdminCreateCustomerInvite()
  const adminAddAddress = useAdminCustomerAddAddress()

  const {
    handleSubmit,
    register,
    formState: {isDirty},
  } = form

  useEffect(() => {
    if (!customerId) return;

    if (address !== null) {
      adminAddAddress.mutateAsync({id: customerId, shipping_address: address}).then(() => {
        createCustomerInvite.mutateAsync({id: customerId}).then(() => {
          notification(
            t("new-success", "Success"),
            t(
              "new-successfully-created-customer-invited",
              "Successfully created customer and sent them an invite"
            ),
            "success"
          )

          props.handleClose()
        }).catch((error) => {
          notification(
            t('new-error', 'Error'),
            getErrorMessage(error),
            'error'
          )
        })
      }).catch((error) => {
        notification(
          t('new-error', 'Error'),
          getErrorMessage(error),
          'error'
        )
      })
    } else {
      createCustomerInvite.mutateAsync({id: customerId}).then(() => {
        notification(
          t("new-success", "Success"),
          t(
            "new-successfully-created-customer-invited",
            "Successfully created customer and sent them an invite"
          ),
          "success"
        )

        props.handleClose()
      }).catch((error) => {
        notification(
          t('new-error', 'Error'),
          getErrorMessage(error),
          'error'
        )
      })
    }

  }, [customerId, address]);

  const validCountries = useMemo(() => {
    if (isLoading) return [];

    const activeRegion = regions.at(0)
    return activeRegion.countries.map((r) => ({
      label: r.display_name,
      value: r.iso_2
    }))
  }, [regions, isLoading])

  const onSubmit = handleSubmit((data: CreateCustomerFormType) => {
    if (customerId) {
      // re-render
      console.log('attempt re-render')
      setCustomerId(customerId)
      return
    }

    createCustomerAdmin.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email,
        metadata: getSubmittableMetadata(data.metadata),
      },
      {
        onSuccess: (resp: any) => {
          if (data.address) {
            setAddress({
              ...data.address,
              country_code: (data.address.country_code as Option).value
            })
          }

          setCustomerId(resp.customer.id)
        },
        onError: (err) => {
          props.handleClose()
          notification(
            t("new-error", "Error"),
            getErrorMessage(err),
            "error"
          )
        },
      }
    )
  })

  return (
    <Modal handleClose={props.handleClose}>
      <Modal.Body>
        <Modal.Header handleClose={props.handleClose}>
          <span className="inter-xlarge-semibold">
            {t("details-customer-details", "Customer Details")}
          </span>
        </Modal.Header>
        <Modal.Content>
          <form action=""></form>
          <div className="gap-y-xlarge flex flex-col">
            <div>
              <h2 className="inter-base-semibold text-grey-90 mb-4">Contact</h2>
              <div className="flex space-x-2">
                <InputField
                  required
                  label={t("details-email", "Email")}
                  {...register("email", {
                    validate: (value) => !!validateEmail(value),
                    required: true
                  })}
                />
                <InputField
                  label={t("details-phone-number", "Phone number")}
                  {...register("phone")}
                  placeholder="+45 42 42 42 42"
                />
              </div>
            </div>
            <div>
              <h2 className="inter-base-semibold text-grey-90 mb-4">
                {t("details-general", "General")}
              </h2>
              <div className="flex w-full space-x-2">
                <InputField
                  label={t("details-first-name", "First Name")}
                  {...register("first_name")}
                  placeholder={t("details-lebron", "Lebron")}
                />
                <InputField
                  label={t("details-last-name", "Last Name")}
                  {...register("last_name")}
                  placeholder={t("details-james", "James")}
                />
              </div>
            </div>
            <div>
              <h2 className="inter-base-semibold mb-base">
                {t("details-metadata", "Metadata")}
              </h2>
              <MetadataForm form={nestedForm(form, "metadata")}/>
            </div>
            <div>
              <h2 className="inter-base-semibold mb-base">
                {t('new-address', 'Address')}
              </h2>
              <Accordion type='single'>
                <Accordion.Item value='address'>
                  <AddressForm form={nestedForm(form, 'address')} type={AddressType.SHIPPING}
                               countryOptions={validCountries} requiredFields={['phone', 'province', 'company']} />
                </Accordion.Item>
              </Accordion>
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end">
            <Button
              variant="secondary"
              size="small"
              onClick={props.handleClose}
              className="mr-2"
              type="button"
            >
              {t("details-cancel", "Cancel")}
            </Button>
            <Button
              loading={createCustomerAdmin.isLoading}
              disabled={!isDirty || createCustomerAdmin.isLoading}
              variant="primary"
              size="small"
              onClick={onSubmit}
            >
              {t("customer-create", "Create customer")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default CreateCustomerModal;
