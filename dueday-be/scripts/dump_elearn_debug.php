<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tasks = DB::table('tasks')->where('source', 'elearn')->orderBy('created_at','desc')->limit(50)->get();
echo "ELEARN TASKS:\n";
foreach ($tasks as $t) {
    echo implode(' | ', [
        $t->id,
        $t->user_id,
        $t->name,
        isset($t->elearn_assessment_id) ? $t->elearn_assessment_id : 'NULL',
        $t->progress,
        $t->status,
        $t->due_date,
        substr($t->description,0,40)
    ]) . "\n";
}

$details = DB::table('detail')->orderBy('id','desc')->limit(50)->get();
echo "\nDETAILS (recent):\n";
foreach ($details as $d) {
    echo implode(' | ', [
        $d->id,
        $d->assessment_id,
        $d->reg_student_id,
        $d->file_name,
        isset($d->submission_text) ? (strlen($d->submission_text)>30?substr($d->submission_text,0,30).'...':$d->submission_text) : 'NULL',
        isset($d->submission_file_path) ? $d->submission_file_path : 'NULL',
        isset($d->submitted_at) ? $d->submitted_at : 'NULL'
    ]) . "\n";
}
