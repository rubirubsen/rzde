<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ordner, in dem die Dateien gespeichert werden
$uploadDir = 'uploads/'; // Stelle sicher, dass dieser Ordner existiert und beschreibbar ist

include('creds.php');

$conn = sqlsrv_connect($servername, array("UID" => $username, "PWD" => $password, "Database" => $dbname, "TrustServerCertificate" => true));

if (!$conn) {
    die(json_encode(["error" => "Verbindung zur Datenbank fehlgeschlagen."]));
}

// GET: Alle Aktivitäten abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT subject, day, CONVERT(varchar, start_time, 108) AS start_time, duration FROM schedule";
    $result = sqlsrv_query($conn, $sql);

    $activities = [];
    while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC)) {
        // Sicherstellen, dass start_time gesetzt ist und nicht leer ist
        if (isset($row['start_time']) && !empty($row['start_time'])) {
            $row['start_time'] = substr($row['start_time'], 0, 5);
        } else {
            $row['start_time'] = null; // oder einen Standardwert setzen
        }
        $activities[] = $row;
    }

    // JSON-Antwort zurückgeben
    echo json_encode($activities);
}

// POST: Neue Aktivität hinzufügen
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Debugging-Ausgabe
    error_log(print_r($input, true)); // Das gibt den Inhalt von $input in die PHP-Fehlerprotokolle aus

    $subject = $input['subject'] ?? null;
    $day = $input['day'] ?? null;
    $start_time = $input['start_time'] ?? null;
    $duration = $input['duration'] ?? null;
    $file = $_FILES['media'] ?? null; // Das hochgeladene Bild/Video

    // Überprüfe, ob alle erforderlichen Werte gesetzt sind
    if ($subject && $day && $start_time && $duration) {
        // Falls eine Datei hochgeladen wurde
        if ($file) {
            $fileName = basename($file['name']);
            $targetFilePath = $uploadDir . $fileName;

            // Verschiebe die hochgeladene Datei in das Zielverzeichnis
            if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
                $mediaUrl = $targetFilePath; // Verwende den relativen Pfad für die Datenbank
            } else {
                echo json_encode(["error" => "Fehler beim Hochladen der Datei."]);
                exit;
            }
        } else {
            $mediaUrl = $input['media_url'] ?? null; // Falls keine Datei hochgeladen wurde, akzeptiere eine URL
        }

        // SQL-Query
        $sql = "INSERT INTO schedule (subject, day, start_time, duration, media_url) VALUES (?, ?, ?, ?, ?)";
        $params = [$subject, $day, $start_time, $duration, $mediaUrl];
        $result = sqlsrv_query($conn, $sql, $params);

        if ($result) {
            echo json_encode(["message" => "Aktivität erfolgreich hinzugefügt."]);
        } else {
            echo json_encode(["error" => "Fehler beim Hinzufügen der Aktivität."]);
        }
    } else {
        echo json_encode(["error" => "Fehler: Einige Werte sind nicht gesetzt."]);
    }
}


sqlsrv_close($conn);
?>
