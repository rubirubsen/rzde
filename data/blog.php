<?php
require('creds.php');

$conn = sqlsrv_connect($servername, array("UID"=>$username, "PWD"=>$password, "Database"=>$dbname,"TrustServerCertificate"=>true));

// Check connection
if ($conn === false) {
    die(print_r("ALERT: ".sqlsrv_errors(), true));
}

// Execute query
$query = "SELECT *
  FROM [dbo].[tblPostings] 
--   LEFT JOIN [dbo].tblMediaLinks ML ON ml.intPostingId = po.id
  ORDER BY id DESC";
$result = sqlsrv_query($conn, $query);
// Loop through results
$arrPostings = [];
$i = 0;
while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC)) {
    $arrPostings[$i]['titel'] =  $row['txtTitel'];
    $arrPostings[$i]['erstellt'] = $row['dateErstellt_am'];
    $arrPostings[$i]['content'] =  $row['txtContent'];
    $arrPostings[$i]['imgUrl'] = $row['txtLinkUrl'];
    $arrPostings[$i]['mediaType'] = $row['txtMediaType'];
    $arrPostings[$i]['arrTags'] = $row['arrTags'];
    $i++;
}


// Free statement and close connection
sqlsrv_free_stmt($result);
sqlsrv_close($conn);
?>
<?php include('navbar.php'); ?>
<div class="fond">
    <span class="s1"></span>
    <span class="s2"></span>
</div>
<?php foreach($arrPostings as $key => $postingDetail): ?>
<?php
$datumTag = $postingDetail['erstellt']->format('d');
$datumMonat = $postingDetail['erstellt']->format('F');
$datumJahr = $postingDetail['erstellt']->format('Y');
$contentCode = '<div class="blogEntryFull" id="bE_'.$key.'"><div class="closeEntry" id="cE_'.$key.'"><a href="#">X</a></div>';
$contentCode .= $postingDetail["content"].'</div>';
//?>

<div class="card">
    <?php echo $contentCode; ?>
    <div class="thumbnail">

    <?php if($postingDetail['mediaType'] === 'video'):?>
        <video controls width='530px'><source src="<?php echo $postingDetail['imgUrl'] ?>" type='video/webm'>
    <?php else: ?>
        <img class="left" src="<?php echo $postingDetail["imgUrl"]?>">
    <?php endif; ?>
    </div>
    <div class="tags" style="padding-top: 33.5em;position: absolute;z-index: inherit;width: fit-content;color: darkgrey;padding-left: 0.8em;font-size: 0.8em;">
        TAGS COMING HERE SOON
    </div>
    <div class="right">
        <h1><?php echo $postingDetail['titel'] ?></h1>
        <div class="author">
            <img src="https://static-cdn.jtvnw.net/jtv_user_pictures/d30781cf-732a-4b91-8249-874654283e52-profile_image-70x70.png">
            <h2>RubiZockt</h2>
        </div>
        <div class="separator"></div>
        <div class="BlogEntryPreview" style="max-height: 230px; overflow: hidden">
            <?php echo $postingDetail['content'] ?>
        </div>

        <div class="readmore"><a href="#" class="readmore-link" data-id="<?php echo $key; ?>">Mehr lesen...</a></div>
        <h5><?php echo $datumTag; ?></h5>
        <h6><?php echo $datumMonat." ".$datumJahr; ?></h6>
        <ul>
            <li><i class="fa fa-eye fa-2x"></i></li>
            <li><i class="fa fa-heart-o fa-2x"></i></li>
            <li><i class="fa fa-envelope-o fa-2x"></i></li>
            <li><i class="fa fa-share-alt fa-2x"></i></li>
        </ul>
    </div>
</div>
<?php endforeach; ?>
<script>
    $(document).ready(function(){
        $(".blogEntryFull").hide();
        $(".shadow").hide();

        $(".readmore-link").click(function(e){
            e.preventDefault();
            var idNo = $(this).data('id');
            $("#bE_" + idNo).show();
            $(".shadow").show();
            $(this).hide();
        });

        $(".closeEntry a").click(function(e){
            e.preventDefault();
            $(this).parent().parent().hide();
            $(".readmore-link").show();
            $(".shadow").hide();
        });

    });
</script>
<?php include('footer.php'); ?>
