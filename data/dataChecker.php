<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Media Checker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        .missing-folder {
            background-color: #ffcccc;
        }
        .missing-json {
            background-color: #ccffcc;
        }
    </style>
</head>
<body>
    <h1>Media Checker</h1>
    <?php
        // Pfade
        $videoFolder = __DIR__ . '/media/webm/';
        $mediaJsonFile = __DIR__ . '/datasets/media.json';

        // Videos aus dem Ordner
        $folderVideos = array_filter(scandir($videoFolder), function($file) {
            return pathinfo($file, PATHINFO_EXTENSION) === 'webm';
        });

        // Media aus der media.json
        $mediaEntries = [];
        if (file_exists($mediaJsonFile)) {
            $mediaData = json_decode(file_get_contents($mediaJsonFile), true);
            foreach ($mediaData as $key => $entry) {
                $mediaEntries[] = [
                    'type' => $entry['type'],
                    'src' => ltrim($entry['src'], './')
                ];
            }
        }
        
        // Alle erfassten Dateien aus Ordnern
        $allFolderFiles = [];
        foreach ($mediaEntries as $entry) {
            $typeFolder = __DIR__ . '/' . dirname($entry['src']);
            $typeFiles = is_dir($typeFolder) ? scandir($typeFolder) : [];
            $allFolderFiles = array_merge($allFolderFiles, array_map(function($file) use ($typeFolder) {
                return trim(str_replace(__DIR__ . '/', '', $typeFolder . '/' . $file), '/');
            }, $typeFiles));
        }

        // Tabelle darstellen
        echo "<table>
                <thead>
                    <tr>
                        <th>Datei</th>
                        <th>Im JSON</th>
                        <th>Im Ordner</th>
                    </tr>
                </thead>
                <tbody>";

        // Alle Dateien aus JSON und Ordner kombinieren
        $allMediaFiles = array_unique(array_merge(array_column($mediaEntries, 'src'), $allFolderFiles));
        foreach ($allMediaFiles as $file) {
            $inJson = in_array($file, array_column($mediaEntries, 'src'));
            $inFolder = in_array($file, $allFolderFiles);

            $rowClass = !$inFolder ? 'missing-folder' : (!$inJson ? 'missing-json' : '');
            echo "<tr class='$rowClass'>
                    <td>$file</td>
                    <td>" . ($inJson ? 'Ja' : 'Nein') . "</td>
                    <td>" . ($inFolder ? 'Ja' : 'Nein') . "</td>
                  </tr>";
        }

        echo "</tbody></table>";
    ?>
</body>
</html>
