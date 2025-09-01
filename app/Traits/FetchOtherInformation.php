<?php

namespace App\Traits;

trait FetchOtherInformation
{
    protected function fetchApplicantOtherInformation($conn, $userId, $type, $category)
    {
        return $conn->table('applicant_other_info')
            ->select(
                'applicant_other_info.id',
                'applicant_other_info.type',
                'applicant_other_info.description',
                'applicant_other_info.year',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_other_info.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->where('applicant_other_info.type', $category)
            ->get();
    }

    protected function fetchStaffOtherInformation($conn, $ipmsId, $type)
    {
        return $conn->table('tblemp_other_info')
            ->where('emp_id', $ipmsId)
            ->where('type', $type)
            ->where('approval', 'yes')
            ->orderBy('year', 'desc')
            ->get();
    }

    protected function getDefaultQuestions()
    {
        return [
            [
                'item_no' => '34',
                'list' => '',
                'question' => "Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed,",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '34',
                        'list' => 'A',
                        'question' => "within the third degree?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => "within the fourth degree (for Local Government Unit - Career Employees)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '35',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '35',
                        'list' => 'A',
                        'question' => "Have you ever been found guilty of any administrative offense?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '35',
                        'list' => 'B',
                        'question' => "Have you been criminally charged before any court?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give the date of filing and the status of case/s",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '36',
                'list' => '',
                'question' => "Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '37',
                'list' => '',
                'question' => "Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '38',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '38',
                        'list' => 'A',
                        'question' => "Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '38',
                        'list' => 'B',
                        'question' => "Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details (country)",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '39',
                'list' => '',
                'question' => "Have you acquired the status of an immigrant or permanent resident of another country?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '40',
                'list' => '',
                'question' => "Pursuant to: (a) Indigenous People's Act (RA 8371) (b) Magna Carta for Disabled Persons (RA 7277) and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '40',
                        'list' => 'A',
                        'question' => "Are you a member of any indigenous group?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'B',
                        'question' => "Are you a person with disability?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'C',
                        'question' => "Are you a solo parent?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                ]
            ],
        ];
    }


    protected function fetchApplicantQuestions($conn, $userId, $type)
    {
        $questions = $this->getDefaultQuestions();

        $saved = $conn->table('applicant_question')
            ->select(
                'applicant_question.id',
                'applicant_question.item_no',
                'applicant_question.list',
                'applicant_question.answer',
                'applicant_question.details',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_question.applicant_id')
                     ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->get()
            ->map(function ($item) {
                return [
                    'item_no' => (string) $item->item_no,
                    'list' => $item->list ?? 'NA',
                    'answer' => $item->answer,
                    'details' => $item->details,
                ];
            })
            ->toArray();

            $answersMap = [];
            foreach ($saved as $item) {
                $key = $item['item_no'] . '-' . ($item['list'] ?? 'NA');
                $answersMap[$key] = [
                    'answer' => $item['answer'],
                    'details' => $item['details'],
                ];
            }

            foreach ($questions as &$q) {
                if (isset($q['isAnswerable']) && $q['isAnswerable']) {
                    $key = $q['item_no'] . '-' . ($q['list'] ?: 'NA');
                    if (isset($answersMap[$key])) {
                        $q['answer'] = $answersMap[$key]['answer'];
                        $q['details'] = $answersMap[$key]['details'];
                    }
                }

                if (isset($q['subQuestions'])) {
                    foreach ($q['subQuestions'] as &$subQ) {
                        $key = $subQ['item_no'] . '-' . ($subQ['list'] ?: 'NA');
                        if (isset($answersMap[$key])) {
                            $subQ['answer'] = $answersMap[$key]['answer'];
                            $subQ['details'] = $answersMap[$key]['details'];
                        }
                    }
                    unset($subQ);
                }
            }
            unset($q);

            return $questions;
    }

    protected function fetchStaffQuestions($conn, $ipmsId)
    {
        $questions = $this->getDefaultQuestions();

        $retrieved = $conn->table('tblemp_questions')
            ->where('emp_id', $ipmsId)
            ->get()
            ->map(function($item) {
                return [
                    'item_no' => (string) $item->number,
                    'list' => $item->list ?: 'NA',
                    'answer' => $item->answer,
                    'details' => $item->yes_details,
                ];
            })
            ->toArray();

        // build easy lookup
        $answersMap = [];
        foreach ($retrieved as $item) {
            $key = $item['item_no'] . '-' . $item['list'];
            $answersMap[$key] = [
                'answer' => $item['answer'],
                'details' => $item['details'],
            ];
        }

        // now update $questions in place
        foreach ($questions as &$q) {
            if (isset($q['isAnswerable']) && $q['isAnswerable']) {
                $key = $q['item_no'] . '-' . ($q['list'] ?: 'NA');
                if (isset($answersMap[$key])) {
                    $q['answer'] = $answersMap[$key]['answer'];
                    $q['details'] = $answersMap[$key]['details'];
                }
            }

            if (isset($q['subQuestions'])) {
                foreach ($q['subQuestions'] as &$subQ) {
                    $key = $subQ['item_no'] . '-' . ($subQ['list'] ?: 'NA');
                    if (isset($answersMap[$key])) {
                        $subQ['answer'] = $answersMap[$key]['answer'];
                        $subQ['details'] = $answersMap[$key]['details'];
                    }
                }
                unset($subQ);
            }
        }

        return $questions;
    }

    protected function fetchApplicantReferences($conn, $userId, $type)
    {
        return $conn->table('applicant_reference')
            ->select(
                'applicant_reference.id',
                'applicant_reference.name',
                'applicant_reference.address',
                'applicant_reference.contact_no',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_reference.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->get();
    }

    protected function fetchStaffReferences($conn, $ipmsId)
    {
        return $conn->table('tblemp_references')
            ->where('emp_id', $ipmsId)
            ->get();
    }
}
