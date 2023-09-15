import { Product } from "@medusajs/medusa"
import useToggleState from "../../../hooks/use-toggle-state"
import EditIcon from "../../fundamentals/icons/edit-icon"
import { ActionType } from "../../molecules/actionables"
import Section from "../section"
import CustomAttributeModal from "./custom-attribute-modal"

type Props = {
  product: Product & { custom_attributes?: Record<string, any> | null }
}

const CustomProductAttributesSection = ({ product }: Props) => {
  const { state, toggle, close } = useToggleState()

  const actions: ActionType[] = [
    {
      label: "Edit Custom Attributes",
      onClick: toggle,
      icon: <EditIcon size={20} />,
    },
  ]

  return (
    <>
      <Section title="Custom Attributes" actions={actions} forceDropdown>
        <div className="gap-y-xsmall mt-base flex flex-col">
          { Object.keys(product?.custom_attributes || {}).length ?
            Object.entries(product?.custom_attributes || {}).map(
              ([k, v]) => <Attribute attribute={k} value={v} />
            ) : <p className="inter-base-regular text-grey-50">No custom attributes specified</p>
          }
        </div>
      </Section>

      <CustomAttributeModal onClose={close} open={state} product={product} />
    </>
  )
}

type AttributeProps = {
  attribute: string
  value: string | number | null
}

const Attribute = ({ attribute, value }: AttributeProps) => {
  return (
    <div className="inter-base-regular text-grey-50 flex w-full items-center justify-between">
      <p>{attribute}</p>
      <p>{value || "–"}</p>
    </div>
  )
}

export default CustomProductAttributesSection
