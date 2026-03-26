<?php

namespace App\Support;

use Illuminate\Support\Facades\Crypt;

class MessengerConversationToken
{
    public static function encode(int $conversationId): string
    {
        $encrypted = Crypt::encryptString((string) $conversationId);

        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    public static function decode(?string $token): ?int
    {
        if (blank($token)) {
            return null;
        }

        try {
            $encoded = (string) $token;
            $padding = strlen($encoded) % 4;
            if ($padding > 0) {
                $encoded .= str_repeat('=', 4 - $padding);
            }

            $encrypted = base64_decode(strtr($encoded, '-_', '+/'), true);
            if ($encrypted === false) {
                return null;
            }

            $value = Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }

        $conversationId = (int) $value;
        return $conversationId > 0 ? $conversationId : null;
    }
}
