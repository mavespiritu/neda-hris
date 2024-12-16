import Competencies from "@/pages/MyCga/Competencies"

const CurrentPosition = ({ emp_id, position_id, fetchHistories }) => {

    return (
        <div className="h-full grid grid-rows-[1fr]">
            <Competencies emp_id={emp_id} position_id={position_id} />
        </div>
    );
};

export default CurrentPosition;
