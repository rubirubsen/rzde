<?php
$datum = date("d.m.Y",strtotime('+2 hours'));
$uhrzeit = date("H:i",strtotime('+2 hours'));
?>
<?php include('navbar.php'); ?>
<br>
Es ist der <?php echo $datum ?> und es ist <?php echo $uhrzeit." Uhr." ?>
<?php include('footer.php'); ?>