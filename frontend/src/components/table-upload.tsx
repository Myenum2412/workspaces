import * as React from "react"

interface TableUploadProps {
  onUpload?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  onFilesChange?: (files: any[]) => void
  compactImage?: boolean
}

const TableUpload: React.FC<TableUploadProps> = (_props: TableUploadProps) => null

export default TableUpload
