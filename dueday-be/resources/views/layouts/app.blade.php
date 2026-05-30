<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DueDay Admin</title>
  </head>
  <body>
    <header>
      @auth
        <div>
          Logged in as {{ auth()->user()->name }}
          <form method="POST" action="/logout" style="display:inline">
            @csrf
            <button type="submit">Logout</button>
          </form>
        </div>
      @endauth
    </header>

    <main>
      @yield('content')
    </main>
  </body>
</html>
