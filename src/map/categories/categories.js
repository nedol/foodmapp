export {Categories};

import {Overlay} from "../overlay/overlay";
import {Utils} from "../../utils/utils";

let utils = new Utils();

class Categories {

    constructor(map) {
        this.map = map;

        $('#category_include').css('display', 'block');

        let catAr = [
            {"id": "0", "state": "0"},
            {"id": "10", "state": "0"},
            {"id": "3", "state": "1"},
            {"id": "20", "state": "1"},
            {"id": "30", "state": "1"},
            {"id": "40", "state": "1"},
            {"id": "50", "state": "0"},
            {"id": "60", "state": "0"},
            {"id": "70", "state": "0"},
            {"id": "80", "state": "0"},
            {"id": "90","state": "0"},
            {"id": "100","state": "0"},
            {"id": "110","state": "0"}
        ];
        let state_cat = localStorage.getItem("state_category");
        if (state_cat)
            catAr = JSON.parse(state_cat);
        else {
            localStorage.setItem("state_category", JSON.stringify(catAr));
        }

        let inputs = $(".category[state]");
        //console.log("InitCategories:"+inputs.length);//possible problem (inputs.length===0), need to delay sript load
        if (inputs.length > 0) {
            try {
                for (let c in catAr) {
                    if (!inputs[c])
                        continue;
                    if ($(inputs[c]).attr('state') !== catAr[c].state) {
                        $(inputs[c]).attr('state', $(inputs[c]).attr('state') === '1' ? '0' : '1');
                        $(inputs[c]).css('opacity', $(inputs[c]).attr('state') === '1' ? 1 : 0.3);
                    }
                    let cat = $(inputs[c]).attr('id');
                    if (!localStorage.getItem("ic_" + cat)) {
                        let img = new Image();
                        img.src = './images/ic_' + cat + ".png";
                        img.alt = cat;
                        localStorage.setItem("ic_" + cat, './images/ic_' + cat + ".png");
                        img.onload = function (ev) {
                            let w = this.width;
                            let h = this.height;
                            let dev = (w > h ? w : h);
                            let scale = (42 / dev).toPrecision(6);//.toFixed(6);
                            utils.createThumb(this, this.width * scale, this.height * scale, this.alt, function (thmb, category) {
                                //localStorage.setItem("ic_" + category, thmb.src);
                                if (category === cat) {
                                    //callback();
                                    return;
                                }
                            });
                        };
                    }
                }

                //callback();

            } catch (ex) {
                alert(ex);
            }
        }

        $('.category').on('click', this,this.OnClickCategory);


        $('#category_container').on('click', function () {
            if (!$('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });
        });
    }

    OnClickCategory(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let that = ev.data;
        let el = ev.target;
        $(el).attr('state', $(el).attr('state') === '1' ? '0' : '1');
        $(el).css('opacity', $(el).attr('state') === '1' ? 1 : 0.3);

        let layers = that.map.ol_map.getLayers().values_;
        let id = $(el).attr('id');

        for(let l in layers) {
            if(parseInt(l) ===parseInt(id))
                layers[l].setVisible(($(el).attr('state') === '0' ? false : true));
        }

        let cats = $(".category").toArray();
        cats = $.map(cats, function (el) {
            return {id: $(el).attr('id'), state: $(el).attr('state')};
        });
        localStorage.setItem("state_category", JSON.stringify(cats));

        window.user.import.ImportDataByLocation(ev);
    }
}