<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$exists = Illuminate\Support\Facades\Schema::hasColumn('tasks', 'elearn_assessment_id');
echo $exists ? "yes\n" : "no\n";
