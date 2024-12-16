
const CompetencyReviewLoading = () => {
    return (
      <div role="status" className="max-w-sm animate-pulse w-full">          
          {Array.from({ length: 15 }).map((_, index) => (
              <div key={`i${index}`} className="flex flex-col gap-2 mb-6">
                  <div className="flex flex-col gap-2">
                      <div className="w-48 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                      <div className="w-64 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
              </div>
          ))
          } 
          <span className="sr-only">Loading...</span>
      </div>
    )
  }
  
  export default CompetencyReviewLoading