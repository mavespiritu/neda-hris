<?php

namespace App\Actions\Tasks;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ListEmails
{
    use AsAction;

    public function asController(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403, 'Only staff accounts can access Outlook inbox.');
        }

        if (! $user->microsoft_access_token) {
            return Inertia::render('Tasks/Emails/index', [
                'messages' => [],
                'needsMicrosoftConnect' => true,
                'connectUrl' => route('auth.microsoft'),
                'error' => null,
            ]);
        }

        $token = $this->ensureValidToken($user);

        if (! $token) {
            return Inertia::render('Tasks/Emails/index', [
                'messages' => [],
                'needsMicrosoftConnect' => true,
                'connectUrl' => route('auth.microsoft'),
                'error' => 'Microsoft session expired. Please reconnect your account.',
            ]);
        }

        $response = Http::withToken($token)->get('https://graph.microsoft.com/v1.0/me/messages', [
            '$top' => 20,
            '$orderby' => 'receivedDateTime DESC',
            '$select' => 'id,subject,from,receivedDateTime,isRead,bodyPreview,webLink',
        ]);

        if ($response->status() === 401) {
            $user->forceFill([
                'microsoft_access_token' => null,
                'microsoft_refresh_token' => null,
                'microsoft_token_expires_at' => null,
            ])->save();

            return Inertia::render('Tasks/Emails', [
                'messages' => [],
                'needsMicrosoftConnect' => true,
                'connectUrl' => route('auth.microsoft'),
                'error' => 'Microsoft token is invalid. Please reconnect your account.',
            ]);
        }

        if (! $response->successful()) {
            return Inertia::render('Tasks/Emails/index', [
                'messages' => [],
                'needsMicrosoftConnect' => false,
                'connectUrl' => route('auth.microsoft'),
                'error' => 'Unable to fetch Outlook mail right now.',
            ]);
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
                ];
            })
            ->values();

        return Inertia::render('Tasks/Emails/index', [
            'messages' => $messages,
            'needsMicrosoftConnect' => false,
            'connectUrl' => route('auth.microsoft'),
            'error' => null,
        ]);
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

        $tokenResponse = Http::asForm()->post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
            'client_id' => config('services.microsoft.client_id'),
            'client_secret' => config('services.microsoft.client_secret'),
            'grant_type' => 'refresh_token',
            'refresh_token' => $user->microsoft_refresh_token,
            'scope' => 'openid profile email offline_access User.Read Mail.Read',
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
