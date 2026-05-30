<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$details = DB::table('detail')->orderBy('id','desc')->limit(20)->get();
foreach ($details as $d) {
    $reg = DB::table('reg_student')->where('id',$d->reg_student_id)->first();
    $student = $reg ? DB::table('students')->where('id',$reg->student_id)->first() : null;
    $user = $student ? DB::table('users')->where('nim',$student->nim)->first() : null;
    echo "Detail {$d->id}: assessment={$d->assessment_id}, reg_student={$d->reg_student_id}, student_nim=".($student->nim ?? 'NULL').", student_name=".($student->student_name ?? 'NULL').", mapped_user_id=".($user->id ?? 'NULL')."\n";
}
