<?php
require('creds.php');
$dbname = 'dayz';

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
$query = "SELECT [id]
      ,[txtItemName]
      ,[txtItemId]
      ,[txtImageUrl]
      ,[txtCategory]
  FROM [dayz].[dbo].[tblItems]";
$result = sqlsrv_query($conn, $query);

// Loop through results
$arrItems = [];
while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC)) {
    $arrItems[$row['id']]['txtItemName'] =  $row['txtItemName'];
    $arrItems[$row['id']]['txtItemId'] = $row['txtItemId'];
    $arrItems[$row['id']]['url'] = $row['txtImageUrl'];
    $arrItems[$row['id']]['category'] = $row['txtCategory'];
}
// Free statement and close connection
sqlsrv_free_stmt($result);
sqlsrv_close($conn);

//echo "<pre>";
//print_r($arrItems);
//exit;
?>
<?php include('navbar.php'); ?>

<div class="dayZcontainer">
    <div class="dayZtable">
        <table>
            <tr>
                <td colspan="4" style="text-align: center"><h1>Clothing</h1></td>
            </tr>
            <tr>
               <th>Item Name</th><th>ItemId</th><th>Kategorie</th><th>Bild</th>
            </tr>
            <?php foreach($arrItems as $key => $item): ?>
            <tr>
                <td><?php echo $item['txtItemName'] ?></td>
                <td><?php echo $item['txtItemId'] ?></td>
                <td><?php echo $item['category'] ?></td>
                <td><img src="<?php echo $item['url']?>" style="max-height: 50px"></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>
<?php include('footer.php'); ?>