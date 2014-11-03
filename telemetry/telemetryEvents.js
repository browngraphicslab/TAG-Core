
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
            case "Maps":        //done needs to be tested //Moved the drawer aspect to the generic Drawer event. 
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
                tobj.offscreen = null;
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
                tobj.input_device = null;
                break;
            case "VideoPlayer":
                tobj.current_video = null;
                tobj.collection = null;
                tobj.interaction = null;
                tobj.input_device = null;
                break;

            //AUTHORING EVENTS
            
            //General Use Timers (not connected to a specific event)
            case "PageLoadTime":                                                    //done: settingsview load time, artwork editor load time, tour editor load time (david)
                tobj.destination_page = null; //what the destination page is
                tobj.source_page = null; //what the source page was
                tobj.load_time = null;
                tobj.identifier = null; //another field containing the ID of the artwork, tour being loaded (when applicable)
                break;
            case "SpentTime": //the time spent on a page or action                  //done: settingsview, artwork editor, tour authoring (david)
                tobj.item = null; //the page or action in question
                tobj.time_spent = null;
                break;
            case "LoadTime": //load time for a specific item, action or process
                tobj.item = null; //what is being loaded
                tobj.load_time = null;
                break;

            //All back buttons
            case "AuthoringBackButton":
                tobj.source_page = null;
                tobj.destination_page = null;
                break;

            //All cancel buttons
            case "AuthoringCancelButton":
                tobj.cancelled_action = null; //what was cancelled
                break;

            //SettingsView
            case "LeftBarSelection":
                tobj.category_name = null;
                tobj.middle_bar_load_count = null;
                tobj.time_spent = null;
                break;
            case "MiddleBarSelection":
                tobj.type_representation = null; //(i.e. artwork, collection, media, setting)
                tobj.time_spent = null;
                break;
            case "ImportButton":
                tobj.element_type = null; //artwork/media
                break;
            case "EndOfImport":
                tobj.number_imported = null;
                tobj.element_type = null; //artwork/media
                break;
            case "EditorButton":
                tobj.edit_type = null; //Manage Collection, Artwork Editor, Edit Tour, or Manage Associations 
                tobj.element_id = null; //ID of the object if applicable
                break;
            case "Visibility":
                tobj.toggle_state = null;
                tobj.collection_id = null;
                break;
            case "BackgroundImage":
                break;
            case "DeleteButton":
                tobj.element_type = null;
                break;
            case "SaveButton":
                tobj.element_type = null;
                break;
            case "DuplicateTour":
                break;
            case "Publish":
                tobj.toggle_state = null;
                tobj.element_type = null; //collection/tour
                break;
            case "LockToArtwork":
                tobj.toggle_state = null;
                break;

            //Artwork Editor
            case "AddRemoveAssocMedia":
                tobj.net_change = null; //number added or removed
                tobj.time_spent = null;
                break;
            case "CaptureArtworkThumbnail":
                break;
            case "EditMaps":
                tobj.time_spent = null;
                break;
            case "ShowHideBingMap":
                tobj.current_state = null;
                break;
            case "ImportMap":
                break;
            case "AddLocation":
                break;
            case "SortByTitle":
                break;
            case "SortByDate":
                break;
            case "Metadata":
                break;
            case "AddCustomField":
                break;
            case "RemoveCustonField":
                break;

            //Tour Authoring (for feature utilization)
            case "AddTrack":
                tobj.track_type = null;
                tobj.quantity = null;
                break;
            case "MultiSelect":
                break;
            case "SaveTour":
                break;
            case "ZoomSlider":
                break
            case "Undo":
                break;
            case "Redo":
                break;
            case "CaptureTourThumbnail":
                break;
            case "ChangeTourLength":
                break;
            case "ExportTourData":
                break;
            case "MinimizeTrackHeader":
                break;
            case "RenameTrack":
                break;
            case "EditAnnotation":
                break;
            case "DuplicateTrack":
                break;
            case "DeleteTrack":
                break;
            case "DeleteDisplay": //from menu
                break;
            case "DeleteKeyframe": //from menu
                break;
            case "Scrollbar": //click-drag
                break;
            case "Play":
                break;
            case "ResizePreviewArea": //click-drag
                break;
            case "TimelineOverviewBox": //green box below the track area, click-drag
                break;
            case "TimelineOverviewPlayhead": //mini-playhead below track area, click-drag
                break;
            case "ArtworkLabelAssocMediaImport":
                break;
            case "CollectionLabelArtworkImport":
                break;
            case "SearchWhileImporting":
                tobj.element_type = null; //artwork/assoc media
                break;

            //default error
            default:
                console.log(tobj.ttype + " is not a valid event.");
                break;
        }
    }

})();