import {MD5} from '../utils';
import {sets} from '../global';
//var Storage = Storage || {};
let Storage = new storage();
function storage(){
    // Проверяем поддержку File API
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Работает


    } else {
        alert('File API не поддерживается данным браузером');
    }

    try {
        var isFileSaverSupported = !!new Blob;
    } catch (e) {
        alert('FileSaverSupported are not fully supported in this browser.');
    }


        var markers = [];
        for (var key in localStorage) {
            if( key!== MD5('uname')
                && key!=='settings'
                && key!=='version'
                && key!=='cur_loc'
                && key!=='state_category'
                && key!=='favourites'
                && key!=='photos'
                && key!=='records'
                && key!=='lang'
                && key !== 'browser_l_t'
                && key !== 'browser_w_h'
                && key !== 'data_src'
                && key!=='drag'
                && key.indexOf('ic_')==-1
            ){
                if (localStorage.getItem("version")) {
                    if (localStorage.getItem("version") !== window.sets.version)
                        localStorage.removeItem(key);
                }

                try {
                    var obj = JSON.parse(localStorage.getItem(key));

                    if (obj.category) {
                        if (!markers[obj.category])
                            markers[obj.category] = new Array();
                        markers[obj.category].push(obj);
                    }
                } catch (ex) {
                    console.log();
                }
            }
        }

        localStorage.setItem('version', window.sets.version);

        for (var c = 0; c < $('.category[state]').length; c++) {
            if (markers[c]) {
                try {
                    SetMarkersArExt(c, markers[c]);
                }catch(ex){

                }
            }
        }

        var res = localStorage.getItem("browser_l_t");
        if (res) {
            res = JSON.parse(res);
            $('#browser_container').css("left", res.left);
            $('#browser_container').css('top', res.top);
        }

        res = localStorage.getItem("browser_w_h");
        if (res) {
            res = JSON.parse(res);
            $('#browser_container').css("width", res.width > $(window).width() ? $(window).width() : res.width);
            $('#browser_container').css('height', res.height > $(window).height() ? $(window).height() : res.height);
        }

    }




