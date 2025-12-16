"use client"

import {
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  Archive,
  File,
  Download,
  Eye,
} from "lucide-react"

const Attachment = ({ file }) => {
  if (!file) return null

  const fileName = file.name || file.filename

  const filePath = file.path || file.filepath

  const fileType = file.type || file.filetype

  const fileSize = file.size || file.filesize

  const getIcon = (filename, type) => {
    const ext = filename?.split(".").pop()?.toLowerCase()
    const mime = type?.toLowerCase()

    if (mime?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext))
      return <ImageIcon className="h-4 w-4 text-green-600" />
    if (mime?.startsWith("video/") || ["mp4", "avi", "mov", "wmv", "flv"].includes(ext))
      return <FileVideo className="h-4 w-4 text-purple-600" />
    if (mime?.startsWith("audio/") || ["mp3", "wav", "flac", "aac"].includes(ext))
      return <FileAudio className="h-4 w-4 text-orange-600" />
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
      return <Archive className="h-4 w-4 text-yellow-600" />
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext))
      return <FileText className="h-4 w-4 text-red-600" />
    return <File className="h-4 w-4 text-gray-600" />
  }

  const formatSize = (bytes) => {
    if (!bytes) return ""
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const openFile = () => {
    const primary = `/storage/${filePath}`
    fetch(primary, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          window.open(primary, "_blank")
        } else {
          window.open(filePath, "_blank")
        }
      })
      .catch(() => window.open(filePath, "_blank"))
  }

  return (
    <div className="flex items-center justify-between gap-2 transition group w-full">
      <div className="flex items-start gap-2 min-w-0">
        {getIcon(fileName, fileType)}
        <div className="flex flex-col min-w-0">
          {/* Filename (truncated with tooltip) */}
          <span
            className="text-xs font-medium text-gray-900 truncate max-w-[250px]"
            title={file.filename || file.name}
          >
            {file.filename || file.name}
          </span>

          {/* Filesize only */}
          {fileSize && (
            <span className="text-xs text-gray-500">{formatSize(fileSize)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex">
        {/* View button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openFile()
          }}
          className="ml-auto p-1 rounded hover:bg-gray-200 transition"
          title="View"
        >
          <Eye className="h-4 w-4 text-blue-600" />
        </button>

        {/* Download button */}
        <a
          href={`/storage/${filePath}`}
          download
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-gray-200 transition"
          title="Download"
        >
          <Download className="h-4 w-4 text-gray-600" />
        </a>
      </div>
    </div>
  )
}

export default Attachment
