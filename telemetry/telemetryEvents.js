
TAG.TelemetryEvents = (function () {

    return {
        initEventProperties: initEventProperties
    };

    function initEventProperties(tobj){
        switch (tobj.ttype){
            //Collections Page Events
            case "BackButton":
                tobj.current_page = null;
                tobj.next_page = null;
                tobj.time_spent = null;
                tobj.is_splitscreen = null;
                break;
            case "SortOptions":
                tobj.sort_type = null;
                tobj.current_collection = null;
                tobj.is_splitscreen = null;
                break;
            case "Search":
                tobj.search_text = null;
                tobj.current_collection = null;
                tobj.number_of_matches = null;
                tobj.is_splitscreen = null;
                break;
            case "CollectionsNavigation":
                tobj.current_collection = null;
                tobj.next_collection = null;
                tobj.time_spent = null;
                tobj.navigation_type = null;
                tobj.is_splitscreen = null;
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
                tobj.is_splitscreen = null;
                break;
            case "Overlay":
                tobj.overlay_type = null; //info or tutorial page
                tobj.current_page = null;
                tobj.time_spent = null;
                tobj.is_splitscreen = null;
                break;
            //Artwork Viewer Events
            case "Description":
                tobj.current_artwork = null;
                tobj.toggle = null; //expanded or collapsed
                tobj.time_spent = null;
                tobj.is_splitscreen = null;
                break;
            case "Maps":
                tobj.current_artwork = null;
                tobj.expanded = null;
                tobj.pins_clicked = null;
                tobj.locations_clicked = null;
                tobj.maps_viewed = null;
                tobj.collapsed = null; //by the minus sign or the arrow icon - which
                tobj.time_spent = null;
                tobj.is_splitscreen = null;
                break;
            case "AssociatedMedia":
                tobj.current_artwork = null;
                tobj.assoc_media = null; //the associated media that was clicked
                tobj.assoc_media_interactions = null; //TODO what is this
                tobj.is_splitscreen = null;
                break;
            case "GenericArtworkEvent":
                tobj.event_type = null; //Tour Clicked in artwork viewer, hide menu arrow in artwork viewer, navigation minimap interaction, splitscreen initialized/closed
                tobj.current_artwork = null;
                tobj.is_splitscreen = null;
                break;
            case "ControlButton":
                tobj.button = null;
                tobj.current_artwork = null;
                tobj.is_splitscreen = null;
                break;
            default:
                console.log("ERROR!!!! NOT A VALID EVENT!!!");
                break;
        }
    }

})();