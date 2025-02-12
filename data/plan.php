<?php
include('creds.php');

$conn = sqlsrv_connect($servername, array("UID" => $username, "PWD" => $password, "Database" => $dbname, "TrustServerCertificate" => true));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $subject = $_POST['subject'];
    $day = $_POST['day'];
    $start_time = $_POST['start_time'];
    $duration = $_POST['duration'];

    $sql = "INSERT INTO schedule (subject, day, start_time, duration) VALUES (?, ?, ?, ?)";
    $params = [$subject, $day, $start_time, $duration];
    sqlsrv_query($conn, $sql, $params);
}

// Daten aus der DB abfragen
$sql = "SELECT subject, day, start_time, duration FROM schedule";
$stmt = sqlsrv_query($conn, $sql);
$scheduleItems = [];
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $scheduleItems[] = [
        'subject' => $row['subject'],
        'day' => $row['day'],
        'start_time' => $row['start_time']->format('H:i'), // Konvertiere das DateTime-Objekt in einen String
        'duration' => $row['duration']
    ];
}

//var_dump($scheduleItems);
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./css/plan.css">
    

    <title>Stundenplan</title>
</head>
<body>
    <h1>Stundenplan</h1>
    
    <div>
    <input type="text" id="subject" placeholder="Fachname">
    <input type="number" id="duration" placeholder="Dauer in Minuten">
    <input type="text" id="day" placeholder="Tag (z.B. Mo, Di, etc.)">
    <input type="time" id="start_time" placeholder="Startzeit">
    <button onclick="addSubject()">Hinzufügen</button>
</div>
    
    <div id="subjectList"></div>
    
    <?php
$zeiten = [];
for ($i = 0; $i < 24; $i++) {
    $zeiten[] = sprintf('%02d:00', $i); // Generiere Zeiten von 00:00 bis 23:00
}
$tage = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
?>
    <script>
        const activities = <?php echo json_encode($scheduleItems); ?>;
    </script>

<table class="timetable"> <!-- Hier die Klasse hinzugefügt -->
    <tr>
        <td></td>
        <?php foreach ($tage as $tag): ?>
            <td><?= $tag ?></td>
        <?php endforeach; ?>
    </tr>
    <?php foreach ($zeiten as $zeit): ?>
        <tr>
            <td><?= $zeit ?></td>
            <?php foreach ($tage as $tag): ?>
                <td class="dropzone" ondrop="drop(event, '<?= $tag ?>')" ondragover="allowDrop(event)" style="height: 50px;"></td>
            <?php endforeach; ?>
        </tr>
    <?php endforeach; ?>
</table>



</body>
<script src="./js/plan.js" defer></script>
</html>
