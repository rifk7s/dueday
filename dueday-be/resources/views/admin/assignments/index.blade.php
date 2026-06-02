@extends('layouts.app')

@section('content')
<div class="elearn-wrapper">
    <div class="elearn-container">
        
        <div class="elearn-back-navigation">
            <a href="{{ route('admin.elearn.majors') }}" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-top; margin-right: 4px;">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Back to Majors
            </a>
        </div>
        
        <div class="elearn-header-block">
            <div>
                <h1 class="elearn-page-title">Assignments</h1>
                <p class="elearn-subtitle">Managing workspace for <span class="highlight">{{ $major->name }}</span></p>
            </div>
            <a href="{{ route('admin.elearn.assignments.create', ['major' => $major->id]) }}" class="elearn-btn elearn-btn-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 6px; vertical-align: text-top;">
                    <path d="M8 4a.5.5 0 0 1 .5 beloved;5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Create Assignment
            </a>
        </div>

        <div class="elearn-card">
            @if(count($assignments) > 0)
                <div class="elearn-table-responsive">
                    <table class="elearn-table">
                        <thead>
                            <tr>
                                <th>Assignment Title</th>
                                <th>Subject</th>
                                <th>Due Date</th>
                                <th>Due Time</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($assignments as $a)
                                <tr>
                                    <td class="font-weight-bold">
                                        <div class="assignment-title-wrapper">
                                            <span class="assignment-icon">📝</span>
                                            <span class="title-text">{{ $a->title }}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="elearn-badge-subject">{{ $a->subject_name }}</span>
                                    </td>
                                    <td>
                                        <span class="date-text">{{ $a->date ?? '-' }}</span>
                                    </td>
                                    <td>
                                        <span class="time-badge">{{ $a->time ? substr($a->time, 0, 5) : '-' }}</span>
                                    </td>
                                    <td class="text-right">
                                        <div class="action-buttons-group">
                                            <a href="{{ route('admin.elearn.assignments.edit', ['major' => $major->id, 'assessment' => $a->id]) }}" class="elearn-btn-sm elearn-btn-edit">
                                                Edit
                                            </a>
                                            <form method="POST" action="{{ route('admin.elearn.assignments.destroy', ['major' => $major->id, 'assessment' => $a->id]) }}" onsubmit="return confirm('Apakah Anda yakin ingin menghapus tugas ini?');" style="display:inline">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="elearn-btn-sm elearn-btn-delete">Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="elearn-empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>No Assignments Found</h3>
                    <p>There are currently no assignments listed for this major. Click the button above to create one.</p>
                </div>
            @endif
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
        max-width: 1000px;
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #dee2e6;
        padding-bottom: 16px;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 16px;
    }
    .elearn-page-title {
        font-size: 26px;
        font-weight: 700;
        color: #1d2124;
        margin: 0;
    }
    .elearn-subtitle {
        font-size: 15px;
        color: #6c757d;
        margin: 4px 0 0 0;
    }
    .elearn-subtitle .highlight {
        color: #d46300;
        font-weight: 600;
    }
    .elearn-card {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        padding: 12px;
    }
    .elearn-table-responsive {
        width: 100%;
        overflow-x: auto;
    }
    .elearn-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 14px;
    }
    .elearn-table th {
        background-color: #f1f3f5;
        color: #495057;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
        padding: 14px 16px;
        border-bottom: 2px solid #dee2e6;
    }
    .elearn-table td {
        padding: 16px;
        vertical-align: middle;
        border-bottom: 1px solid #e9ecef;
        color: #212529;
    }
    .elearn-table tbody tr:hover {
        background-color: #f8f9fa;
    }
    .assignment-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .assignment-icon {
        font-size: 16px;
    }
    .title-text {
        font-weight: 600;
        color: #0f4c81;
    }
    .elearn-badge-subject {
        display: inline-block;
        background-color: #e8f4fd;
        color: #0f4c81;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid #d2e9fb;
    }
    .time-badge {
        font-family: monospace;
        font-size: 13px;
        background: #f1f3f5;
        padding: 2px 6px;
        border-radius: 4px;
        color: #495057;
    }
    .font-weight-bold { font-weight: 600; }
    .text-right { text-align: right; }
    .elearn-btn {
        display: inline-block;
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        padding: 10px 20px;
        font-size: 14px;
        border-radius: 4px;
        transition: all 0.15s ease-in-out;
        text-decoration: none;
        cursor: pointer;
    }
    .elearn-btn-success {
        color: #fff;
        background-color: #d46300;
        border-color: #d46300;
    }
    .elearn-btn-success:hover {
        background-color: #b85600;
        border-color: #b85600;
    }
    .action-buttons-group {
        display: inline-flex;
        gap: 6px;
        justify-content: flex-end;
    }
    .elearn-btn-sm {
        display: inline-block;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 4px;
        text-decoration: none;
        text-align: center;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.1s ease;
    }
    .elearn-btn-edit {
        background-color: #e9ecef;
        color: #495057;
    }
    .elearn-btn-edit:hover {
        background-color: #dee2e6;
        color: #212529;
    }
    .elearn-btn-delete {
        background-color: #fff;
        color: #dc3545;
        border-color: #f5c6cb;
    }
    .elearn-btn-delete:hover {
        background-color: #dc3545;
        color: #fff;
        border-color: #dc3545;
    }
    .elearn-empty-state {
        text-align: center;
        padding: 50px 20px;
        color: #6c757d;
    }
    .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    .elearn-empty-state h3 {
        font-size: 18px;
        color: #343a40;
        margin: 0 0 8px 0;
    }
    .elearn-empty-state p {
        font-size: 14px;
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.5;
    }
</style>
@endsection