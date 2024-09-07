<?php
include ('../navbar.php');
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login into Backend</title>
    <link rel="stylesheet" href="../css/rubStyle.css">
</head>
<body>
<div id="adminPage" class="adminPage">
    <h1 style="color:white; text-align: center">💀💀You will find Admin-Login soon, Padawan 💀💀</h1>
    <div class="loginContainer">
        <form id="loginForm" action="https://rubizockt.de:3000/auth/login" method="POST">
            <input type="text" name="username" placeholder="username" required><br>
            <input type="password" name="password" placeholder="password" required><br>
            <button type="submit">Login</button>
            <button type="reset">Reset</button><br>
        </form><br>
    </div>
</div>

<script>
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Verhindert die Standard-Formular-Übermittlung

        const formData = new FormData(event.target);
        const response = await fetch(event.target.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.login === 'true') {
            window.location.href = 'edit.php'; // Weiterleitung zur edit.php
        } else {
            alert('Benutzername oder Passwort falsch.');
        }
    });
</script>
</body>
</html>
