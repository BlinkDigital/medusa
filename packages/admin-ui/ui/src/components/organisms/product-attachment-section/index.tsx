import { Product } from "@medusajs/medusa"
import { useTranslation } from "react-i18next"
import useToggleState from "../../../hooks/use-toggle-state"
import { ActionType } from "../../molecules/actionables"
import Section from "../../organisms/section"
import AttachmentModal from "./attachment-modal"

type Props = {
  product: Product & { attachments: { id: string, url: string }[] }
}

const ProductAttachmentSection = ({ product }: Props) => {
  const { state, close, toggle } = useToggleState()
  const { t } = useTranslation()

  const actions: ActionType[] = [
    {
      label: t("product-attachment-section-edit-media", "Edit Attachments"),
      onClick: toggle,
    },
  ]

  return (
    <>
      <Section title="Attachments" actions={actions}>
        {product.attachments && product.attachments.length > 0 && (
          <div className="gap-xsmall mt-base grid grid-cols-3">
            {product.attachments.map((attachment, index) => {
              return (
                <div
                  key={attachment.id}
                  className="flex aspect-square items-center justify-center"
                >
                  <img
                    src={attachment.url}
                    alt={`Image ${index + 1}`}
                    className="rounded-rounded max-h-full max-w-full object-contain"
                  />
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <AttachmentModal product={product} open={state} onClose={close} />
    </>
  )
}

export default ProductAttachmentSection
