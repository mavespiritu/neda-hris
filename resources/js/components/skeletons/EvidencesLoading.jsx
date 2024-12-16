
const EvidencesLoading = () => {
    return (
      <div role="status" className="w-full animate-pulse"> 
      
        <div role="status" className="w-full p-4 border border-gray-200 divide-y divide-gray-200 rounded-lg shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700 mb-4">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[220px] mb-2"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[150px] mb-8"></div>

            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[120px] mb-2"></div>
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={`i${index}`} className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-2"></div>
            ))
            } 
        </div>

        <div role="status" className="w-full p-4 border border-gray-200 divide-y divide-gray-200 rounded-lg shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700 mb-4">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[220px] mb-2"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[150px] mb-8"></div>

            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[120px] mb-2"></div>
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={`j${index}`} className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-2"></div>
            ))
            } 
        </div>

          <span className="sr-only">Loading...</span>
      </div>
    )
  }
  
  export default EvidencesLoading