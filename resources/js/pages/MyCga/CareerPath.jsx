import Competencies from "@/pages/MyCga/Competencies"

const CareerPath = ({ emp_id, selectedCareer, setSelectedCareer, fetchCareers }) => {

  return (
    <div className="h-full grid grid-rows-[1fr]">
        {selectedCareer ? (
            <Competencies emp_id={emp_id} position_id={selectedCareer} setSelectedCareer={setSelectedCareer} custom={true} career={true} fetchCareers={fetchCareers} />
        ) : (
            <div className="font-semibold text-muted-foreground text-sm flex justify-center items-center">
              Please select a career path to view competencies.
            </div>
        )}
    </div>
  )
}

export default CareerPath