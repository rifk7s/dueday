@extends('layouts.app')

@section('content')
<div class="elearn-wrapper">
    <div class="elearn-container">
        
        <div class="elearn-back-navigation">
            <a href="{{ route('admin.elearn.assignments', ['major' => $major->id]) }}" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-top; margin-right: 4px;">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Back to Assignments
            </a>
        </div>
        
        <div class="elearn-header-block">
            <h1 class="elearn-page-title">
                {{ isset($assessment) ? 'Edit' : 'Create' }} Assignment 
                <span class="elearn-subtitle">— {{ $major->name }}</span>
            </h1>
        </div>

        @if($errors->any())
            <div class="elearn-alert-danger">
                <div class="elearn-alert-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                </div>
                <ul class="elearn-error-list">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <div class="elearn-card">
            <form method="POST" action="{{ isset($assessment) ? route('admin.elearn.assignments.update', ['major' => $major->id, 'assessment' => $assessment->id]) : route('admin.elearn.assignments.store', ['major' => $major->id]) }}">
                @csrf
                @if(isset($assessment))
                    @method('PUT')
                @endif

                <div class="elearn-form-group">
                    <label class="elearn-label">Opened Class</label>
                    <div class="elearn-input-wrapper">
                        @if(isset($assessment))
                            <div class="elearn-readonly-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 6px; vertical-align: -1px;">
                                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                                </svg>
                                {{ $assessment->openedClass->subject->name ?? $assessment->subject_name ?? 'Assigned Course Class' }} (Parallel: {{ $assessment->openedClass->parallel ?? $assessment->parallel ?? 'N/A' }})
                            </div>
                            <input type="hidden" name="opened_class_id" value="{{ $assessment->opened_class_id }}" />
                        @else
                            <select name="opened_class_id" class="elearn-control" required>
                                <option value="">-- Choose Target Active Subject Course --</option>
                                @foreach($opened ?? [] as $o)
                                    <option value="{{ $o->id }}" {{ old('opened_class_id') == $o->id ? 'selected' : '' }}>
                                        {{ $o->subject_name ?? ($o->subject?->name ?? 'Course Model #' . $o->id) }} ({{ $o->parallel ?? 'N/A' }})
                                    </option>
                                @endforeach
                            </select>
                        @endif
                    </div>
                </div>

                <div class="elearn-form-group">
                    <label class="elearn-label">Assignment Title</label>
                    <div class="elearn-input-wrapper">
                        <input name="title" class="elearn-control assignment-title-input" value="{{ old('title', $assessment->title ?? '') }}" placeholder="e.g., Midterm Project Presentation Paper" required />
                    </div>
                </div>

                <div class="elearn-form-group">
                    <label class="elearn-label">Description & Instructions</label>
                    <div class="elearn-input-wrapper">
                        <textarea name="description" class="elearn-control elearn-textarea" placeholder="Provide complete instruction metrics, references, and criteria expectations for student submissions..." rows="5">{{ old('description', $assessment->description ?? '') }}</textarea>
                    </div>
                </div>

                <div class="elearn-form-row">
                    <div class="elearn-form-group col-half">
                        <label class="elearn-label">Due Date Cutoff</label>
                        <div class="elearn-input-wrapper">
                            <input type="date" name="date" class="elearn-control" value="{{ old('date', $assessment->date ?? '') }}" />
                        </div>
                    </div>

                    <div class="elearn-form-group col-half">
                        <label class="elearn-label">Due Time Limit</label>
                        <div class="elearn-input-wrapper">
                            <input type="time" name="time" class="elearn-control" value="{{ old('time', $assessment->time ?? '') }}" />
                        </div>
                    </div>
                </div>

                <div class="elearn-form-group">
                    <label class="elearn-label">Accepted Submission File Format Template Restriction</label>
                    <div class="elearn-input-wrapper">
                        <select name="file_name" class="elearn-control" required>
                            <option value="">-- Choose Enforced Format Rules Matrix --</option>
                            <option value="pdf" {{ (old('file_name', $assessment->file_name ?? '')) === 'pdf' ? 'selected' : '' }}>PDF Document Extension Format (.pdf)</option>
                            <option value="txt" {{ (old('file_name', $assessment->file_name ?? '')) === 'txt' ? 'selected' : '' }}>Plain Raw Text Input Workspace (.txt)</option>
                        </select>
                    </div>
                </div>

                <div class="elearn-form-actions">
                    <a href="{{ route('admin.elearn.assignments', ['major' => $major->id]) }}" class="elearn-btn elearn-btn-secondary">Cancel</a>
                    <button type="submit" class="elearn-btn elearn-btn-primary">Save Assignment Parameters</button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    body {
        background-color: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .elearn-wrapper {
        padding: 30px 15px 40px 15px;
        min-height: 100vh;
    }
    .elearn-container {
        max-width: 840px;
        margin: 0 auto;
    }
    .elearn-back-navigation {
        margin-bottom: 12px;
    }
    .back-link {
        color: #0f4c81;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        transition: color 0.15s ease;
    }
    .back-link:hover {
        color: #d46300;
        text-decoration: underline;
    }
    .elearn-header-block {
        border-bottom: 2px solid #dee2e6;
        padding-bottom: 16px;
        margin-bottom: 30px;
    }
    .elearn-page-title {
        font-size: 26px;
        font-weight: 700;
        color: #1d2124;
        margin: 0;
    }
    .elearn-subtitle {
        font-size: 18px;
        color: #6c757d;
        font-weight: 400;
    }
    .elearn-card {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        padding: 30px;
    }
    .elearn-form-group {
        margin-bottom: 24px;
    }
    .elearn-label {
        display: block;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 700;
        color: #d46300;
        margin-bottom: 8px;
    }
    .elearn-control {
        width: 100%;
        padding: 12px 16px;
        font-size: 14px;
        line-height: 1.5;
        color: #495057;
        background-color: #ffffff;
        border: 1px solid #ced4da;
        border-radius: 6px;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        box-sizing: border-box;
    }
    .elearn-control:focus {
        color: #495057;
        background-color: #fff;
        border-color: #0f4c81;
        outline: 0;
        box-shadow: 0 0 0 0.2rem rgba(15, 76, 129, 0.15);
    }
    /* Clean styles for the locked down field row */
    .elearn-readonly-badge {
        background-color: #e9ecef;
        color: #495057;
        border: 1px solid #ced4da;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 6px;
        display: flex;
        align-items: center;
        user-select: none;
    }
    .assignment-title-input {
        font-weight: 600;
        color: #1d2124;
    }
    .elearn-textarea {
        resize: vertical;
        font-family: inherit;
    }
    .elearn-form-row {
        display: flex;
        gap: 20px;
    }
    .col-half {
        flex: 1;
    }
    .elearn-form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #dee2e6;
        padding-top: 20px;
        margin-top: 30px;
    }
    .elearn-btn {
        display: inline-block;
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        padding: 10px 24px;
        font-size: 14px;
        line-height: 1.5;
        border-radius: 4px;
        transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
        text-decoration: none;
        cursor: pointer;
    }
    .elearn-btn-primary {
        color: #fff;
        background-color: #0f4c81;
        border-color: #0f4c81;
    }
    .elearn-btn-primary:hover {
        background-color: #0b3a62;
        border-color: #0b3a62;
    }
    .elearn-btn-secondary {
        color: #495057;
        background-color: #e9ecef;
        border-color: #e9ecef;
    }
    .elearn-btn-secondary:hover {
        background-color: #dae0e5;
        border-color: #d3d9df;
    }
    .elearn-alert-danger {
        display: flex;
        align-items: flex-start;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 16px;
        border-radius: 6px;
        margin-bottom: 24px;
        gap: 12px;
    }
    .elearn-alert-icon {
        flex-shrink: 0;
        margin-top: 2px;
    }
    .elearn-error-list {
        margin: 0;
        padding-left: 20px;
        font-size: 14px;
    }
    @media (max-width: 576px) {
        .elearn-form-row {
            flex-direction: column;
            gap: 0;
        }
    }
</style>
@endsection