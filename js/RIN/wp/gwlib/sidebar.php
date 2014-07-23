<?php
/**
 * The Sidebar containing the main widget areas.
 *
 * @package gwlib
 */
?>
	<div id="secondary" class="secondary sidebar col">
		<?php do_action( 'before_sidebar' ); ?>

		<!--
		<div class="actions">
			<a class="calltoaction" href="/about">
            	<div>
            		<h3>Start Here</h3>
            		Start here to learn more about the site and how to use it.
            	</div>
            	<i class="icon-arrow-right"></i>
            </a>
            <a class="calltoaction" href="http://explore.glacierworks.org">
            	<div>
            		<h3>Rivers of Ice</h3>
            		Get to know the region with our online exploration of Mount Everest.
            	</div>
            	<i class="icon-arrow-right"></i>
            </a>
            <a class="calltoaction" href="http://glacierworks.org/home">
            	<div>
            		<h3>GlacierWorks Home</h3>
            		Learn more about our committment to further research of the Himalaya.
            	</div>
            	<i class="icon-arrow-right"></i>
            </a>
        </div>
    -->
				
		<?php /*if ( ! dynamic_sidebar( 'sidebar-1' ) ) :*/ ?>
			<ul class="links">
			<?
			
			$args = array(
				'orderby'          => 'id',
				'order'            => 'ASC',
				'limit'            => 3,
				'echo'             => 1,
				'show_description' => true,
				'title_li'         => ''
			);
			
			wp_list_bookmarks($args); 
			

			/*
			<aside id="archives" class="widget">
				<h1 class="widget-title"><?php _e( 'Archives', 'gwlib' ); ?></h1>
				<ul>
					<?php wp_get_archives( array( 'type' => 'monthly' ) ); ?>
				</ul>
			</aside>

			<aside id="meta" class="widget">
				<h1 class="widget-title"><?php _e( 'Meta', 'gwlib' ); ?></h1>
				<ul>
					<?php wp_register(); ?>
					<li><?php wp_loginout(); ?></li>
					<?php wp_meta(); ?>
				</ul>
			</aside>
			*/
			
			?>
			</ul>

		<?php /*endif; */ // end sidebar widget area ?>
	</div><!-- #secondary -->
