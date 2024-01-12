import {User} from "@medusajs/medusa"
import {useAdminStockLocations, useAdminUpdateUser} from "medusa-react"
import React, {useEffect} from "react"
import {Controller, useForm} from "react-hook-form"
import {useTranslation} from "react-i18next"
import useNotification from "../../../hooks/use-notification"
import {getErrorMessage} from "../../../utils/error-messages"
import FormValidator from "../../../utils/form-validator"
import Button from "../../fundamentals/button"
import InputField from "../../molecules/input"
import Modal from "../../molecules/modal"
import {NextSelect} from '../../molecules/select/next-select'

type EditUserModalProps = {
  handleClose: () => void
  user: User
  onSuccess: () => void
}

type EditUserModalFormData = {
  first_name: string
  last_name: string,
  location: Record<string, string>
}

const EditUserModal: React.FC<EditUserModalProps> = ({
                                                       handleClose,
                                                       user,
                                                       onSuccess,
                                                     }) => {
  const {mutate, isLoading} = useAdminUpdateUser(user.id)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: {errors},
  } = useForm<EditUserModalFormData>()

  const notification = useNotification()
  const {t} = useTranslation()
  const {stock_locations} = useAdminStockLocations()

  const locationOptions = React.useMemo(() => {
    if (!stock_locations?.length) return [];

    return stock_locations.map(sL => {
      return {
        label: sL.name,
        value: sL.id
      }
    })
  }, [stock_locations])

  useEffect(() => {
    reset(mapUser(user))
  }, [user])

  useEffect(() => {
    if (user.role !== 'location_manager' || !stock_locations?.length) return;

    const currentLocation = user.metadata['location_id'];
    console.log(currentLocation, stock_locations);
    const sL = stock_locations.find((m) => m.id === currentLocation);
    if (!sL) {
      notification(
        t("edit-user-modal-error", "Error"),
        'Location defined on user does not exist',
        "error"
      )
      return;
    }
    setValue('location', {
      label: sL.name,
      value: sL.id
    });
  }, [stock_locations, user]);

  const onSubmit = (data: EditUserModalFormData) => {
    const location = data.location?.value;

    if (user.role === 'location_manager' && !location) {
      setError('location', {message: "a Location manager should always have a location assigned to them", type: 'custom'});
      return;
    }

    if (location) {
      data['metadata'] = {
        location_id: location
      }
    }

    delete data.location

    mutate(data, {
      onSuccess: () => {
        notification(
          t("edit-user-modal-success", "Success"),
          t("edit-user-modal-user-was-updated", "User was updated"),
          "success"
        )
        onSuccess()
      },
      onError: (error) => {
        notification(
          t("edit-user-modal-error", "Error"),
          getErrorMessage(error),
          "error"
        )
      },
      onSettled: () => {
        handleClose()
      },
    })
  }

  return (
    <Modal handleClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Modal.Header handleClose={handleClose}>
            <span className="inter-xlarge-semibold">
              {t("edit-user-modal-edit-user", "Edit User")}
            </span>
          </Modal.Header>
          <Modal.Content>
            <div className="gap-large mb-base grid w-full grid-cols-2">
              <InputField
                label={t("edit-user-modal-first-name-label", "First Name")}
                placeholder={t(
                  "edit-user-modal-first-name-placeholder",
                  "First name..."
                )}
                required
                {...register("first_name", {
                  required: FormValidator.required("First name"),
                  pattern: FormValidator.whiteSpaceRule("First name"),
                  minLength: FormValidator.minOneCharRule("First name"),
                })}
                errors={errors}
              />
              <InputField
                label={t("edit-user-modal-last-name-label", "Last Name")}
                placeholder={t(
                  "edit-user-modal-last-name-placeholder",
                  "Last name..."
                )}
                required
                {...register("last_name", {
                  required: FormValidator.required("Last name"),
                  pattern: FormValidator.whiteSpaceRule("Last name"),
                  minLength: FormValidator.minOneCharRule("last name"),
                })}
                errors={errors}
              />
              {user.role === 'location_manager'
                ? <Controller name="location"
                              control={control}
                              defaultValue={null}
                              render={({
                                         field: {
                                           value,
                                           name,
                                           onChange,
                                           onBlur,
                                           ref
                                         }
                                       }) => {
                                return <NextSelect
                                  name={name}
                                  label={t('invite-modal-location', "Location")}
                                  placeholder={t('invite-modal-select-location', "Select location")}
                                  onBlur={onBlur} ref={ref}
                                  onChange={onChange}
                                  options={locationOptions}
                                  value={value}
                                />
                              }}>
                </Controller>
                : null}
            </div>
            <InputField
              label={t("edit-user-modal-email", "Email")}
              disabled
              value={user.email}
            />
          </Modal.Content>
          <Modal.Footer>
            <div className="flex w-full justify-end">
              <Button
                variant="ghost"
                size="small"
                onClick={handleClose}
                className="mr-2"
              >
                {t("edit-user-modal-cancel", "Cancel")}
              </Button>
              <Button
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="small"
              >
                {t("edit-user-modal-save", "Save")}
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Body>
      </form>
    </Modal>
  )
}

const mapUser = (user: User): EditUserModalFormData => {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    location: user.metadata?.location_id
  }
}

export default EditUserModal
