@extends('layouts.app')

@section('content')
<div class="elearn-wrapper">
    <div class="elearn-container">
        
        <div class="elearn-header-block">
            <div>
                <h1 class="elearn-page-title">Admin Dashboard</h1>
                <p class="elearn-subtitle">Welcome back, <span class="highlight">{{ $user->name }}</span>. Select a management workspace module below.</p>
            </div>
        </div>

        <div class="elearn-grid">
            
            <div class="elearn-module-card project-hub">
                <div class="card-accent-bar blue"></div>
                <div class="card-body">
                    <div class="module-icon-wrapper blue-bg">
                        <span class="module-icon">📚</span>
                    </div>
                    <h3 class="module-title">Elearn Management</h3>
                    <p class="module-desc">Configure academic majors, monitor student courses, and manage active assignment sync pipelines.</p>
                    
                    <a href="{{ route('admin.elearn.majors') }}" class="elearn-card-link">
                        Manage Elearn
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="arrow-icon" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                        </svg>
                    </a>
                </div>
            </div>

            <div class="elearn-module-card payments-hub">
                <div class="card-accent-bar amber"></div>
                <div class="card-body">
                    <div class="module-icon-wrapper amber-bg">
                        <span class="module-icon">💳</span>
                    </div>
                    <h3 class="module-title">Financial Gateway</h3>
                    <p class="module-desc">Review inbound student transaction entries, payment confirmations, and billing structures.</p>
                    
                    <a href="{{ route('fakepay.index') }}" class="elearn-card-link">
                        Manage Payments
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="arrow-icon" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                        </svg>
                    </a>
                </div>
            </div>

        </div>

    </div>
</div>

<style>
    body {
        background-color: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .elearn-wrapper {
        padding: 40px 15px;
        min-height: 100vh;
    }
    .elearn-container {
        max-width: 900px;
        margin: 0 auto;
    }
    
    /* Header components */
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
    }
    .elearn-subtitle .highlight {
        color: #0f4c81;
        font-weight: 700;
    }
    
    /* Dual-column grid setup */
    .elearn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 28px;
    }
    
    /* Interactive Dashboard Modules styling */
    .elearn-module-card {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .elearn-module-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
    }
    
    /* Adaptive color brand bars */
    .card-accent-bar.blue { background-color: #0f4c81; }
    .card-accent-bar.amber { background-color: #d46300; }
    .card-accent-bar { height: 5px; }
    
    .card-body {
        padding: 26px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }
    
    /* Icon wrap badges */
    .module-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 18px;
    }
    .module-icon-wrapper.blue-bg { background-color: #e8f4fd; }
    .module-icon-wrapper.amber-bg { background-color: #fff3e0; }
    .module-icon { font-size: 22px; }
    
    .module-title {
        font-size: 19px;
        font-weight: 700;
        color: #212529;
        margin: 0 0 8px 0;
    }
    .module-desc {
        font-size: 14px;
        color: #6c757d;
        line-height: 1.5;
        margin: 0 0 24px 0;
    }
    
    /* Action Card Link styles */
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
        padding-top: 16px;
        transition: color 0.15s ease;
    }
    .project-hub:hover .elearn-card-link { color: #0f4c81; }
    .payments-hub:hover .elearn-card-link { color: #d46300; }
    
    .arrow-icon {
        transform: translateX(0);
        transition: transform 0.2s ease;
    }
    .elearn-card-link:hover .arrow-icon {
        transform: translateX(4px);
    }
</style>
@endsection