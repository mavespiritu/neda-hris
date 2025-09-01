import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const Question = ({ question, handleUpdateQuestion }) => {
  const renderQuestion = (q, isSubQuestion = false) => {
    
    return (
      <div key={q.item_no+`-`+q.list} className="mb-2 text-sm">
        <div className="flex flex-col gap-2">
            <p>{q.list !== '' ? q.list : q.item_no}. {q.question}</p>
            <div className="flex">
                {q.isAnswerable && (
                    <div className="flex flex-col gap-2">
                        <RadioGroup
                            onValueChange={(value) => handleUpdateQuestion(question.item_no, isSubQuestion ? q.list : null, 'answer', value)}
                            defaultValue={q.answer || ""} // Ensure value is set (use empty string if undefined)
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id={`${q.item_no+`-`+q.list}-yes`} />
                                <Label htmlFor={`${q.item_no+`-`+q.list}-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id={`${q.item_no+`-`+q.list}-no`} />
                                <Label htmlFor={`${q.item_no+`-`+q.list}-no`}>No</Label>
                            </div>
                        </RadioGroup>

                        {/* Conditionally render Input if 'Yes' is selected */}
                        {q.answer === 'yes' && (
                          <div>
                          <Label className="text-sm">{q.question_details}</Label>
                          <Input
                            value={q.details || ""} // Use empty string if undefined
                            onChange={(e) => handleUpdateQuestion(question.item_no, isSubQuestion ? q.list : null, 'details', e.target.value)}
                          />
                          </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {renderQuestion(question)}
      {question.subQuestions && question.subQuestions.map((subQ) => (
        <div key={subQ.item_no} className="ml-6">
          {renderQuestion(subQ, true)}
        </div>
      ))}
    </div>
  )
}

export default Question
