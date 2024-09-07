<?php
// Verbindung zur MSSQL-Datenbank herstellen
$serverName = "your_server_name"; // Zum Beispiel: "localhost"
$connectionOptions = array(
    "Database" => "your_database_name",
    "Uid" => "your_username",
    "PWD" => "your_password"
);
$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}

// Autorisierungscode von Spotify abrufen
$code = $_GET['code']; // Hier wird angenommen, dass der Autorisierungscode per GET-Parameter übergeben wird

// Beispiel: SQL-Befehl zum Einfügen des Autorisierungscodes in die Datenbank
$sql = "INSERT INTO oauth_authorization_codes (code) VALUES (?)";
$params = array($code);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
} else {
    echo "Autorisierungscode erfolgreich in der Datenbank gespeichert.";
}

// Verbindung schließen
sqlsrv_close($conn);
?>