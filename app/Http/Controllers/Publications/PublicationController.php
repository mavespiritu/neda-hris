<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Pagination\LengthAwarePaginator;

class PublicationController extends Controller
{

    public $emp_id;

    public function __construct()
    {
        $this->emp_id = Auth::check() ? Auth::user()->ipms_id : null; 
    }

    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'reference_no' => DB::raw('reference_no'),
            'date_published' => DB::raw('date_published'),       
            'date_closed' => DB::raw('date_closed'),             
            'is_public' => DB::raw('is_public'),                   
        ];

        $searchable = [
            'reference_no',
            'date_published',
            'date_closed',
            'creator',
        ];

        $filterable = [
            'is_public' => 'is_public',
        ];

        $publicationsQuery = $conn2->table('publication as p')
        ->select([
            'p.*',
        ]);

        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $publicationsQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $publicationsQuery->orderBy($sortable[$sort], $direction);
        }

        $publications = $publicationsQuery->orderBy('p.id', 'desc')->paginate(20);

        $publicationIDs = $publications->pluck('id')->all();

        $vacancyCounts = $conn2->table('publication_vacancies')
        ->select('publication_id', DB::raw('COUNT(*) as vacancy_count'))
        ->whereIn('publication_id', $publicationIDs)
        ->groupBy('publication_id')
        ->pluck('vacancy_count', 'publication_id');

        $creatorIDs = $publications->pluck('created_by')->unique()->values();

        $employees = $conn3->table('tblemployee as e')
        ->select([
            'e.emp_id',
            DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
        ])
        ->get()
        ->keyBy('emp_id');

        $files = $conn2->table('file')
            ->select(['id', 'itemId', 'name', 'path', 'size', 'mime'])
            ->where('model', 'Publication')
            ->whereIn('itemId', $publicationIDs)
            ->get()
            ->groupBy('itemId');

        $publications->getCollection()->transform(function ($publication) use ($employees, $vacancyCounts, $files) {
            $publication->creator = $employees->get($publication->created_by)->name ?? null;
            $publication->vacancy_count = $vacancyCounts[$publication->id] ?? 0;
            $publication->files         = $files[$publication->id] ?? collect();
            
            if (!empty($publication->date_closed)) {
                $closingDateTime = Carbon::parse($publication->date_closed . ' ' . ($publication->time_closed ?? '23:59:59'));

                if (Carbon::now()->greaterThan($closingDateTime)) {
                    $publication->status = 'Closed';
                } else {
                    $publication->status = $publication->is_public ? 'Published' : 'Draft';
                }
            } else {
                $publication->status = $publication->is_public ? 'Published' : 'Draft';
            }

            return $publication;
        });

        $status = $request->input('status');

        if ($request->filled('status')) {
            $publications->setCollection(
                $publications->getCollection()->filter(function ($publication) use ($status) {
                    return $publication->status === $status;
                })->values()
            );
        }

        if ($sort === 'creator') {
            $sorted = $publications->getCollection()->sortBy(
                fn($p) => $p->creator ?? '',
                SORT_REGULAR,
                $direction === 'desc'
            );
            $publications->setCollection($sorted->values());
        }

        if ($sort === 'vacancy_count') {
            $sorted = $publications->getCollection()->sortBy(
                fn($p) => $p->vacancy_count ?? '',
                SORT_REGULAR,
                $direction === 'desc'
            );
            $publications->setCollection($sorted->values());
        }

        if ($sort === 'status') {
            $sorted = $publications->getCollection()->sortBy(
                fn($p) => $p->status ?? '',
                SORT_REGULAR,
                $direction === 'desc'
            );
            $publications->setCollection($sorted->values());
        }

        if ($search) {
            $searchLower = strtolower($search);

            $publications->setCollection(
                $publications->getCollection()->filter(function ($publication) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($publication->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return Inertia::render('Publications/index', [
            'data' => [
                'publications' => $publications,
            ],
        ]);
    }

    /* public function show($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $signatoryName = $conn2->table('settings')->where('title', 'Agency Head')->first();
        $signatoryPosition = $conn2->table('settings')->where('title', 'Agency Head Position')->first();
        $agencyAddress = $conn2->table('settings')->where('title', 'Agency Address')->first();

        $requirements = $conn2->table('recruitment_requirements')
        ->where('is_default', 1)
        ->pluck('requirement');

        $search = $request->input('search', '');
        $matchingEmployeeIDs = collect();

        $publication = $conn2->table('publication')->where('id', $id)->first();
        if (!$publication) {
            abort(404, 'Publication not found.');
        }

        if (!empty($search)) {
            $matchingEmployeeIDs = $conn3->table('tblemployee')
                ->where('work_status', 'active')
                ->where(function ($query) use ($search) {
                    $query->where(DB::raw("CONCAT(fname, ' ', lname)"), 'like', '%' . $search . '%');
                })
                ->pluck('emp_id');
        }

        $vacancyIDs = $conn2->table('publication_vacancies')
            ->where('publication_id', $publication->id)
            ->pluck('vacancy_id');

        if ($vacancyIDs->isEmpty()) {
            $page = LengthAwarePaginator::resolveCurrentPage();
            return Inertia::render('Publications/View', [
                'publication' => $publication,
                'vacancies' => new LengthAwarePaginator([], 0, 20, $page),
                'allVacancies' => [],
                'signatoryName' => $signatoryName ? $signatoryName->value : '',
                'signatoryPosition' => $signatoryPosition ? $signatoryPosition->value : '',
                'agencyAddress' => $agencyAddress ? $agencyAddress->value : '',
                'requirements' => $requirements
            ]);
        }

        $latestStatus = $conn2->table('status_logs as vs1')
            ->select(
                'vs1.model_id as status_vacancy_id',
                'vs1.status as current_status',
                'vs1.acted_by as latest_acted_by',
                'vs1.date_acted as date_acted'
            )
            ->join(DB::raw('(
                SELECT model_id, MAX(id) as max_id 
                FROM status_logs 
                WHERE model = "Vacancy"
                GROUP BY model_id
            ) as vs2'), function ($join) {
                $join->on('vs1.model_id', '=', 'vs2.model_id')
                    ->on('vs1.id', '=', 'vs2.max_id');
            })
            ->where('vs1.model', 'Vacancy');

        $vacanciesQuery = $conn2->table('vacancy')
            ->whereIn('vacancy.id', $vacancyIDs)
            ->leftJoinSub($latestStatus, 'vs', function ($join) {
                $join->on('vacancy.id', '=', 'vs.status_vacancy_id');
            })
            ->when($search, function ($query) use ($search, $matchingEmployeeIDs) {
                $query->where(function ($q) use ($search, $matchingEmployeeIDs) {
                    $q->where('item_no', 'like', '%' . $search . '%')
                    ->orWhere('division', 'like', '%' . $search . '%')
                    ->orWhere('position', 'like', '%' . $search . '%')
                    ->orWhere('position_description', 'like', '%' . $search . '%')
                    ->orWhere('sg', 'like', '%' . $search . '%')
                    ->orWhere('date_created', 'like', '%' . $search . '%')
                    ->orWhere('vs.current_status', 'like', '%' . $search . '%');

                    if ($matchingEmployeeIDs->isNotEmpty()) {
                        $q->orWhereIn('vacancy.created_by', $matchingEmployeeIDs);
                        $q->orWhereIn('vacancy.requested_by', $matchingEmployeeIDs);
                        $q->orWhereIn('vs.latest_acted_by', $matchingEmployeeIDs);
                    }
                });
            })
            ->select(
                'vacancy.*',
                'vs.current_status as status',
                'vs.date_acted',
                'vs.latest_acted_by'
            )
            ->orderBy('vacancy.id', 'desc');

        $paginatedVacancies = $vacanciesQuery->paginate(20);
        $allVacancies = $vacanciesQuery->get();

        $allIDs = $paginatedVacancies->pluck('created_by')
            ->merge($paginatedVacancies->pluck('updated_by'))
            ->merge($paginatedVacancies->pluck('latest_acted_by'))
            ->unique()
            ->values();

        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $allIDs)
            ->get()
            ->keyBy('emp_id')
            ->map(function ($employee) {
                return (object)[
                    'name' => $employee->fname . ' ' . $employee->lname,
                ];
            });

        $addMetaToVacancy = function ($vacancy) use ($conn2, $conn3, $employees) {
            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;
            $vacancy->actor = $employees->get($vacancy->latest_acted_by)->name ?? null;

            // Attach competencies
            $vacancyCompetencies = $conn2->table('vacancy_competencies as vc')
                ->leftJoin('competency as c', 'c.comp_id', '=', 'vc.competency_id')
                ->select('vc.competency_id as id', 'c.competency', 'vc.level', 'vc.comp_type')
                ->where('vacancy_id', $vacancy->id)
                ->get()
                ->groupBy('comp_type');

            $vacancy->competencies = [
                'organizational' => $vacancyCompetencies->get('org', collect())->values(),
                'leadership'     => $vacancyCompetencies->get('mnt', collect())->values(),
                'functional'     => $vacancyCompetencies->get('func', collect())->values(),
            ];

            // Attach monthly salary
            $salary = $conn3->table('tblprl_salary_schedule')
                ->select('salary')
                ->where('grade', $vacancy->sg)
                ->where('step', $vacancy->step)
                ->orderByDesc('effectivity_date_start')
                ->first();

            $position = $conn3->table('tblposition')
                ->select('post_description')
                ->where('position_id', $vacancy->position)
                ->first();

            $vacancy->monthly_salary = $salary->salary ?? 0;
            $vacancy->positionTitle = $position->post_description ?? '';

            return $vacancy;
        };

        $paginatedVacancies->getCollection()->transform($addMetaToVacancy);
        $allVacancies = $allVacancies->map($addMetaToVacancy);

        

        return Inertia::render('Publications/View', [
            'publication' => $publication,
            'vacancies' => $paginatedVacancies,
            'allVacancies' => $allVacancies,
            'signatoryName' => $signatoryName ? $signatoryName->value : '',
            'signatoryPosition' => $signatoryPosition ? $signatoryPosition->value : '',
            'agencyAddress' => $agencyAddress ? $agencyAddress->value : '',
            'requirements' => $requirements
        ]);
    } */

    public function show($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $publication = $conn2->table('publication')->where('id', $id)->first();
        if (!$publication) {
            abort(404, 'Page not found.');
        }

        $publication->files = $conn2->table('file')
            ->where('model', 'Publication')
            ->where('itemId', $publication->id)
            ->select(['id', 'itemId', 'name', 'path', 'size', 'mime'])
            ->orderBy('id', 'desc')
            ->get();

        if (!empty($publication->date_closed)) {

            $closingDate = Carbon::parse($publication->date_closed)->toDateString();

            if (now()->toDateString() > $closingDate) {
                $publication->status = 'Closed';
            } else {
                $publication->status = $publication->is_public ? 'Published' : 'Draft';
            }
        } else {
            $publication->status = $publication->is_public ? 'Published' : 'Draft';
        }

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'reference_no' => DB::raw('reference_no'),
            'division' => DB::raw('division'),
            'appointment_status' => DB::raw('appointment_status'),       
            'position_description' => DB::raw('position_description'),             
            'sg' => DB::raw('sg'),             
            'monthly_salary' => DB::raw('monthly_salary'),            
        ];

        $searchable = [
            'reference_no',
            'division',
            'appointment_status',
            'position',
            'position_description',
            'sg',
            'monthly_salary',
        ];

        $filterable = [
            'division' => 'v.division',
            'appointment_status' => 'v.appointment_status',
            'sg' => 'v.sg',
        ];

        $vacanciesQuery = $conn2->table('publication_vacancies as pv')
        ->join('vacancy as v', 'pv.vacancy_id', '=', 'v.id')
        ->select([
            'pv.id as id',     
            'v.id as vacancy_id',  
            'v.reference_no as reference_no',  
            'v.position',
            'v.position_description',
            'v.item_no',
            'v.division',
            'v.appointment_status',
            'v.sg',
            'v.monthly_salary',
        ])
        ->where('pv.publication_id', $publication->id);

        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $vacanciesQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $vacanciesQuery->orderBy($sortable[$sort], $direction);
        }

        $vacancies = $vacanciesQuery->orderBy('pv.id', 'desc')->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $vacancies->setCollection(
                $vacancies->getCollection()->filter(function ($vacancy) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($vacancy->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return Inertia::render('Publications/View', [
            'data' => [
                'publication' => $publication,
                'vacancies' => $vacancies,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'date_published' => 'required|date',
            'date_closed' => 'required|date',
            'newFiles'       => 'nullable|array|max:1',
            'newFiles.*'     => 'nullable|mimes:pdf,doc,docx|max:5120',
        ], [
            'date_published.required' => 'The posting date is required.',
            'date_closed.required' => 'The closing date is required.',
            'newFiles.max'            => 'Only 1 file may be uploaded.',
            'newFiles.*.mimes'        => 'Files must be a PDF or Word document.',
            'newFiles.*.max'          => 'Files may not be greater than 5MB.',
        ]);

        $validator->after(function ($validator) use ($request) {
            $publishedDate = Carbon::parse($request->date_published)->startOfDay();
            $closedDate = Carbon::parse($request->date_closed)->startOfDay();
    
            if ($closedDate->lt($publishedDate)) {
                $validator->errors()->add('date_closed', 'The closing date must be on or after the posting date.');
            }
        });

        $validator->validate();

        try{

            $conn2->beginTransaction();

            $year = Carbon::now()->year;

            $lastReferenceNo = $conn2->table('publication')
            ->whereYear('date_created', $year) 
            ->orderByDesc('id') 
            ->first();

            $nextReferenceNo = '01'; 

            if ($lastReferenceNo) {
                $lastRefNum = explode('-', $lastReferenceNo->reference_no)[0];
                $nextReferenceNo = str_pad((int)$lastRefNum + 1, 2, '0', STR_PAD_LEFT);
            }
    
            $referenceNo = $nextReferenceNo . '-' . $year;

            $publicationId = $conn2->table('publication')->insertGetId([
                'reference_no'   => $referenceNo,
                'date_published' => Carbon::parse($request->date_published)->format('Y-m-d'),
                'date_closed'    => Carbon::parse($request->date_closed)->format('Y-m-d'),
                'created_by'     => Auth::user()->ipms_id,
                'date_created'   => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            // Handle file uploads
            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('uploads/publications/'.$year, $filename, 'public'); 

                    $conn2->table('file')->insert([
                        'model'       => 'Publication',
                        'itemId'      => $publicationId,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $path,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);
                }
            }

            $conn2->commit();

            return redirect()->route('publications.show', $publication)->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request saved successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving request. Please try again.'
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');

        // Validation
        $validator = Validator::make($request->all(), [
            'date_published' => 'required|date',
            'date_closed'    => 'required|date',
            'newFiles'       => 'nullable|array|max:1',
            'newFiles.*'     => 'nullable|mimes:pdf,doc,docx|max:5120',
        ], [
            'date_published.required' => 'The posting date is required.',
            'date_closed.required'    => 'The closing date is required.',
            'newFiles.max'            => 'Only 1 file may be uploaded.',
            'newFiles.*.mimes'        => 'Files must be a PDF or Word document.',
            'newFiles.*.max'          => 'Files may not be greater than 5MB.',
        ]);

        $validator->after(function ($validator) use ($request) {
            $publishedDate = Carbon::parse($request->date_published)->startOfDay();
            $closedDate    = Carbon::parse($request->date_closed)->startOfDay();

            if ($closedDate->lt($publishedDate)) {
                $validator->errors()->add('date_closed', 'The closing date must be on or after the posting date.');
            }
        });

        $validator->validate();

        try {
            $conn2->beginTransaction();

            // Update publication info
            $conn2->table('publication')
                ->where('id', $id)
                ->update([
                    'date_published' => Carbon::parse($request->date_published)->format('Y-m-d'),
                    'date_closed'    => Carbon::parse($request->date_closed)->format('Y-m-d'),
                    'updated_by'     => Auth::user()->ipms_id,
                    'date_updated'   => Carbon::now()->format('Y-m-d H:i:s'),
                ]);

            $year = Carbon::now()->year;

            // Handle removal of old files
            if ($request->filled('removeFiles')) {
                foreach ($request->removeFiles as $fileId) {
                    $file = $conn2->table('file')
                    ->where('id', $fileId)
                    ->where('model', 'Publication')
                    ->first();
                    if ($file) {
                        Storage::disk('public')->delete($file->path);

                        $conn2->table('file')
                        ->where('id', $fileId)
                        ->where('model', 'Publication')
                        ->delete();
                    }
                }
            }

            // Handle new file uploads
            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path     = $file->storeAs('uploads/publications/'.$year, $filename, 'public');

                    $conn2->table('file')->insert([
                        'model'       => 'Publication',
                        'itemId'      => $id,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $path,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);
                }
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Success!',
                'message' => 'Request updated successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status'  => 'error',
                'title'   => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the request. Please try again.'
            ]);
        }
    }


    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $publication = $conn2->table('publication')
                ->where('id', $id)
                ->first();

            if (!$publication) {
                abort(404, 'Page not found.');
            }

            $vacancies = $conn2->table('publication_vacancies')
                ->where('publication_id', $publication->id)
                ->pluck('vacancy_id')
                ->toArray();

            if (!empty($vacancies)) {
                $conn2->table('vacancy')
                    ->whereIn('id', $vacancies)
                    ->update([
                        'status' => 'Open',
                    ]);
            }

            $files = $conn2->table('file')
                ->where('model', 'Publication')
                ->where('itemId', $publication->id)
                ->get();

            foreach ($files as $file) {
                if ($file->path && Storage::disk('public')->exists($file->path)) {
                    Storage::disk('public')->delete($file->path);
                }

                $conn2->table('file')->where('id', $file->id)->delete();
            }

            $conn2->table('publication_vacancies')
                ->where('publication_id', $publication->id)
                ->delete();

            $conn2->table('publication')
                ->where('id', $publication->id)
                ->delete();

            $conn2->commit();

            return redirect()->route('publications.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            $conn2->beginTransaction();

            $vacancies = $conn2->table('publication_vacancies')
                ->whereIn('publication_id', $ids)
                ->pluck('vacancy_id')
                ->toArray();

            if (!empty($vacancies)) {
                $conn2->table('vacancy')
                    ->whereIn('id', $vacancies)
                    ->update(['status' => 'Open']);
            }

            $files = $conn2->table('file')
                ->where('model', 'Publication')
                ->whereIn('itemId', $ids)
                ->get();

            foreach ($files as $file) {
                if ($file->path && Storage::disk('public')->exists($file->path)) {
                    Storage::disk('public')->delete($file->path);
                }

                $conn2->table('file')->where('id', $file->id)->delete();
            }

            $conn2->table('publication_vacancies')
                ->whereIn('publication_id', $ids)
                ->delete();

            $conn2->table('publication')
                ->whereIn('id', $ids)
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request(s) deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request(s). Please try again.'
            ]);
        }
    }

    public function getVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        /* $existingVacancies = $conn2->table('publication_vacancies')
            ->where('publication_id', $id)
            ->pluck('vacancy_id')
            ->toArray(); */

        $vacancies = $conn2->table('vacancy')
            ->select(
                'vacancy.id as value',
                DB::raw("
                    CONCAT(
                        '[RF#: ',vacancy.reference_no,'] ',vacancy.division, ': ', vacancy.position_description,
                        CASE
                            WHEN vacancy.appointment_status = 'Permanent' THEN CONCAT(' (', vacancy.item_no, ')')
                            ELSE ''
                        END
                    ) as label
                ")
            )
            //->whereNotIn('vacancy.id', $existingVacancies)
            ->where('vacancy.status', 'Open')
            ->orderBy('vacancy.division', 'asc')
            ->orderBy('vacancy.position', 'asc')
            ->orderBy('vacancy.item_no', 'asc')
            ->get();

        return response()->json($vacancies); 
    }

    public function storeVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'vacancy_id' => 'required',
        ], [
            'vacancy_id.required' => 'The vacancy is required.',
        ]);

        $validator->validate();

        try{

            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')
            ->insert([
                'publication_id' => $id,
                'vacancy_id' => $request->vacancy_id,
                'created_by' => Auth::user()->ipms_id,
                'date_created' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            $conn2->table('vacancy')
            ->where('id', $request->vacancy_id)
            ->update([
                'status' => 'Close',
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy included successfully.'
            ]);
            
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to include vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while including vacancy. Please try again.'
            ]);
        }
    }

    public function destroyVacancy($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')
                ->where('id', $id)
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy removed successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to remove vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing the vacancy. Please try again.'
            ]);
        }
    }

    public function bulkDestroyVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')
                ->where('publication_id', $id)
                ->whereIn('id', $ids)
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies removed successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to remove vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing vacancies. Please try again.'
            ]);
        }
    }

    public function toggleVisibility($id)
    {
        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication')->where('id', $id)->first();

        if (!$publication) {
            return response()->json(['error' => 'Publication not found'], 404);
        }

        $newVisibility = !$publication->is_public;

        $conn2->table('publication')->where('id', $id)->update([
            'is_public' => $newVisibility,
            'updated_by' => Auth::user()->ipms_id,
            'date_updated' => now(),
        ]);

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'isibility toggled successfully.'
        ]);
    }
}
