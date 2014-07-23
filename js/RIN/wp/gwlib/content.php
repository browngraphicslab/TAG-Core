<?php
/**
 * @package gwlib
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

	<header class="entry-header">
		<h2 class="entry-title"><a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a></h2>


		<?php if ( 'post' == get_post_type() ) : ?>
		<div class="entry-meta">
			<?php gwlib_posted_on(); ?>
		</div>

		<?php endif; ?>
	</header>


	<?php
		$thumb = '';
		if (is_category() && has_post_thumbnail()) {
			$thumb = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
			if ($thumb) {
				echo '<div class="thumb" style="background-image:url(' . $thumb[0] . ');"></div>';
			}
		}
	?>

	<?php if ( is_search() || is_category()) : // Only display Excerpts for Search ?>
	<div class="entry-summary">
		<?php 
			if (is_category() && has_post_thumbnail()) {
				$excerpt = get_the_excerpt();
				if (strlen($excerpt) > 120) {
					$excerpt = substr($excerpt, 0, strpos($excerpt,' ', 120)); 
				}
				echo '<p>' . $excerpt . ' [...]</p>';	
			}
			else {
				the_excerpt();
			}
		?>
	</div>
	<?php else : ?>
	<div class="entry-content">
		<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'gwlib' ) ); ?>
		<?php
			wp_link_pages( array(
				'before' => '<div class="page-links">' . __( 'Pages:', 'gwlib' ),
				'after'  => '</div>',
			) );
		?>
	</div><!-- .entry-content -->
	<?php endif; ?>

	<footer class="entry-meta">
		<?php if ( 'post' == get_post_type() ) : // Hide category and tag text for pages on Search ?>

			<?php
				/* translators: used between list items, there is a space after the comma */
				$tags_list = get_the_tag_list( '', __( ', ', 'gwlib' ) );
				if ( $tags_list ) :
			?>
			<span class="tags-links">
				<?php //printf( __( 'Tagged %1$s', 'gwlib' ), $tags_list ); ?>
			</span>
			<?php endif; // End if $tags_list ?>
		<?php endif; // End if 'post' == get_post_type() ?>

	</footer>
</article>
