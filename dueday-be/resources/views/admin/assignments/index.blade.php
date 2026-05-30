@extends('layouts.app')

@section('content')
    <div class="container">
        <h1>Assignments — {{ $major->name }}</h1>

        <a href="{{ route('admin.elearn.assignments.create', ['major' => $major->id]) }}">Create Assignment</a>

        <table>
            <thead>
                <tr><th>Title</th><th>Subject</th><th>Date</th><th>Time</th><th>Actions</th></tr>
            </thead>
            <tbody>
                @foreach($assignments as $a)
                    <tr>
                        <td>{{ $a->title }}</td>
                        <td>{{ $a->subject_name }}</td>
                        <td>{{ $a->date }}</td>
                        <td>{{ $a->time }}</td>
                        <td>
                            <a href="{{ route('admin.elearn.assignments.edit', ['major' => $major->id, 'assessment' => $a->id]) }}">Edit</a>
                            <form method="POST" action="{{ route('admin.elearn.assignments.destroy', ['major' => $major->id, 'assessment' => $a->id]) }}" style="display:inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit">Delete</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endsection
