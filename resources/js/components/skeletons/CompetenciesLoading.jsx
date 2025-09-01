
const CompetenciesLoading = () => {
  return (
    <div role="status" className="animate-pulse w-full space-y-4">
      <div className="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-1/4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full rounded-md"></div>

      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`i${index}`} className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/6"></div>
        </div>
      ))}

      <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full rounded-md"></div>

      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`j${index}`} className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/6"></div>
        </div>
      ))}

      <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full rounded-md"></div>

      {Array.from({ length: 2 }).map((_, index) => (
        <div key={`k${index}`} className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-2/3"></div>
        </div>
      ))}

      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default CompetenciesLoading