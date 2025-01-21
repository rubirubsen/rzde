<?php
require('creds.php');
error_reporting(E_ALL); // Fehlerberichterstattung aktivieren

$conn = sqlsrv_connect($servername, array("UID" => $username, "PWD" => $password, "Database" => $dbname, "TrustServerCertificate" => true));

$username = $_GET['username'] ?? '';
// var_dump($username); // Überprüfe, ob der Benutzername korrekt übergeben wird

if (!$username) {
    echo json_encode(["error" => "Benutzername nicht übergeben oder leer"]);
    exit;
}

// Abfrage der User-ID basierend auf dem Benutzernamen (case-insensitive)
$userQuery = "SELECT id FROM dbo.tbl_users WHERE LOWER(username) = LOWER(?)";
$params = [$username];
$userResult = sqlsrv_query($conn, $userQuery, $params);

if ($userResult === false) {
    die(print_r(sqlsrv_errors(), true)); // SQL-Fehler ausgeben
}

$user = sqlsrv_fetch_array($userResult, SQLSRV_FETCH_ASSOC);
// var_dump($user); // Überprüfe, ob der Benutzer gefunden wurde

if (!$user) {
    echo json_encode(["error" => "Benutzer nicht gefunden"]);
    exit;
}

$userId = $user['id'];

// Abfrage der Karten für den Benutzer
$cardsQuery = "SELECT card_id FROM dbo.tbl_user_cards WHERE user_id = ?";
$cardsResult = sqlsrv_query($conn, $cardsQuery, [$userId]);

if ($cardsResult === false) {
    die(print_r(sqlsrv_errors(), true)); // SQL-Fehler ausgeben
}

$cards = [];
while ($cardRow = sqlsrv_fetch_array($cardsResult, SQLSRV_FETCH_ASSOC)) {
    $cards[] = $cardRow['card_id'];
}
// var_dump($cards); // Überprüfe, welche Karten gefunden wurden

if (empty($cards)) {
    echo json_encode(["message" => "Keine Karten gefunden."]);
    exit;
}

// Abfrage der Kartendetails
$cardDetails = [];
foreach ($cards as $cardId) {
    $cardQuery = "SELECT id AS card_id, card_name, description, image_url FROM dbo.tbl_cards WHERE id = ?";
    $cardResult = sqlsrv_query($conn, $cardQuery, [$cardId]);
    if ($cardResult) {
        while ($card = sqlsrv_fetch_array($cardResult, SQLSRV_FETCH_ASSOC)) {
            $cardDetails[] = $card;
        }
    }
}

// Ausgabe der Kartendetails als JSON
$response = [
    'cards' => $cardDetails, // Verwende die gesammelten Kartendetails
    'user_id' => $userId,
];

header('Content-Type: application/json');
$jsonResponse = json_encode($response);

if ($jsonResponse === false) {
    // Fehler beim Kodieren
    echo json_last_error_msg(); // Ausgabe des Fehlers
    exit;
}

echo $jsonResponse;
exit;
?>
