
const IndicatorsLoading = () => {
  return (
    <div role="status" className="animate-pulse w-full">  
        <div role="status" className="w-full p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded-lg shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700 mb-4">
            <div className="flex items-center gap-4">
                <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                <div className="flex flex-col gap-2 w-full">
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={`j${index}`} className="flex items-center gap-4 pt-4">
                    <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                    <div className="flex flex-col gap-2 w-full">
                        <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                        <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    </div>
                </div>
                ))
            } 
        </div>
        <span className="sr-only">Loading...</span>
    </div>
  )
}

export default IndicatorsLoading