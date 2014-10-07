<?php

/*
Template Name: Home
*/

function CategoryPosts($cat, $count) {

    $queryargs = array(
        'category_name' => $cat,
        'posts_per_page' => $count
    );

    $query = new WP_Query( $queryargs );

    while ( $query->have_posts() ) {

        $query->the_post();

        // excerpt
        $excerpt = get_the_excerpt();
        if (strlen($excerpt) > 80) {
            $excerpt = substr($excerpt, 0, strpos($excerpt,' ', 70)) . ' [...]'; 
        };

        // thumbnail
        $thumb = 'abc';
        if (has_post_thumbnail()) {
            $thumb = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
            if ($thumb) {
                $thumb = $thumb[0];
            }
        }

        echo '<div class="featured col">';
            echo '<div class="thumb" style="background-image:url(' . $thumb . ');"></div>';
            echo '<h3>' . get_the_title() . '</h3>';
            echo '<summary>' . $excerpt . '</summary>';
            echo '<a class="block-link" href="' . get_permalink() . '"></a>';
        echo '</div>';
    }                    
}

get_header(); ?>

    <div id="primary" class="primary col content-area">
        <div id="content" class="site-content home" role="main">
            <?php if ( have_posts() ) : ?>
                <?php while ( have_posts() ) : the_post(); ?>


                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <div class="entry-content">
                        <?php the_content(); ?>
                        <?php
                            wp_link_pages( array(
                                'before' => '<div class="page-links">' . __( 'Pages:', 'gwlib' ),
                                'after'  => '</div>',
                            ) );
                        ?>
                    </div>
                </article>


                <?php endwhile; ?>
            <?php endif; ?>
        </div>
    </div>

    <div class="col secondary actions">

            <ul class="links">
            <?php
            $args = array(
                'orderby'          => 'id',
                'order'            => 'ASC',
                'limit'            => 3,
                'echo'             => 1,
                'show_description' => true,
                'title_li'         => ''
            );
            wp_list_bookmarks($args); 
            ?>
        </ul>


    </div>

    <h2 class="row section-header">Featured</h2>
    <div class="row">
        <?php CategoryPosts('featured', 3); ?>
    </div>

    <h2 class="row section-header">Essentials</h2>
    <div class="row">
        <?php CategoryPosts('essential', 6); ?>
    </div>

<?php get_footer(); ?>
