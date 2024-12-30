<?php
include('../navbar.php'); 
require('../creds.php');

$conn = sqlsrv_connect($servername, array("UID" => $username, "PWD" => $password, "Database" => $dbname, "TrustServerCertificate" => true));

if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}


// Passwort-Überprüfung
$correctPassword = "n3wp0st."; // Setze hier dein sicheres Passwort

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Überprüfe das Passwort
    if ($_POST['password'] === $correctPassword) {
        // Daten aus dem Formular abrufen
        $titel = $_POST['titel'];
        $content = $_POST['content'];
        $imgUrl = $_POST['imgUrl'];
        $mediaType = $_POST['mediaType'];
        $tags = $_POST['tags'];

        // SQL-Insert-Query
        $insertQuery = "INSERT INTO [rzde].[dbo].[tblPostings] (txtTitel, txtContent, txtLinkUrl, txtMediaType, arrTags, dateErstellt_am) 
                        VALUES (?, ?, ?, ?, ?, GETDATE())";

        $params = [$titel, $content, $imgUrl, $mediaType, $tags];

        $insertResult = sqlsrv_query($conn, $insertQuery, $params);

        if ($insertResult === false) {
            die(print_r(sqlsrv_errors(), true));
        } else {
            echo "Artikel erfolgreich erstellt!";
        }
    } else {
        echo "Ungültiges Passwort.";
    }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../css/rubStyle.css">
    <title>Create Newsartikel</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .form-container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
        }
        input[type="text"], textarea {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        input[type="submit"] {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>

<div class="form-container">
    <h2>Erstelle einen Newsartikel</h2>
    <hr>
    <form method="POST" action="">
        <label for="password">Passwort:</label>
        <input type="password" name="password" required>
        <br>
        <label for="titel">Titel:</label>
        <input type="text" name="titel" required>
        
        <label for="content">Inhalt:</label>
        <textarea name="content" rows="5" required></textarea>
        
        <label for="imgUrl">Bild-URL:</label>
        <input type="text" name="imgUrl" required>
        
        <label for="fileUpload">Oder Datei hochladen (Bild/Video):</label>
        <input type="file" name="fileUpload" accept="image/*,video/*">
        <br>
        <br>
        <label for="mediaType">Medienart:</label>
        <input type="text" name="mediaType" required>

        <label for="tags">Tags (kommagetrennt):</label>
        <input type="text" name="tags" required>

        <input type="submit" value="Artikel erstellen">
    </form>
</div>

</body>
</html>
