<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
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

        // Document Sanctum bearer-token auth in the generated OpenAPI spec.
        Scramble::afterOpenApiGenerated(function (OpenApi $openApi): void {
            $openApi->secure(SecurityScheme::http('bearer'));
        });
    }
}
