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
            <div className={`text-xs text-muted-foreground leading-normal mb-2`}>
                {isExpanded ? (
                    <>
                        <span className="text-xs font-medium">Context:</span> {text}
                    </>
                ) : (shouldShowReadMore ? (
                    <>
                        <span className="text-xs font-medium">Context:</span> {text?.substring(0, charLimit)}...`
                    </>
                    ) : (
                        <>
                            <span className="text-xs font-medium">Context:</span> {text}
                        </>
                    )
                )}
            </div>

            {shouldShowReadMore && !isExpanded && (
                <button 
                    onClick={toggleExpand} 
                    className="font-medium text-xs my-1"
                >
                    Read more
                </button>
            )}

            {isExpanded && (
                <button 
                    onClick={toggleExpand} 
                    className="font-medium text-xs my-1"
                >
                    Show less
                </button>
            )}
        </div>
    )
}

export default EvidenceDescription
