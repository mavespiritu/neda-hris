<?php

namespace App\Actions\Messenger;

use App\Events\ConversationPing;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class SendConversationMessage
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversation = $request->route('conversation');

        return Gate::forUser($request->user())->allows('send', $conversation);
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx'],
            'reply_to_id' => ['nullable', 'integer', 'exists:mysql4.messages,id'],
        ];
    }

    public function asController(ActionRequest $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validated();
        $attachment = $request->file('attachment');
        $attachmentPath = null;
        $attachmentName = null;
        $attachmentType = null;
        $attachmentSize = null;

        if ($attachment) {
            $folder = 'uploads/messenger/' . now()->format('Y/m');
            $extension = strtolower($attachment->getClientOriginalExtension() ?: $attachment->extension() ?: 'png');
            $filename = Str::uuid()->toString() . '.' . $extension;
            $attachmentPath = $attachment->storeAs($folder, $filename, 'public');
            $attachmentName = $attachment->getClientOriginalName() ?: $filename;
            $attachmentType = $attachment->getMimeType() ?: $attachment->getClientMimeType() ?: 'image/png';
            $attachmentSize = (int) $attachment->getSize();
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'] ?? '',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_type' => $attachmentType,
            'attachment_size' => $attachmentSize,
            'reply_to_id' => $validated['reply_to_id'] ?? null,
        ]);

        $conversation->touch();
        $message->load(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id']);

        $empIds = collect([
            $message->sender?->ipms_id,
            $message->replyTo?->sender?->ipms_id,
        ])->filter()->unique()->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');
        $gendersById = $this->employeeGenderById($empIds, 'mysql3');

        $senderName = $this->employeeName($employeesById, $message->sender?->ipms_id)
            ?? $message->sender?->name
            ?? 'User';

        $senderGender = $gendersById[$message->sender?->ipms_id] ?? null;

        $replySenderName = $message->replyTo
            ? ($this->employeeName($employeesById, $message->replyTo->sender?->ipms_id)
                ?? $message->replyTo->sender?->name
                ?? 'User')
            : null;

        $replySenderGender = $message->replyTo
            ? ($gendersById[$message->replyTo->sender?->ipms_id] ?? null)
            : null;

        $attachmentUrl = $message->attachment_path
            ? Storage::disk('public')->url($message->attachment_path)
            : null;

        $participantSnapshots = $conversation->type === 'group'
            ? $conversation->participants()
                ->select(['users.id', 'users.ipms_id', 'users.name'])
                ->get()
                ->filter(fn ($participant) => (int) $participant->id !== (int) $request->user()->id)
                ->map(fn ($participant) => [
                    'id' => (int) $participant->id,
                    'ipms_id' => (string) ($participant->ipms_id ?? ''),
                    'name' => (string) ($participant->name ?? 'Member'),
                    'avatar' => !empty($participant->ipms_id)
                        ? "/employees/image/{$participant->ipms_id}"
                        : 'https://www.gravatar.com/avatar/?d=mp&s=200',
                ])
                ->values()
                ->all()
            : null;

        $recipientIds = $conversation->participants()
            ->where('users.id', '!=', $request->user()->id)
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $this->bumpConversationMessagesVersion((int) $conversation->id);
        $this->bumpConversationListVersion((int) $request->user()->id);

        foreach ($recipientIds as $recipientId) {
            $this->bumpConversationListVersion($recipientId);

            broadcast(new ConversationPing(
                recipientUserId: $recipientId,
                conversationId: (int) $conversation->id,
                conversationToken: MessengerConversationToken::encode((int) $conversation->id),
                conversationType: (string) $conversation->type,
                conversationTitle: $conversation->title ? (string) $conversation->title : null,
                participants: $participantSnapshots,
                senderId: (int) $message->sender_id,
                senderName: (string) $senderName,
                senderIpmsId: (string) ($message->sender?->ipms_id ?? ''),
                message: (string) $message->body,
                attachmentPath: $message->attachment_path,
                attachmentName: $message->attachment_name,
                attachmentType: $message->attachment_type,
                attachmentSize: $message->attachment_size,
                attachmentUrl: $attachmentUrl,
                createdAt: $message->created_at?->toISOString()
            ));
        }

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'data' => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'sender_name' => $senderName,
                'sender_ipms_id' => $message->sender?->ipms_id,
                'sender_gender' => $senderGender,
                'body' => $message->body,
                'attachment_path' => $message->attachment_path,
                'attachment_url' => $attachmentUrl,
                'attachment_name' => $message->attachment_name,
                'attachment_type' => $message->attachment_type,
                'attachment_size' => $message->attachment_size,
                'created_at' => $message->created_at?->toISOString(),
                'reply_to' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'sender_id' => $message->replyTo->sender_id,
                    'sender_name' => $replySenderName,
                    'sender_gender' => $replySenderGender,
                    'body' => $message->replyTo->body,
                    'attachment_path' => $message->replyTo->attachment_path,
                    'attachment_url' => $message->replyTo->attachment_path
                        ? Storage::disk('public')->url($message->replyTo->attachment_path)
                        : null,
                    'attachment_name' => $message->replyTo->attachment_name,
                    'attachment_type' => $message->replyTo->attachment_type,
                    'attachment_size' => $message->replyTo->attachment_size,
                ] : null,
            ],
        ]);
    }
}
