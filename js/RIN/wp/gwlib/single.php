<?php
/**
 * The Template for displaying all single posts.
 *
 * @package gwlib
 */

get_header(); ?>

	<div id="primary" class="primary col content-area">
    	
		<div id="content" class="site-content single" role="main">
    		<div class="article-host">
    		<?php while ( have_posts() ) : the_post(); ?>
    			<?php get_template_part( 'content', 'single' ); ?>
    		<?php endwhile; // end of the loop. ?>
    	   </div>
		</div>
	</div>

<?php get_footer(); ?>