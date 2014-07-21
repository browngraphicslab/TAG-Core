

<?php

/*
Template Name: Start
*/
?>
<!DOCTYPE html>

<html <?php language_attributes(); ?>>
    <head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width" />
    <title>GlacierWorks</title>
    <script type="text/javascript" src="//use.typekit.net/svg1zem.js"></script>
    <script type="text/javascript">try{Typekit.load();}catch(e){}</script>
    <link rel="stylesheet" href='<?php echo get_stylesheet_directory_uri(); ?>/start.css' type='text/css' media='all' />

</head>

    <body>
        <div id="bg"></div>
        <div id="sidebar">
            
            <div id="content-host">
                
                <!-- glacierworks logo -->
                <div id="gwlogo"></div>

                <!-- content -->
                <?php while ( have_posts() ) : the_post(); ?>
                <?
                
                function GetCustom($postid, $key) {
                
                    $data = get_post_meta($postid, $key, true);
                    
                    $lines = preg_split('/\r\n|\n|\r/', trim($data));

                    for ($i = 0; $i < count($lines); $i++) {
                        $lines[$i] = trim($lines[$i]);
                    }   
                    
                    return $lines;                 
                }
                  
                $actions = GetCustom($post->ID, 'actions');
                $actions_links = GetCustom($post->ID, 'actions_links');
                $actions_text = GetCustom($post->ID, 'actions_text');
                $menu = GetCustom($post->ID, 'menu');
                $menu_links = GetCustom($post->ID, 'menu_links');
                
                // create the links menu
                echo '<div id="menu">';
                for ($i = 0; $i < count($menu); $i++) {
                    echo '<a class="menu-link" href="' . $menu_links[$i] . '">' . $menu[$i] . '</a>';
                    //echo '<a class="menu-link" href=""></a>';
                }                    
                echo '</div>';
                
                // create the actions menu
                echo '<div id="actions">';
                for ($i = 0; $i < count($menu); $i++) {
                    echo '<a class="action-link" href="' . $actuions_links[$i] . '"><h2>' . $actions[$i] . '</h2>' . $actions_text[$i] . '</a>';
                    //echo '<a class="menu-link" href=""></a>';
                }                    
                echo '</div>';
                ?>
                
                <div id="content">
                    <?php the_content(); ?>
                </div>
                
                <div id="social">
                    <a id="facebook" href="http://www.facebook.com/pages/GlacierWorks/223864927659716" class="social-link" target="_blank"></a>
                    <a id="twitter" href="http://twitter.com/GlacierWorks" class="social-link" target="_blank"></a>
                    <a id="tumblr" href="http://glacierworks.tumblr.com/" class="social-link" target="_blank"></a>
                    <a id="googleplus" href="https://plus.google.com/u/0/b/117673343843752201872/117673343843752201872/about" class="social-link" target="_blank"></a>
                <div>

                <?php endwhile; ?>
                
            </div>
            
            <!-- ie logo -->
            <div id="ielogo"></div>
        </div>
        
        <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>        
    </body>
</html>

