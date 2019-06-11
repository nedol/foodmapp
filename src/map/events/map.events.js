import {OrderViewer} from "../../order/order.viewer";

export {MapEvents}

import proj from 'ol/proj';
import Extent from 'ol/extent';
import {OfferOrder} from "../../customer/init.frame";

import {UtilsMap} from "../../utils/utils.map"
let utils_map = new UtilsMap();
class MapEvents{

    constructor(map){

        this.map = map;

        let that = this;

        $(window).on("orientationchange", function (event) {
            if( that.map.ol_map)
                that.map.ol_map.updateSize();
            console.log("the orientation of the device is now " + screen.orientation.angle);
        });

        // When the user clicks anywhere outside of the modal, close it
        $(window).on('click', function (event) {
            console.log();
        });



        this.map.ol_map.on('movestart', function (event) {
            $(this).trigger('click');
            //Map.getLayers().item(0).setProperties({opacity: 1.0, contrast:1.0});//setBrightness(1);

            //var extent = Map.getView().calculateExtent(Map.getSize());

            // if (!event.loc_mode && $('#categories').is(':visible'))
            //     $('#categories').slideToggle('slow', function () {
            //
            //     });

            // if (!event.loc_mode && $('#menu_items').is(':visible'))
            //     $('#menu_items').slideToggle('slow', function () {
            //     });

        });

        this.map.ol_map.on('pointerdrag', function (event) {
            $("#marker").trigger("change:cur_pos", ["Custom", event]);
            try {
                that.coord.cur = event.target.focus_;
            } catch (ex) {

            }
        });

        this.map.ol_map.on('moveend', function (event) {

            if (event) {
                if (window.user.constructor.name === 'Supplier')
                    return;
                window.user.import.ImportDataByLocation(event);
            }

        });

        this.map.ol_map.getView().on('change:resolution', function (event) {

            var zoom = parseInt(that.map.ol_map.getView().getZoom()).toString();

            $("#zoom_but").text(zoom);
            if (zoom >= 14)
                $("#zoom_but").css('color', 'blue');
            else
                $("#zoom_but").css('color', 'black');

            var bounce = that.map.ol_map.getView().calculateExtent(that.map.ol_map.getSize());
        });

        function OnPropertyChange(event) {
            that.map.ol_map.dispatchEvent('movestart');
            that.map.ol_map.getView().un('propertychange', OnPropertyChange);
            that.map.ol_map.on('moveend', function () {
                that.map.ol_map.on('propertychange', OnPropertyChange);
            });

        };

        this.map.ol_map.getView().on('propertychange',  OnPropertyChange);


        // Map.getView().on('change:center', function (event) {
        //
        // });
    }
}