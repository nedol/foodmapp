export {Settings};
import {MD5} from '../utils/utils';
import {dict,set_lang} from '../dict/dict.js';



import dialogPolyfill from 'dialog-polyfill';


class Settings{

    constructor(map) {
        this.map = map;
        this.init();
    }

    init(){

        window.sets.user = localStorage.getItem(MD5('uname'))===null?window.sets.user: localStorage.getItem(MD5('uname'));

        window.sets.http = location.protocol + "//";

        if (localStorage.getItem("lang")) {
            window.sets.lang = localStorage.getItem("lang");
        } else {
            localStorage.setItem("lang", window.sets.lang);
        }

        $("[lang='" + window.sets.lang + "']").prop("checked", true);
        $("[lang='" + window.sets.lang + "']").trigger("click");

        if (localStorage.getItem("map")) {
            window.sets.map = localStorage.getItem("map");
        } else {
            localStorage.setItem("map", window.sets.map);
        }

        if (dict.hasOwnProperty(window.sets.lang)) {
            set_lang(dict[window.sets.lang]);
        }
    }

    OnClickSettings(el) {

        dialogPolyfill.registerDialog($('#settings_modal')[0]);
        // Now dialog acts like a native <dialog>.

        $('#settings_modal')[0].showModal();

        $('head').append('<link rel="stylesheet" type="text/css" href="../lib/jquery.mobile-1.4.5.css">');

        $('head').append('<script rel="stylesheet" type="text/javascript" href="../lib/jquery.mobile-1.4.5.min.js"></script>');

        let transition = setTimeout(function() {
            $('#settings_modal').addClass('dialog-scale');
        }, 1);

        $('#menu_items').slideToggle('slow', function () {
        });

        //solved in ol_map.css
        // Swap languages when editor changes
        $("input").on( "click", function() {
            let el = $(this)
            if ($(el).attr('lang')) {
                window.sets.lang = $(el).attr('lang').toLowerCase().substring(0, 2);
                window.sets.lang = (window.sets.lang === 'ан' ? 'en' : lang);
                window.sets.lang = (window.sets.lang === 'ру' ? 'ru' : lang);
                localStorage.setItem("lang", window.sets.lang);
                if (dict.hasOwnProperty(window.sets.lang)) {
                    set_lang(dict[window.sets.lang]);
                }
            }else if($(el).attr('data_src')){
                let ds = $("[data_src]:checked");
                let ar = [];
                for(let i=0 ; i<ds.length;i++){
                    ar.push($(ds[i]).attr('data_src'));
                }
                localStorage.setItem("data_src", JSON.stringify(ar));
            }else if($(el).attr('map')){

                function SetMapVisible(map){

                    var layers = map.ol_map.getLayers();
                    layers.forEach(function(layer,i, layers){
                        if(layer.values_.map_type) {
                            layer.setVisible(false);
                        }
                    });

                    $("[map='"+map+"']").attr("checked","checked");

                    switch(map) {
                        case "osm":
                            layers.get("OSM").setVisible(true);
                            break;
                        case "google":
                            layers.get("Google").setVisible(true);
                            break;
                        case "bing":
                            layers.get("Bing").setVisible(true);
                            break;
                    }
                }
                localStorage.setItem("map", $(el).attr('map'));
                SetMapVisible($(el).attr('map'));//TODO:

            }else if($(el).attr('drag')){
                let drag = $(el).prop('checked');
                localStorage.setItem("drag", drag);
            }
        });
        $('#close_settings').on('click',this.OnCloseSettings);

    }

    OnCloseSettings() {
        $('#settings_modal')[0].close();
        $('#settings_modal').removeClass('dialog-scale');
        // $('#settings_modal').remove();
        clearTimeout(transition);
        $('head').find('link').last().remove();//remove last file from html file
    }
}
