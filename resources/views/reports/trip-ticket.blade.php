<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report</title>
    <style>
        @page {
            margin: 210px 50px 140px 50px;
        }

       body {
            font-family: Arial, sans-serif;
            font-size: 9pt;
            margin: 0;
            padding: 0;
        }

        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            text-align: center;
        }

        footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
        }

        .content {
            padding: 140px 50px 0 50px; /* reserve space for header/footer */
        }

        p { text-align: justify; margin: 0 0 12px 0; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th, td {
            border: 1px solid #444;
            padding: 6px;
        }

        .no-border,
        .no-border td,
        .no-border th {
            border: none !important;
        }

        .line-fill {
            display: block;
            width: 100%;
            border-bottom: 1px solid #444;
            min-height: 16px;
            line-height: 16px;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <header>
        <img src="{{ asset('images/header.png') }}" style="width:70%;height:auto;">
    </header>

    <footer>
        <img src="{{ asset('images/footer.png') }}" style="width:70%;height:auto;">
    </footer>

    <div class="content">
        <table style="border:2px solid black !important; width:100%; border-collapse:collapse; margin:0;">
            <tr>
                <td style="width:70%; font-weight:bolder; font-size:13pt;" align="center">
                    <strong>V E H I C L E&nbsp;&nbsp;T R I P&nbsp;&nbsp;T I C K E T</strong>
                </td>
                <td style="font-size:13pt;" align="center">
                    <strong>No. {{ $tripTicket['tt_reference_no'] ?? date('Y').'-' }}</strong>
                </td>
            </tr>
        </table>

        <small>
        <p style="margin:0 0 2px 0;"><strong><i>INSTRUCTIONS:</i></strong></p>
        <ol style="margin:0; padding-left:18px;">
            <li>To be filled out by the person requesting the use of the DEPDev RO1 vehicle.</li>
            <li>The original copy shall be given to the driver and returned to the Finance and Administrative Division upon completion.</li>
            <li>A copy of the duly filled-out Vehicle Trip Ticket shall be compiled by the PRU.</li>
        </ol>
        </small>

        <p style="text-align:center; margin:10px 0;"><strong>TO BE FILLED OUT ONLY BY THE PERSON REQUESTING USE OF THE DEPDev RO1 VEHICLE</strong></p>

        <table class="no-border" style="width:100%; border-collapse:collapse; margin:0;">
            <tr>
                <td style="width:1%; white-space:nowrap;"><strong>Date:</strong></td>
                <td style="width:49%;"><span class="line-fill">{{ $tripTicket['date'] ?? '' }}</span></td>
                <td style="width:1%; white-space:nowrap;" align="right"><strong>Vehicle Plate Number:</strong></td>
                <td style="width:49%;"><span class="line-fill">{{ $tripTicket['plate_no'] ?? '' }}</span></td>
            </tr>
            <tr>
                <td style="width:1%; white-space:nowrap;"><strong>Driver's Name:</strong></td>
                <td style="width:49%;"><span class="line-fill">{{ $tripTicket['driver_name'] ?? '' }}</span></td>
                <td style="width:1%; white-space:nowrap;" align="right"><strong>Travel Order No.:</strong></td>
                <td style="width:49%;"><span class="line-fill">{{ $tripTicket['to_reference_no'] ?? '' }}</span></td>
            </tr>

            @php
                $passengers = collect($tripTicket['passengers'] ?? [])
                    ->map(fn ($p) => trim((string)($p['name'] ?? '')))
                    ->filter()
                    ->values();

                $maxLines = 9;
                $showNames = $passengers->count() <= $maxLines;
            @endphp

            <tr>
                <td colspan="4"><strong>Authorized Passenger/s:</strong></td>
            </tr>
            <tr>
                <td colspan="4" style="padding:0;">
                    <table style="width:100%; border-collapse:collapse; margin:0;">
                        <tr>
                            @for ($col = 0; $col < 3; $col++)
                                <td style="width:33.33%; vertical-align:top; border:0; {{ $col < 2 ? 'border-right:1px solid #444;' : '' }} padding:6px;">
                                    @for ($row = 1; $row <= 3; $row++)
                                        @php
                                            $idx = ($col * 3) + ($row - 1);
                                            $num = $idx + 1;
                                            $name = $showNames ? ($passengers[$idx] ?? '') : '';
                                        @endphp
                                        <div style="border-bottom:1px solid #444; padding:2px 0;">
                                            {{ $num }}. {{ $name }}
                                        </div>
                                    @endfor
                                </td>
                            @endfor
                        </tr>
                    </table>
                </td>
            </tr>

            @php
                $formatDestination = function ($d) {
                    if (!$d) return '';
                    $arr = is_array($d) ? $d : (array)$d;

                    $type = $arr['type'] ?? '';
                    $country = $arr['country'] ?? '';
                    $location = $arr['location'] ?? '';

                    if ($type === 'Local' || $country === 'Philippines') {
                        $city = $arr['citymunName'] ?? ($arr['citymun'] ?? '');
                        $prov = $arr['provinceName'] ?? ($arr['province'] ?? '');
                        $parts = array_filter([$location, $city, $prov], fn($x) => trim((string)$x) !== '');
                        return implode(', ', $parts);
                    }

                    $parts = array_filter([$location, $country], fn($x) => trim((string)$x) !== '');
                    return implode(', ', $parts);
                };

                $destLines = [];
                foreach (collect($tripTicket['destinations'] ?? []) as $d) {
                    $txt = trim($formatDestination($d));
                    if ($txt !== '') $destLines[] = $txt;
                }
                if (count($destLines) === 0) $destLines = [''];
            @endphp

            <tr>
                <td style="width:1%; white-space:nowrap;"><strong>Destination:</strong></td>
                <td style="width:69%; padding:0;">
                    <table style="width:100%; border-collapse:collapse; margin:0;">
                        @foreach($destLines as $line)
                            <tr>
                                <td style="border:0 !important; border-bottom:1px solid #444 !important; padding:2px 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    {{ $line !== '' ? $line : "\u{00A0}" }}
                                </td>
                            </tr>
                        @endforeach
                    </table>
                </td>
                <td style="width:1%; white-space:nowrap;" align="right"><strong>PrexC Code:</strong></td>
                <td style="width:29%;"><span class="line-fill">{{ $tripTicket['prexc'] ?? '' }}</span></td>
            </tr>
            <tr>
                <td style="width:1%; white-space:nowrap;"><strong>Purpose:</strong></td>
                <td style="width:99%;" colspan="3"><span class="line-fill">{{ $tripTicket['purpose'] ?? '' }}</span></td>
            </tr>
        </table>

        <p style="text-align:center; margin:8px 0 0 0;"><i><strong>Authorized by:</strong></i></p>
        <table class="no-border" style="width:100%; border-collapse:collapse; margin:20px 0 0 0;">
            <tr>
                <td style="text-align:center; padding:0 0 2px 0;"><strong>{{ strtoupper($tripTicket['authorized_by']) ?? '' }}</strong></td>
            </tr>
            <tr>
                <td style="padding:0;"><div style="width:220px; border-bottom:1px solid #000; margin:0 auto;"></div></td>
            </tr>
            <tr>
                <td style="text-align:center; padding:2px 0 0 0;"><strong>{{ $tripTicket['authorized_by_designation'] ?? '' }}</strong></td>
            </tr>
        </table>

        <table class="no-border" style="width:100%; border-collapse:collapse; margin:12px 0 0 0;">
            <tr><td style="padding:0;"><div style="width:100%; border-bottom:2px dashed black; height:1px;"></div></td></tr>
        </table>

        <p style="text-align:center; margin:12px 0;"><strong>TO BE FILLED OUT ONLY BY THE DRIVER AFTER COMPLETION OF THE TRIP</strong></p>

        @php
            $tripRows = collect($tripTicket['destinations'] ?? [])->map(function ($d) use ($formatDestination) {
                $arr = is_array($d) ? $d : (array)$d;
                return [
                    'place' => trim($formatDestination($arr)),
                    'departure_time' => !empty($arr['departure_time']) ? \Carbon\Carbon::parse($arr['departure_time'])->format('g:i A') : '',
                    'arrival_time' => !empty($arr['arrival_time']) ? \Carbon\Carbon::parse($arr['arrival_time'])->format('g:i A') : '',
                ];
            })->filter(fn ($r) => $r['place'] !== '')->values();

            $tripRowCount = max(4, $tripRows->count());
        @endphp

        <table style="width:100%; border-collapse:collapse; margin:0; border:2px solid #000;">
            <thead>
                <tr>
                    <td align="center" style="width:10%"><strong>TRIP</strong></td>
                    <td align="center" colspan="2" style="width:40%"><strong>DEPARTURE</strong></td>
                    <td align="center" colspan="2" style="width:40%"><strong>ARRIVAL</strong></td>
                    <td align="center" style="width:10%" rowspan="2"><strong>Driver's Initial</strong></td>
                </tr>
                <tr>
                    <td align="center">No.</td>
                    <td align="center" style="width:8%">Time</td>
                    <td align="center">Place</td>
                    <td align="center" style="width:8%">Time</td>
                    <td align="center">Place</td>
                </tr>
            </thead>
            <tbody>
                @for ($i = 0; $i < $tripRowCount; $i++)
                    @php $row = $tripRows[$i] ?? ['place' => '', 'departure_time' => '', 'arrival_time' => '']; @endphp
                    <tr>
                        <td align="center">{{ $i + 1 }}</td>
                        <td style="font-size: 8pt;">{{ $row['departure_time'] }}</td>
                        <td style="font-size: 8pt;">{{ $row['place'] }}</td>
                        <td style="font-size: 8pt;">{{ $row['arrival_time'] }}</td>
                        <td style="font-size: 8pt;">{{ $row['place'] }}</td>
                        <td>&nbsp;</td>
                    </tr>
                @endfor
            </tbody>
        </table>

        <table class="no-border" style="width:100%; border-collapse:collapse; margin:0 !important;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:8px;">
                    <table class="no-border" style="width:100%; border-collapse:collapse; margin:0;">
                        <tr>
                            <td style="width:65%; vertical-align:top; padding-right:6px;">
                                <table style="width:100%; border-collapse:collapse; margin:0; border:2px solid #000;">
                                    <tr><td colspan="2" align="center"><strong>ODOMETER READING</strong></td></tr>
                                    <tr>
                                        <td style="width:55%; border:1px solid #000 !important;"><strong>Start of Trip:</strong></td>
                                        <td style="width:45%; border:1px solid #000 !important;" align="right">{{ $tripTicket['odo_start'] ?? '' }}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #000 !important;"><strong>End of Trip:</strong></td>
                                        <td style="border:1px solid #000 !important;" align="right">{{ $tripTicket['odo_end'] ?? '' }}</td>
                                    </tr>
                                </table>
                            </td>

                            <td style="width:35%; vertical-align:top;">
                                @php $fuel = strtoupper(trim((string)($tripTicket['fuel_type'] ?? ''))); @endphp
                                <table style="width:100%; border-collapse:collapse; margin:0; border:2px solid #000;">
                                    <tr>
                                        <td style="border:1px solid #000 !important;">
                                            <span style="display:inline-block; width:14px; height:14px; line-height:14px; text-align:center; border:1px solid #000; margin-right:6px;">
                                                {{ $fuel === 'DIESEL' ? 'X' : '' }}
                                            </span>
                                            DIESEL
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #000 !important;">
                                            <span style="display:inline-block; width:14px; height:14px; line-height:14px; text-align:center; border:1px solid #000; margin-right:6px;">
                                                {{ $fuel === 'GAS' ? 'X' : '' }}
                                            </span>
                                            GAS
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>

                <td style="width:50%; vertical-align:top; padding-left:8px;">
                    <table style="width:100%; border-collapse:collapse; margin:0;">
                        <tr>
                            <td style="vertical-align:top;">
                                <p style="text-align:left; margin:0;"><small><strong>CERTIFIED CORRECT:</strong></small><br><br><br></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center; padding-top:10px;">
                                <strong>{{ strtoupper($tripTicket['driver_name']) ?? '' }}</strong>
                                <div style="width:220px; border-bottom:1px solid #000; margin:0 auto 4px auto;"></div>
                                <strong>Driver</strong>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table class="no-border" style="width:100%; border-collapse:collapse; margin:0 !important;">
            <tr><td style="padding:0;"><div style="width:100%; border-bottom:2px dashed black; height:1px;"></div></td></tr>
        </table>

        <p style="margin-top: 12px;"><i>I/We certify that the vehicle was used exclusively for <strong>OFFICIAL BUSINESS</strong> as stated above.</i></p>

        @php
            $passengersBottom = collect($tripTicket['passengers'] ?? [])
                ->map(fn ($p) => trim((string)($p['name'] ?? '')))
                ->filter()
                ->values();

            $maxLinesBottom = 9;
            $showNamesBottom = $passengersBottom->count() <= $maxLinesBottom;
        @endphp

        <table class="no-border" style="width:100%; border-collapse:collapse; margin-top:8px;">
            <tr>
                <td colspan="3"><strong>Authorized Passenger/s:</strong></td>
            </tr>
            <tr>
                @for ($col = 0; $col < 3; $col++)
                    <td style="width:33.33%; vertical-align:top; border:0; {{ $col < 2 ? 'border-right:1px solid #444;' : '' }} padding:4px 8px;">
                        @for ($row = 1; $row <= 3; $row++)
                            @php
                                $idx = ($col * 3) + ($row - 1);
                                $num = $idx + 1;
                                $name = $showNamesBottom ? ($passengersBottom[$idx] ?? '') : '';
                            @endphp
                            <div style="border-bottom:1px solid #444; padding:2px 0;">
                                {{ $num }}. {{ $name }}
                            </div>
                        @endfor
                    </td>
                @endfor
            </tr>
        </table>
    </div>

    <script>
        window.onload = function () {
            window.print();
            window.onafterprint = function () {
                window.close();
            };
        };
    </script>
</body>
</html>
