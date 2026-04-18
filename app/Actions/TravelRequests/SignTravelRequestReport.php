<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestReportPdfService;
use App\Traits\AuthorizesTravelRequests;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use setasign\Fpdi\Tcpdf\Fpdi as Pdf;

class SignTravelRequestReport
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');

        return $this->canGenerateTravelRequest($request->user(), $id);
    }

    public function rules(): array
    {
        return [
            'signature_source' => ['required', 'in:none,saved_image,upload_image,saved_digital,upload_digital'],
            'signature_page' => ['required', 'integer', 'min:1'],
            'signature_x' => ['required', 'numeric', 'min:0', 'max:100'],
            'signature_y' => ['required', 'numeric', 'min:0', 'max:100'],
            'signature_w' => ['required', 'numeric', 'min:5', 'max:60'],
            'signature_h' => ['required', 'numeric', 'min:5', 'max:40'],
            'signature_image_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:4096', 'required_if:signature_source,upload_image'],
            'digital_certificate' => ['nullable', 'file', 'mimetypes:application/x-pkcs12,application/octet-stream', 'max:4096', 'required_if:signature_source,upload_digital'],
            'digital_certificate_password' => ['nullable', 'string', 'max:255', 'required_if:signature_source,saved_digital', 'required_if:signature_source,upload_digital'],
        ];
    }

    public function asController(ActionRequest $request, TravelRequestReportPdfService $pdfService)
    {
        $id = (int) $request->route('id');

        try {
            $unsigned = $pdfService->ensureUnsignedPdf($id);

            if (! $unsigned) {
                return redirect()->route('travel-requests.index')->with([
                    'status' => 'error',
                    'title' => 'Not found',
                    'message' => 'Travel request not found.',
                ]);
            }

            $validated = $request->validated();
            $payload = $this->resolveSignaturePayload($request, $validated['signature_source']);

            if (str_starts_with($payload['source'], 'saved_') && $payload['mode'] === 'none') {
                throw new \RuntimeException('Saved signature source is unavailable. Please upload a file or use a different source.');
            }

            $placement = $this->resolvePlacement($request, $unsigned['path']);
            $pdf = new Pdf('L', 'mm', 'A4', true, 'UTF-8', false);
            $pdf->SetCreator(config('app.name'));
            $pdf->SetAuthor($payload['signer_name'] ?: config('app.name'));
            $pdf->SetTitle($unsigned['filename']);
            $pdf->SetMargins(0, 0, 0);
            $pdf->SetAutoPageBreak(false, 0);
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);

            $pdf->setSourceFile($unsigned['path']);
            $templateId = $pdf->importPage(1);
            $templateSize = $pdf->getTemplateSize($templateId);
            $pdf->AddPage($templateSize['orientation'] ?? 'L', [$templateSize['width'], $templateSize['height']]);
            $pdf->useTemplate($templateId);

            if ($payload['mode'] === 'image') {
                if (! $payload['image_path']) {
                    throw new \RuntimeException('Unable to load the selected signature image.');
                }

                $pdf->Image(
                    $payload['image_path'],
                    $placement['x'],
                    $placement['y'],
                    $placement['w'],
                    $placement['h'],
                    '',
                    '',
                    '',
                    false,
                    300,
                    '',
                    false,
                    false,
                    0,
                    'LT',
                    false,
                    false
                );
            }

            if ($payload['mode'] === 'digital') {
                if (! $this->applyDigitalSignature($pdf, $payload['certificate_path'], $payload['password'], $payload['signer_name'], $placement)) {
                    throw new \RuntimeException('Unable to apply digital signature. Please verify the certificate file and password.');
                }
            }

            $filename = str_replace('.pdf', '_SIGNED.pdf', $unsigned['filename']);

            return response($pdf->Output($filename, 'S'), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\RuntimeException $e) {
            return response($e->getMessage(), 422);
        } catch (\Throwable $e) {
            Log::error("SignTravelRequestReport failed [TR:{$id}] {$e->getMessage()}");

            return response('Failed to sign travel request report.', 500);
        }
    }

    private function resolveSignaturePayload(ActionRequest $request, string $signatureSource): array
    {
        $user = $request->user();
        $signerName = trim((string) ($user?->name ?? ''));
        if ($signerName === '') {
            $signerName = trim(collect([$user?->first_name ?? '', $user?->middle_name ?? '', $user?->last_name ?? ''])->filter()->implode(' '));
        }

        $mode = 'none';
        $imagePath = null;
        $certificatePath = null;
        $password = (string) $request->input('digital_certificate_password', '');

        if ($signatureSource === 'saved_image' && ! empty($user?->signature)) {
            $imagePath = $this->writeTempBinaryFile((string) $user->signature, $this->detectImageExtension((string) $user->signature));
            $mode = 'image';
        }

        if ($signatureSource === 'saved_digital' && ! empty($user?->digital_sig)) {
            $certificatePath = $this->writeTempBinaryFile((string) $user->digital_sig, 'p12');
            $mode = 'digital';
        }

        if ($signatureSource === 'upload_image' && $request->hasFile('signature_image_file')) {
            $file = $request->file('signature_image_file');
            $imagePath = $this->writeTempBinaryFile(file_get_contents($file->getRealPath()), $this->detectImageExtension(file_get_contents($file->getRealPath())));
            $mode = 'image';
        }

        if ($signatureSource === 'upload_digital' && $request->hasFile('digital_certificate')) {
            $file = $request->file('digital_certificate');
            $certificatePath = $this->writeTempBinaryFile(file_get_contents($file->getRealPath()), 'p12');
            $mode = 'digital';
        }

        return [
            'source' => $signatureSource,
            'mode' => $mode,
            'image_path' => $imagePath,
            'certificate_path' => $certificatePath,
            'password' => $password,
            'signer_name' => $signerName,
        ];
    }

    private function resolvePlacement(ActionRequest $request, string $pdfPath): array
    {
        $pdf = new Pdf('L', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->setSourceFile($pdfPath);
        $templateId = $pdf->importPage(1);
        $templateSize = $pdf->getTemplateSize($templateId);

        $pageWidth = (float) ($templateSize['width'] ?? 297.0);
        $pageHeight = (float) ($templateSize['height'] ?? 210.0);

        $boxWidth = max(18.0, min($pageWidth * 0.5, $pageWidth * ((float) $request->input('signature_w', 24)) / 100));
        $boxHeight = max(10.0, min($pageHeight * 0.25, $pageHeight * ((float) $request->input('signature_h', 12)) / 100));
        $xPct = max(0.0, min(100.0, (float) $request->input('signature_x', 58)));
        $yPct = max(0.0, min(100.0, (float) $request->input('signature_y', 74)));

        $x = max(0.0, min($pageWidth - $boxWidth, ($pageWidth - $boxWidth) * ($xPct / 100)));
        $y = max(0.0, min($pageHeight - $boxHeight, ($pageHeight - $boxHeight) * ($yPct / 100)));

        return [
            'page' => max(1, (int) $request->input('signature_page', 1)),
            'x' => $x,
            'y' => $y,
            'w' => $boxWidth,
            'h' => $boxHeight,
        ];
    }

    private function writeTempBinaryFile(string $binary, string $extension): ?string
    {
        $temp = tempnam(sys_get_temp_dir(), 'to_sig_');
        if (! $temp) {
            return null;
        }

        $path = $temp . '.' . ltrim($extension, '.');
        file_put_contents($path, $binary);
        @unlink($temp);

        register_shutdown_function(static function () use ($path) {
            @unlink($path);
        });

        return $path;
    }

    private function detectImageExtension(string $binary): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = $finfo ? finfo_buffer($finfo, $binary) : 'image/png';
        if ($finfo) {
            finfo_close($finfo);
        }

        return match ($mimeType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            default => 'png',
        };
    }

    private function applyDigitalSignature(Pdf $pdf, ?string $certificatePath, string $password, string $signerName, array $placement): bool
    {
        if (! $certificatePath || ! is_file($certificatePath)) {
            return false;
        }

        $certs = [];
        if (! openssl_pkcs12_read(file_get_contents($certificatePath), $certs, $password)) {
            return false;
        }

        $tempCert = tempnam(sys_get_temp_dir(), 'to_cert_');
        $tempKey = tempnam(sys_get_temp_dir(), 'to_key_');

        if (! $tempCert || ! $tempKey) {
            return false;
        }

        $tempCert .= '.pem';
        $tempKey .= '.pem';

        file_put_contents($tempCert, $certs['cert'] ?? '');
        file_put_contents($tempKey, $certs['pkey'] ?? '');

        $pdf->setSignature(
            $tempCert,
            $tempKey,
            '',
            '',
            2,
            [
                'Name' => $signerName ?: (string) config('app.name'),
                'Location' => (string) config('app.name'),
                'Reason' => 'Travel Order',
            ]
        );

        $pdf->setSignatureAppearance(
            $placement['x'],
            $placement['y'],
            $placement['w'],
            $placement['h'],
            $placement['page']
        );

        register_shutdown_function(static function () use ($tempCert, $tempKey) {
            @unlink($tempCert);
            @unlink($tempKey);
        });

        return true;
    }
}