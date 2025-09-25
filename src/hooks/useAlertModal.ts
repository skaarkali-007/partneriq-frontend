import { useState, useCallback } from 'react'

interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'error' | 'warning' | 'success'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

interface ConfirmOptions extends AlertOptions {
  showCancel: true
}

interface PromptOptions {
  title: string
  message: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

export const useAlertModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [options, setOptions] = useState<AlertOptions>({
    message: '',
    type: 'info'
  })
  const [promptOptions, setPromptOptions] = useState<PromptOptions>({
    title: '',
    message: ''
  })
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)
  const [resolvePromptPromise, setResolvePromptPromise] = useState<((value: string | null) => void) | null>(null)

  const showAlert = useCallback((alertOptions: AlertOptions) => {
    setOptions(alertOptions)
    setIsOpen(true)
    
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const showConfirm = useCallback((confirmOptions: ConfirmOptions) => {
    return showAlert(confirmOptions)
  }, [showAlert])

  const showPrompt = useCallback((promptOptions: PromptOptions) => {
    setPromptOptions(promptOptions)
    setIsPromptOpen(true)
    
    return new Promise<string | null>((resolve) => {
      setResolvePromptPromise(() => resolve)
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handlePromptClose = useCallback(() => {
    setIsPromptOpen(false)
    if (resolvePromptPromise) {
      resolvePromptPromise(null)
      setResolvePromptPromise(null)
    }
  }, [resolvePromptPromise])

  const handlePromptConfirm = useCallback((value: string) => {
    setIsPromptOpen(false)
    if (resolvePromptPromise) {
      resolvePromptPromise(value)
      setResolvePromptPromise(null)
    }
  }, [resolvePromptPromise])

  return {
    isOpen,
    isPromptOpen,
    options,
    promptOptions,
    showAlert,
    showConfirm,
    showPrompt,
    handleClose,
    handleConfirm,
    handlePromptClose,
    handlePromptConfirm
  }
}