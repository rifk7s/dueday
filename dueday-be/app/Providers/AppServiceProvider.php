<?php

namespace App\Providers;

use App\Models\User;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Disable automatic wrapping of resource responses to keep legacy JSON shapes
        JsonResource::withoutWrapping();

        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return rtrim((string) config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
                'email' => $user->email,
                'token' => $token,
            ]);
        });

        // Document Sanctum bearer-token auth in the generated OpenAPI spec.
        if (class_exists(Scramble::class)) {
            Scramble::afterOpenApiGenerated(function (OpenApi $openApi): void {
                $openApi->secure(SecurityScheme::http('bearer'));
            });
        }
    }
}
