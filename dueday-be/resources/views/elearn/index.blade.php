<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Elearn</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 24px; background: #111; color: #f5f5f5; }
        a { color: #7db7ff; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .card { background: #1b1b1b; border: 1px solid #333; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .muted { color: #b5b5b5; }
        textarea, input[type="file"] { width: 100%; max-width: 640px; }
        textarea { min-height: 120px; }
        .assignment { margin-top: 12px; padding-top: 12px; border-top: 1px solid #333; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #2a2a2a; font-size: 12px; }
        .submitted { color: #8dd18d; }
        .not-submitted { color: #ffcc80; }
        button { margin-top: 8px; padding: 8px 12px; cursor: pointer; }
        .hidden { display: none; }
        .submission-panel { margin-top: 14px; padding-top: 14px; border-top: 1px solid #333; }
        .alert-success { background: #1c3d1c; border: 1px solid #2e662e; color: #a3e0a3; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="topbar">
        <div>
            <h1>Welcome to Elearn</h1>
            <p class="muted">Logged in as <strong>{{ auth()->user()->name }}</strong> (role: {{ method_exists(auth()->user(), 'isAdmin') && auth()->user()->isAdmin() ? 'admin' : 'student' }})</p>
        </div>
        <div>
            <a href="/dashboard" style="margin-right: 12px;">Dashboard</a>
            <form method="POST" action="/logout" style="display:inline">
                @csrf
                <button type="submit">Logout</button>
            </form>
        </div>
    </div>

    @if(session('success'))
        <div class="alert-success">
            {{ session('success') }}
        </div>
    @endif

    @if(method_exists(auth()->user(), 'isAdmin') && auth()->user()->isAdmin())
        <div class="card">
            <p>You are logged in as admin. Use the dashboard to manage Elearn assignments.</p>
            <p><a href="{{ route('admin.elearn.majors') }}">Go to Admin Majors</a></p>
        </div>
    @else
        <div class="card">
            <p>Your assignments are listed below. Submit using the format required by each assignment.</p>
        </div>

        @forelse($assignments as $assignment)
            @php
                $assessment = $assignment->assessment;
                $subject = $assessment?->openedClass?->subject;
                $submissionType = $assignment->file_name === 'txt' ? 'text' : 'file';
                $isSubmitted = filled($assignment->submitted_at);
            @endphp
            <div class="card assignment">
                <h2>{{ $assessment?->title ?? 'Assignment' }}</h2>
                <p class="muted">
                    Subject: <strong>{{ $subject?->name ?? 'N/A' }}</strong>
                    | Parallel: <strong>{{ $assessment?->openedClass?->parallel ?? 'N/A' }}</strong>
                    | Required: <strong>{{ strtoupper((string) $assignment->file_name) }}</strong>
                </p>
                <p>{{ $assessment?->description }}</p>
                <p>
                    <span class="status {{ $isSubmitted ? 'submitted' : 'not-submitted' }}">
                        {{ $isSubmitted ? 'Submitted' : 'Not submitted' }}
                    </span>
                </p>

                @if($isSubmitted)
                    @if($assignment->submission_text)
                        <p><strong>Your typed answer:</strong></p>
                        <pre style="white-space:pre-wrap;background:#0f0f0f;padding:12px;border-radius:8px;">{{ $assignment->submission_text }}</pre>
                    @endif

                    @if($assignment->submission_file_path)
                        <p><a href="{{ asset('storage/'.$assignment->submission_file_path) }}" target="_blank">Open uploaded PDF</a></p>
                    @endif
                @endif

                <button type="button" onclick="toggleSubmissionPanel('{{ $assignment->id }}')">
                    {{ $isSubmitted ? 'Resubmit Submission' : 'Add Submission' }}
                </button>

                <form id="submission-form-{{ $assignment->id }}" class="submission-panel hidden" method="POST" action="{{ route('elearn.details.submit', ['detail' => $assignment->id]) }}" enctype="multipart/form-data">
                    @csrf

                    @if($submissionType === 'text')
                        <label for="submission_text_{{ $assignment->id }}"><strong>Type your answer:</strong></label><br>
                        <textarea id="submission_text_{{ $assignment->id }}" name="submission_text" required>{{ old('submission_text', $assignment->submission_text ?? '') }}</textarea>
                    @else
                        <label for="submission_file_{{ $assignment->id }}"><strong>Upload PDF:</strong></label><br>
                        <input id="submission_file_{{ $assignment->id }}" type="file" name="submission_file" accept="application/pdf" required>
                    @endif
                    <br>
                    <button type="submit">Submit Assignment</button>
                </form>
            </div>
        @empty
            <div class="card">
                <p>No assignments found.</p>
            </div>
        @endforelse
    @endif

    <script>
        function toggleSubmissionPanel(id) {
            const panel = document.getElementById(`submission-form-${id}`);
            if (!panel) return;

            panel.classList.toggle('hidden');
        }
    </script>
</body>
</html>