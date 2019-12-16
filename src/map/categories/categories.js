export {Categories};

import {Utils} from "../../utils/utils";
import proj from 'ol/proj';
import Extent from 'ol/extent';

let utils = new Utils();

(function($) {
    $.fn.longTap = function(longTapCallback) {
        return this.each(function(){
            var elm = this;
            var pressTimer;
            $(elm).on('touchend mouseup', function (e) {
                clearTimeout(pressTimer);
            });
            $(elm).on('touchstart mousedown', function (e) {
                // Set timeout
                pressTimer = window.setTimeout(function () {
                    longTapCallback.call(elm);
                }, 500)
            });
        });
    }
})(jQuery);

class Categories {

    constructor(map) {
        this.map = map;

        $('#category_include').css('display', 'block');

        let inputs = $(".main_category");

        $(inputs).attr('state', 0);
        $(inputs).css('opacity',0.3);

        let catAr = [];
        let state_cat = localStorage.getItem("state_category");

        let arCatPar = [];
        try {
            arCatPar = JSON.parse(utils.getParameterByName('cat'));
        }catch(ex){

        }

        inputs = $(".category");
        if (state_cat) {
            catAr = JSON.parse(state_cat);
            $(inputs).attr('state', 0);
            $(inputs).css('opacity', 0.3);
        } else {
            localStorage.setItem("state_category", JSON.stringify(catAr));
        }

        window.db.GetOffer(window.user.date, function (obj) {
            if(obj[0])
                for(let item in obj[0].data){
                    $('[cat="'+item+'"]').attr('state','1').css('opacity', '1');
                    $('[cat="'+item+'"]').parents('.dropup').find('.main_category').attr('state', 1);
                    $('[cat="'+item+'"]').parents('.dropup').find('.main_category').css('opacity', 1);
                }

            if($('.category[state="1"]').length===0)
                $('#categories[data-toggle="tooltip"]').tooltip("show");

            $('#loc_ctrl[data-toggle="tooltip"]').tooltip("show");
        });

        if (inputs.length > 0) {
            try {
                let arr = inputs.toArray();
                for (let c in arr) {
                    if (!inputs[c]) {
                        continue;
                    }
                    let id = inputs[c].id;
                    let cat = _.find( catAr, {id:id});
                    if(!cat) {
                        catAr.push( {id: id, state: $(inputs[c]).attr('state')});
                        $(inputs[c]).css('opacity', $(inputs[c]).attr('state') === '1' ? 1 : 0.3);
                        if($(inputs[c]).attr('state')==='1'){
                            $(inputs[c]).parents('.dropup').find('.main_category').attr('state', 1);
                            $(inputs[c]).parents('.dropup').find('.main_category').css('opacity', 1);
                        }
                        localStorage.setItem("state_category", JSON.stringify(catAr));
                        continue;
                    }
                    $(inputs[c]).attr('state', cat.state);
                    $(inputs[c]).css('opacity', cat.state === '1' ? 1 : 0.3);

                    if($(inputs[c]).attr('state')==='1'){
                        $(inputs[c]).parents('.dropup').find('.main_category').attr('state', 1);
                        $(inputs[c]).parents('.dropup').find('.main_category').css('opacity', 1);
                    }

                    // $(inputs[c]).after('<h2 class="title">'+$(inputs[c]).attr('title')+'</h2>');

                    if (!localStorage.getItem("ic_" + cat.id)) {
                        let img = new Image();
                        img.src = './images/ic_' + cat.id + ".png";
                        img.alt = cat.id;
                        localStorage.setItem("ic_" + cat.id, './images/ic_' + cat.id + ".png");
                        img.onload = function (ev) {
                            let w = this.width;
                            let h = this.height;
                            let dev = (w > h ? w : h);
                            let scale = (42 / dev).toPrecision(6);//.toFixed(6);
                            utils.createThumb(this, this.width * scale, this.height * scale, this.alt, function (thmb, category) {
                                //localStorage.setItem("ic_" + category, thmb.src);
                                if (category === cat.id) {
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

            //window.user.import.ImportDataByLocation(null);
        }

        for(let c in arCatPar) {
            let id  = arCatPar[c];
            $('.category[id="'+id+'"]').attr('state','1');
            $('.category[id="'+id+'"]').css('opacity','1');
            $('.category[id="'+id+'"]').parents('.dropup').find('.main_category').attr('state', 1);
            $('.category[id="'+id+'"]').parents('.dropup').find('.main_category').css('opacity', 1);
        }


        $(".dropup").on("hide.bs.dropdown", function(event){
            // $('#categories').css('overflow','hidden');
            // $('#categories').css('overflow-x','auto');
            return false;
        });

        $(".dropup").on("show.bs.dropdown", function(event){
            // var id = $(event.relatedTarget).attr('id');
            // $(event.relatedTarget).next().dropdown();
            // $('#categories').css('overflow','');
            // $('#categories').css('overflow-x','');
            // return false;
        });



        $('.category').on('click', this,this.OnClickCategory);

        $('#category_container').on('click', function () {
            if (!$('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });
        });

        $('.main_category').on('click touchstart', function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
        });

        $('.main_category').off();
        $('.main_category').longTap( function (ev) {

            if($(this).attr('visible')==='true')
                $(this).parent().find('.category[state="0"]').trigger('click');
            else
                $(this).parent().find('.category[state="1"]').trigger('click');
            $(this).css('opacity', $(this).attr('visible')==='true' ? '1' : '0.3');
            $(this).attr('visible',$(this).attr('visible')==='true'?'false':'true');
            return true;
        });

        let isDown = false, isScroll = false ;
        let startX;
        let scrollLeft;

        $('.dropdown-menu').on("mousedown", function(e) {
            isDown = true;
            this.classList.add("active");
            startX = e.pageX - this.offsetLeft;
            scrollLeft = this.scrollLeft;
        });
        $('.dropdown-menu').on("mouseleave", function() {

            isDown = false;
            this.classList.remove("active");
        });
        $('.dropdown-menu').on("mouseup", function() {

            setTimeout(function () {
                isScroll = false;
            },100);
            isDown = false;
            this.classList.remove("active");
            return false;
        });
        $('.dropdown-menu').on("mousemove", function(e) {

            if (!isDown) return;
            isScroll = true;
            e.preventDefault();
            const x = e.pageX - this.offsetLeft;
            const walk = x - startX;
            this.scrollLeft = scrollLeft - walk;
        });
        $("#categories").on('click', function (e) {
            if(!isScroll)
                $('.dropdown-menu').removeClass('show');
        });

        setTimeout(function () {
            map.ol_map.on('moveend', function (event) {
                //if ($('#categories').is(':visible') && $('.category[state="1"]').length>0)
                    // $('#categories').slideToggle('slow', function () {
                    //
                    // });
            });
        },1000*5)

    }


    OnClickCategory(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        $('#categories[data-toggle="tooltip"]').tooltip("dispose");

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

        let state_category = JSON.parse(localStorage.getItem("state_category"));
        let cat = _.find(state_category, {id:id});
        if(!cat) {
            cat = {id: id, state: $(el).attr('state')};
            state_category.push(cat);
        }
        cat.state = $(el).attr('state');
        localStorage.setItem("state_category", JSON.stringify(state_category));

        if($(el).parent().find('[state=1]').length>0) {
            $(el).parents('.dropup').find('.main_category').attr('state', 1);
            $(el).parents('.dropup').find('.main_category').css('opacity', 1);
        }else {
            $(el).parents('.dropup').find('.main_category').attr('state', 0);
            $(el).parents('.dropup').find('.main_category').css('opacity', 0.3);
        }

        if(window.user.constructor.name!=='Supplier')
            window.user.import.ImportDataByLocation(ev);

        setTimeout(function (ev) {
            that.map.ol_map.dispatchEvent('moveend');
        },100)

    }

}