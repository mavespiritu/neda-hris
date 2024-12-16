
const CompetenciesLoading = () => {
  return (
    <div role="status" className="max-w-sm animate-pulse w-full">         
        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[180px] mb-2.5"></div> 
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full mb-4"></div>
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={`i${index}`} className="flex items-center justify-between mb-6">
                <div>
                    <div className="w-32 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-12"></div>
            </div>
        ))
        } 
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full mb-4"></div>
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={`j${index}`} className="flex items-center justify-between mb-6">
                <div>
                    <div className="w-32 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-12"></div>
            </div>
        ))
        } 
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full mb-4"></div>
        {Array.from({ length: 2 }).map((_, index) => (
            <div key={`k${index}`} className="flex items-center justify-between mb-6">
                <div>
                    <div className="w-32 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-12"></div>
            </div>
        ))
        } 
        <span className="sr-only">Loading...</span>
    </div>
  )
}

export default CompetenciesLoading