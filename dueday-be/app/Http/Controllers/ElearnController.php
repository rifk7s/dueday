<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
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

        $taskOwnerIds = collect([$user->id]);

        if (! empty($user->nim)) {
            $taskOwnerIds = $taskOwnerIds->merge(
                DB::table('users')
                    ->where('nim', $user->nim)
                    ->pluck('id')
            );
        }

        $taskOwnerIds = $taskOwnerIds
            ->filter()
            ->unique()
            ->values();

        // Validate before opening the transaction so a validation failure never
        // leaves a half-stored upload behind.
        if ($detail->file_name === 'txt') {
            $data = $request->validate([
                'submission_text' => 'required|string',
            ]);
        } else {
            $data = $request->validate([
                'submission_file' => 'required|file|mimes:pdf|max:12288', // Max 12MB limit safety cap
            ]);
        }

        // Store the new upload outside the transaction. Filesystem writes are not
        // transactional, so we keep the transaction body limited to DB writes and
        // defer deleting the replaced file until after a successful commit.
        $oldPath = $detail->submission_file_path;
        $newPath = null;
        if ($detail->file_name !== 'txt') {
            $newPath = $data['submission_file']->store('elearn_submissions', 'public');
        }

        try {
            DB::transaction(function () use ($detail, $detailId, $assessment, $taskOwnerIds, $data, $newPath) {

                // 1. Persist the submission for this detail row.
                if ($detail->file_name === 'txt') {
                    DB::table('detail')->where('id', $detailId)->update([
                        'submission_text' => $data['submission_text'],
                        'submission_file_path' => null,
                        'submitted_at' => now(),
                    ]);
                } else {
                    DB::table('detail')->where('id', $detailId)->update([
                        'submission_file_path' => $newPath,
                        'submission_text' => null,
                        'submitted_at' => now(),
                    ]);
                }

                // 2. Mark this user's matching elearn task as complete.
                $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');
                $cleanTitle = trim($assessment->title);

                $taskQuery = Task::query()->whereIn('user_id', $taskOwnerIds);

                if ($hasElearnAssessmentId) {
                    $taskQuery->where(function ($query) use ($detail, $assessment, $cleanTitle) {
                        $query->where('elearn_assessment_id', $detail->assessment_id)
                            ->orWhere(function ($legacyQuery) use ($assessment, $cleanTitle) {
                                // Legacy fallback: only target rows that predate the stable
                                // id column, otherwise a sibling task tagged to a different
                                // assessment but sharing name/description/date is also completed.
                                $legacyQuery
                                    ->whereNull('elearn_assessment_id')
                                    ->where('source', 'elearn')
                                    ->where('name', $cleanTitle)
                                    ->where('description', $assessment->description);

                                $this->scopeToAssessmentDate($legacyQuery, $assessment->date);
                            });
                    });
                } else {
                    $taskQuery->where('source', 'elearn')
                        ->where('name', $cleanTitle)
                        ->where('description', $assessment->description);

                    $this->scopeToAssessmentDate($taskQuery, $assessment->date);
                }

                $taskQuery->update([
                    'progress' => 100,
                    'status' => 'completed',
                    'updated_at' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            // The DB never committed, so discard the orphaned upload we stored above.
            if ($newPath) {
                Storage::disk('public')->delete($newPath);
            }

            throw $e;
        }

        // Commit succeeded: now it is safe to remove the file we replaced (covers
        // both a PDF overwrite and a txt re-submission that cleared a previous file).
        if ($oldPath && $oldPath !== $newPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return redirect()->route('elearn.index')->with('success', 'Assignment submitted and your progress tracker has been marked complete!');
    }

    /**
     * Constrain a task query to the assessment's due date. Assessments may have a
     * null date, where a plain `whereDate` comparison against null never matches,
     * so we match a null `due_date` explicitly instead.
     */
    private function scopeToAssessmentDate(Builder $query, ?string $date): void
    {
        if ($date) {
            $query->whereDate('due_date', $date);
        } else {
            $query->whereNull('due_date');
        }
    }
}
