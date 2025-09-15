@component('mail::message')
# Vacancy Needs Revision

You are receiving this email because {{ $senderName }} has returned for revision your submitted CBJD for the vacant position {{ $position }}.

Below are the remarks for returning:
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>{!! $remarks !!}</td>
    </tr>
</table>
<br>
Below are the details of the vacant position:
<h3 style="font-size: 16px; font-weight: bold;">
    {{ $vacancy->appointment_status === 'Permanent' 
    ? 'Competency-Based Job Description' 
    : 'Job Description' }}
</h3>
<br>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>Status of Appointment</td>
        <td>{{ $vacancy->appointment_status }}</td>
    </tr>
    <tr>
        <td>Position Title</td>
        <td>{{ $vacancy->position_description }}</td>
    </tr>
    <tr>
        <td>Salary Grade</td>
        <td>{{ $vacancy->sg }}</td>
    </tr>
    @if ($vacancy->appointment_status === 'Permanent')
    <tr>
        <td>Item No.</td>
        <td>{{ $vacancy->item_no }}</td>
    </tr>
    @endif
    <tr>
        <td>Area of Assignment</td>
        <td>{{ $vacancy->division }}</td>
    </tr>
    @if ($vacancy->appointment_status === 'Permanent')
    <tr>
        <td>Reports to</td>
        <td>{{ $vacancy->reports_to }}</td>
    </tr>
    <tr>
        <td>Positions Supervised</td>
        <td>{{ $vacancy->positions_supervised }}</td>
    </tr>
    <tr>
        <td>Classification</td>
        <td>
            @foreach ($classifications as $label)
                {{ $label }} {{ $label === $vacancy->classification ? '( X )' : '( )' }}<br>
            @endforeach
        </td>
    </tr>
    @endif
</table>
<br>
<h3 style="font-size: 16px; font-weight: bold;">A. Qualification Guide</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    @if ($vacancy->appointment_status === 'Permanent')
    <tr>
        <td colspan=2 style="font-weight: bold; background-color: #f0f0f0;">CSC-Prescribed QS</td>
    </tr>
    <tr>
        <td style="width: 30%;">Education</td>
        <td>{!! $vacancy->prescribed_education !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Experience</td>
        <td>{!! $vacancy->prescribed_experience !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Training</td>
        <td>{!! $vacancy->prescribed_training !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Eligibility</td>
        <td>{{ $vacancy->prescribed_eligibility }}</td>
    </tr>
    @endif
    <tr>
        <td colspan=2 style="font-weight: bold; background-color: #f0f0f0;">Preferred Qualifications</td>
    </tr>
    <tr>
        <td style="width: 30%;">Education</td>
        <td>{!! $vacancy->preferred_education !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Experience</td>
        <td>{!! $vacancy->preferred_experience !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Training</td>
        <td>{!! $vacancy->preferred_training !!}</td>
    </tr>
    <tr>
        <td style="width: 30%;">Eligibility</td>
        <td>{{ $vacancy->preferred_eligibility }}</td>
    </tr>
    <tr>
        <td style="width: 30%;">DEPDev Pre-employment Exam</td>
        <td>{{ $vacancy->examination }}</td>
    </tr>
</table>
<br>
<h3 style="font-size: 16px; font-weight: bold;">B. Job Summary</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>{!! $vacancy->summary !!}</td>
    </tr>
</table>
<br>
<h3 style="font-size: 16px; font-weight: bold;">C. Job Output</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>{!! $vacancy->output !!}</td>
    </tr>
</table>
<br>
<h3 style="font-size: 16px; font-weight: bold;">D. Duties and Responsibilities</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>{!! $vacancy->responsibility !!}</td>
    </tr>
</table>
<br>
@if ($vacancy->appointment_status === 'Permanent')
<h3 style="font-size: 16px; font-weight: bold;">E. Competency Requirements</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <th style="width: 80%;">Competency</th>
        <th>Level</th>
    </tr>
    @foreach ($competencies as $type => $group)
        <tr>
            <td colspan="2" style="font-weight: bold; background-color: #f0f0f0;">
                {{ $type }}
            </td>
        </tr>
        @foreach ($group as $comp)
            <tr>
                <td style="width: 80%;">{{ $comp->competency }}</td>
                <td style="text-align: center;">{{ $comp->level }}</td>
            </tr>
        @endforeach
    @endforeach
</table>
<br>
@endif
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td>
                        <a href="{{ $url }}" 
                           style="display:inline-block; background-color:#4a90e2; border-radius:4px; color:#ffffff; font-size:14px; font-weight:bold; line-height:40px; text-align:center; text-decoration:none; width:160px;">
                            Open in HRIS
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

Thanks,<br>
{{ config('app.name') }}
@endcomponent
