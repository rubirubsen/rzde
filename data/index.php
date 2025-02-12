<?php

require('functions.php');
// Credentials verstecken
require('creds.php');

// Create connection
$conn = sqlsrv_connect($servername, array("UID" => $username, "PWD" => $password, "Database" => $dbname, "TrustServerCertificate" => true));

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
    $arrPostings[$i]['titel'] = $row['txtTitel'];
    $arrPostings[$i]['erstellt'] = $row['dateErstellt_am'];
    $arrPostings[$i]['content'] = $row['txtContent'];
    $arrPostings[$i]['imgUrl'] = $row['txtLinkUrl'];
    $arrPostings[$i]['mediaType'] = $row['txtMediaType'];
    $arrPostings[$i]['arrTags'] = $row['arrTags'];
    $i++;
}

// Free statement and close connection
sqlsrv_free_stmt($result);
sqlsrv_close($conn);

include('navbar.php'); 
?>

<div class="newsContainer" style="width:50%; margin:auto;">
    <h1 style="text-decoration:underline; font-size:2em; color:#ff8000; -webkit-text-stroke: 2px black;">Updates</h1>
    <?php foreach ($arrPostings as $key => $newsDetail): ?>
        <div class="newsEntry">
            <div class="newsTitle" style="cursor:pointer;" onclick="openModal('<?php echo $key ?>')">
                <?php
                $newsDate = $newsDetail['erstellt']->format('d.m.Y');
                $newsTime = $newsDetail['erstellt']->format('H:i');
                echo $newsDetail['titel'];
                ?><br>
            </div>
            <div class="newsTimestamp"><?php echo $newsDate; ?></div>
            
            <div id="newsModal<?php echo $key; ?>" class="modal">
                <div class="modalContent">
                    <span class="close" onclick="closeModal('<?php echo $key; ?>')">&times;</span> <!-- Hier platziert -->
                    <div class="newsArticle" style="background: url('<?php echo $newsDetail['imgUrl']; ?>')">
                        <?php if($newsDetail['mediaType'] === 'video'): ?>
                            <video controls width='530px'>
                                <source src="<?php echo $newsDetail['imgUrl'] ?>" type='video/webm'>
                            </video>
                        <?php elseif($newsDetail['mediaType'] === 'youtube'): ?>
                            <iframe width="560" height="315" src="<?php echo $newsDetail['imgUrl'] ?>" 
                            title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; 
                            clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <?php else: ?>
                            <img src="<?php echo $newsDetail['imgUrl'] ?>" width="60%">
                        <?php endif; ?>         
                    </div>

                    <h1 style="font-size: 1.4em"><?php echo $newsDetail['titel'] ?></h1>
                    <div class="newsContent">
                        <?php echo $newsDetail['content'] ?>
                    </div>
                    <div class="newsTimestamp">
                        <?php echo "gepostet am ".$newsDate." um ".$newsTime." von Rubi"; ?>
                    </div>
                </div>  
            </div>
        </div>
        <br>
    <?php endforeach; ?>
</div>

<br>
<script>
function openModal(id) {
    document.getElementById('newsModal' + id).style.display = "block";
}

function closeModal(id) {
    document.getElementById('newsModal' + id).style.display = "none";
}


</script>

<?php include('footer.php'); ?>
