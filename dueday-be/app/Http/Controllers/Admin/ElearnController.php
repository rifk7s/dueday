<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Detail;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Assessment;
use Illuminate\Support\Str;

class ElearnController extends Controller
{
    public function majors(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $majors = DB::table('major')->orderBy('id')->get();

        return view('admin.majors', ['majors' => $majors]);
    }

    public function assignments(Request $request, $majorId)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $assignments = DB::table('assessment')
            ->join('opened_class', 'assessment.opened_class_id', '=', 'opened_class.id')
            ->join('subject', 'opened_class.subject_id', '=', 'subject.id')
            ->where('subject.major_id', $majorId)
            ->select('assessment.*', 'opened_class.id as opened_class_id', 'subject.name as subject_name')
            ->get();

        $major = DB::table('major')->where('id', $majorId)->first();

        return view('admin.assignments.index', ['assignments' => $assignments, 'major' => $major]);
    }

    public function create(Request $request, $majorId)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        // opened classes for major
        $opened = DB::table('opened_class')
            ->join('subject', 'opened_class.subject_id', '=', 'subject.id')
            ->where('subject.major_id', $majorId)
            ->select('opened_class.*', 'subject.name as subject_name')
            ->get();

        $major = DB::table('major')->where('id', $majorId)->first();

        return view('admin.assignments.form', ['opened' => $opened, 'major' => $major]);
    }

    public function store(Request $request, $majorId)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $data = $request->validate([
            'opened_class_id' => 'required|integer',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'time' => 'nullable',
            'file_name' => 'required|string',
        ]);

        $assessment = Assessment::create($data);
        $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');

        $regStudentIds = DB::table('study_plan_card')
            ->where('opened_class_id', $data['opened_class_id'])
            ->pluck('reg_student_id');

        foreach ($regStudentIds as $regStudentId) {
            Detail::create([
                'assessment_id' => $assessment->id,
                'reg_student_id' => $regStudentId,
                'file_name' => $data['file_name'],
                'nilai' => null,
            ]);
        }

        $enrolledUsers = DB::table('study_plan_card')
            ->join('reg_student', 'study_plan_card.reg_student_id', '=', 'reg_student.id')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->join('users', 'students.nim', '=', 'users.nim')
            ->where('study_plan_card.opened_class_id', $data['opened_class_id'])
            ->select('users.id as user_id')
            ->distinct()
            ->get();

        foreach ($enrolledUsers as $enrolledUser) {
            $taskData = [
                'id' => (string) Str::uuid(),
                'user_id' => $enrolledUser->user_id,
                'tag_id' => null,
                'name' => $assessment->title,
                'due_date' => $assessment->date,
                'due_time' => $assessment->time,
                'priority' => null,
                'status' => 'ongoing',
                'source' => 'elearn',
                'description' => $assessment->description,
                'progress' => 0,
                'goals' => null,
                'goal_points' => null,
            ];

            if ($hasElearnAssessmentId) {
                $taskData['elearn_assessment_id'] = $assessment->id;
            }

            Task::create($taskData);
        }

        return redirect()->route('admin.elearn.assignments', ['major' => $majorId]);
    }

    public function edit(Request $request, $majorId, Assessment $assessment)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $major = DB::table('major')->where('id', $majorId)->first();

        return view('admin.assignments.form', ['assessment' => $assessment, 'major' => $major]);
    }

    public function update(Request $request, $majorId, Assessment $assessment)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'time' => 'nullable',
            'file_name' => 'required|string',
        ]);

        // Preserve old values so we can find and update corresponding tasks.
        $oldTitle = $assessment->title;
        $oldDescription = $assessment->description;
        $oldDate = $assessment->date;
        $oldTime = $assessment->time;

        $assessment->update($data);
        $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');

        // Propagate edits to existing tasks for enrolled users where the task
        // was created from this elearn assessment (match on old values).
        $enrolledUserIds = DB::table('study_plan_card')
            ->join('reg_student', 'study_plan_card.reg_student_id', '=', 'reg_student.id')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->join('users', 'students.nim', '=', 'users.nim')
            ->where('study_plan_card.opened_class_id', $assessment->opened_class_id)
            ->pluck('users.id');

        if ($enrolledUserIds->isNotEmpty()) {
            // Prefer stable matching by elearn_assessment_id. This ensures we
            // update only tasks that were created from this assessment.
            if ($hasElearnAssessmentId) {
                Task::query()
                    ->whereIn('user_id', $enrolledUserIds)
                    ->where('source', 'elearn')
                    ->where('elearn_assessment_id', $assessment->id)
                    ->update([
                        'name' => $assessment->title,
                        'description' => $assessment->description,
                        'due_date' => $assessment->date,
                        'due_time' => $assessment->time,
                        'updated_at' => now(),
                    ]);
            }

            Task::query()
                ->whereIn('user_id', $enrolledUserIds)
                ->where('source', 'elearn')
                ->where('name', $oldTitle)
                ->where('description', $oldDescription)
                ->update([
                    'name' => $assessment->title,
                    'description' => $assessment->description,
                    'due_date' => $assessment->date,
                    'due_time' => $assessment->time,
                    'updated_at' => now(),
                ]);
        }

        return redirect()->route('admin.elearn.assignments', ['major' => $majorId]);
    }

    public function destroy(Request $request, $majorId, Assessment $assessment)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $enrolledUserIds = DB::table('study_plan_card')
            ->join('reg_student', 'study_plan_card.reg_student_id', '=', 'reg_student.id')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->join('users', 'students.nim', '=', 'users.nim')
            ->where('study_plan_card.opened_class_id', $assessment->opened_class_id)
            ->pluck('users.id');

        Task::query()
            ->whereIn('user_id', $enrolledUserIds)
            ->where('source', 'elearn')
            ->where(function ($q) use ($assessment) {
                // Prefer stable id match, but fall back to legacy name/description/date
                if (Schema::hasColumn('tasks', 'elearn_assessment_id')) {
                    $q->where('elearn_assessment_id', $assessment->id)
                      ->orWhere(function ($q2) use ($assessment) {
                          $q2->where('name', $assessment->title)
                             ->where('description', $assessment->description)
                             ->whereDate('due_date', $assessment->date);
                      });
                } else {
                    $q->where('name', $assessment->title)
                      ->where('description', $assessment->description)
                      ->whereDate('due_date', $assessment->date);
                }
            })
            ->delete();

        $assessment->delete();

        return redirect()->route('admin.elearn.assignments', ['major' => $majorId]);
    }
}
