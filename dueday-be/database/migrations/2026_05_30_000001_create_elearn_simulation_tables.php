<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('title', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });

        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('student_name');
            $table->unsignedBigInteger('title_id')->nullable();
            $table->integer('current_semester')->nullable();
            $table->string('nim')->unique();

            $table->foreign('title_id')->references('id')->on('title')->nullOnDelete();
        });

        Schema::create('major', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });

        Schema::create('admin', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('title_id')->nullable();
            $table->string('password');

            $table->foreign('title_id')->references('id')->on('title')->nullOnDelete();
        });

        Schema::create('reg_student', function (Blueprint $table) {
            $table->id();
            $table->uuid('student_id');
            $table->integer('student_year')->nullable();
            $table->unsignedBigInteger('major_id')->nullable();

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('major_id')->references('id')->on('major')->nullOnDelete();
        });

        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('major_id')->nullable();
            $table->integer('semester')->nullable();
            $table->integer('sks')->nullable();
            $table->string('period')->nullable();

            $table->foreign('major_id')->references('id')->on('major')->nullOnDelete();
        });

        Schema::create('opened_class', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->string('parallel')->nullable();
            $table->integer('student_num')->nullable();
            $table->integer('session')->nullable();

            $table->foreign('subject_id')->references('id')->on('subject')->cascadeOnDelete();
        });

        Schema::create('study_plan_card', function (Blueprint $table) {
            $table->id();
            $table->string('period')->nullable();
            $table->unsignedBigInteger('reg_student_id');
            $table->unsignedBigInteger('opened_class_id');

            $table->foreign('reg_student_id')->references('id')->on('reg_student')->cascadeOnDelete();
            $table->foreign('opened_class_id')->references('id')->on('opened_class')->cascadeOnDelete();
        });

        Schema::create('assessment', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('opened_class_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('date')->nullable();
            $table->time('time')->nullable();

            $table->foreign('opened_class_id')->references('id')->on('opened_class')->cascadeOnDelete();
        });

        Schema::create('detail', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assessment_id');
            $table->unsignedBigInteger('reg_student_id');
            $table->string('file_name')->nullable();
            $table->decimal('nilai', 8, 2)->nullable();

            $table->foreign('assessment_id')->references('id')->on('assessment')->cascadeOnDelete();
            $table->foreign('reg_student_id')->references('id')->on('reg_student')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail');
        Schema::dropIfExists('assessment');
        Schema::dropIfExists('study_plan_card');
        Schema::dropIfExists('opened_class');
        Schema::dropIfExists('subject');
        Schema::dropIfExists('admin');
        Schema::dropIfExists('reg_student');
        Schema::dropIfExists('major');
        Schema::dropIfExists('students');
        Schema::dropIfExists('title');
    }
};
