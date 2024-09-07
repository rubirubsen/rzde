<?php 

require_once 'vendor/autoload.php';
require_once 'functions.php';
// Laden Sie die Umgebungsvariablen
loadEnv();

// Verwenden Sie die Umgebungsvariablen
$clientID = $_ENV['CLIENT_ID'];
$secret = $_ENV['CLIENT_PASSWORD'];

$session = new SpotifyWebAPI\Session(
  $clientID,
  $secret,
  'http://rubizockt.de/callback.php'
);

$options = [
  'scope' => ['user-read-private', 'user-read-email'],
];

if (isset($_GET['code'])) {
    try 
    {
        $accessToken = $session->requestAccessToken($_GET['code']);
        $api = new SpotifyWebAPI\SpotifyWebAPI();
        $api->setAccessToken($accessToken->getAccessToken());

        // Der Zugriffstoken wurde erfolgreich abgerufen. Verwenden Sie die Spotify Web API, um die Daten des Benutzers abzurufen.

        $user = $api->me();
        echo 'Hallo, ' . $user->display_name;
    } 
        catch (SpotifyWebAPI\SpotifyWebAPIException $e) {
        echo 'Es ist ein Fehler aufgetreten: ' . $e->getMessage();
    }
};

?>