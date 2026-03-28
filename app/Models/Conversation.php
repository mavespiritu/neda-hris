<?php 
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $connection = 'mysql4';
    protected $table = 'conversations';

    protected $fillable = ['type', 'title', 'is_title_custom'];

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withTimestamps();
    }

    public function hiddenUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_hidden_users')
            ->withPivot(['deleted_after_message_id'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
