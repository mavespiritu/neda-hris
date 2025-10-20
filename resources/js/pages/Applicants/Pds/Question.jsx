import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import TextInput from "@/components/TextInput"

const Question = ({ question, qIndex, handleUpdateQuestion, errors = {} }) => {
  // ✅ helper to safely pull an error by dot path
  const getError = (path) => {
    const err = errors?.[path]
    if (!err) return null
    return Array.isArray(err) ? err[0] : err
  }

  // Render a single question or subquestion
  const renderQuestion = (q, parentIndex = null, subIndex = null) => {
    const key = `question-${parentIndex ?? qIndex}-${subIndex ?? ''}-${q.list ?? 'NA'}`
    let basePath = `otherInformation.questions.${parentIndex ?? qIndex}`

    if (subIndex !== null && subIndex !== undefined) {
      basePath += `.subQuestions.${subIndex}`
    }

    const answerErrorPath = `${basePath}.answer`
    const detailsErrorPath = `${basePath}.details`

    const answerError = getError(answerErrorPath)
    const detailsError = getError(detailsErrorPath)

    return (
      <div key={key} className={`mb-2 text-sm ${subIndex !== null ? "ml-6" : ""}`}>
        <div className="flex flex-col gap-2">
          <p>{q.list !== '' ? q.list : q.item_no}. {q.question}</p>

          {q.isAnswerable && (
            <div className="flex flex-col gap-2">
              <RadioGroup
                onValueChange={(value) =>
                  handleUpdateQuestion(
                    parentIndex ?? qIndex,   // numeric index for main question
                    subIndex ?? null,        // numeric index for subquestion
                    'answer',
                    value
                  )
                }
                value={q.answer || ""}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${key}-yes`} />
                  <Label className="text-sm" htmlFor={`${key}-yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${key}-no`} />
                  <Label className="text-sm" htmlFor={`${key}-no`}>No</Label>
                </div>
              </RadioGroup>

              {answerError && (
                <div className="text-xs text-red-500 mt-1">{answerError}</div>
              )}

              {q.answer === 'yes' && (
                <div>
                  <Label>{q.question_details}</Label>
                  <TextInput
                    value={q.details ?? ""}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        parentIndex ?? qIndex,
                        subIndex ?? null,
                        'details',
                        e.target.value
                      )
                    }
                    isInvalid={!!detailsError}
                  />
                  {detailsError && (
                    <div className="text-xs text-red-500 mt-1">{detailsError}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {renderQuestion(question, qIndex)}
      {question.subQuestions &&
        question.subQuestions.map((subQ, subIdx) =>
          renderQuestion(subQ, qIndex, subIdx)
        )}
    </div>
  )
}

export default Question
