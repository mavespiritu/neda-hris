
const IndicatorsLoading = () => {
  return (
    <div role="status" className="max-w-sm animate-pulse w-full">  
        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-2"></div>       
        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[120px] mb-4"></div>

        {Array.from({ length: 5 }).map((_, index) => (
            <div key={`i${index}`} className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-2.5"></div>
        ))
        } 

        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[120px] mb-4 mt-6"></div>
        <div role="status" className="max-w-md p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700 mb-4">
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