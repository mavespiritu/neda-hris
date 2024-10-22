import { useState } from 'react'
import { Paperclip } from 'lucide-react' // Import the Paperclip icon from lucide-react

const AttachmentList = ({ files, evidence }) => {
  const [isOpen, setIsOpen] = useState(false) // State to manage the visibility of the file list

  const handleToggle = () => {
    setIsOpen((prev) => !prev) // Toggle the open state
  }

  const attachmentFiles = files || [] // Get the files for the specific evidence
  const attachmentCount = attachmentFiles.length // Count of attachments

  return (
    <div>
      {attachmentCount === 1 ? (
        // If there is only one file, render it directly
        <a 
          key={attachmentFiles[0].id} // Use the first file
          href={`/storage/${attachmentFiles[0].file_path}`} // Update with the correct path to your file
          className="text-xs text-blue-500 hover:underline" // Optional styling
          download // This attribute prompts download
        >
          {attachmentFiles[0].file_name}
        </a>
      ) : (
        // If there are multiple files, show the clip icon with count
        <div>
          <div className="flex items-center cursor-pointer" onClick={handleToggle}>
            <Paperclip className="h-3 w-3 mr-1" />
            <span className="text-xs">{attachmentCount} Attachments</span>
          </div>

          {isOpen && (
            <div className="flex flex-col gap-1 mt-2">
              {attachmentFiles.map((file, index) => (
                <a 
                  key={index} // Ensure to add a unique key for each mapped element
                  href={`/storage/${file.file_path}`} // Update with the correct path to your files
                  className="text-xs text-blue-500 hover:underline cursor-pointer" // Optional styling
                  download // This attribute prompts download
                >
                  {file.file_name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AttachmentList
