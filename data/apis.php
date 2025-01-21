<?php

require_once('functions.php');

?>

<!DOCTYPE html>
<html lang="de">
<head>
  <title>RubiZockt bald wieder!</title>
  <link rel="stylesheet" href="css/rubStyle.css">
</head>
<body style="background:darkgrey">
<?php include('navbar.php'); ?>
<br>



<h1>API's</h1>
<p>Hier werden alle API-Spielereien erscheinen.</p>

<h3>News Api</h3>
<?php

$curl = curl_init();
$userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://newsapi.org/v2/everything?q=Tesla&from=2023-04-01&sortBy=popularity&apiKey=722c0e61144d4af2948c95d45521f0cd',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
));
curl_setopt($curl, CURLOPT_USERAGENT, $userAgent);
$response = curl_exec($curl);
curl_close($curl);

$array = json_decode($response, true);

getSpotifyAuth();
?>


