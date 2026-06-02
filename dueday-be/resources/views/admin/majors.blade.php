@extends('layouts.app')

@section('content')
<div class="elearn-wrapper">
    <div class="elearn-container">
        
        <div class="elearn-back-navigation">
            <a href="{{ url('/dashboard') }}" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-top; margin-right: 4px;">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Back to Admin Dashboard
            </a>
        </div>

        <div class="elearn-header-block">
            <div>
                <h1 class="elearn-page-title">Academic Majors</h1>
                <p class="elearn-subtitle">Select a major department to view and manage course assignment sync timelines.</p>
            </div>
        </div>

        @if(count($majors) > 0)
            <div class="elearn-grid">
                @foreach($majors as $major)
                    <div class="elearn-major-card">
                        <div class="card-accent-bar"></div>
                        <div class="card-body">
                            <div class="major-icon-wrapper">
                                <span class="major-icon">🎓</span>
                            </div>
                            <h3 class="major-title">{{ $major->name }}</h3>
                            <p class="major-meta">Elearn Management Hub</p>
                            
                            <a href="{{ route('admin.elearn.assignments', ['major' => $major->id]) }}" class="elearn-card-link">
                                Manage Assignments
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="arrow-icon" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="elearn-empty-state">
                <div class="empty-icon">📂</div>
                <h3>No Majors Listed</h3>
                <p>There are currently no active academic majors registered within the system database configuration fields.</p>
            </div>
        @endif

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
        border-bottom: 2px solid #dee2e6;
        padding-bottom: 16px;
        margin-bottom: 35px;
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
        margin: 6px 0 0 0;
        line-height: 1.5;
    }
    .elearn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
    }
    .elearn-major-card {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .elearn-major-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
    }
    .card-accent-bar {
        height: 5px;
        background-color: #0f4c81;
    }
    .elearn-major-card:nth-child(even) .card-accent-bar {
        background-color: #d46300;
    }
    .card-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }
    .major-icon-wrapper {
        background-color: #f1f3f5;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
    }
    .major-icon {
        font-size: 20px;
    }
    .major-title {
        font-size: 18px;
        font-weight: 700;
        color: #212529;
        margin: 0 0 6px 0;
        line-height: 1.3;
    }
    .major-meta {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #868e96;
        font-weight: 600;
        margin: 0 0 24px 0;
    }
    .elearn-card-link {
        margin-top: auto;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        color: #0f4c81;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        border-top: 1px solid #f1f3f5;
        padding-top: 14px;
        transition: color 0.1s ease;
    }
    .elearn-major-card:hover .elearn-card-link {
        color: #d46300;
    }
    .arrow-icon {
        transform: translateX(0);
        transition: transform 0.2s ease;
    }
    .elearn-card-link:hover .arrow-icon {
        transform: translateX(4px);
    }
    .elearn-empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6c757d;
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
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
        max-width: 420px;
        margin: 0 auto;
        line-height: 1.5;
    }
</style>
@endsection