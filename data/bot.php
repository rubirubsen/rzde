<?php
    if($_GET['client_type']){
        $client_type = $_GET['client_type'];
    }
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://rubizockt.de/css/spotify.css">
    <script type="module" src="https://rubizockt.de/js/extension-script.js"></script>
    <title>Overlay</title>
</head>

<body>
    <div id="track-info" class="track-info" style="">
        <div class="trackCover" id="trackCover"></div>
        
        <div id="topRow" class="topRow">
            <p id="topRowText">Title Info</p>
        </div>
        
        <div id="bottomRow" class="bottomRow">    
            <p id="bottomRowText" class="bottomRowText">Artist Info</p>
        </div>
    </div>
    <p class="hiddenClientType" id="client_type" style="display:none"><?php if($client_type){echo $client_type;} ?></p>
    <div id="newsScroll" class="newsBox">
        <p id="newsText" class="newsText">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore</p>
    </div>

</body>
</html>
