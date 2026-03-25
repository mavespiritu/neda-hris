<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait UsesMessengerRedisCache
{
    protected function messengerCache()
    {
        return Cache::store('redis');
    }

    protected function conversationListVersionKey(int $userId): string
    {
        return "messenger:conversations:version:{$userId}";
    }

    protected function conversationMessagesVersionKey(int $conversationId): string
    {
        return "messenger:messages:version:{$conversationId}";
    }

    protected function currentConversationListVersion(int $userId): int
    {
        $key = $this->conversationListVersionKey($userId);
        $cache = $this->messengerCache();

        if (! $cache->has($key)) {
            $cache->forever($key, 1);
        }

        return (int) $cache->get($key, 1);
    }

    protected function currentConversationMessagesVersion(int $conversationId): int
    {
        $key = $this->conversationMessagesVersionKey($conversationId);
        $cache = $this->messengerCache();

        if (! $cache->has($key)) {
            $cache->forever($key, 1);
        }

        return (int) $cache->get($key, 1);
    }

    protected function bumpConversationListVersion(int $userId): void
    {
        $key = $this->conversationListVersionKey($userId);
        $cache = $this->messengerCache();

        if (! $cache->has($key)) {
            $cache->forever($key, 1);
        }

        $cache->increment($key);
    }

    protected function bumpConversationMessagesVersion(int $conversationId): void
    {
        $key = $this->conversationMessagesVersionKey($conversationId);
        $cache = $this->messengerCache();

        if (! $cache->has($key)) {
            $cache->forever($key, 1);
        }

        $cache->increment($key);
    }
}
