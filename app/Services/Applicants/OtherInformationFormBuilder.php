<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class OtherInformationFormBuilder
{
    public function build(ConnectionInterface $conn, ?int $applicantId = null): array
    {
        $defaultQuestions = $this->getDefaultQuestions();

        if (! $applicantId) {
            return [
                'skills' => [],
                'recognitions' => [],
                'memberships' => [],
                'questions' => $defaultQuestions,
                'references' => $this->fillReferences(),
            ];
        }

        $otherInfos = $conn->table('applicant_other_info')
            ->where('applicant_id', $applicantId)
            ->get();

        $questions = $conn->table('applicant_question')
            ->where('applicant_id', $applicantId)
            ->get();

        $references = $conn->table('applicant_reference')
            ->where('applicant_id', $applicantId)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name ?? '',
                    'address' => $item->address ?? '',
                    'contact_no' => $item->contact_no ?? '',
                ];
            })
            ->values()
            ->all();

        $payload = [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => $this->fillReferences($references),
        ];

        foreach ($otherInfos as $item) {
            $mapped = [
                'id' => $item->id,
                'type' => $item->type ?? '',
                'description' => $item->description ?? '',
                'year' => $item->year ?? '',
            ];

            $type = strtolower(trim($item->type ?? ''));

            if ($type === 'hobbies') {
                $payload['skills'][] = $mapped;
            } elseif ($type === 'recognition') {
                $payload['recognitions'][] = $mapped;
            } elseif ($type === 'membership') {
                $payload['memberships'][] = $mapped;
            }
        }

        $answered = [];

        foreach ($questions as $question) {
            $key = ($question->item_no ?? '') . (($question->list ?? '') !== '' ? '-' . $question->list : '');
            $answered[$key] = [
                'answer' => strtolower($question->answer ?? 'no'),
                'details' => $question->details ?? '',
            ];
        }

        foreach ($defaultQuestions as $question) {
            if (! empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as &$subQuestion) {
                    $key = $subQuestion['item_no'] . (($subQuestion['list'] ?? '') !== '' ? '-' . $subQuestion['list'] : '');

                    if (isset($answered[$key])) {
                        $subQuestion['answer'] = $answered[$key]['answer'];
                        $subQuestion['details'] = $answered[$key]['details'];
                    }
                }
                unset($subQuestion);
            } else {
                $key = $question['item_no'];

                if (isset($answered[$key])) {
                    $question['answer'] = $answered[$key]['answer'];
                    $question['details'] = $answered[$key]['details'];
                }
            }

            $payload['questions'][] = $question;
        }

        return $payload;
    }

    private function fillReferences(array $references = []): array
    {
        while (count($references) < 3) {
            $references[] = [
                'name' => '',
                'address' => '',
                'contact_no' => '',
            ];
        }

        return array_slice($references, 0, 3);
    }

    private function getDefaultQuestions(): array
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
                        'answer' => 'no',
                        'question_details' => "If YES, give details",
                        'details' => '',
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => "within the fourth degree (for Local Government Unit - Career Employees)?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, give details",
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '35',
                'list' => '',
                'question' => '',
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '35',
                        'list' => 'A',
                        'question' => "Have you ever been found guilty of any administrative offense?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, give details",
                        'details' => '',
                    ],
                    [
                        'item_no' => '35',
                        'list' => 'B',
                        'question' => "Have you been criminally charged before any court?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, give the date of filing and the status of case/s",
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '36',
                'list' => '',
                'question' => "Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?",
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => "If YES, give details",
                'details' => '',
            ],
            [
                'item_no' => '37',
                'list' => '',
                'question' => "Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?",
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => "If YES, give details",
                'details' => '',
            ],
            [
                'item_no' => '38',
                'list' => '',
                'question' => '',
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '38',
                        'list' => 'A',
                        'question' => "Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, give details",
                        'details' => '',
                    ],
                    [
                        'item_no' => '38',
                        'list' => 'B',
                        'question' => "Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, give details (country)",
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '39',
                'list' => '',
                'question' => "Have you acquired the status of an immigrant or permanent resident of another country?",
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => "If YES, give details",
                'details' => '',
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
                        'answer' => 'no',
                        'question_details' => "If YES, please specify",
                        'details' => '',
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'B',
                        'question' => "Are you a person with disability?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, please specify ID No.",
                        'details' => '',
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'C',
                        'question' => "Are you a solo parent?",
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => "If YES, please specify ID No.",
                        'details' => '',
                    ],
                ],
            ],
        ];
    }
}
