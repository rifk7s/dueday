<?php

test('the application redirects guests from the root to the login page', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login'));
});
