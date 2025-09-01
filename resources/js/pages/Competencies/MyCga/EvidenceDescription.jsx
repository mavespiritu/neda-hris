import { useState } from 'react'

const EvidenceDescription = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const charLimit = 300 // Define your character limit here

    const toggleExpand = () => {
        setIsExpanded(prev => !prev)
    }

    const shouldShowReadMore = text ? text.length > charLimit : false

    return (
        <div className="flex flex-col justify-start items-start">
            <div className="text-xs leading-normal mb-2">
                {isExpanded ? (
                    <div className="flex flex-col">
                        <span className="text-muted-foreground font-medium">Details:</span>
                        <span className="font-medium text-justify">{text}</span> 
                    </div>
                ) : (shouldShowReadMore ? (
                    <div className="flex flex-col">
                        <span className="text-muted-foreground font-medium">Details:</span>
                        <span className="font-medium text-justify">{text?.substring(0, charLimit)}...</span> 
                    </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">Context:</span>
                            <span className="font-medium text-justify">{text}</span> 
                        </div>
                    )
                )}
            </div>

            {shouldShowReadMore && !isExpanded && (
                <button 
                    onClick={toggleExpand} 
                    className="font-bold text-xs my-1"
                >
                    Read more
                </button>
            )}

            {isExpanded && (
                <button 
                    onClick={toggleExpand} 
                    className="font-bold text-xs my-1"
                >
                    Show less
                </button>
            )}
        </div>
    )
}

export default EvidenceDescription
