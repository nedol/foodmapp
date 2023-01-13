export { MapEvents };
// import {OrderViewer} from "../../order/order.viewer";
// import proj from 'ol/proj';
// import Extent from 'ol/extent';
//import {OfferOrder} from "../../customer/init.frame";

import { UtilsMap } from '../../utils/utils.map';
let utils_map = new UtilsMap();
class MapEvents {
  constructor(map) {
    this.map = map;

    const that = this;

    that.map.ol_map.getView().on('propertychange', OnPropertyChange);

    $(window).on('orientationchange', function (event) {
      if (that.map.ol_map) that.map.ol_map.updateSize();
      console.log(
        'the orientation of the device is now ' + screen.orientation.angle
      );
    });

    // When the user clicks anywhere outside of the modal, close it
    $(window).on('click', function (event) {
      console.log();
    });

    function OnPropertyChange(event) {
      that.map.ol_map.dispatchEvent('movestart');
      that.map.ol_map.getView().un('propertychange', OnPropertyChange);
      that.map.ol_map.on('moveend', function () {
        that.map.ol_map.on('propertychange', OnPropertyChange);
      });
    }

    // Map.getView().on('change:center', function (event) {
    //
    // });
  }
}
