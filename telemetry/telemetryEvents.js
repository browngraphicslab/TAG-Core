
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
            case "ArtworkPreviewer": //done but needs testing of all cases
                tobj.is_assoc_media_view = null; //is the collections page on the assoc media view (if true, then selected artwork is actually assoc media, assoc media is actually artwork)
                tobj.click_type = null; //single or double click on the preview tile
                tobj.selected_artwork = null;
                tobj.is_tour = null;
                tobj.current_collection = null;
                tobj.tap_to_explore = null;
                tobj.close = null; //whether the previewer was closed before something in it was clicked
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
            case "Drawer":      //Done
                tobj.current_artwork = null;
                tobj.toggle = null; //expanded or collapsed
                tobj.drawer_header = null;
                tobj.time_spent = null; //ONLY SET FOR MAPS, it doesn't make sense for other drawers
                break;
            case "Maps":        //Moved the drawer aspect to the generic Drawer event. 
                tobj.current_artwork = null;
                tobj.pin_clicked = null;
                tobj.location_clicked = null;
                tobj.map_viewed = null;
                tobj.map_interaction = null;
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
            case "ButtonPanelToggled": //Done - actually registering only when the button panel is open and for how long it was open
                tobj.current_artwork = null;
                tobj.time_spent = null;
                break;
            case "ToggleSidebar":       //Done - registering only when the sidebar menu is open and for how long it is open
                tobj.sidebar_open = null;
                tobj.current_artwork = null;
                tobj.time_spent = null;
                break;
            case "VideoPlayer":
                tobj.current_video = null;
                tobj.collection = null;
                tobj.interaction = null;
                break;
            default:
                console.log(tobj.ttype + " is not a valid event.");
                break;
        }
    }

})();