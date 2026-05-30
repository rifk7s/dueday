@extends('layouts.app')

@section('content')
    <div class="container">
        <h1>Majors</h1>
        <ul>
            @foreach($majors as $major)
                <li><a href="{{ route('admin.elearn.assignments', ['major' => $major->id]) }}">{{ $major->name }}</a></li>
            @endforeach
        </ul>
    </div>
@endsection
