<?php

// Verwenden Sie die Umgebungsvariablen
$clientID = '6d7e02e2a1034ff19e9b4f317aa7b03e';
$redirect_uri = "https://rubizockt.de/callback.php"; 
$scope = "user-read-private user-read-email"; 

function getSpotifyAuth(){
    $authorize_url = "https://accounts.spotify.com/authorize?" . http_build_query(
        [ 
        "client_id" => $client_id, 
        "redirect_uri" => $redirect_uri, 
        "response_type" => "code", 
        "scope" => $scope, 
        ]
    ); 
    echo "<pre>";
    var_dump($authorize_url);
    echo "</pre>";
    
    header('Location: ' . $authorizeUrl);
    exit;
}
?>

