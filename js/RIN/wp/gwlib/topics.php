<?php

/*
Template Name: Topics
*/

/**
 * The topics (tags) page for the theme.
 *
 * @package gwlib
 */
 

 
 
get_header(); ?>
 
     <section class="full content-area topics col">
         <div id="content" class="site-content" role="main">
 
            <?php
            
            
            
            

  $tags = get_terms('post_tag');
  $break = ceil(count($tags) / 3);
  $curr = 0;
  
  echo '<div class="topic-list col">';
  
  foreach ( $tags as $key => $tag ) {
      
      if ($curr > 0 && $curr % $break == 0) {
        //echo $curr;
        echo '</div>';
        echo '<div class="topic-list col">';
          
      }
      
      $curr++;
      
      //$link = get_term_link( intval($tag->term_id), 'post_tag' );
      echo '<h3 class="topic-name">' . $tag->name . '</h3>';
      
      $query = new WP_Query( 'tag_id=' . $tag->term_taxonomy_id);
      
      if ( $query->have_posts() ) {
          echo '<ul>';
          while ( $query->have_posts() ) {
              $query->the_post();
              echo '<li><a href="' . get_permalink() . '">' . get_the_title() . '</a></li>';
          }
          echo '</ul>';
      } else {
          // shouldn't have no results
      }
      
      
  //     if ( 'edit' == 'view' )
  //         $link = get_edit_tag_link( $tag->term_id, 'post_tag' );
  //     else
  //         $link = get_term_link( intval($tag->term_id), 'post_tag' );
  //     if ( is_wp_error( $link ) )
  //         return false;
  // 
  //     $tags[ $key ]->link = $link;
  //     $tags[ $key ]->id = $tag->term_id;
  //     $tags[ $key ]->name = $tag->name;
  //     echo ' <a href="'. $link .'">' . $tag->name . '</a>';
  }
  
  echo '</div>';
  // 
  // 
  // return $tags;

            
            ?>
 
         </div>
     </section>
 
<?php get_footer(); ?>
