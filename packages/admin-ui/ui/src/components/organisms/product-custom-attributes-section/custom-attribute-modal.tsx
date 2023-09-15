import { Product } from "@medusajs/medusa"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import useEditProductActions from "../../../hooks/use-edit-product-actions"
import { nestedForm } from "../../../utils/nested-form"
import Button from "../../fundamentals/button"
import Modal from "../../molecules/modal"
import MetadataForm, {
  getMetadataFormValues,
  getSubmittableMetadata,
  MetadataFormType
} from '../../forms/general/metadata-form'

type Props = {
  product: Product & { custom_attributes?: Record<string, any> | null }
  open: boolean
  onClose: () => void
}

type CustomAttributeFormType = {
  custom_attributes: MetadataFormType
}

const CustomAttributeModal = ({ product, open, onClose }: Props) => {
  const { onUpdate, updating } = useEditProductActions(product.id)
  const form = useForm<CustomAttributeFormType>({
    defaultValues: getDefaultValues(product),
  })
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form

  useEffect(() => {
    reset(getDefaultValues(product))
  }, [product])

  const onReset = () => {
    reset(getDefaultValues(product))
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    onUpdate(
      {
        // @ts-ignore
        custom_attributes: getSubmittableMetadata(data.custom_attributes),
      },
      onReset
    )
  })

  return (
    <Modal open={open} handleClose={onReset} isLargeModal>
      <Modal.Body>
        <Modal.Header handleClose={onReset}>
          <h1 className="inter-xlarge-semibold m-0">Edit Custom Attributes</h1>
        </Modal.Header>
        <form onSubmit={onSubmit}>
          <Modal.Content>
            <MetadataForm form={nestedForm(form, "custom_attributes")} />
          </Modal.Content>
          <Modal.Footer>
            <div className="flex w-full justify-end gap-x-2">
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={onReset}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="primary"
                type="submit"
                disabled={!isDirty}
                loading={updating}
              >
                Save
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  )
}

const getDefaultValues = (
  product: Product & { custom_attributes?: Record<string, any> | null }
): CustomAttributeFormType => {
  return {
    custom_attributes: getMetadataFormValues(product?.custom_attributes ?? {})
  }
}

export default CustomAttributeModal
