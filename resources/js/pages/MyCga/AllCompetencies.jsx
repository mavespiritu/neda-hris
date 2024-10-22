import Competencies from "@/pages/MyCga/Competencies"

const AllCompetencies = ({ emp_id }) => {
  return (
    <div className="h-full grid grid-rows-[1fr]">
      <Competencies emp_id={emp_id} all={true} />
    </div>
  )
}

export default AllCompetencies