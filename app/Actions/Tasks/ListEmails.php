<?php

namespace App\Actions\Tasks;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ListEmails
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() instanceof User;
    }

    public function asController(Request $request): Response|JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403, 'Only staff accounts can access Outlook inbox.');
        }

        $token = $this->ensureValidToken($user);

        if ($request->boolean('json')) {
            if (! $token) {
                return response()->json([
                    'messages' => [],
                    'nextLink' => null,
                    'error' => 'Microsoft session expired. Please reconnect your account.',
                ], 401);
            }

            if ($messageId = $request->input('message_id')) {
                return response()->json($this->fetchMessageDetail($token, $messageId));
            }

            return response()->json($this->fetchMessagePage(
                token: $token,
                search: (string) $request->input('search', ''),
                filter: (string) $request->input('filter', ''),
                cursor: $request->input('cursor')
            ));
        }

        if (! $user->microsoft_access_token) {
            return Inertia::render('Tasks/Emails/index', [
                'messages' => [],
                'nextLink' => null,
                'needsMicrosoftConnect' => true,
                'connectUrl' => route('auth.microsoft'),
                'error' => null,
            ]);
        }

        if (! $token) {
            return Inertia::render('Tasks/Emails/index', [
                'messages' => [],
                'nextLink' => null,
                'needsMicrosoftConnect' => true,
                'connectUrl' => route('auth.microsoft'),
                'error' => 'Microsoft session expired. Please reconnect your account.',
            ]);
        }

        $page = $this->fetchMessagePage(
            token: $token,
            search: (string) $request->input('search', ''),
            filter: (string) $request->input('filter', ''),
        );

        return Inertia::render('Tasks/Emails/index', [
            'messages' => $page['messages'],
            'nextLink' => $page['nextLink'],
            'search' => (string) $request->input('search', ''),
            'filter' => (string) $request->input('filter', ''),
            'needsMicrosoftConnect' => false,
            'connectUrl' => route('auth.microsoft'),
            'error' => null,
            'initialSelectedMessageId' => $page['messages'][0]['id'] ?? null,
        ]);
    }

    private function fetchMessagePage(string $token, string $search = '', string $filter = '', ?string $cursor = null): array
    {
        $request = Http::withToken($token);

        if ($cursor) {
            $response = $request
                ->withHeaders(['ConsistencyLevel' => 'eventual'])
                ->get($cursor);
        } else {
            $search = preg_replace('/\s+/', ' ', trim($search));
            $search = str_replace(['"', "\r", "\n"], ['', ' ', ' '], $search);

            $query = [
                '$top' => 20,
                '$select' => 'id,subject,from,receivedDateTime,isRead,bodyPreview,webLink,hasAttachments',
            ];

            if ($search !== '') {
                $query['$search'] = "\"{$search}\"";
            } else {
                $query['$orderby'] = 'receivedDateTime DESC';
            }

            if ($filter === 'unread') {
                $query['$filter'] = 'isRead eq false';
            } elseif ($filter === 'attachments') {
                $query['$filter'] = 'hasAttachments eq true';
            }

            $request = $request;

            if ($search !== '' || in_array($filter, ['unread', 'attachments'], true)) {
                $request = $request->withHeaders(['ConsistencyLevel' => 'eventual']);
                $query['$count'] = 'true';
            }

            $response = $request->get('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages', $query);
        }

        if (! $response->successful()) {
            $graphError = $response->json('error.message')
                ?? $response->json('error.innerError.message')
                ?? null;

            return [
                'messages' => [],
                'nextLink' => null,
                'error' => $graphError ?: 'Unable to fetch Outlook mail right now.',
            ];
        }

        $messages = collect($response->json('value', []))
            ->map(function (array $message): array {
                return [
                    'id' => $message['id'] ?? null,
                    'subject' => $message['subject'] ?: '(No subject)',
                    'from' => $message['from']['emailAddress']['address'] ?? null,
                    'senderName' => $message['from']['emailAddress']['name'] ?? null,
                    'preview' => $message['bodyPreview'] ?? '',
                    'receivedAt' => $message['receivedDateTime'] ?? null,
                    'isRead' => (bool) ($message['isRead'] ?? false),
                    'webLink' => $message['webLink'] ?? null,
                    'hasAttachments' => (bool) ($message['hasAttachments'] ?? false),
                ];
            })
            ->values()
            ->all();

        $json = $response->json();

        return [
            'messages' => $messages,
            'nextLink' => $json['@odata.nextLink'] ?? null,
            'error' => null,
        ];
    }

    private function fetchMessageDetail(string $token, string $messageId): array
    {
        $response = Http::withToken($token)->get("https://graph.microsoft.com/v1.0/me/messages/{$messageId}", [
            '$select' => 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,bodyPreview,webLink,body,hasAttachments,importance',
        ]);

        if (! $response->successful()) {
            return [
                'message' => null,
                'error' => 'Unable to open the selected email right now.',
            ];
        }

        $message = $response->json();
        $isRead = (bool) ($message['isRead'] ?? false);

        if (! $isRead) {
            Http::withToken($token)->patch("https://graph.microsoft.com/v1.0/me/messages/{$messageId}", [
                'isRead' => true,
            ]);
        }

        $attachmentsResponse = Http::withToken($token)->get("https://graph.microsoft.com/v1.0/me/messages/{$messageId}/attachments", [
            '$select' => 'id,name,contentType,size,isInline,@odata.type',
        ]);

        $attachments = [];

        if ($attachmentsResponse->successful()) {
            foreach ($attachmentsResponse->json('value', []) as $attachment) {
                if (! str_contains($attachment['@odata.type'] ?? '', 'fileAttachment')) {
                    continue;
                }

                $attachmentId = $attachment['id'] ?? null;

                if (! $attachmentId) {
                    continue;
                }

                $attachmentDetail = Http::withToken($token)->get(
                    "https://graph.microsoft.com/v1.0/me/messages/{$messageId}/attachments/{$attachmentId}"
                );

                $attachmentPayload = $attachmentDetail->successful()
                    ? $attachmentDetail->json()
                    : $attachment;

                $attachments[] = [
                    'id' => $attachmentPayload['id'] ?? $attachmentId,
                    'name' => $attachmentPayload['name'] ?? 'Attachment',
                    'contentType' => $attachmentPayload['contentType'] ?? 'application/octet-stream',
                    'size' => (int) ($attachmentPayload['size'] ?? 0),
                    'isInline' => (bool) ($attachmentPayload['isInline'] ?? false),
                    'contentBytes' => $attachmentPayload['contentBytes'] ?? null,
                ];
            }
        }

        return [
            'message' => [
                'id' => $message['id'] ?? null,
                'subject' => $message['subject'] ?: '(No subject)',
                'from' => $message['from']['emailAddress']['address'] ?? null,
                'senderName' => $message['from']['emailAddress']['name'] ?? null,
                'toRecipients' => collect($message['toRecipients'] ?? [])
                    ->map(fn ($recipient) => $recipient['emailAddress']['address'] ?? null)
                    ->filter()
                    ->values()
                    ->all(),
                'ccRecipients' => collect($message['ccRecipients'] ?? [])
                    ->map(fn ($recipient) => $recipient['emailAddress']['address'] ?? null)
                    ->filter()
                    ->values()
                    ->all(),
                'preview' => $message['bodyPreview'] ?? '',
                'body' => $message['body']['content'] ?? '',
                'bodyType' => $message['body']['contentType'] ?? 'text',
                'receivedAt' => $message['receivedDateTime'] ?? null,
                'isRead' => true,
                'webLink' => $message['webLink'] ?? null,
                'importance' => $message['importance'] ?? 'normal',
                'hasAttachments' => (bool) ($message['hasAttachments'] ?? false),
                'attachments' => $attachments,
            ],
            'error' => null,
        ];
    }

    private function ensureValidToken(User $user): ?string
    {
        $expiresAt = $user->microsoft_token_expires_at;
        $isExpired = ! $expiresAt || Carbon::parse($expiresAt)->lte(now()->addMinute());

        if (! $isExpired) {
            return $user->microsoft_access_token;
        }

        if (! $user->microsoft_refresh_token) {
            return null;
        }

        $tenant = config('services.microsoft.tenant_id');
        $tokenUrl = "https://login.microsoftonline.com/{$tenant}/oauth2/v2.0/token";

        $tokenResponse = Http::asForm()->post($tokenUrl, [
            'client_id' => config('services.microsoft.client_id'),
            'client_secret' => config('services.microsoft.client_secret'),
            'grant_type' => 'refresh_token',
            'refresh_token' => $user->microsoft_refresh_token,
            'scope' => 'openid offline_access User.Read Mail.Read',
        ]);

        if (! $tokenResponse->successful()) {
            return null;
        }

        $payload = $tokenResponse->json();
        $accessToken = $payload['access_token'] ?? null;

        if (! $accessToken) {
            return null;
        }

        $expiresIn = (int) ($payload['expires_in'] ?? 3600);

        $user->forceFill([
            'microsoft_access_token' => $accessToken,
            'microsoft_refresh_token' => $payload['refresh_token'] ?? $user->microsoft_refresh_token,
            'microsoft_token_expires_at' => now()->addSeconds(max($expiresIn - 60, 0)),
        ])->save();

        return $accessToken;
    }
}
