<?php

use Illuminate\Support\Facades\Gate;

// The docs routes are gated to the `local` environment by RestrictedDocsAccess.
// Tests run in `testing`, so we open the gate explicitly to reach the document.
// The nullable parameter lets the gate pass for the unauthenticated test request
// (zero-argument gate closures deny guests by default).
beforeEach(function () {
    Gate::define('viewApiDocs', fn ($user = null) => true);
});

test('openapi document is generated and lists the api endpoints', function () {
    $response = $this->getJson('/docs/api.json');

    $response->assertStatus(200);

    // Paths are relative to `api_path` (the `/api` base lives in the server URL).
    expect($response->json('paths'))
        ->toHaveKeys(['/tasks', '/login', '/tags', '/payments', '/subscriptions', '/activities']);
});

test('openapi document documents sanctum bearer auth', function () {
    $response = $this->getJson('/docs/api.json');

    $response->assertStatus(200);

    // Proves the Scramble::afterOpenApiGenerated hook in AppServiceProvider applied.
    expect($response->json('components.securitySchemes.http'))
        ->toMatchArray(['type' => 'http', 'scheme' => 'bearer']);
});
