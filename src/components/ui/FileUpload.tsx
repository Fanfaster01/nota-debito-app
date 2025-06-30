// src/components/ui/FileUpload.tsx

import React, { useState, useRef } from 'react'
import { 
  DocumentArrowUpIcon, 
  XMarkIcon,
  DocumentIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { Button } from './Button'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // en MB
  onFilesSelected: (files: File[]) => void
  onRemoveFile?: (index: number) => void
  disabled?: boolean
  className?: string
  files?: File[]
  allowedTypes?: string[]
  dragDropText?: string
  browseText?: string
}

export function FileUpload({
  accept = '.xlsx,.xls,.csv,.pdf',
  multiple = false,
  maxSize = 10,
  onFilesSelected,
  onRemoveFile,
  disabled = false,
  className = '',
  files = [],
  allowedTypes = ['xlsx', 'xls', 'csv', 'pdf'],
  dragDropText = 'Arrastra archivos aquí o',
  browseText = 'selecciona archivos'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo ${file.name} es muy grande. Máximo ${maxSize}MB.`
    }

    // Validar tipo
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && !allowedTypes.includes(extension)) {
      return `Tipo de archivo no permitido: ${extension}. Permitidos: ${allowedTypes.join(', ')}`
    }

    return null
  }

  const processFiles = (fileList: FileList) => {
    const newFiles: File[] = []
    const errors: string[] = []

    Array.from(fileList).forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
      } else {
        newFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors[0])
      return
    }

    setError(null)
    
    if (!multiple && newFiles.length > 0) {
      onFilesSelected([newFiles[0]])
    } else {
      onFilesSelected(newFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const files = e.dataTransfer.files
    if (files) {
      processFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processFiles(files)
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const iconClass = "h-6 w-6"
    
    switch (extension) {
      case 'pdf':
        return <DocumentIcon className={`${iconClass} text-red-500`} />
      case 'xlsx':
      case 'xls':
        return <DocumentIcon className={`${iconClass} text-green-500`} />
      case 'csv':
        return <DocumentIcon className={`${iconClass} text-blue-500`} />
      default:
        return <DocumentIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zona de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={handleBrowseClick}
      >
        <DocumentArrowUpIcon className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {dragDropText}{' '}
            <span className="text-blue-600 hover:text-blue-500 font-medium">
              {browseText}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos: {allowedTypes.join(', ').toUpperCase()} (máx. {maxSize}MB)
          </p>
        </div>
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Archivos seleccionados ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={disabled}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}