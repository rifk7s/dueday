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
            $frontend = (string) config('app.frontend_url');

            // If the frontend is an app scheme (starts with scheme://), embed
            // the web-path as the path component so deep-links like
            // `duedayfe://reset-password?email=...&token=...` open the app.
            if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//', $frontend)) {
                return rtrim($frontend, '/').'/reset-password?'.http_build_query([
                    'email' => $user->email,
                    'token' => $token,
                ]);
            }

            // Fallback to web URL
            return rtrim($frontend, '/').'/reset-password?'.http_build_query([
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
