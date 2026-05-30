<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'photo_url', 'username', 'nickname', 'name', 'email', 'password', 'nim', 'is_subscribed', 'language',
    'reminder_task_time', 'reminder_task_message', 'reminder_task_style', 'reminder_task_sound', 'reminder_task_vibrate',
    'reminder_activity_time', 'reminder_activity_message', 'reminder_activity_style', 'reminder_activity_sound', 'reminder_activity_vibrate',
])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_subscribed' => 'boolean',
            'reminder_task_vibrate' => 'boolean',
            'reminder_activity_vibrate' => 'boolean',
        ];
    }

    /**
     * Get all tasks for the user.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get all subscriptions for the user.
     */
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get all payments for the user.
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Determine if this user is an elearn/web admin.
     *
     * We treat admin membership as authoritative in the `admin` table
     * rather than relying on a `role` column in `users`.
     */
    public function isAdmin(): bool
    {
        // The `admin` table stores admin accounts by name; fall back to username if needed.
        return DB::table('admin')
            ->where('name', $this->name)
            ->orWhere('name', $this->username)
            ->exists();
    }
}
