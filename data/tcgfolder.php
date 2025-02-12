<?php
include('navbar.php'); 
?>
<a href="javascript:history.back()"><== Go Back</a>
<div id="userInput" style="margin-left:12vw">
    <input type="text" id="username" placeholder="Benutzernamen eingeben" />
    <button onclick="loadUserCards()">Karten anzeigen</button>
</div>

<div id="folderOuter" class="folderOuter">
<div id="folderRing" class="folderRing"></div>
<div id="folderRing2" class="folderRing2"></div>
<div id="folderRing3" class="folderRing3"></div>


    <div id="folderInnerLeft" class="folderInnerLeft" style="z-index:1">
        <div id="folderInner2" class="folderInner2">
            <div id="folderInner3" class="folderInner3">
                <div id="card1-left" class="card1 tcg-card hiddenCard animated"></div>
                <div id="card2-left" class="card2 tcg-card hiddenCard animated"></div>
                <div id="card3-left" class="card3 tcg-card hiddenCard animated"></div>
                <div id="card5-left" class="card5 tcg-card hiddenCard animated"></div>
                <div id="card6-left" class="card6 tcg-card hiddenCard animated"></div>
                <div id="card7-left" class="card7 tcg-card hiddenCard animated"></div>
                <div id="card9-left" class="card9 tcg-card hiddenCard animated"></div>
                <div id="card10-left" class="card10 tcg-card hiddenCard animated" ></div>
                <div id="card11-left" class="card11 tcg-card hiddenCard animated" ></div>
            </div>
        </div>
    </div>
    <div id="folderInnerRight" class="folderInnerRight" style="z-index:2">
        <div id="folderInner2" class="folderInnerRight2">
            <div id="folderInner3" class="folderInnerRight3">
                <div id="card1-right" class="card1 tcg-card hiddenCard animated"></div>
                <div id="card2-right" class="card2 tcg-card hiddenCard animated"></div>
                <div id="card3-right" class="card3 tcg-card hiddenCard animated"></div>
                <div id="card5-right" class="card5 tcg-card hiddenCard animated"></div>
                <div id="card6-right" class="card6 tcg-card hiddenCard animated"></div>
                <div id="card7-right" class="card7 tcg-card hiddenCard animated"></div>
                <div id="card9-right" class="card9 tcg-card hiddenCard animated"></div>
                <div id="card10-right" class="card10 tcg-card hiddenCard animated"></div>
                <div id="card11-right" class="card11 tcg-card hiddenCard animated"></div>
            </div>
        </div>
    </div>
</div>

<div id="tcg-modal" class="tcg-modal">
    <span class="tcg-close">&times;</span>
    <img class="tcg-modal-content" id="tcg-modal-img" alt="Kartenbild">
    <div id="tcg-caption"></div>
</div>

<script>
var x;
var $cards = $(".hiddenCard");
var $style = $(".hover");


function loadUserCards() {
    var username = document.getElementById("username").value;
    fetch(`get_user_cards.php?username=${encodeURIComponent(username)}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht okay');
        }
        return response.text(); // Hol den Rohinhalt der Antwort
    })
    .then(text => {
        const data = JSON.parse(text); // Parse die Antwort
        const cards = data.cards || []; // Zugriff auf das cards-Array
        
        // Hier setzen wir alle Karten zurück
        $(".hiddenCard").addClass("animated"); 

        cards.forEach(card => {
            const cardElement = document.querySelector(`.tcg-card.card${card.card_id}`);
            if (cardElement) {
                cardElement.classList.remove("hiddenCard");
                cardElement.style.backgroundImage = `url(${card.image_url})`; // Setze das Hintergrundbil
            }
        });
    })
    .catch(error => console.error("Fehler beim Laden der Karten:", error));

    const $cards = $(".tcg-card");

    $cards.on("click", function() {
        const cardElement = $(this);
        const imgSrc = cardElement.css("background-image").slice(5, -2); // Extrahiere die URL aus dem Hintergrundbild
        const cardName = cardElement.find(".text-container p").first().text(); // Hier wird der Name aus dem text-container geholt

        $("#tcg-modal-img").attr("src", imgSrc);
        $("#tcg-caption").text(cardName);
        $("#tcg-modal").css("display", "block");
    });

    // Schließe das Modal, wenn das Schließen-Symbol oder der Hintergrund geklickt wird
    $(".tcg-close").off("click").on("click", function() {
        $("#tcg-modal").css("display", "none");
    });

    // Schließe das Modal, wenn der Benutzer außerhalb des Bildes klickt
    $("#tcg-modal").off("click").on("click", function(e) {
        if (e.target === this) {
            $(this).css("display", "none");
        }
    });
}


$cards.on("mousemove touchmove", function(e) {
    // Normalisiere Touch-/Mouse-Position
    var pos = [e.offsetX, e.offsetY];
    e.preventDefault();
    if (e.type === "touchmove") {
        pos = [e.touches[0].clientX, e.touches[0].clientY];
    }
    
    var $card = $(this);

    // Speichere das aktuelle Hintergrundbild
    var currentBackgroundImage = $card.css('background-image');

    // Berechnungen für die Mouse-Position
    var l = pos[0];
    var t = pos[1];
    var h = $card.height();
    var w = $card.width();
    var px = Math.abs(Math.floor(100 / w * l) - 100);
    var py = Math.abs(Math.floor(100 / h * t) - 100);
    var pa = (50 - px) + (50 - py);
    
    // Berechnungen für den Hintergrund und Effekte
    var lp = (50 + (px - 50) / 1.5);
    var tp = (50 + (py - 50) / 1.5);
    var px_spark = (50 + (px - 50) / 7);
    var py_spark = (50 + (py - 50) / 7);
    var ty = ((tp - 50) / 2) * -1;
    var tx = ((lp - 50) / 1.5) * 0.5;

    // CSS für aktive Karte
    var grad_pos = `background-position: ${lp}% ${tp}%;`;
    var sprk_pos = `background-position: ${px_spark}% ${py_spark}%;`;
    var tf = `transform: rotateX(${ty}deg) rotateY(${tx}deg)`;

    // Setze die CSS-Eigenschaften der Karte
    $card.css({
        'background-image': currentBackgroundImage, // Behalte das Hintergrundbild
        'transform': tf
    });

    // CSS für Pseudoelemente hinzufügen
    var style = `
      .tcg-card:hover:before { ${grad_pos} }  /* gradient */
      .tcg-card:hover:after { ${sprk_pos} }   /* sparkles */
    `;
    
    // Setze die CSS-Klasse und den Stil
    $cards.removeClass("active");
    $card.removeClass("animated");
    $style.html(style);

    if (e.type === "touchmove") {
        return false; 
    }
    clearTimeout(x);
}).on("mouseout touchend touchcancel", function() {
    // Entferne CSS und wende die benutzerdefinierte Animation beim Ende an
    var $card = $(this);
    $style.html("");
    
    // Setze nur Transformations- und Opazitätsstile zurück, ohne das Hintergrundbild zu entfernen
    $card.css({
        'transform': '',
        'opacity': ''
    });
    
    x = setTimeout(function() {
        $card.addClass("animated");
    }, 2500);
});


  </script>