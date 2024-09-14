<?php
if(isset($_GET['uid'])) {
    $uid = $_GET['uid'];
}
// Deine PHP-Logik könnte hier stehen, falls benötigt
?>
<!DOCTYPE html>
<html lang="de">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./css/spotify.css">
        <title>Overlay</title>
</head>


    <body>
        <div id="cred" style="display:none" cred-data="<?php echo $uid ?>"></div>
    </body>
    
    <div id="track-info" class="track-info" style="visibility: hidden;">
        
        <div class="trackCover" id="trackCover"></div>
        
        <div id="topRow" class="topRow">
            <p id="topRowText">Seeed</p>
        </div>
        
        <div id="bottomRow" class="bottomRow">    
            <p id="bottomRowText" class="bottomRowText">G€LD</p>
        </div>
    </div>

    <script>
            var uid =  document.getElementById('cred').getAttribute('cred-data');
            // WebSocket-Verbindung herstellen
            var socket = new WebSocket(`wss://rubizockt.de:3000?uid=${uid}`);	
            var playerDiv; // Globale Variable für das div-Element
            let parsedMessage;
            let message; 

            // Funktion zum Aktualisieren des Track-Info Divs
            function updateTrackInfoDiv(trackInfo) {
                    const trackInfoDiv = document.getElementById('track-info');
                    const backgroundImageUrl = `spotify/info/current_image.jpg?${encodeURIComponent(trackInfo.artistNames)}`;
                    const trackCover = document.getElementById('trackCover');
                    const topRowDiv = document.getElementById('topRow');
                    const scrollerRowDiv = document.getElementById('bottomRow');

                    // Setze Hintergrundbild
                    trackCover.style.backgroundImage = `url(${backgroundImageUrl})`;

                    // Aktualisiere Text
                    topRowDiv.innerHTML = `<p id="topRowText">${trackInfo.trackName}</p>`;
                    scrollerRowDiv.innerHTML = `<p id="bottomRowText">${trackInfo.artistNames}</p>`;

                    // Funktion zur Anwendung der Scroll-Animation
                    function applyScrolling(element) {
                        const textElement = element.querySelector('p');
                        headerElementWidth = 180;
                        let textWidth = getTextWidth(textElement);
                        if ( textElement.scrollWidth > headerElementWidth) {
                            // Wenn der Text breiter ist als der Container
                            console.log("scrolling enabled");
                            textElement.classList.add('scrolling');
                        } else {
                            // Wenn der Text in den Container passt
                            console.log("scrolling not enabled");
                            textElement.classList.remove('scrolling');
                        }
                    }

                    applyScrolling(topRowDiv);
                    applyScrolling(scrollerRowDiv);

                    // Sichtbarkeit sicherstellen
                    trackInfoDiv.style.visibility = 'visible';
                    return trackInfoDiv;
                }

            // WebSocket-Ereignis: Verbindung hergestellt
            socket.onopen = function(event) {
                console.log('WebSocket-Verbindung hergestellt');
            };

            // WebSocket-Ereignis: Nachricht empfangen
                socket.onmessage = function(event) {
                    
                    let message = event.data;
                    console.log('Empfangene Nachricht: ', message);

                    try {
                        message = JSON.parse(message);  // Versuche, JSON zu parsen
                        console.log("Valid JSON:", message);
                    } catch (error) {
                        console.error("Invalid JSON, no parsing needed:", message);
                        message = message;  // Nachricht bleibt String
                    }

                    let trackInfo = message.trackInfo;
                    
                    var media = {
                        '15000volt': { type: 'video', src: './media/webm/15000volt.webm' },
                        '1700mark': { type: 'video', src: './media/webm/1700mark.webm' },
                        '2000later': { type: 'video', src: './media/webm/2000later.webm' },
                        'antworten': { type: 'video', src: './media/webm/antworten.webm' },
                        'archbtw': { type: 'video', src: './media/webm/archbtw.webm' },
                        'atemlos' : { type: 'video', src: './media/webm/breathtaking.webm' },
                        'bathroom': { type: 'video', src: './media/webm/bathroom.webm' },
                        'binichdabei': { type: 'video', src: './media/webm/binichdabei.webm' },
                        'bluescreen': { type: 'video', src: './media/webm/bluescreen.webm' },
                        'breathtaking' : { type: 'video', src: './media/webm/breathtaking.webm'},
                        'boom': { type: 'video', src: './media/webm/boom.webm' },
                        'camping': { type: 'video', src: './media/webm/camper.webm' },
                        'cat': { type: 'video', src: './media/webm/cat.webm' },
                        'chicks': { type: 'video', src: './media/webm/chicks.webm' },
                        'cringe': { type: 'video', src: './media/webm/cringe.webm' },
                        'crowdstrike': { type: 'video', src: './media/webm/crowdstrike.webm' },
                        'dds': { type: 'video', src: './media/webm/dds.webm' },
                        'diegrünen': { type: 'video', src: './media/webm/diegrünen.webm' },
                        'disconnect': { type: 'video', src: './media/webm/disconnect.webm' },
                        'drei': { type: 'video', src: './media/webm/drei.webm' },
                        'eier': { type: 'video', src: './media/webm/eier.webm' },
                        'ente': { type: 'video', src: './media/webm/ente.webm' },
                        'eww' : { type: 'video', src: './media/webm/eww.webm'},
                        'fax': { type: 'video', src: './media/webm/fax.webm' },
                        'fire': { type: 'video', src: './media/webm/fire.webm' },
                        'freshavocado': { type: 'video', src: './media/webm/freshavocado.webm' },
                        'gefahr': { type: 'video', src: './media/webm/gefahr.webm' },
                        'geringverdiener': { type: 'video', src: './media/webm/geringverdiener.webm' },
                        'goat': { type: 'video', src: './media/webm/goat.webm' },
                        'groovy': { type: 'video', src: './media/webm/groovy.webm' },
                        'hahaschwanz': { type: 'video', src: './media/webm/hahaschwanz.webm' },
                        'hase': { type: 'video', src: './media/webm/hase.webm' },
                        'highscore': { type: 'video', src: './media/webm/highscore.webm' },
                        'isso': { type: 'video', src: './media/webm/isso.webm' },
                        'kappa': { type: 'video', src: './media/webm/kappa.webm' }, 
                        'vid_kekw' : { type: 'video', src: './media/webm/kekw.webm'},
                        'kristellmett': { type: 'video', src: './media/webm/kristellmett.webm' },
                        'keininstrument': { type: 'video', src: './media/webm/keininstrument.webm' },
                        'lametta': { type: 'video', src: './media/webm/lametta.webm' },
                        'later': { type: 'video', src: './media/webm/later.webm' },
                        'lol': { type: 'video', src: './media/webm/lol.webm' },
                        'macke': { type: 'video', src: './media/webm/macke.webm' },
                        'megalangweilig': { type: 'video', src: './media/webm/megalangweilig.webm' },
                        'megaboom': { type: 'video', src: './media/webm/megaboom.webm' },
                        'megaburp': { type: 'video', src: './media/webm/megaburp.webm' },
                        'mindblown': { type: 'video', src: './media/webm/mindblown.webm' },
                        'nachhause': { type: 'video', src: './media/webm/nachhause.webm' },
                        'ninja': { type: 'video', src: './media/webm/ninja.webm' },
                        'nice': { type: 'video', src: './media/webm/nice.webm' },
                        'noice': { type: 'video', src: './media/webm/noice.webm' },
                        'noo': { type: 'video', src: './media/webm/noo.webm'},
                        'nein': { type: 'video', src: './media/webm/nein.webm' },
                        'ohgott': { type: 'video', src: './media/webm/ohgott.webm' },
                        'ouha': { type: 'video', src: './media/webm/ouha.webm' },
                        'ok': { type: 'video', src :'./media/webm/ok.webm'},
                        'plan': { type: 'video', src: './media/webm/plan.webm' },
                        'pikatwerk': { type: 'video', src: './media/webm/pikatwerk.webm' },
                        'preis': { type: 'video', src: './media/webm/preis.webm' },
                        'radar': { type: 'video', src: './media/webm/radar.webm' },
                        'rage': { type: 'video', src: './media/webm/rage.webm' },
                        'ratedw': { type: 'video', src: './media/webm/ratedw.webm' },
                        'vid_420': { type: 'video', src: './media/webm/drugs.webm' },
                        'schabernack': { type: 'video', src: './media/webm/schabernack.webm' },
                        'sheeshdigga': { type: 'video', src: './media/webm/sheeshdigga.webm' },
                        'sheeshmittwoch': { type: 'video', src: './media/webm/sheeshmittwoch.webm' },
                        'smash': { type: 'video', src: './media/webm/smash.webm' },
                        'stop': { type: 'video', src: './media/webm/stop.webm' },
                        'sos': { type: 'video', src: './media/webm/sos.webm' },
                        'stimm': { type: 'video', src: './media/webm/stimm.webm' },
                        'stimme': { type: 'video', src: './media/webm/stimme.webm' },
                        'sun': { type: 'video', src: './media/webm/sun.webm' },
                        'super': { type: 'video', src: './media/webm/super.webm' },
                        'tastadatur': { type: 'video', src: './media/webm/tastadatur.webm' },
                        'tastethesun': { type: 'video', src: './media/webm/tastethesun.webm' },
                        'technikstreams': { type: 'video', src: './media/webm/technikstreams.webm' },
                        'tos': { type: 'video', src: './media/webm/tos.webm' },
                        'unverzueglich': { type: 'video', src: './media/webm/unverzueglich.webm' },
                        'verwaehlung': { type: 'video', src: './media/webm/verwaehlung.webm' },
                        'verwaltung': { type: 'video', src: './media/webm/verwaltung.webm' },
                        'wasted': { type: 'video', src: './media/webm/wasted.webm' },
                        'what': { type: 'video', src: './media/webm/what.webm' },
                        'why': { type: 'video', src: './media/webm/why.webm' },
                        'windofs': { type: 'video', src: './media/webm/windofs.webm' },
                        'wissen': { type: 'video', src: './media/webm/wissen.webm' },
                        'wtf': { type: 'video', src: './media/webm/wtf.webm' },
                        'xbox': { type: 'video', src: './media/webm/xbox.webm' },

                        // MP3-Dateien
                        '200puls': { type: 'audio', src: './media/mp3/200puls.mp3' },
                        'burp': { type: 'audio', src: './media/mp3/burp.mp3' },
                        'dusollstatmen': { type: 'audio', src: './media/mp3/dusollstatmen.mp3' },
                        'gewitter': { type: 'audio', src: './media/mp3/gewitter.mp3' },
                        'icq': { type: 'audio', src: './media/mp3/icq.mp3' },
                        'lieferung': { type: 'audio', src: './media/mp3/lieferung.mp3' },
                        'nom': { type: 'audio', src: './media/mp3/nom.mp3' },
                        'regal': { type: 'audio', src: './media/mp3/regal.mp3' },
                        'teams': { type: 'audio', src: './media/mp3/teams.mp3' },
                        'water': { type: 'audio', src: './media/mp3/water.mp3' },
                        'achtung': { type: 'audio', src: './media/mp3/achtung.mp3' },
                        'bzzt': { type: 'audio', src: './media/mp3/bzzt.mp3' },
                        'eeeee': { type: 'audio', src: './media/mp3/eeeee.mp3' },
                        'gibsmir': { type: 'audio', src: './media/mp3/gibsmir.mp3' },
                        'immerdiesegurken': { type: 'audio', src: './media/mp3/immerdiesegurken.mp3' },
                        'life': { type: 'audio', src: './media/mp3/life.mp3' },
                        'nope': { type: 'audio', src: './media/mp3/nope.mp3' },
                        'russencyber': { type: 'audio', src: './media/mp3/russencyber.mp3' },
                        'telegram': { type: 'audio', src: './media/mp3/telegram.mp3' },
                        'waweb': { type: 'audio', src: './media/mp3/waweb.mp3' },
                        'ahshit': { type: 'audio', src: './media/mp3/ahshit.mp3' },
                        'chirp': { type: 'audio', src: './media/mp3/chirp.mp3' },
                        'eigenleben': { type: 'audio', src: './media/mp3/eigenleben.mp3' },
                        'gigi': { type: 'audio', src: './media/mp3/gigi.mp3' },
                        'indertat': { type: 'audio', src: './media/mp3/indertat.mp3' },
                        'listen': { type: 'audio', src: './media/mp3/listen.mp3' },
                        'numpad': { type: 'audio', src: './media/mp3/numpad.mp3' },
                        'rustikal': { type: 'audio', src: './media/mp3/rustikal.mp3' },
                        'theone': { type: 'audio', src: './media/mp3/theone.mp3' },
                        'wetfart': { type: 'audio', src: './media/mp3/wetfart.mp3' },
                        'alarm': { type: 'audio', src: './media/mp3/alarm.mp3' },
                        'cmake': { type: 'audio', src: './media/mp3/cmake.mp3' },
                        'erdbeerkäse': { type: 'audio', src: './media/mp3/erdbeerkäse.mp3' },
                        'gurke': { type: 'audio', src: './media/mp3/gurke.mp3' },
                        'internet': { type: 'audio', src: './media/mp3/internet.mp3' },
                        'knock': { type: 'audio', src: './media/mp3/knock.mp3' },
                        'okgurke': { type: 'audio', src: './media/mp3/okgurke.mp3' },
                        'sabbelnich': { type: 'audio', src: './media/mp3/sabbelnich.mp3' },
                        'toasty': { type: 'audio', src: './media/mp3/toasty.mp3' },
                        'whip': { type: 'audio', src: './media/mp3/whip.mp3' },
                        'alexa': { type: 'audio', src: './media/mp3/alexa.mp3' },
                        'tief': { type: 'audio', src: './media/mp3/tief.mp3' },
                        'coin': { type: 'audio', src: './media/mp3/coin.mp3' },
                        'erika': { type: 'audio', src: './media/mp3/erika.mp3' },
                        'hallo': { type: 'audio', src: './media/mp3/hallo.mp3' },
                        'irre': { type: 'audio', src: './media/mp3/irre.mp3' },
                        'lügen': { type: 'audio', src: './media/mp3/lügen.mp3' },
                        'onoff': { type: 'audio', src: './media/mp3/onoff.mp3' },
                        'samen': { type: 'audio', src: './media/mp3/samen.mp3' },
                        'tolleswort': { type: 'audio', src: './media/mp3/tolleswort.mp3' },
                        'willnichtmehr': { type: 'audio', src: './media/mp3/willnichtmehr.mp3' },
                        'amrad': { type: 'audio', src: './media/mp3/amrad.mp3' },
                        'cookie': { type: 'audio', src: './media/mp3/cookie.mp3' },
                        'eyey': { type: 'audio', src: './media/mp3/eyey.mp3' },
                        'happybirthday': { type: 'audio', src: './media/mp3/happybirthday.mp3' },
                        'javapeek': { type: 'audio', src: './media/mp3/javapeek.mp3' },
                        'machhinne': { type: 'audio', src: './media/mp3/machhinne.mp3' },
                        'ostdeutsch': { type: 'audio', src: './media/mp3/ostdeutsch.mp3' },
                        'schaffen': { type: 'audio', src: './media/mp3/schaffen.mp3' },
                        'tralala': { type: 'audio', src: './media/mp3/tralala.mp3' },
                        'winamp': { type: 'audio', src: './media/mp3/winamp.mp3' },
                        'arrogant': { type: 'audio', src: './media/mp3/arrogant.mp3' },
                        'cyberbacher': { type: 'audio', src: './media/mp3/cyberbacher.mp3' },
                        'fail': { type: 'audio', src: './media/mp3/fail.mp3' },
                        'heim': { type: 'audio', src: './media/mp3/heim.mp3' },
                        'jfpeek': { type: 'audio', src: './media/mp3/jfpeek.mp3' },
                        'miez': { type: 'audio', src: './media/mp3/miez.mp3' },
                        'over9000': { type: 'audio', src: './media/mp3/over9000.mp3' },
                        'scheissding': { type: 'audio', src: './media/mp3/scheissding.mp3' },
                        'trinken': { type: 'audio', src: './media/mp3/trinken.mp3' },
                        'wow': { type: 'audio', src: './media/mp3/wow.mp3' },
                        'babam': { type: 'audio', src: './media/mp3/babam.mp3' },
                        'dasistgeil': { type: 'audio', src: './media/mp3/dasistgeil.mp3' },
                        'falscheentscheidung': { type: 'audio', src: './media/mp3/falscheentscheidung.mp3' },
                        'heiss': { type: 'audio', src: './media/mp3/heiss.mp3' },
                        'jo': { type: 'audio', src: './media/mp3/jo.mp3' },
                        'mimimi': { type: 'audio', src: './media/mp3/mimimi.mp3' },
                        'ovpn': { type: 'audio', src: './media/mp3/ovpn.mp3' },
                        'scheissemitscheisse': { type: 'audio', src: './media/mp3/scheissemitscheisse.mp3' },
                        'uhtini': { type: 'audio', src: './media/mp3/uhtini.mp3' },
                        'wvpn': { type: 'audio', src: './media/mp3/wvpn.mp3' },
                        'baeh': { type: 'audio', src: './media/mp3/baeh.mp3' },
                        'dc': { type: 'audio', src: './media/mp3/dc.mp3' },
                        'fart': { type: 'audio', src: './media/mp3/fart.mp3' },
                        'hellodaddy': { type: 'audio', src: './media/mp3/hellodaddy.mp3' },
                        'kabelmaus': { type: 'audio', src: './media/mp3/kabelmaus.mp3' },
                        'miregal': { type: 'audio', src: './media/mp3/miregal.mp3' },
                        'pain': { type: 'audio', src: './media/mp3/pain.mp3' },
                        'schienenersatzverkehr': { type: 'audio', src: './media/mp3/schienenersatzverkehr.mp3' },
                        'usb': { type: 'audio', src: './media/mp3/usb.mp3' },
                        'wwm': { type: 'audio', src: './media/mp3/wwm.mp3' },
                        'banned': { type: 'audio', src: './media/mp3/banned.mp3' },
                        'dergeht': { type: 'audio', src: './media/mp3/dergeht.mp3' },
                        'fbi': { type: 'audio', src: './media/mp3/fbi.mp3' },
                        'heulleise': { type: 'audio', src: './media/mp3/heulleise.mp3' },
                        'kaching': { type: 'audio', src: './media/mp3/kaching.mp3' },
                        'mlem': { type: 'audio', src: './media/mp3/mlem.mp3' },
                        'penisistpenis': { type: 'audio', src: './media/mp3/penisistpenis.mp3' },
                        'schlag': { type: 'audio', src: './media/mp3/schlag.mp3' },
                        'uwop': { type: 'audio', src: './media/mp3/uwop.mp3' },
                        'yay': { type: 'audio', src: './media/mp3/yay.mp3' },
                        'beckenrand': { type: 'audio', src: './media/mp3/beckenrand.mp3' },
                        'fettbemmen': { type: 'audio', src: './media/mp3/fettbemmen.mp3' },
                        'hilfe': { type: 'audio', src: './media/mp3/hilfe.mp3' },
                        'kacken': { type: 'audio', src: './media/mp3/kacken.mp3' },
                        'muhaha': { type: 'audio', src: './media/mp3/muhaha.mp3' },
                        'pfu': { type: 'audio', src: './media/mp3/pfu.mp3' },
                        'shame': { type: 'audio', src: './media/mp3/shame.mp3' },
                        'vibr': { type: 'audio', src: './media/mp3/vibr.mp3' },
                        'zerstoerer': { type: 'audio', src: './media/mp3/zerstoerer.mp3' },
                        'belastend': { type: 'audio', src: './media/mp3/belastend.mp3' },
                        'destroyed': { type: 'audio', src: './media/mp3/destroyed.mp3' },
                        'fetzig': { type: 'audio', src: './media/mp3/fetzig.mp3' },
                        'hmm': { type: 'audio', src: './media/mp3/hmm.mp3' },
                        'kaiuwe': { type: 'audio', src: './media/mp3/kaiuwe.mp3' },
                        'mussraus': { type: 'audio', src: './media/mp3/mussraus.mp3' },
                        'ping': { type: 'audio', src: './media/mp3/ping.mp3' },
                        'shutdown': { type: 'audio', src: './media/mp3/shutdown.mp3' },
                        'viecher': { type: 'audio', src: './media/mp3/viecher.mp3' },
                        'zombie': { type: 'audio', src: './media/mp3/zombie.mp3' },
                        'berndruhe': { type: 'audio', src: './media/mp3/berndruhe.mp3' },
                        'deutlich': { type: 'audio', src: './media/mp3/deutlich.mp3' },
                        'fia': { type: 'audio', src: './media/mp3/fia.mp3' },
                        'hodensack': { type: 'audio', src: './media/mp3/hodensack.mp3' },
                        'kammamamachen': { type: 'audio', src: './media/mp3/kammamamachen.mp3' },
                        'mwep': { type: 'audio', src: './media/mp3/mwep.mp3' },
                        'powerlevel': { type: 'audio', src: './media/mp3/powerlevel.mp3' },
                        'shutup': { type: 'audio', src: './media/mp3/shutup.mp3' },
                        'visca': { type: 'audio', src: './media/mp3/visca.mp3' },
                        'zonk': { type: 'audio', src: './media/mp3/zonk.mp3' },
                        'biele': { type: 'audio', src: './media/mp3/biele.mp3' },
                        'diagnose': { type: 'audio', src: './media/mp3/diagnose.mp3' },
                        'fickerberg': { type: 'audio', src: './media/mp3/fickerberg.mp3' },
                        'horn': { type: 'audio', src: './media/mp3/horn.mp3' },
                        'kassette': { type: 'audio', src: './media/mp3/kassette.mp3' },
                        'mypenis': { type: 'audio', src: './media/mp3/mypenis.mp3' },
                        'prickelnd': { type: 'audio', src: './media/mp3/prickelnd.mp3' },
                        'sketchyshit': { type: 'audio', src: './media/mp3/sketchyshit.mp3' },
                        'voicejoin': { type: 'audio', src: './media/mp3/voicejoin.mp3' },
                        'zweischoppe': { type: 'audio', src: './media/mp3/zweischoppe.mp3' },
                        'bleibtso': { type: 'audio', src: './media/mp3/bleibtso.mp3' },
                        'dickmove': { type: 'audio', src: './media/mp3/dickmove.mp3' },
                        'fräulein': { type: 'audio', src: './media/mp3/fräulein.mp3' },
                        'hose': { type: 'audio', src: './media/mp3/hose.mp3' },
                        'klapse': { type: 'audio', src: './media/mp3/klapse.mp3' },
                        'natuerlich': { type: 'audio', src: './media/mp3/natuerlich.mp3' },
                        'prima': { type: 'audio', src: './media/mp3/prima.mp3' },
                        'sleepmode': { type: 'audio', src: './media/mp3/sleepmode.mp3' },
                        'vorwaerts': { type: 'audio', src: './media/mp3/vorwärts.mp3' },
                        'bloed': { type: 'audio', src: './media/mp3/bloed.mp3' },
                        'dingdong': { type: 'audio', src: './media/mp3/dingdong.mp3' },
                        'gefallen': { type: 'audio', src: './media/mp3/gefallen.mp3' },
                        'howdareyou': { type: 'audio', src: './media/mp3/howdareyou.mp3' },
                        'knock': { type: 'audio', src: './media/mp3/knock.mp3' },
                        'nebenrisiken': { type: 'audio', src: './media/mp3/nebenrisiken.mp3' },
                        'prost': { type: 'audio', src: './media/mp3/prost.mp3' },
                        'startup': { type: 'audio', src: './media/mp3/startup.mp3' },
                        'vpn': { type: 'audio', src: './media/mp3/vpn.mp3' },
                        'bluetooth': { type: 'audio', src: './media/mp3/bluetooth.mp3' },
                        'diskutabel': { type: 'audio', src: './media/mp3/diskutabel.mp3' },
                        'gege': { type: 'audio', src: './media/mp3/gege.mp3' },
                        'hunger': { type: 'audio', src: './media/mp3/hunger.mp3' },
                        'komisch': { type: 'audio', src: './media/mp3/komisch.mp3' },
                        'neee': { type: 'audio', src: './media/mp3/neee.mp3' },
                        'pun': { type: 'audio', src: './media/mp3/pun.mp3' },
                        'subbomb': { type: 'audio', src: './media/mp3/subbomb.mp3' },
                        'wakeup': { type: 'audio', src: './media/mp3/wakeup.mp3' },
                        'bock': { type: 'audio', src: './media/mp3/bock.mp3' },
                        'dogshit': { type: 'audio', src: './media/mp3/dogshit.mp3' },
                        'geier': { type: 'audio', src: './media/mp3/geier.mp3' },
                        'hurz': { type: 'audio', src: './media/mp3/hurz.mp3' },
                        'kranplätze': { type: 'audio', src: './media/mp3/kranplätze.mp3' },
                        'nerf': { type: 'audio', src: './media/mp3/nerf.mp3' },
                        'purge': { type: 'audio', src: './media/mp3/purge.mp3' },
                        'superhot': { type: 'audio', src: './media/mp3/superhot.mp3' },
                        'zwischendurch': { type: 'audio', src: './media/mp3/zwischendurch.mp3' },

                        // EMOTES 
                        'emo_kekw': { type: 'emoji', src: './media/emotes/kekw.webp' },
                        'rubizodancer': { type: 'emoji', src: './media/emotes/rubizoDancer.gif'},
                        'emo_rubizo420': { type: 'emoji', src: './media/emotes/rubizo420.png'}
                    }

                    let oldTitle;

                    // Hauptlogik
                    if (message.cmd === 'trackUpdate' && trackInfo) {
                        console.log('Overlay-Artist ', trackInfo.artistNames);
                        
                        if (!oldTitle || oldTitle !== trackInfo.artistNames) {
                            if (playerDiv) playerDiv.remove();  // Altes Div entfernen, wenn vorhanden
                            playerDiv = null;
                            updateTrackInfoDiv(trackInfo);  // Neues Div erstellen
                        }

                        console.log('Overlay-Title ', trackInfo.trackName);
                        oldTitle = trackInfo.artistNames;  // Titel aktualisieren

                    } else if (message.cmd === 'notPlaying') {
                        console.log('received not playing');
                        if (playerDiv) playerDiv.remove();

                    } else if (message.cmd === 'trigger' && message.triggerName) {
                        console.log('Received Trigger', message.triggerName);
                        // Trigger-Logik
                        for (let command in media) {
                            if (message.triggerName.includes(command)) {
                                switch (media[command].type) {
                                    case 'emoji':
                                        console.log("EMOJI");
                                        createEmoji(media[command].src);
                                        break;
                                    case 'audio':
                                        console.log("AUDIO");
                                        playAudio(media[command].src);
                                        break;
                                    case 'video':
                                        console.log("VIDEO");
                                        playVideo(media[command].src);
                                        break;
                                }
                                break;  // Falls nur ein Command behandelt werden soll
                            }
                        }
                    }
                };
            
                
                
            
            // Funktion zur Erstellung eines Emojis an einer zufälligen Position
            function createEmoji(src) {
                var emoji = document.createElement('img');
                emoji.src = src;
                emoji.style.position = 'fixed';
                
                // Zufällige horizontale Position
                emoji.style.left = Math.random() * (window.innerWidth - 100) + 'px';
                
                // Zufällige vertikale Startposition im oberen Drittel des Bildschirms
                var startTop = Math.random() * (window.innerHeight / 3);
                emoji.style.top = startTop + 'px';
                
                emoji.style.width = '100px';
                emoji.style.height = '100px';
                emoji.style.zIndex = 1000;

                // CSS-Klasse für die Animation hinzufügen
                emoji.classList.add('falling-emoji');

                document.body.appendChild(emoji);

                // Zufällige Fallgeschwindigkeit zwischen 3 und 6 Sekunden
                var fallDuration = 3 + Math.random() * 3;
                emoji.style.setProperty('--fall-duration', fallDuration + 's');

                // Nach 10 Sekunden entfernen
                setTimeout(function() {
                    emoji.remove();
                }, 10000);
            }

            // Funktion zum Abspielen von Audio
            function playAudio(src) {
                var audio = document.createElement('audio');
                audio.src = src;
                audio.autoplay = true;
                audio.style.position = 'fixed';
                audio.style.zIndex = 1000;

                document.body.appendChild(audio);
                audio.onended = function() {
                    audio.remove();
                };
            }
            
            function getTextWidth(text, font) {
                // Erstelle ein unsichtbares Element
                const span = document.createElement("span");
                span.style.visibility = "hidden";
                span.style.whiteSpace = "nowrap"; // Verhindert Zeilenumbruch
                span.style.font = font; // Setzt die gleiche Schriftart wie im div

                // Füge den Text in das span ein
                span.textContent = text;
                
                // Füge das span in das Dokument ein, um es zu messen
                document.body.appendChild(span);
                
                // Messe die Breite des Textes
                const width = span.offsetWidth;
                
                // Entferne das span wieder aus dem Dokument
                document.body.removeChild(span);

                return width; // gibt die Breite in Pixeln zurück
            }
            
            // Funktion zum Abspielen von Videos
            function playVideo(src) {
                var video = document.createElement('video');
                video.src = src;
                video.autoplay = true;
                video.loop = false; // Ändere dies, wenn das Video wiederholt werden soll
                video.style.position = 'fixed';
                video.style.top = '0';
                video.style.left = '0';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.zIndex = 1000;

                video.addEventListener('error', function(e) {
                    console.error('Video-Fehler:', e);
                });

                document.body.appendChild(video);
                video.onended = function() {
                    video.remove();
                };
            }

            // WebSocket-Ereignis: Verbindung geschlossen
            socket.onclose = function(event) {
                console.log('WebSocket-Verbindung geschlossen');
            };
    </script>
</html>
