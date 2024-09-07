<?php

require('functions.php');
//Credentials verstecken
require('creds.php');

// Create connection
$conn = sqlsrv_connect($servername, array("UID"=>$username, "PWD"=>$password, "Database"=>$dbname,"TrustServerCertificate"=>true));

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
<?php include('navbar.php'); ?>
<div class="newsContainer">
    <h1>Aktuelleres:</h1>
    <?php foreach($arrPostings as $key => $newsDetail): ?>
    <div class="newsEntry">
        <div class="newsTitle">
            <?php
            $newsDate = $newsDetail['erstellt']->format('d.m.Y H:i:s');
            echo $newsDate.": ".$newsDetail['titel'];
            ?>
        </div>
        <div class="newsEntry">
            <?php echo $newsDetail['content'] ?>
        </div>
    </div>
    <br>
    <?php endforeach ?>
</div>
<br>

<?php include('footer.php'); ?>