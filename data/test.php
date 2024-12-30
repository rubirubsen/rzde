<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animation Beispiel</title>
</head>
<body>
  <div class="animation-container" onclick="startAnimation()">
    <img src="./img/back1.png" alt="Linke Folie" class="folie links">
    <img src="./img/back2.png" alt="Rechte Folie" class="folie rechts">
  </div>

  <style>
    /* Grundstruktur */
    .animation-container {
      position: relative;
      width: 385px;
      height: 555px;
      overflow: hidden;
      cursor: pointer; /* Zeigt an, dass es klickbar ist */
      margin: 50px auto;
      border: 2px solid #ccc;
    }

    .folie {
      position: absolute;
      width: 256px; /* 2/3 von 385 */
      height: 555px; /* gleiche Höhe */
      transform-origin: top left;
      backface-visibility: hidden; /* für bessere Performance */
      transition: transform 1s ease-in-out;
    }

    /* Linke Folie */
    .folie.links {
      top: 0;
      left: 0;
      z-index: 2;
      transform: rotateX(0deg); /* Initial */
    }

    /* Rechte Folie */
    .folie.rechts {
      top: 0;
      right: 0;
      z-index: 1;
      transform: rotateX(0deg); /* Initial */
      transform-origin: top right;
    }

    /* Animation */
    @keyframes aufblaetternRechts {
      0% {
        transform: rotateX(0deg);
      }
      100% {
        transform: rotateX(-180deg); /* Nach unten klappen */
      }
    }

    @keyframes aufblaetternLinks {
      0% {
        transform: rotateX(0deg);
      }
      100% {
        transform: rotateX(180deg); /* Nach unten klappen */
      }
    }

    .folie.links.animate {
      animation: aufblaetternLinks 1s forwards;
    }

    .folie.rechts.animate {
      animation: aufblaetternRechts 1s 1s forwards; /* Verzögert starten */
    }
  </style>

  <script>
    function startAnimation() {
      const links = document.querySelector(".folie.links");
      const rechts = document.querySelector(".folie.rechts");

      // Animation starten
      links.classList.add("animate");
      rechts.classList.add("animate");

      // Optional: Animation zurücksetzen, um sie erneut starten zu können
      setTimeout(() => {
        links.classList.remove("animate");
        rechts.classList.remove("animate");
      }, 2500); // Gesamtdauer beider Animationen
    }
  </script>
</body>
</html>
