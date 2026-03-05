<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Travel Order</title>

  <style>
    @page { size: A4 landscape; margin: 12mm 10mm 10mm 10mm; }
    @media print { body { margin: 0; } .sheet { page-break-after: always; } }

    html, body { margin: 0; padding: 0; }

    /* ✅ SINGLE FONT SIZE (12px everywhere) */
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
    }

    .sheet { width: 100%; box-sizing: border-box; page-break-inside: avoid !important; break-inside: avoid !important; }
    table.twoup { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: avoid !important; break-inside: avoid !important; }

    /* symmetric padding for cutting */
    td.half { width: 50%; vertical-align: top; padding: 0; box-sizing: border-box; page-break-inside: avoid !important; break-inside: avoid !important; }
    td.half-left  { border-right: 2px dashed #000; padding-left: 8mm; padding-right: 8mm; box-sizing: border-box; }
    td.half-right { padding-left: 8mm; padding-right: 8mm; box-sizing: border-box; }

    .text-center { text-align: center; }
    .font-semibold { font-weight: 700; }
    .underline { text-decoration: underline; }

    /* ✅ keep utility classes but make them SAME size too */
    .text-xs, .text-sm { font-size: 12px; }

    .boxed-title {
      border: 2px solid #000;
      display: inline-block;
      padding: 2px 8px;
      font-weight: 700;
      margin-top: 6px;
      max-width: 90%;
      word-break: break-word;
    }

    .line-b {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 90px;
      padding: 0 6px;
      text-align: center;
      font-weight: 700;
      white-space: nowrap;
    }

    .rowtable { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .rowtable td { vertical-align: top; }

    .date-line {
        border-bottom: 1px solid #000;
        display: block;
        height: 16px;          /* same visual row height as your underline rows */
        line-height: 16px;
        box-sizing: border-box;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
    }

    .mt-2 { margin-top: 6px; }
    .mt-3 { margin-top: 10px; }
    .mb-3 { margin-bottom: 14px; }
    .mb-2 { margin-bottom: 6px; }
    .mb-1 { margin-bottom: 3px; }

    .heading { display: inline-block; font-weight: 700; }

    /* underline-per-row tables */
    .lines-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .lines-table td {
      border-bottom: 1px solid #000;
      height: 16px;
      padding: 0 4px;
      vertical-align: bottom;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px; /* ✅ enforce 12px inside tables too */
    }

    /* Purpose can wrap */
    .lines-table.wrap td {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      height: auto;
      padding: 2px 4px;
      line-height: 1.2;
      font-size: 12px; /* ✅ */
    }

    .sheet, .sheet * { page-break-inside: avoid !important; break-inside: avoid !important; }
  </style>
</head>

<body>
@php
  $MIN_LINES = 7;

  $toArray = function ($v) {
    if (is_array($v)) return $v;
    if ($v instanceof \Illuminate\Support\Collection) return $v->all();
    if (is_iterable($v)) return iterator_to_array($v);
    return [];
  };

  $splitToLines = function (?string $text, int $maxChars = 72) {
    $text = trim((string)($text ?? ''));
    if ($text === '') return [];

    $rawLines = preg_split("/\R/u", $text) ?: [];
    $out = [];

    foreach ($rawLines as $ln) {
      $ln = trim((string)$ln);
      if ($ln === '') { $out[] = ''; continue; }

      $words = preg_split('/\s+/u', $ln) ?: [];
      $buf = '';
      foreach ($words as $w) {
        $candidate = $buf === '' ? $w : ($buf.' '.$w);
        if (mb_strlen($candidate) > $maxChars && $buf !== '') {
          $out[] = $buf;
          $buf = $w;
        } else {
          $buf = $candidate;
        }
      }
      if ($buf !== '') $out[] = $buf;
    }

    while (count($out) && trim((string)end($out)) === '') array_pop($out);
    return $out;
  };

  $padToCount = function (array $lines, int $min) {
    $clean = array_map(fn($s) => (string)($s ?? ''), $lines);
    $target = max($min, count($clean));
    while (count($clean) < $target) $clean[] = '';
    return $clean;
  };

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

  $purposeLines = $padToCount($splitToLines($travelOrder['purpose'] ?? '', 72), 2);

  $destLines = [];
  foreach ($toArray($travelOrder['destinations'] ?? []) as $d) {
    $txt = trim($formatDestination($d));
    if ($txt !== '') $destLines[] = $txt;
  }
  if (count($destLines) === 0) $destLines = [''];

  $staffs = $toArray($travelOrder['staffs'] ?? []);

  $personnelNames = array_values(array_filter(array_map(function ($s) {
    $arr = is_array($s) ? $s : (array)$s;
    $name = trim((string)($arr['name'] ?? ''));
    return $name !== '' ? $name : null;
  }, $staffs)));

  $recommenderNames = array_values(array_filter(array_map(function ($s) {
    $arr = is_array($s) ? $s : (array)$s;
    $name = trim((string)($arr['recommender_name'] ?? ''));
    return $name !== '' ? $name : null;
  }, $staffs)));

  $uniqueRecommenders = array_values(array_unique($recommenderNames));

  $personnelLines = $padToCount($personnelNames, $MIN_LINES);
  $recommendingLines = $padToCount($uniqueRecommenders, $MIN_LINES);

  $approverNames = array_values(array_filter(array_map(function ($s) {
    $arr = is_array($s) ? $s : (array)$s;
    $name = trim((string)($arr['approver_name'] ?? ''));
    return $name !== '' ? $name : null;
  }, $staffs)));

  $uniqueApprovers = array_values(array_unique($approverNames));
  $approvedByText = count($uniqueApprovers) ? $uniqueApprovers[0] : '';

  function renderToHalf(array $travelOrder, array $purposeLines, array $destLines, array $personnelLines, array $recommendingLines, string $approvedByText): string
  {
    $nb = "\u{00A0}";

    $rows = function (array $lines, bool $wrap = false) use ($nb) {
      $cls = $wrap ? 'lines-table wrap' : 'lines-table';
      $html = '<table class="'.$cls.'">';
      foreach ($lines as $ln) {
        $val = trim((string)$ln) !== '' ? e($ln) : $nb;
        $html .= '<tr><td>'.$val.'</td></tr>';
      }
      $html .= '</table>';
      return $html;
    };

    $html = '';

    $html .= '<div class="text-center">';
    $html .= '  <div class="mb-1">Republic of the Philippines</div>';
    $html .= '  <div class="mb-1 font-semibold">DEPARTMENT OF ECONOMY, PLANNING, AND DEVELOPMENT</div>';
    $html .= '  <div class="mb-1">Regional Office 1</div>';
    $html .= '  <div class="mb-3">Guerrero Road, City of San Fernando, La Union</div>';
    $html .= '  <div class="mb-3 boxed-title">TRAVEL ORDER NO. '.e($travelOrder["reference_no"] ?? "").'</div>';
    $html .= '</div>';

    $html .= '<div class="mt-2 mb-3">';
    $html .= '  <table class="rowtable">';
    $html .= '    <tr>';
    $html .= '      <td style="width:70%"></td>';
    $html .= '      <td style="width:10%; white-space:nowrap;">Date:</td>';
    $html .= '      <td style="width:20%"><span class="date-line">'.e($travelOrder["date_created"] ?? "").'</span></td>';
    $html .= '    </tr>';
    $html .= '  </table>';
    $html .= '</div>';

    $html .= '<div class="mt-2"><table class="rowtable"><tr>';
    $html .= '  <td style="width:8%; white-space:nowrap;">To:</td>';
    $html .= '  <td style="border-bottom:1px solid #000;"><span class="font-semibold">CONCERNED STAFF</span></td>';
    $html .= '</tr></table></div>';

    $html .= '<div class="mt-2"><table class="rowtable"><tr>';
    $html .= '  <td style="width:16%; white-space:nowrap;">Purpose:</td>';
    $html .= '  <td>'.$rows($purposeLines, true).'</td>';
    $html .= '</tr></table></div>';

    $html .= '<div class="mt-2 mb-3"><table class="rowtable"><tr>';
    $html .= '  <td style="width:16%; white-space:nowrap;">Destination:</td>';
    $html .= '  <td>'.$rows($destLines, false).'</td>';
    $html .= '</tr></table></div>';

    $html .= '<div class="mt-2 mb-3">';
    $html .= '  1. The following personnel of this Authority are hereby authorized to proceed to official destination on ';
    $html .= '  <span class="line-b">'.e($travelOrder["dates"] ?? "").'</span>.';
    $html .= '</div>';

    $html .= '<div class="mt-3 mb-3"><table class="rowtable"><tr>';

    $html .= '  <td style="width:50%; padding-right:10px;">';
    $html .= '    <div class="mb-2"><span class="heading">PERSONNEL</span></div>';
    $html .=        $rows($personnelLines, false);
    $html .= '  </td>';

    $html .= '  <td style="width:50%; padding-left:10px;">';
    $html .= '    <div class="mb-2"><span class="heading">RECOMMENDING APPROVAL</span></div>';
    $html .=        $rows($recommendingLines, false);
    $html .= '  </td>';

    $html .= '</tr></table></div>';

    $html .= '<div class="mt-2 mb-3">';
    $html .= '  2. Per approved Itinerary of Travel, expenses are hereby authorized, subject to availability of funds and the usual accounting and auditing rules and regulations, chargeable against the fund of the:';
    $html .= '</div>';

    $html .= '<div class="mt-2 mb-3 font-semibold underline text-center">'.e($travelOrder["fund_source_title"] ?? $nb).'</div>';

    $html .= '<div class="mt-2 mb-3">';
    $html .= '  3. Upon completion of the travel, the Certificate of Appearance, Certificate of Travel Completed and a Report on the purpose shall be submitted to the office.';
    $html .= '</div>';

    $html .= '<div class="mt-2 mb-3 font-semibold" style="margin-left:70px;">APPROVED:</div>';

    $html .= '<div class="mt-2 text-center">';
    $html .= '  <div class="font-semibold underline">'.e($approvedByText).'</div>';
    $html .= '  <div>'.e($travelOrder["approver_designation"] ?? "").'</div>';
    $html .= '</div>';

    return $html;
  }

  $halfHtml = renderToHalf($travelOrder, $purposeLines, $destLines, $personnelLines, $recommendingLines, (string)$approvedByText);
@endphp

<div class="sheet">
  <table class="twoup">
    <tr>
      <td class="half half-left">{!! $halfHtml !!}</td>
      <td class="half half-right">{!! $halfHtml !!}</td>
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
