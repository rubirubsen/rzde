<?php

function getUrlContent($url) {
    fopen("cookies.txt", "w");
    $parts = parse_url($url);
    $host = $parts['host'];
    $ch = curl_init();
    $header = array('GET /1575051 HTTP/1.1',
        "Host: {$host}",
        'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language:en-US,en;q=0.8',
        'Cache-Control:max-age=0',
        'Connection:keep-alive',
        'Host:adfoc.us',
        'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36',
    );

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_COOKIESESSION, true);

    curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');
    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}
include('navbar.php');
?>
<table>
    <thead>
    <tr>
        <th>Kategorie</th>
        <th>Befehl</th>
        <th>Beschreibung</th>
    </tr>
    </thead>
    <tbody>
    <!-- Chat-Befehle -->
    <tr>
        <td rowspan="23">Chat-Befehle</td>
        <td>!tekno</td>
        <td></td>
    </tr>
    <tr>
        <td>!sexytime</td>
        <td></td>
    </tr>
    <!-- ... (weitere Chat-Befehle) ... -->

    <!-- Song-Anfragen -->
    <tr>
        <td rowspan="2">Song-Anfragen</td>
        <td>!songrequest</td>
        <td>Anfrage für ein Lied</td>
    </tr>
    <tr>
        <td>!sr</td>
        <td>Anfrage für ein Lied</td>
    </tr>

    <!-- Teamspeak und DayZ Server -->
    <tr>
        <td rowspan="2">Teamspeak und DayZ Server</td>
        <td>!teamspeak</td>
        <td>Gibt die Teamspeak-Adresse aus</td>
    </tr>
    <tr>
        <td>!dayZserver</td>
        <td>Zeigt alle Informationen zum DayZ Server</td>
    </tr>

    <!-- Andere Befehle -->
    <tr>
        <td rowspan="4">Andere Befehle</td>
        <td>!so</td>
        <td>Sendet einen Shoutout an einen Benutzer</td>
    </tr>
    <tr>
        <td>!chatgpt</td>
        <td>Spricht mit Chat GPT</td>
    </tr>
    <!-- ... (weitere Andere Befehle) ... -->

    <!-- Twitch Points Commands -->
    <tr>
        <td rowspan="3">Twitch Points Commands</td>
        <td>nice500</td>
        <td></td>
    </tr>
    <tr>
        <td>goodmorning500</td>
        <td></td>
    </tr>
    <!-- ... (weitere Twitch Points Commands) ... -->

    <!-- Twitch Extensions Commands -->
    <tr>
        <td rowspan="1">Twitch Extensions Commands</td>
        <td>tts100</td>
        <td>Sendet eine Text-zu-Sprache-Nachricht</td>
    </tr>
    </tbody>
</table>
