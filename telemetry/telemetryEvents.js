
TAG.TelemetryEvents = (function () {

    return {
        initEventProperties: initEventProperties
    };

    function initEventProperties(tobj){
        switch (tobj.ttype){
            //Collections Page Events
            case "SortOptions":         //done
                tobj.sort_type = null;
                tobj.current_collection = null;
                break;
            case "Search":              //done
                tobj.search_text = null;
                tobj.current_collection = null;
                tobj.number_of_matches = null;
                break;
            case "CollectionsNavigation":       //done
                tobj.current_collection = null;
                tobj.next_collection = null;
                tobj.time_spent = null;
                tobj.navigation_type = null;
                break;
            case "ArtworkPreviewer":
                tobj.click_type = null; //single or double click on the preview tile
                tobj.selected_artwork = null;
                tobj.is_tour = null;
                tobj.current_collection = null;
                tobj.tap_to_explore = null;
                tobj.close_button = null;
                tobj.assoc_media = null;
                tobj.time_spent = null; //time spent in the previewer
                break;
            case "Overlay":                 //Done
                tobj.overlay_type = null; //info or tutorial page
                tobj.current_collection = null;         //Changed from current page to current collection
                tobj.time_spent = null;
                break;
            //Artwork Viewer Events
            case "BackButton": //Done
                tobj.current_artwork = null;
                tobj.next_page = null;
                tobj.time_spent = null;
                break;
            case "Drawer":      //Done minus timer
                tobj.current_artwork = null;
                tobj.toggle = null; //expanded or collapsed
                tobj.time_spent = null;
                tobj.drawer_header = null;
                break;
            case "Maps":        //Moved the drawer aspect to the generic Drawer event. 
                tobj.current_artwork = null;
                tobj.pins_clicked = null;
                tobj.locations_clicked = null;
                tobj.maps_viewed = null;
                tobj.time_spent = null;
                break;
            case "AssociatedMedia":
                tobj.current_artwork = null;
                tobj.assoc_media = null; //the associated media that was clicked
                tobj.assoc_media_interactions = null; //TODO what is this
                break;
            case "GenericArtworkEvent":
                tobj.event_type = null; //Tour Clicked in artwork viewer, hide menu arrow in artwork viewer, navigation minimap interaction, splitscreen initialized/closed
                tobj.current_artwork = null;
                break;
            case "Manipulation": //Done for seaDragon and keypress
                tobj.control_type = null;
                tobj.media_manipulated = null;
                tobj.navigation = null;
                tobj.current_artwork = null;
                break;
            case "ButtonPanelToggled": //Done minus timer
                tobj.current_artwork = null;
                tobj.time_spent = null;
                break;
            case "ToggleSidebar":       //Done minus timer
                tobj.sidebar_open = null;
                tobj.current_artwork = null;
                tobj.time_spent = null;
                break;
            default:
                console.log(tobj.ttype + " is not a valid event.");
                break;
        }
    }

})();