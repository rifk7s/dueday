<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Elearn — Sign In</title>
    <style>
        /* Elearn Corporate Light Brand Theme */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8f9fa;
            color: #212529;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .login-wrapper {
            width: 100%;
            max-width: 420px;
            padding: 20px;
            box-sizing: border-box;
        }

        /* Branding Core Container Block */
        .login-card {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
            padding: 35px 30px;
            position: relative;
            overflow: hidden;
        }

        /* Top Accent Banner Bar line */
        .card-accent-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #0f4c81 0%, #d46300 100%);
        }

        /* Header elements section */
        .login-header {
            text-align: center;
            margin-bottom: 28px;
        }

        .login-logo {
            font-size: 28px;
            font-weight: 800;
            color: #0f4c81;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
        }

        .login-logo span {
            color: #d46300;
        }

        .login-subtitle {
            font-size: 14px;
            color: #6c757d;
            margin: 0;
        }

        /* Form component input rows */
        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        .elearn-label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #495057;
            margin-bottom: 6px;
        }

        .elearn-control {
            width: 100%;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 1.5;
            color: #212529;
            background-color: #ffffff;
            border: 1px solid #ced4da;
            border-radius: 6px;
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            box-sizing: border-box;
        }

        .elearn-control:focus {
            outline: none;
            border-color: #0f4c81;
            box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.12);
        }

        /* Password visibility checkbox panel inline config */
        .password-toggle-container {
            display: flex;
            align-items: center;
            margin-top: 8px;
            user-select: none;
        }

        .password-toggle-container input[type="checkbox"] {
            margin: 0 6px 0 0;
            cursor: pointer;
            width: 14px;
            height: 14px;
        }

        .password-toggle-container label {
            font-size: 13px;
            color: #6c757d;
            cursor: pointer;
        }
        
        .password-toggle-container label:hover {
            color: #212529;
        }

        /* Submit Button mechanics styling */
        .elearn-btn-submit {
            width: 100%;
            background-color: #0f4c81;
            color: #ffffff;
            font-weight: 600;
            font-size: 15px;
            padding: 12px 24px;
            border: 1px solid transparent;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.15s ease-in-out;
            margin-top: 8px;
        }

        .elearn-btn-submit:hover {
            background-color: #0b3a62;
        }

        /* Error validation lists styles block layout */
        .elearn-alert-danger {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 14px;
            border-radius: 6px;
            margin-bottom: 20px;
        }

        .elearn-error-list {
            margin: 0;
            padding-left: 18px;
            font-size: 13px;
            font-weight: 500;
        }
    </style>
</head>
<body>

    <div class="login-wrapper">
        <div class="login-card">
            <div class="card-accent-bar"></div>
            
            <div class="login-header">
                <div class="login-logo">E<span>learn</span></div>
                <p class="login-subtitle">Sign in to manage your course workspace</p>
            </div>

            @if($errors->any())
                <div class="elearn-alert-danger">
                    <ul class="elearn-error-list">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="/login">
                @csrf
                
                <div class="form-group">
                    <label for="name" class="elearn-label">Name</label>
                    <input id="name" name="name" type="text" class="elearn-control" placeholder="Enter your registered name" required autofocus />
                </div>
                
                <div class="form-group">
                    <label for="password" class="elearn-label">Password</label>
                    <input id="password" name="password" type="password" class="elearn-control" placeholder="Enter your account password" required />
                    
                    <div class="password-toggle-container">
                        <input type="checkbox" id="showPassword" onclick="togglePassword()">
                        <label for="showPassword">Show Password</label>
                    </div>
                </div>

                <div>
                    <button type="submit" class="elearn-btn-submit">Sign In</button>
                </div>
            </form>

        </div>
    </div>

    <script>
        function togglePassword() {
            var p = document.getElementById('password');
            p.type = p.type === 'password' ? 'text' : 'password';
        }
    </script>
</body>
</html>