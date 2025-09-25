import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface PromptModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  placeholder?: string
  onConfirm: (value: string) => void
  confirmText?: string
  cancelText?: string
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  placeholder = '',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [value, setValue] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(value)
    setValue('')
  }

  const handleClose = () => {
    setValue('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3">
              {message}
            </p>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm()
                }
              }}
            />
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}