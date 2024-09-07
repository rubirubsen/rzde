<?php

$datum = date("d.m.Y");
$uhrzeit = date("H:i");

require('creds.php');

// Create connection
$conn = sqlsrv_connect($servername, array("UID"=>$username, "PWD"=>$password, "Database"=>$dbname));

// Check connection
if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}

// Execute query
$query = "SELECT *
  FROM [rzde].[dbo].[tblPostings]
  ORDER BY id DESC";
$result = sqlsrv_query($conn, $query);

// Loop through results
$arrPostings = [];
$i = 0;
while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC)) {
    $arrPostings[$i]['titel'] =  $row['txtTitel'];
    $arrPostings[$i]['erstellt'] = $row['dateErstellt_am'];
    $arrPostings[$i]['content'] =  $row['txtContent'];
    $i++;
}


// Free statement and close connection
sqlsrv_free_stmt($result);
sqlsrv_close($conn);
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <title>RubiZockt bald wieder!</title>
  <link rel="stylesheet" href="css/rubStyle.css">
</head>
<body style="background:darkgrey">

<?php include('navbar.php'); ?>

<div class="blogContainer">
<?php foreach($arrPostings as $key => $postingDetail): ?>
<div class="blogEntry">
    <div class="blogHeader"><?php echo $postingDetail['titel'] ?></div>
    <div class="blogTime"><?php
        $date_string = $postingDetail['erstellt']->format('d.m.Y H:i:s');
        echo $date_string.' Uhr';
        ?></div>
    <hr>
    <div class="entryBody">
        <?php echo $postingDetail['content']; ?>
    </div>
</div>
    <?php endforeach; ?>
</div>