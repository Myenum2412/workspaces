import * as React from "react"

interface BasicModalProps {
  children: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  size?: string
  title?: string
  className?: string
}

export const BasicModal: React.FC<BasicModalProps> = ({ children }) => {
  return <>{children}</>
}
