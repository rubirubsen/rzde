<?php

?>
</div>
</div>
<script>

    document.addEventListener("DOMContentLoaded", function() {
        console.log('Page loaded.');
        var scrollContent = document.getElementById('mainContent');
        var navBar = document.getElementById('navbar');

        scrollContent.addEventListener('scroll',function(){
            var navBar = document.getElementById('navbar');
            var imgHead = document.getElementById('imgHead');
            var rect = navBar.getBoundingClientRect();
            var rect2 =  imgHead.getBoundingClientRect();
            console.log('navBar Top: ',rect.top);
            console.log('HeadImg Top: ', rect2.top);
            if(rect2.top <= -167){
                navBar.classList.add('sticky');
            }else{
                navBar.classList.remove('sticky');
            }
        })
    });

</script>

</body>
</html>
