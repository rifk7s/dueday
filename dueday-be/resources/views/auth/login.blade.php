<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login</title>
</head>
<body>
    <h1>Login</h1>

    @if($errors->any())
        <div style="color: red;">
            <ul>
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="/login">
        @csrf
        <div>
            <label for="name">Name</label>
            <input id="name" name="name" type="text" required />
        </div>
        <div>
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required />
            <label style="margin-left:8px; font-size:0.9em;">
                <input type="checkbox" id="showPassword" onclick="togglePassword()"> Show
            </label>
        </div>
        <div>
            <button type="submit">Sign in</button>
        </div>
    </form>

    @env('local')
        <p>Seeded Elearn admin: <strong>Admin123 / Password123</strong></p>
    @endenv

    <script>
        function togglePassword() {
            var p = document.getElementById('password');
            p.type = p.type === 'password' ? 'text' : 'password';
        }
    </script>
</body>
</html>
