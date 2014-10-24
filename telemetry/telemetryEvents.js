
TAG.TelemetryEvents = (function () {

    return {
        initEventProperties: initEventProperties
    };

    function initEventProperties(tobj){
        switch (tobj.ttype){
            //Collections Page Events
            case "BackButton": //There isn't a back button...
                tobj.current_page = null;
                tobj.next_page = null;
                tobj.time_spent = null;
                break;
            case "SortOptions":         //done
                tobj.sort_type = null;
                tobj.current_collection = null;
                break;
            case "Search":              //done
                tobj.search_text = null;
                tobj.current_collection = null;
                tobj.number_of_matches = null;
                break;
            case "CollectionsNavigation":
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
            case "Overlay":
                tobj.overlay_type = null; //info or tutorial page
                tobj.current_page = null;
                tobj.time_spent = null;
                break;
            //Artwork Viewer Events
            case "Description":
                tobj.current_artwork = null;
                tobj.toggle = null; //expanded or collapsed
                tobj.time_spent = null;
                break;
            case "Maps":
                tobj.current_artwork = null;
                tobj.expanded = null;
                tobj.pins_clicked = null;
                tobj.locations_clicked = null;
                tobj.maps_viewed = null;
                tobj.collapsed = null; //by the minus sign or the arrow icon - which
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
            case "ControlButton":
                tobj.button = null;
                tobj.current_artwork = null;
                break;
            default:
                console.log("ERROR!!!! NOT A VALID EVENT!!!");
                break;
        }
    }

})();