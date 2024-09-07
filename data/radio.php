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

$url = "http://109.169.23.124:9513/played.html";
$html = getUrlContent($url);
include('navbar.php');
?>

<div class="rubiRadio" id="rubiRadio">
    <?php
    $dom = new DOMDocument();

    // Fehlerunterdrückung für fehlerhaftes HTML
    libxml_use_internal_errors(true);

    // HTML in das DOMDocument laden
    $dom->loadHTML($html);

    // Fehlermeldungen zurücksetzen
    libxml_clear_errors();

    $tables = $dom->getElementsByTagName('table');
    if ($tables->length >= 2) {
        $second_table = $tables->item(2);

        // Den HTML-Code des zweiten <table>-Tags extrahieren
        $table_html = $dom->saveHTML($second_table);

        // Nun kannst du den $table_html-String analysieren, um die gewünschten Daten zu extrahieren
        // Hier könntest du z.B. SimpleHTMLDOM oder reguläre Ausdrücke verwenden

        // Ein Beispiel, um den extrahierten HTML-Code auszugeben
        echo $table_html;
    }
    ?>
    Zum hören einfach oben rechts auf Play drücken 😉
</div>