<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;
use App\Models\Task;

$detailId = 5;
$detail = DB::table('detail')->where('id',$detailId)->first();
$assessmentId = $detail->assessment_id;
// find mapped user id
$reg = DB::table('reg_student')->where('id',$detail->reg_student_id)->first();
$student = DB::table('students')->where('id',$reg->student_id)->first();
$user = DB::table('users')->where('nim',$student->nim)->first();

echo "Detail $detailId -> assessment=$assessmentId, user_id=".($user->id ?? 'NULL')."\n";

$affected = Task::where('user_id',$user->id)->where('source','elearn')->where('elearn_assessment_id',$assessmentId)->update(['progress'=>100, 'status'=>'completed','updated_at'=>now()]);

echo "Affected rows: $affected\n";

$task = DB::table('tasks')->where('elearn_assessment_id',$assessmentId)->first();
print_r($task);
