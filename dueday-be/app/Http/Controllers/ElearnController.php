<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ElearnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Find reg_student ids for this user (students.nim == users.nim)
        $regStudentIds = DB::table('reg_student')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->where('students.nim', $user->nim)
            ->pluck('reg_student.id');

        $details = DB::table('detail')
            ->whereIn('reg_student_id', $regStudentIds)
            ->get();

        $assignments = $details->map(function ($detail) {
            $assessment = DB::table('assessment')->where('id', $detail->assessment_id)->first();
            $openedClass = $assessment ? DB::table('opened_class')->where('id', $assessment->opened_class_id)->first() : null;
            $subject = $openedClass ? DB::table('subject')->where('id', $openedClass->subject_id)->first() : null;

            // Attach objects used by the view for convenience
            $detail->assessment = $assessment ? (object) array_merge((array) $assessment, ['openedClass' => $openedClass ? (object) array_merge((array) $openedClass, ['subject' => $subject]) : null]) : null;

            return $detail;
        });

        return view('elearn.index', ['assignments' => $assignments]);
    }

    public function submit(Request $request, $detailId)
    {
        $user = $request->user();

        $detail = DB::table('detail')->where('id', $detailId)->first();
        if (! $detail) {
            abort(404, 'Assignment detail record not found.');
        }

        // Verify the detail belongs to this user via reg_student -> students.nim
        $student = DB::table('reg_student')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->where('reg_student.id', $detail->reg_student_id)
            ->select('students.nim')
            ->first();

        if (! $student || $student->nim !== $user->nim) {
            abort(403, 'Unauthorized access to this assignment record.');
        }

        $assessment = DB::table('assessment')->where('id', $detail->assessment_id)->first();
        if (! $assessment) {
            abort(404, 'Parent assessment metadata not found.');
        }

        // Execute both submission processing and core task tracking updates inside an atomic database transaction
        DB::transaction(function () use ($request, $detail, $detailId, $assessment, $user) {

            // 1. Handle actual data updates depending on required flag configuration type
            if ($detail->file_name === 'txt') {
                $data = $request->validate([
                    'submission_text' => 'required|string',
                ]);

                DB::table('detail')->where('id', $detailId)->update([
                    'submission_text' => $data['submission_text'],
                    'submission_file_path' => null,
                    'submitted_at' => now(),
                ]);
            } else {
                $data = $request->validate([
                    'submission_file' => 'required|file|mimes:pdf|max:12288', // Max 12MB limit safety cap
                ]);

                $file = $data['submission_file'];
                $path = $file->store('elearn_submissions', 'public');

                // Clear previous files from disk if performing an assignment overwrite rewrite step
                $oldPath = $detail->submission_file_path;
                if ($oldPath) {
                    Storage::disk('public')->delete($oldPath);
                }

                DB::table('detail')->where('id', $detailId)->update([
                    'submission_file_path' => $path,
                    'submission_text' => null,
                    'submitted_at' => now(),
                ]);
            }

            // 2. Mark this user's matching elearn task as complete.
            $taskUpdated = false;
            $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');
            $cleanTitle = trim($assessment->title);

            // Pathway A: match by the stable elearn assessment id, scoped to this user.
            if ($hasElearnAssessmentId) {
                $affected = Task::where('user_id', $user->id)
                    ->where('elearn_assessment_id', $detail->assessment_id)
                    ->update([
                        'progress' => 100,
                        'status' => 'completed',
                        'updated_at' => now(),
                    ]);

                $taskUpdated = $affected > 0;
            }

            // Pathway B: fall back to an exact name match scoped to this user's elearn tasks.
            if (! $taskUpdated) {
                Task::where('user_id', $user->id)
                    ->where('source', 'elearn')
                    ->where('name', $cleanTitle)
                    ->update([
                        'progress' => 100,
                        'status' => 'completed',
                        'updated_at' => now(),
                    ]);
            }
        });

        return redirect()->route('elearn.index')->with('success', 'Assignment submitted and your progress tracker has been marked complete!');
    }
}
