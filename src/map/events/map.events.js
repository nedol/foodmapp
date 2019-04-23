import {OrderViewer} from "../../order/order.viewer";

export {MapEvents}

import proj from 'ol/proj';
import Extent from 'ol/extent';
import {OfferOrder} from "../../customer/init.frame";
import {OfferViewer} from "../../supplier/offer.viewer";
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


        this.map.ol_map.on('click', function (event) {
            if (!event.loc_mode) {
                that.map.geo.StopLocation();
                window.user.isShare_loc = false;
            }

            // $('.menu_item', $('.client_frame').contents()).remove();
            // $('#client_frame_container').css('display','none');
            // $('.carousel-indicators', $('.client_frame').contents()).empty();
            // $('.carousel-inner', $('.client_frame').contents()).empty();

            var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

            var latlon = proj.toLonLat(event.coordinate);
            $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            // and add it to the Map

            window.sets.coords.cur = event.coordinate;

            $('#datetimepicker').data("DateTimePicker").hide();

            var time = new Date().getTime();
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });
            if (!event.loc_mode && $('.sup_menu').is(':visible')) {
                $('.sup_menu').animate({'width': 'toggle'});
            }

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });



            that.map.ol_map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
                let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

                let closest = feature.getGeometry().getClosestPoint(event.pixel);

                if(feature.values_)
                if(feature.values_.features && feature.values_.features.length >1) {//cluster

                    var coordinates = [];
                    $.each(feature.values_.features, function (key, feature) {
                        coordinates.push(feature.getGeometry().flatCoordinates);
                    });

                    var extent = Extent.boundingExtent(coordinates);
                    var buf_extent = Extent.buffer(extent, 5);
                    //ol.extent.applyTransform(extent, transformFn, opt_extent)
                    that.map.ol_map.getView().fit(buf_extent, {duration: window.sets.animate_duration});

                    that.map.ol_map.getView().animate({
                            center: feature.getGeometry().flatCoordinates, duration: window.sets.animate_duration
                        },
                        function () {

                        });
                }else {

                    if(feature){
                        if(feature.values_.features && feature.values_.features.length === 1)
                            feature = feature.values_.features[0];

                        if (feature.values_.type === 'supplier') {
                            window.db.GetSupplier(new Date(window.user.date), feature.values_.object.uid, function (obj) {
                                if (obj !== -1) {
                                    if (window.user.constructor.name === 'Supplier') {
                                        //window.user.viewer = new OfferViewer(obj.dict);
                                        $("a[href=#profile]").text('Мой профиль')
                                    }else if (window.user.constructor.name === 'Deliver') {

                                        window.user.viewer = new OfferViewer(obj.dict);
                                        window.user.profile.InitDeliverProfile(obj);

                                        window.user.viewer.OpenOffer(obj);

                                        // window.user.viewer = new OfferOrder();
                                        // window.user.viewer.InitCustomerOrder(obj);

                                    }else if (window.user.constructor.name === 'Customer') {
                                        if (!window.user.viewer) {
                                            window.user.viewer = new OfferOrder();
                                        }
                                        window.user.viewer.InitCustomerOrder(obj);
                                    }

                                }
                            });
                        } else if (feature.values_.type === 'customer') {
                            window.db.GetSupOrders(date, feature.values_.object.supuid, function (objs) {
                                let orderViewer = new OrderViewer();
                                orderViewer.InitOrders(objs);
                            });
                        }
                    }
                }

                return true;
            });
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