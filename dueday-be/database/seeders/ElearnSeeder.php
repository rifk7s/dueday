<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ElearnSeeder extends Seeder
{
    use WithoutModelEvents;

    private const ACADEMIC_YEAR = 2025;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('detail')->delete();
        DB::table('assessment')->delete();
        DB::table('study_plan_card')->delete();
        DB::table('opened_class')->delete();
        DB::table('reg_student')->delete();
        DB::table('subject')->delete();
        DB::table('admin')->delete();
        DB::table('major')->delete();
        DB::table('students')->delete();
        DB::table('title')->delete();

        DB::table('title')->insert([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'student'],
        ]);

        DB::table('major')->insert([
            ['id' => 1, 'name' => 'MAN'],
            ['id' => 2, 'name' => 'IMT'],
            ['id' => 3, 'name' => 'VCD'],
        ]);

        DB::table('admin')->insert([
            'id' => 1,
            'name' => 'Admin123',
            'title_id' => 1,
            'password' => Hash::make('Password123'),
        ]);

        $students = [
            [
                'id' => (string) Str::uuid(),
                'student_name' => 'MAN',
                'current_semester' => 1,
                'nim' => '0806010001',
                'major_id' => 1,
            ],
            [
                'id' => (string) Str::uuid(),
                'student_name' => 'Britney',
                'current_semester' => 2,
                'nim' => '0806022410020',
                'major_id' => 2,
            ],
            [
                'id' => (string) Str::uuid(),
                'student_name' => 'VCD',
                'current_semester' => 2,
                'nim' => '0806030001',
                'major_id' => 3,
            ],
        ];

        foreach ($students as $index => $student) {
            DB::table('students')->insert([
                'id' => $student['id'],
                'student_name' => $student['student_name'],
                'title_id' => 2,
                'current_semester' => $student['current_semester'],
                'nim' => $student['nim'],
                'password' => Hash::make('Password123'),
            ]);

            DB::table('reg_student')->insert([
                'id' => $index + 1,
                'student_id' => $student['id'],
                // student_year: cycle through 1..4 deterministically
                'student_year' => ($index % 4) + 1,
                'major_id' => $student['major_id'],
            ]);
        }

        $majorSubjects = [
            1 => ['Management Basics', 'Business Communication', 'Management Ethics'],
            2 => ['Programming Fundamentals', 'Database Systems', 'Web Development'],
            3 => ['Design Principles', 'Digital Illustration', 'Motion Graphics'],
        ];

        $fileNames = ['txt', 'pdf'];
        $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');
        $subjectId = 1;
        $openedClassId = 1;
        $studyPlanCardId = 1;
        $assessmentId = 1;
        $detailId = 1;

        foreach ($students as $studentIndex => $student) {
            $regStudentId = $studentIndex + 1;

            foreach ($majorSubjects[$student['major_id']] as $semesterIndex => $subjectName) {
                $semester = $semesterIndex + 1;
                $period = (string) self::ACADEMIC_YEAR.'_'.$semester;

                DB::table('subject')->insert([
                    'id' => $subjectId,
                    'name' => $subjectName,
                    'major_id' => $student['major_id'],
                    'semester' => $semester,
                    'sks' => 3,
                    'period' => $period,
                ]);

                DB::table('opened_class')->insert([
                    'id' => $openedClassId,
                    'subject_id' => $subjectId,
                    'parallel' => 'A',
                    'student_num' => 30,
                    'session' => 16,
                ]);

                DB::table('study_plan_card')->insert([
                    'id' => $studyPlanCardId,
                    'period' => $period,
                    'reg_student_id' => $regStudentId,
                    'opened_class_id' => $openedClassId,
                ]);

                DB::table('assessment')->insert([
                    'id' => $assessmentId,
                    'opened_class_id' => $openedClassId,
                    'title' => $subjectName.' Assignment',
                    'description' => 'Assignment for '.$student['student_name'].' in '.$subjectName,
                    'date' => now()->addDays($assessmentId)->toDateString(),
                    'time' => '09:00:00',
                ]);

                DB::table('detail')->insert([
                    'id' => $detailId,
                    'assessment_id' => $assessmentId,
                    'reg_student_id' => $regStudentId,
                    'file_name' => $fileNames[($detailId - 1) % count($fileNames)],
                    'nilai' => null,
                ]);

                // If there is a matching user in the `users` table (by nim or name),
                // create a corresponding Task row so assignments appear immediately
                // in the user's task list after seeding.
                $user = DB::table('users')
                    ->where('nim', $student['nim'])
                    ->orWhere('name', $student['student_name'])
                    ->first();

                if ($user) {
                    $taskData = [
                        'id' => (string) Str::uuid(),
                        'user_id' => $user->id,
                        'tag_id' => null,
                        'name' => $subjectName.' Assignment',
                        'due_date' => now()->addDays($assessmentId)->toDateString(),
                        'due_time' => '09:00:00',
                        'priority' => 'sedang', // Updated fallback to match requirement
                        'status' => 'ongoing',
                        'source' => 'elearn',
                        'description' => 'Assignment for '.$student['student_name'].' in '.$subjectName,
                        'progress' => 0,
                        'recurrence' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if ($hasElearnAssessmentId) {
                        $taskData['elearn_assessment_id'] = $assessmentId;
                    }

                    DB::table('tasks')->insert($taskData);
                }

                $subjectId++;
                $openedClassId++;
                $studyPlanCardId++;
                $assessmentId++;
                $detailId++;
            }
        }

        $extraOpenedClasses = [
            ['subject_id' => 1, 'parallel' => 'B'],
            ['subject_id' => 4, 'parallel' => 'B'],
        ];

        foreach ($extraOpenedClasses as $extraOpenedClass) {
            DB::table('opened_class')->insert([
                'id' => $openedClassId,
                'subject_id' => $extraOpenedClass['subject_id'],
                'parallel' => $extraOpenedClass['parallel'],
                'student_num' => 30,
                'session' => 16,
            ]);

            $openedClassId++;
        }
    }
}