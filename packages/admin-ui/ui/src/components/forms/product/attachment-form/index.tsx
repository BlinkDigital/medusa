import clsx from "clsx"
import { useMemo } from "react"
import {
  Controller,
  FieldArrayWithId,
  useFieldArray,
  useWatch,
} from "react-hook-form"
import { FormAttachment } from "../../../../types/shared"
import { NestedForm } from "../../../../utils/nested-form"
import FileUploadField from "../../../atoms/file-upload-field"
import Button from "../../../fundamentals/button"
import CheckCircleFillIcon from "../../../fundamentals/icons/check-circle-fill-icon"
import TrashIcon from "../../../fundamentals/icons/trash-icon"
import Actionables, { ActionType } from "../../../molecules/actionables"

type AttachmentType = { selected: boolean } & FormAttachment

export type AttachmentFormType = {
  attachments: AttachmentType[]
}

type Props = {
  form: NestedForm<AttachmentFormType>
}

const AttachmentForm = ({form}: Props) => {
  const {control, path, setValue} = form

  const {fields, append, remove} = useFieldArray({
    control: control,
    name: path("attachments"),
  })

  const handleFilesChosen = (files: File[]) => {
    if (files.length) {
      const toAppend = files.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        nativeFile: file,
        selected: false,
      }))

      append(toAppend)
    }
  }

  const attachments = useWatch({
    control,
    name: path("attachments"),
    defaultValue: [],
  })

  const selected = useMemo(() => {
    const selected: number[] = []

    attachments.forEach((i, index) => {
      if (i.selected) {
        selected.push(index)
      }
    })

    return selected
  }, [attachments])

  const handleRemove = () => {
    remove(selected)
  }

  const handleDeselect = () => {
    selected.forEach((i) => {
      setValue(path(`attachments.${i}.selected`), false)
    })
  }

  return (
    <div>
      <div>
        <div>
          <FileUploadField
            onFileChosen={handleFilesChosen}
            placeholder=""
            multiple
            filetypes={["application/pdf"]}
            className="py-large"
          />
        </div>
      </div>
      {fields.length > 0 && (
        <div className="mt-large">
          <div className="mb-small flex items-center justify-between">
            <h2 className="inter-large-semibold">Uploads</h2>
            <ModalActions
              number={selected.length}
              onDeselect={handleDeselect}
              onRemove={handleRemove}
            />
          </div>
          <div className="gap-y-2xsmall flex flex-col">
            {fields.map((field, index) => {
              return (
                <File
                  key={field.id}
                  file={field}
                  index={index}
                  remove={remove}
                  form={form}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type FileProps = {
  file: FieldArrayWithId<AttachmentFormType, "attachments", "id">
  index: number
  remove: (index: number) => void
  form: NestedForm<AttachmentFormType>
}

const File = ({file, index, form, remove}: FileProps) => {
  const {control, path} = form

  const actions: ActionType[] = [
    {
      label: "Delete",
      onClick: () => remove(index),
      icon: <TrashIcon size={20}/>,
      variant: "danger",
    },
  ]

  return (
    <Controller
      name={path(`attachments.${index}.selected`)}
      control={control}
      render={({field: {value, onChange}}) => {
        return (
          <div className="relative">
            <button
              className={clsx(
                "px-base py-xsmall hover:bg-grey-5 rounded-rounded group flex items-center justify-between",
                {
                  "bg-grey-5": value,
                }
              )}
              type="button"
              onClick={() => onChange(!value)}
            >
              <div className="gap-x-large flex items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <a href={file.url} className="file-widget">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         className="feather feather-file">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </a>
                </div>
                <div className="inter-small-regular flex flex-col text-left">
                  <p>{file.name}</p>
                  <p className="text-grey-50">
                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                  </p>
                </div>
              </div>
              <div className="gap-x-base flex items-center">
                <span
                  className={clsx("hidden", {
                    "!text-violet-60 !block": value,
                  })}
                >
                  <CheckCircleFillIcon size={24}/>
                </span>
              </div>
            </button>
            <div className="right-base absolute top-0 bottom-0 flex items-center">
              <Actionables actions={actions} forceDropdown/>
            </div>
          </div>
        )
      }}
    />
  )
}

type ModalActionsProps = {
  number: number
  onRemove: () => void
  onDeselect: () => void
}

const ModalActions = ({number, onRemove, onDeselect}: ModalActionsProps) => {
  return (
    <div className="flex h-10 items-center overflow-y-hidden pr-1">
      <div
        className={clsx(
          "gap-x-small flex items-center transition-all duration-200",
          {
            "translate-y-[-42px]": !number,
            "translate-y-[0px]": number,
          }
        )}
      >
        <span>{number} selected</span>
        <div className="bg-grey-20 h-5 w-px"/>
        <div className="gap-x-xsmall flex items-center">
          <Button
            variant="secondary"
            size="small"
            type="button"
            onClick={onDeselect}
          >
            Deselect
          </Button>
          <Button
            variant="danger"
            size="small"
            type="button"
            onClick={onRemove}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AttachmentForm
export { File }