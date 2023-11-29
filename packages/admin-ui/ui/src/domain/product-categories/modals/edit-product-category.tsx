import { useEffect, useState } from "react"

import { ProductCategory } from "@medusajs/medusa"
import { useAdminUpdateProductCategory } from "medusa-react"
import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import Button from "../../../components/fundamentals/button"
import CrossIcon from "../../../components/fundamentals/icons/cross-icon"
import InputField from "../../../components/molecules/input"
import TextArea from "../../../components/molecules/textarea"
import SideModal from "../../../components/molecules/modal/side-modal"
import { NextSelect } from "../../../components/molecules/select/next-select"
import useNotification from "../../../hooks/use-notification"
import { Option } from "../../../types/shared"
import { getErrorMessage } from "../../../utils/error-messages"
import TreeCrumbs from "../components/tree-crumbs"
import FileUploadField from '../../../components/atoms/file-upload-field'
import Medusa from '../../../services/api'

const visibilityOptions: (t: TFunction) => Option[] = (t) => [
  {
    label: "Public",
    value: "public",
  },
  { label: "Private", value: "private" },
]

const statusOptions: (t: TFunction) => Option[] = (t) => [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]

const showInMenuOptions = (t) => [
  { label: t("show-in-menu-yes", "Yes"), value: "yes" },
  { label: t("show-in-menu-no", "No"), value: "no" },
]

type EditProductCategoriesSideModalProps = {
  activeCategory: ProductCategory
  close: () => void
  isVisible: boolean
}

/**
 * Modal for editing product categories
 */
function EditProductCategoriesSideModal(
  props: EditProductCategoriesSideModalProps
) {
  const { isVisible, close, activeCategory, categories } = props

  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [showInMenu, setShowInMenu] = useState(false)

  const [image, setImage] = useState<null | {[key: string]: any}>(null)

  console.log(image, )

  const handleFilesChosen = (files: File[]) => {
    if (files.length) {
      const toAppend = {
        url: URL.createObjectURL(files[0]),
        name: files[0].name,
        size: files[0].size,
        nativeFile: files[0],
        selected: false,
      }

      setImage(toAppend)
    }
  }

  const { t } = useTranslation()
  const notification = useNotification()

  const { mutateAsync: updateCategory } = useAdminUpdateProductCategory(
    activeCategory?.id
  )

  useEffect(() => {
    if (activeCategory) {
      setName(activeCategory.name)
      setHandle(activeCategory.handle)
      setDescription(activeCategory.description)
      setIsActive(activeCategory.is_active)
      setIsPublic(!activeCategory.is_internal)
      setShowInMenu(activeCategory.showInMenu)
      if ((activeCategory as ProductCategory & { image: string | null })?.image) {
        setImage({
          url: (activeCategory as ProductCategory & { image: string | null })?.image,
          name: "",
          size: 0,
          nativeFile: null,
          selected: false,
        })
      } else {
        setImage(null)
      }
    }
  }, [activeCategory])

  const onSave = async () => {
    try {
      let uploadedImage;
      if (image) {
        uploadedImage = await Medusa.uploads
        .create([image.nativeFile])
        .then(({ data }) => data.uploads[0])
        console.log(uploadedImage)
      }


      await updateCategory({
        name,
        handle,
        description,
        image: uploadedImage ? uploadedImage.url : null,
        is_active: isActive,
        is_internal: !isPublic,
        showInMenu: showInMenu,
      })

      notification(
        t("modals-success", "Success"),
        t(
          "modals-successfully-updated-the-category",
          "Successfully updated the category"
        ),
        "success"
      )
      close()
    } catch (e) {
      const errorMessage =
        getErrorMessage(e) ||
        t(
          "modals-failed-to-update-the-category",
          "Failed to update the category"
        )
      notification(t("modals-error", "Error"), errorMessage, "error")
    }
  }

  const onClose = () => {
    close()
  }

  return (
    <SideModal close={onClose} isVisible={!!isVisible}>
      <div className="flex h-full flex-col justify-between">
        {/* === HEADER === */}
        <div className="flex items-center justify-between p-6">
          <h3 className="inter-large-semibold flex items-center gap-2 text-xl text-gray-900">
            {t("modals-edit-product-category", "Edit product category")}
          </h3>
          <Button
            variant="secondary"
            className="h-8 w-8 p-2"
            onClick={props.close}
          >
            <CrossIcon size={20} className="text-grey-50" />
          </Button>
        </div>

        {/* === DIVIDER === */}
        <div className="block h-[1px] bg-gray-200" />

        {activeCategory && (
          <div className="mt-[25px] px-6">
            <TreeCrumbs nodes={categories} currentNode={activeCategory} />
          </div>
        )}

        <div className="flex-grow px-6">
          <InputField
            required
            label={t("modals-name", "Name")}
            type="string"
            name="name"
            value={name}
            className="my-6"
            placeholder={t(
              "modals-give-this-category-a-name",
              "Give this category a name"
            )}
            onChange={(ev) => setName(ev.target.value)}
          />

          <InputField
            required
            label={t("modals-handle", "Handle")}
            type="string"
            name="handle"
            value={handle}
            className="my-6"
            placeholder={t("modals-custom-handle", "Custom handle")}
            onChange={(ev) => setHandle(ev.target.value)}
          />

          <TextArea
            label={t("modals-description", "Description")}
            name="description"
            value={description}
            className="my-6"
            placeholder={t(
              "modals-give-this-category-a-description",
              "Give this category a description"
            )}
            onChange={(ev) => setDescription(ev.target.value)}
          />

          <NextSelect
            label={t("modals-status", "Status")}
            options={statusOptions(t)}
            value={statusOptions(t)[isActive ? 0 : 1]}
            onChange={(o) => setIsActive(o.value === "active")}
          />

          <NextSelect
            className="my-6"
            label={t("modals-visibility", "Visibility")}
            options={visibilityOptions(t)}
            value={visibilityOptions(t)[isPublic ? 0 : 1]}
            onChange={(o) => setIsPublic(o.value === "public")}
          />

          <NextSelect
            label={t("modals-show-in-menu", "Show in menu")}
            options={showInMenuOptions(t)}
            value={showInMenuOptions(t)[showInMenu ? 0 : 1]}
            onChange={(o) => setShowInMenu(o.value === "yes")}
          />

          <h4 className="inter-large-semibold text-grey-90 pb-1">{t('category-image-heading', 'Category image')}</h4>
          <div className="flex">
            <div className="flex-1">
              { !image &&
                  <FileUploadField
                      onFileChosen={handleFilesChosen}
                      placeholder={t('category-image-placeholder', 'up to 10MB each')}
                      filetypes={["image/gif", "image/jpeg", "image/png", "image/webp"]}
                      className="py-large"
                  />
              }
              {image && (
                <div className="mt-large w-100">
                  <div className="gap-y-2xsmall flex flex-col relative w-100">
                    <img src={image.url} />
                    <Button style={{position: 'absolute', right: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0}}
                            size="small" variant="danger" onClick={() => setImage(null)}>
                      <CrossIcon size={20} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === DIVIDER === */}
        <div className="block h-[1px] bg-gray-200" />

        {/* === FOOTER === */}
        <div className="flex justify-end gap-2 p-3">
          <Button size="small" variant="ghost" onClick={onClose}>
            {t("modals-cancel", "Cancel")}
          </Button>
          <Button size="small" variant="primary" onClick={onSave}>
            {t("modals-save-and-close", "Save and close")}
          </Button>
        </div>
      </div>
    </SideModal>
  )
}

export default EditProductCategoriesSideModal
