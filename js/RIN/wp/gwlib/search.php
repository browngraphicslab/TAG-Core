<?php
/**
 * The template for displaying Search Results pages.
 *
 * @package gwlib
 */

get_header(); ?>

	<section class="primary content-area col search" >
		<div id="content" class="site-content" role="main">

		<?php if ( have_posts() ) : ?>

			<header class="page-header">
				<h1 class="page-title">
    				"<?php printf( __( '%s', 'gwlib' ), '<span>' . get_search_query() . '</span>' ); ?>"
    			</h1>
			</header><!-- .page-header -->

            <div class="row">
			<?php /* Start the Loop */ ?>
			<?php while ( have_posts() ) : the_post(); ?>

    			<?php get_template_part( 'content', 'search' ); ?>

			<?php endwhile; ?>
    		</div>

			<?php gwlib_content_nav( 'nav-below' ); ?>

		<?php else : ?>

			<?php get_template_part( 'no-results', 'search' ); ?>

		<?php endif; ?>

		</div>
	</section>

<?php get_sidebar(); ?>
<?php get_footer(); ?>