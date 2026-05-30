@extends('layouts.app')

@section('content')
    <div class="container">
        <h1>{{ isset($assessment) ? 'Edit' : 'Create' }} Assignment — {{ $major->name }}</h1>

        <form method="POST" action="{{ isset($assessment) ? route('admin.elearn.assignments.update', ['major' => $major->id, 'assessment' => $assessment->id]) : route('admin.elearn.assignments.store', ['major' => $major->id]) }}">
            @csrf
            @if(isset($assessment))
                @method('PUT')
            @endif

            <div>
                <label>Opened Class</label>
                <select name="opened_class_id">
                    @foreach($opened ?? [] as $o)
                        <option value="{{ $o->id }}">{{ $o->subject_name }} ({{ $o->parallel }})</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label>Title</label>
                <input name="title" value="{{ $assessment->title ?? old('title') }}" />
            </div>

            <div>
                <label>Description</label>
                <textarea name="description">{{ $assessment->description ?? old('description') }}</textarea>
            </div>

            <div>
                <label>Date</label>
                <input type="date" name="date" value="{{ $assessment->date ?? old('date') }}" />
            </div>

            <div>
                <label>Time</label>
                <input type="time" name="time" value="{{ $assessment->time ?? old('time') }}" />
            </div>

            <div>
                <label>File Name</label>
                <select name="file_name" required>
                    <option value="">-- Select File Type --</option>
                    <option value="pdf" {{ (old('file_name') ?? $assessment->file_name ?? '') === 'pdf' ? 'selected' : '' }}>PDF</option>
                    <option value="txt" {{ (old('file_name') ?? $assessment->file_name ?? '') === 'txt' ? 'selected' : '' }}>TXT</option>
                </select>
            </div>

            <button type="submit">Save</button>
        </form>
    </div>
@endsection
