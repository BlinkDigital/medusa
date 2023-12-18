import { Product } from "@medusajs/medusa"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import useEditProductActions from "../../../hooks/use-edit-product-actions"
import useNotification from "../../../hooks/use-notification"
import { FormAttachment, FormImage } from "../../../types/shared"
import { prepareImages } from "../../../utils/images"
import { nestedForm } from "../../../utils/nested-form"
import Button from "../../fundamentals/button"
import Modal from "../../molecules/modal"
import AttachmentForm, {AttachmentFormType} from '../../forms/product/attachment-form'

type Props = {
  product: Product & { attachments: FormAttachment[] }
  open: boolean
  onClose: () => void
}

type AttachmentFormWrapper = {
  media: AttachmentFormType
}

const AttachmentModal = ({ product, open, onClose }: Props) => {
  const { t } = useTranslation()
  const { onUpdate, updating } = useEditProductActions(product.id)
  const form = useForm<AttachmentFormWrapper>({
    defaultValues: getDefaultValues(product),
  })

  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form

  const notification = useNotification()

  useEffect(() => {
    reset(getDefaultValues(product))
  }, [product, reset])

  const onReset = () => {
    reset(getDefaultValues(product))
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    let preppedAttachments: FormAttachment[] = []

    try {
      preppedAttachments = await prepareImages(data.media.attachments)
    } catch (error) {
      let errorMessage = t(
        "product-media-section-upload-attachments-error",
        "Something went wrong while trying to upload attachments."
      )
      const response = (error as any).response as Response

      if (response.status === 500) {
        errorMessage =
          errorMessage +
          " " +
          t(
            "product-media-section-file-service-not-configured",
            "You might not have a file service configured. Please contact your administrator"
          )
      }

      notification(
        t("product-media-section-error", "Error"),
        errorMessage,
        "error"
      )
      return
    }
    const urls = preppedAttachments.map((attachment) => attachment.url)

    onUpdate(
      {
        attachments: urls,
      },
      onReset
    )
  })

  return (
    <Modal open={open} handleClose={onReset} isLargeModal>
      <Modal.Body>
        <Modal.Header handleClose={onReset}>
          <h1 className="inter-xlarge-semibold m-0">
            {t("product-media-section-edit-media", "Edit Media")}
          </h1>
        </Modal.Header>
        <form onSubmit={onSubmit}>
          <Modal.Content>
            <div>
              <h2 className="inter-large-semibold mb-2xsmall">
                {t("product-media-section-media", "Media")}
              </h2>
              <p className="inter-base-regular text-grey-50 mb-large">
                {t(
                  "product-media-section-add-images-to-your-product",
                  "Add images to your product."
                )}
              </p>
              <div>
                <AttachmentForm form={nestedForm(form, "media")} />
              </div>
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex w-full justify-end gap-x-2">
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={onReset}
              >
                {t("product-media-section-cancel", "Cancel")}
              </Button>
              <Button
                size="small"
                variant="primary"
                type="submit"
                disabled={!isDirty}
                loading={updating}
              >
                {t("product-media-section-save-and-close", "Save and close")}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  )
}

const getDefaultValues = (product: Product & { attachments: FormAttachment[] }): AttachmentFormWrapper => {
  return {
    media: {
      attachments:
        product.attachments?.map((attachment) => ({
          url: attachment.url,
          selected: false,
          name: extractFileInfoFromUrl(attachment.url),
        })) || [],
    },
  }
}

const FileMatchRegex = /([0-9]+)-(.+)\.pdf$/;

function extractFileInfoFromUrl(fileUrl: string): string {
  const {pathname} = new URL(fileUrl);
  const parts = pathname.split('/');
  const fileName = parts[parts.length - 1];
  const matches = FileMatchRegex.exec(fileName);
  if (!matches) return fileName;

  return matches[2];
}

export default AttachmentModal
