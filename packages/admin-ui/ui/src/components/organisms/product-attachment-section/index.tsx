import {Product} from "@medusajs/medusa"
import {useTranslation} from "react-i18next"
import useToggleState from "../../../hooks/use-toggle-state"
import {ActionType} from "../../molecules/actionables"
import Section from "../../organisms/section"
import AttachmentModal from "./attachment-modal"
import {useMemo} from 'react'

type Props = {
  product: Product & { attachments: { id: string, url: string }[] }
}

const FileMatchRegex = /([0-9]+)-(.+)\.pdf$/;

function extractFileInfoFromUrl(fileUrl: string): string | string[] {
  const {pathname} = new URL(fileUrl);
  const parts = pathname.split('/');
  const fileName = parts[parts.length - 1];
  const matches = FileMatchRegex.exec(fileName);
  if (!matches) return fileName;

  return [matches[1], matches[2]];
}

const ProductAttachmentSection = ({product}: Props) => {
  const {state, close, toggle} = useToggleState()
  const {t} = useTranslation()

  const actions: ActionType[] = [
    {
      label: t("product-attachment-section-edit-media", "Edit Attachments"),
      onClick: toggle,
    },
  ]

  const attachmentInfo = useMemo(() => {
    return new Map(
      product.attachments.map((attachment) =>
        [attachment.id, extractFileInfoFromUrl(attachment.url)]
      )
    )
  }, [product.attachments])

  return (
    <>
      <Section title="Attachments" actions={actions}>
        {product.attachments && product.attachments.length > 0 && (
          <div className="space-y-2">
            {product.attachments.map((attachment, index) => {
              return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-start"
                >
                  <a target='_blank' className='flex items-center gap-xsmall py-3' href={attachment.url}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         className="feather feather-file">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                    {Array.isArray(attachmentInfo.get(attachment.id))
                      ? <span>
                          {(attachmentInfo.get(attachment.id) as string[])[1]}
                      </span>
                      : <span>
                        {attachmentInfo.get(attachment.id)}
                      </span>
                    }
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <AttachmentModal product={product} open={state} onClose={close}/>
    </>
  )
}

export default ProductAttachmentSection
