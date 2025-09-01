<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report</title>
    <style>
        @page {
            margin: 210px 50px 140px 50px; /* Top and bottom margins reserve space */
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            margin: 0;
            padding: 0;
        }

        header {
            position: fixed;
            top: -180px;   /* Must match @page top margin */
            left: 0;
            right: 0;
            height: auto;
            text-align: center;
        }

        footer {
            position: fixed;
            bottom: -140px; /* Must match @page bottom margin */
            left: 0;
            right: 0;
            height: 100px;
            text-align: center;
        }

        p {
            text-align: justify;
            margin: 0 0 12px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th, td {
            border: 1px solid #444;
            padding: 6px;
        }

        .page-break {
            page-break-after: always;
        }

        .checkbox { display: inline-block; width: 14px; height: 14px; margin-right: 4px; text-align: center; font-size: 12px; line-height: 14px; border: none; }

        .no-border, 
        .no-border td, 
        .no-border th {
            border: none !important;
        }

        .signature-box {
            display: block;
            width: 200px;
            height: 60px; 
            margin: 0 auto 5px auto;
        }

        .signature-left {
            display: block;
            width: 200px;
            height: 60px; 
            margin: 0 0 5px 0; /* No auto margins, stick left */
        }

        .signature-box img,
        .signature-left img {
            max-width: 200px;
            max-height: 60px;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <header>
        <img src="{{ public_path('images/header.png') }}" style="width: 100%; height: auto;">
    </header>

    <!-- FOOTER -->
    <footer>
        <img src="{{ public_path('images/footer.png') }}" style="width: 100%; height: auto;">
    </footer>

    <!-- CONTENT -->
    <div class="content">
        <p style="text-align:right">Annex A</p>
        <h3 style="text-align:center">REPORT ON TARGET OUTPUTS (RTO)</h3>
        <p>This certifies that the outputs specified below will be accomplished during the Flexiplace workday.</p>

        <table> 
            <tbody> 
                <tr> 
                    <td style="width: 30%;">Name and <br> Signature:</td> 
                    <td>
                        <span class="signature-left">
                            @if(!empty($creatorSignature))
                                <img src="{{ $creatorSignature }}" alt="Creator Signature">
                            @endif
                        </span>
                        {{ $rto->name ?? '' }}
                    </td> 
                </tr> 
                <tr>
                    <td style="width: 30%;">Position:</td> 
                    <td>{{ $position->position ?? '' }}</td> 
                </tr> 
                <tr> 
                    <td style="width: 30%;">Division:</td> 
                    <td>{{ $rto->division_id ?? '' }}</td> 
                </tr> 
                <tr> 
                    <td style="width: 30%;">Flexiplace<br>Type:</td> 
                    <td> 
                        <div> 
                            <span class="checkbox">[{{ $rto->type === 'WFH' ? 'X' : ' ' }}]</span>WFH &nbsp;&nbsp;&nbsp;&nbsp; 
                            <span class="checkbox">[{{ $rto->type === 'Satellite Office' ? 'X' : ' ' }}]</span>Satellite Office 
                        </div> 
                        <div> 
                            <span class="checkbox">[{{ $rto->type === 'Other' ? 'X' : ' ' }}]</span>Another Fixed Place (specify) 
                            {!! $rto->type === 'Other' 
                                ? '<u>'.e($rto->other_type).'</u>' 
                                : '__________________' !!}
                        </div> 
                    </td>
                </tr> 
            </tbody> 
        </table>
        <table> 
            <tbody> 
                <tr> 
                    <td colspan="2" style="text-align: center; font-weight: bolder;">List of Outputs to be Accomplished</td> 
                </tr> 
                @foreach($outputs as $i => $output)
                    <tr>
                        <td style="width: 5%; text-align:center;">{{ $i + 1 }}.</td>
                        <td>{{ $output ?? '' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <table class="no-border">
            <tbody>
                <tr>
                    <<td>
                        Recommending Approval:<br>
                        <span class="signature-box">
                            @if(!empty($supervisorSignature))
                                <img src="{{ $supervisorSignature }}" alt="Supervisor Signature">
                            @endif
                        </span>
                        <u>{{ $supervisorName }}</u><br>
                        Immediate Supervisor
                    </td>
                    <td>
                        Approved by:<br>
                        <span class="signature-box">
                            @if(!empty($approverSignature))
                                <img src="{{ $approverSignature }}" alt="Approver Signature">
                            @endif
                        </span>
                        <u>{{ $approverName }}</u><br>
                        {{ $approverPosition }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
