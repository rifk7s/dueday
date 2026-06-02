<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Elearn — Student Dashboard</title>
    <style>
        /* Elearn LMS Modern Light Theme Palette */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            padding: 0; 
            margin: 0;
            background-color: #f8f9fa; 
            color: #212529; 
            line-height: 1.5;
        }
        
        .elearn-wrapper {
            max-width: 1040px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* Topbar and Identity Navigation Headers */
        .elearn-topbar { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #dee2e6; 
            padding-bottom: 20px; 
            margin-bottom: 35px;
            flex-wrap: wrap;
            gap: 16px;
        }
        .elearn-title-group h1 {
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 4px 0;
            color: #1d2124;
            letter-spacing: -0.5px;
        }
        .muted { color: #6c757d; font-size: 14px; margin: 0; }
        .muted strong { color: #212529; }
        
        /* Interactive Link Elements */
        .elearn-nav-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .elearn-link { 
            color: #0f4c81; 
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: color 0.15s ease;
        }
        .elearn-link:hover { color: #d46300; text-decoration: underline; }
        
        /* Master Container block card definitions */
        .elearn-card { 
            background: #ffffff; 
            border: 1px solid #e9ecef; 
            border-radius: 12px; 
            padding: 24px; 
            margin-bottom: 24px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }
        
        /* Assignment specific layout adjustments */
        .assignment-card { 
            position: relative;
            border-left: 4px solid #6c757d;
            transition: transform 0.15s ease;
        }
        .assignment-card.status-submitted {
            border-left-color: #28a745; /* Green line marker for complete status */
        }
        .assignment-card.status-pending {
            border-left-color: #d46300; /* Amber marker line for unsubmitted items */
        }
        
        .assignment-card h2 {
            font-size: 20px;
            font-weight: 700;
            color: #212529;
            margin: 0 0 8px 0;
        }
        
        /* Dynamic Badges Framework */
        .meta-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }
        .elearn-badge {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            background: #f1f3f5;
            color: #495057;
            border: 1px solid #dee2e6;
        }
        .elearn-badge .highlight { color: #0f4c81; }

        .assignment-desc {
            color: #495057;
            font-size: 15px;
            margin: 0 0 20px 0;
            background: #f8f9fa;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        /* Status Pills components setup */
        .status-pill { 
            display: inline-flex; 
            align-items: center;
            gap: 6px;
            padding: 4px 12px; 
            border-radius: 999px; 
            font-size: 12px; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-pill.submitted { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .status-pill.not-submitted { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
        
        /* Text typed file response render blocks */
        .submission-preview-box {
            margin: 16px 0;
            padding: 16px;
            background: #f1f3f5;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .submission-preview-box p {
            margin: 0 0 8px 0;
            font-size: 13px;
            font-weight: 600;
            color: #6c757d;
        }
        .code-render { 
            white-space: pre-wrap; 
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            color: #212529;
            margin: 0;
        }
        
        /* Form inputs control elements fields customization */
        .submission-panel { 
            margin-top: 20px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
        }
        .submission-panel label {
            display: block;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6c757d;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .elearn-textarea { 
            width: 100%; 
            max-width: 100%;
            min-height: 140px; 
            background: #ffffff;
            border: 1px solid #ced4da;
            border-radius: 8px;
            padding: 12px;
            color: #212529;
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
            resize: vertical;
        }
        .elearn-textarea:focus, .elearn-file-input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 0.2s rgba(0, 123, 255, 0.25);
        }
        .elearn-file-input {
            width: 100%;
            max-width: 100%;
            background: #ffffff;
            border: 1px solid #ced4da;
            border-radius: 8px;
            padding: 10px;
            color: #495057;
            box-sizing: border-box;
        }
        
        /* Form Action and Toggle Buttons layout setups */
        .elearn-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            padding: 10px 20px;
            border-radius: 6px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            text-decoration: none;
        }
        .elearn-btn-primary { background-color: #0f4c81; color: #ffffff; }
        .elearn-btn-primary:hover { background-color: #0b3a62; }
        
        .elearn-btn-secondary { background-color: #e9ecef; color: #495057; border-color: #e9ecef; }
        .elearn-btn-secondary:hover { background-color: #dae0e5; }
        
        .elearn-btn-action-toggle {
            background-color: transparent;
            color: #0f4c81;
            border: 1px solid #0f4c81;
            margin-top: 16px;
        }
        .elearn-btn-action-toggle:hover {
            background-color: rgba(15, 76, 129, 0.05);
            color: #d46300;
            border-color: #d46300;
        }

        .hidden { display: none !important; }
        
        /* Banner validation popups context configurations */
        .alert-success { 
            background: #e8f4fd; 
            border: 1px solid #d2e9fb; 
            color: #0f4c81; 
            padding: 16px; 
            border-radius: 8px; 
            margin-bottom: 24px; 
            font-size: 14px;
            font-weight: 600;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="elearn-wrapper">
        
        <div class="elearn-topbar">
            <div class="elearn-title-group">
                <h1>Welcome to Elearn</h1>
                <p class="muted">Logged in as <strong>{{ auth()->user()->name }}</strong> (role: <strong>{{ method_exists(auth()->user(), 'isAdmin') && auth()->user()->isAdmin() ? 'admin' : 'student' }}</strong>)</p>
            </div>
            <div class="elearn-nav-actions">
                <a href="/dashboard" class="elearn-link">Dashboard</a>
                <form method="POST" action="/logout" style="display:inline">
                    @csrf
                    <button type="submit" class="elearn-btn elearn-btn-secondary" style="padding: 6px 14px; font-size: 13px;">Logout</button>
                </form>
            </div>
        </div>

        @if(session('success'))
            <div class="alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if(method_exists(auth()->user(), 'isAdmin') && auth()->user()->isAdmin())
            <div class="elearn-card">
                <p style="margin: 0 0 12px 0;">You are logged in as administrator. Use the main management workspace channels to alter assignment configuration matrices.</p>
                <a href="{{ route('admin.elearn.majors') }}" class="elearn-btn elearn-btn-primary">Go to Admin Majors Workspace</a>
            </div>
        @else
            <div class="elearn-card" style="background: linear-gradient(135deg, #ffffff 0%, #f1f3f5 100%);">
                <p style="margin:0; font-size:15px; color:#495057;">Your assigned timelines are detailed below. Ensure files align directly with formatting restrictions required by your coordinator panels prior to processing sync commands.</p>
            </div>

            @forelse($assignments as $assignment)
                @php
                    $assessment = $assignment->assessment;
                    $subject = $assessment?->openedClass?->subject;
                    $submissionType = $assignment->file_name === 'txt' ? 'text' : 'file';
                    $isSubmitted = filled($assignment->submitted_at);
                @endphp
                
                <div class="elearn-card assignment-card {{ $isSubmitted ? 'status-submitted' : 'status-pending' }}">
                    <h2>{{ $assessment?->title ?? 'Assignment' }}</h2>
                    
                    <div class="meta-container">
                        <div class="elearn-badge">Subject: <span class="highlight">{{ $subject?->name ?? 'N/A' }}</span></div>
                        <div class="elearn-badge">Parallel: <span class="highlight">{{ $assessment?->openedClass?->parallel ?? 'N/A' }}</span></div>
                        <div class="elearn-badge">Required: <span class="highlight">{{ strtoupper((string) $assignment->file_name) }}</span></div>
                    </div>
                    
                    @if($assessment?->description)
                        <div class="assignment-desc">
                            {{ $assessment->description }}
                        </div>
                    @endif
                    
                    <div style="margin-bottom: 8px;">
                        <span class="status-pill {{ $isSubmitted ? 'submitted' : 'not-submitted' }}">
                            {{ $isSubmitted ? '✓ Submitted' : '⚠ Not submitted' }}
                        </span>
                    </div>

                    @if($isSubmitted)
                        @if($assignment->submission_text)
                            <div class="submission-preview-box">
                                <p>Your active text response submission payload:</p>
                                <pre class="code-render">{{ $assignment->submission_text }}</pre>
                            </div>
                        @endif

                        @if($assignment->submission_file_path)
                            <div style="margin: 14px 0;">
                                <a href="{{ asset('storage/'.$assignment->submission_file_path) }}" class="elearn-link" target="_blank" style="display: inline-flex; align-items: center; gap: 4px;">
                                    📎 Open Uploaded PDF Document Link
                                </a>
                            </div>
                        @endif
                    @endif

                    <button type="button" class="elearn-btn elearn-btn-action-toggle" onclick="toggleSubmissionPanel('{{ $assignment->id }}')">
                        {{ $isSubmitted ? 'Modify / Resubmit Work' : 'Add Submission File' }}
                    </button>

                    <form id="submission-form-{{ $assignment->id }}" class="submission-panel hidden" method="POST" action="{{ route('elearn.details.submit', ['detail' => $assignment->id]) }}" enctype="multipart/form-data">
                        @csrf

                        @if($submissionType === 'text')
                            <div style="margin-bottom: 16px;">
                                <label for="submission_text_{{ $assignment->id }}">Type your text response below:</label>
                                <textarea id="submission_text_{{ $assignment->id }}" name="submission_text" class="elearn-textarea" placeholder="Input your code or text response block details here..." required>{{ old('submission_text', $assignment->submission_text ?? '') }}</textarea>
                            </div>
                        @else
                            <div style="margin-bottom: 16px;">
                                <label for="submission_file_{{ $assignment->id }}">Select PDF attachment package file:</label>
                                <input id="submission_file_{{ $assignment->id }}" type="file" name="submission_file" class="elearn-file-input" accept="application/pdf" required>
                            </div>
                        @endif
                        
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button type="submit" class="elearn-btn elearn-btn-primary">Submit to Core Workspace</button>
                            <button type="button" class="elearn-btn elearn-btn-secondary" onclick="toggleSubmissionPanel('{{ $assignment->id }}')">Cancel</button>
                        </div>
                    </form>
                </div>
            @empty
                <div class="elearn-card empty-state">
                    <p style="margin: 0; font-size: 16px;">No pending or ongoing assignments are currently attached to your account profile layout stream.</p>
                </div>
            @endforelse
        @endif
    </div>

    <script>
        function toggleSubmissionPanel(id) {
            const panel = document.getElementById(`submission-form-${id}`);
            if (!panel) return;

            panel.classList.toggle('hidden');
        }
    </script>
</body>
</html>