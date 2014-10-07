<?php
/**
 * The Header for our theme.
 *
 * Displays all of the <head> section and everything up till <div id="main">
 *
 * @package gwlib
 */

 
    parse_str($_SERVER['QUERY_STRING']);
    
    if (isset($fullbandwidth)) {
        setcookie ("lowbandwidth", '0', time() + (86400 * 1), '/'); // 86400 = 1 day
        $lowbandwidth = '0';
    }
    
    else if (isset($lowbandwidth)) {
        setcookie('lowbandwidth', true, time() + (86400 * 1), '/'); // 86400 = 1 day
        $lowbandwidth = '1';
    }
    
    else {
        $lowbandwidth = $_COOKIE['lowbandwidth'];
    }
    
    $lowbandwidth = $lowbandwidth == '1';
 
?>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<meta name="viewport" content="width=device-width" />
<title><?php wp_title( '|', true, 'right' ); ?></title>
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />

<?php wp_head(); ?>
    
<?php if(!$lowbandwidth) : ?>
    <script type="text/javascript" src="//use.typekit.net/svg1zem.js"></script>
    <script type="text/javascript">try{Typekit.load();}catch(e){}</script>
<?php endif; ?>
<?php if($lowbandwidth) : ?>
    <style>
        img, .wp-caption, .thumb {
            background: none !important;
            display: none !important;
        }
    </style>
<?php endif; ?>

</head>

<body <?php body_class(); ?>>
    
<?php if (isset($nofonts) || isset($noimages)) : ?>

    <div id="lowbandwidth">
        <strong>
        <?php
            if (isset($nofonts) && isset($noimages)) {
                echo "Custom fonts and most images";
            }
            else if (isset($nofonts)) {
                echo "Custom fonts";
            }
            else {
                echo "Most images";
            }
        ?>
        </strong>
        have been disabled to support a low bandwidth Internet connection. 
        <a href="<?php echo $_SERVER['PHP_SELF']; ?>">Click here for the standard version of this page</a>.
    </div>
    

<?php endif; ?>


    
<div id="page" class="hfeed site">
	<?php do_action( 'before' ); ?>
	<div class="site-header-outer">
    	<header id="masthead" class="site-header" role="banner">
    		<div class="site-branding">
    			<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home">GlacierWorks <em>Learning</em></a></h1>
    		</div>
    
    		<nav id="site-navigation" class="navigation-main" role="navigation">
    			
    			<?php wp_nav_menu( array( 'theme_location' => 'primary' ) ); ?>

                <div class="search-container">
                    <div class="menu-item">Search <i class="icon-search"></i></div>
                    <form method="get" id="searchform" class="searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>" role="search">
                	    <label for="s" class="screen-reader-text"><?php _ex( 'Search', 'assistive text', 'gwlib' ); ?></label>
                	    <input type="search" class="field" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" id="s" placeholder="search..." />
                	</form>
                </div>

    		</nav>
    		
    	</header>
    </div>

	<div id="main" class="site-main row">
    
