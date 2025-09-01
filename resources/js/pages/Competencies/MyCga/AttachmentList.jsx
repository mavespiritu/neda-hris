"use client"

import { useState } from "react"
import {
  Paperclip,
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  Archive,
  File,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

const AttachmentList = ({ files = [] }) => {

  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = (e) => {
    e.stopPropagation()
    setIsOpen((open) => !open)
  }

  const getIcon = (filename, type) => {
    const ext = filename?.split(".").pop()?.toLowerCase()
    const mime = type?.toLowerCase()

    if (mime?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return <ImageIcon className="h-4 w-4 text-green-600" />
    if (mime?.startsWith("video/") || ["mp4", "avi", "mov", "wmv", "flv"].includes(ext)) return <FileVideo className="h-4 w-4 text-purple-600" />
    if (mime?.startsWith("audio/") || ["mp3", "wav", "flac", "aac"].includes(ext)) return <FileAudio className="h-4 w-4 text-orange-600" />
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <Archive className="h-4 w-4 text-yellow-600" />
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return <FileText className="h-4 w-4 text-red-600" />
    return <File className="h-4 w-4 text-gray-600" />
  }

  const formatSize = (bytes) => {
    if (!bytes) return ""
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  if (!files.length) return null

  if (files.length === 1) {
    const file = files[0]
    return (
      <div className="mt-3 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 transition group">
        {getIcon(file.filename, file.type)}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-gray-900 truncate">{file.filename}</span>
          {file.size && <span className="text-xs text-gray-500">{formatSize(file.size)}</span>}
        </div>
        <a
          href={file.path} // fallback
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            const primary = `/storage/${file.path}`
            fetch(primary, { method: "HEAD" })
              .then((res) => {
                if (res.ok) {
                  window.open(primary, "_blank")
                } else {
                  window.open(file.path, "_blank") // fallback
                }
              })
              .catch(() => window.open(file.path, "_blank"))
          }}
          download
          className="ml-auto p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
        >
          <Download className="h-4 w-4 text-gray-600" />
        </a>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <button
        onClick={toggleOpen}
        type="button"
        className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 transition"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Paperclip className="h-4 w-4" />
        <span>{files.length} Attachments</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 transition group"
            >
              {getIcon(file.filename, file.type)}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-900 truncate">{file.filename}</span>
                {file.size && <span className="text-xs text-gray-500">{formatSize(file.size)}</span>}
              </div>
              <a
                href={`/storage/${file.path}`}
                download
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AttachmentList
