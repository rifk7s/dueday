<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function findByUsernameOrEmail(string $identifier): ?User
    {
        return User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();
    }

    public function findById(string $id): ?User 
    {
        return User::find($id);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Force-update user records cleanly
     */
    public function update(User $user, array $data): bool
    {
        // Force fill the data array into the model attributes
        $user->fill($data);
        
        // Save directly to the database layer
        return $user->save();
    }

    public function delete(User $user): bool
    {
        return $user->delete();
    }
}