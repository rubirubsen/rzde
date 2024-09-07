<?php
require('creds.php');


// Create connection
/** @var string $servername */
/** @var string $username */
/** @var string $password */
/** @var string $dbname */
$conn = sqlsrv_connect($servername, array("UID"=>$username, "PWD"=>$password, "Database"=>$dbname));


// Check connection
if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}

// Execute query
$query = "SELECT [id],[title],[description],[url],[port]
  FROM [rzde].[dbo].[tblServer]";

$result = sqlsrv_query($conn, $query);

// Loop through results
$arrItems = [];
while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC)) {
    $arrItems[$row['id']]['txtTitle'] =  $row['title'];
    $arrItems[$row['id']]['txtItemId'] = $row['id'];
    $arrItems[$row['id']]['url'] = $row['url'];
    $arrItems[$row['id']]['port'] = $row['port'];
    $arrItems[$row['id']]['description'] = $row['description'];
}
// Free statement and close connection
sqlsrv_free_stmt($result);
sqlsrv_close($conn);

//echo "<pre>";
//print_r($arrItems);
//exit;
?>
<?php include('navbar.php'); ?>

    <div class="serverContainer" style="margin:auto;width: fit-content;">
    <div class="serverTable" style="text-align: center;margin:auto">
        <table style="border-radius: 5px; border-width: 2px">
            <tr>
                <th colspan="5" style="text-align: center"><h1>Aktuelle Server</h1></th>
            </tr>
            <tr>
                <th>Id</th><th>Spiel</th><th>Beschreibung</th><th>URL</th><th>Port</th>
            </tr>
            <?php foreach($arrItems as $key => $item): ?>
                <tr>
                    <td><?php echo $item['txtItemId'] ?></td>
                    <td><?php echo $item['txtTitle'] ?></td>
                    <td><?php echo $item['description'] ?></td>
                    <td><?php echo $item['url']?></td>
                    <td><?php echo $item['port']?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>
</div>
<?php include('footer.php'); ?>