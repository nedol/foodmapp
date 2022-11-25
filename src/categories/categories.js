'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

import {MPCustomer} from "../customer/customer.mp.js";
import {Utils} from "../utils/utils";
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

export class Categories {

    constructor() {


    }

    initCategories(){

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

        window.db.GetOfferTmplt( function (obj) {
            if(obj)
                for(let item in obj.data){
                    $('[id="'+item+'"]').attr('state','1').css('opacity', '1');
                    $('[id="'+item+'"]').parents('.dropup').find('.main_category').attr('state', 1);
                    $('[id="'+item+'"]').parents('.dropup').find('.main_category').css('opacity', 1);
                }

            if($('#loc_ctrl[data-toggle="tooltip"]').tooltip) {
                if ($('.category[state="1"]').length === 0)
                    $('#categories[data-toggle="tooltip"]').tooltip('show');

                $('#loc_ctrl[data-toggle="tooltip"]').tooltip("show");
            }
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


        $('.category').on('click', this,this.OnClickCategory);

        $('.cat_menu ').on('click', function () {
            if (!$('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });
        });


        $('.mp_open').on('click', function (ev) {

            $('#mp_frame_div').css('display', 'block');
            $('.mp_frame').css('display', 'block');
            $('.mp_frame').attr('src', './customer/mp.customer.html?v='+new Date().valueOf());

            $('.loader').css('display','block');

            window.user.mp = new MPCustomer($(ev.target).closest('.mp_open').attr('user_type'));
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


        this.WordSearch();

    }


    WordSearch() {
        let that = this;
        $('.word_input').on('focusout',function (ev) {
            that.map.map.ol_map.dispatchEvent('moveend');
            if(ev.currentTarget.value==='' || $('.word_btn[value="'+ev.currentTarget.value+'"').length>0)
                return true;
            let word = $('.word_tmplt').clone();
            $('.word_tmplt').parent().append(word);
            $(word).css('display','block');
            $(word).removeClass('word_tmplt');
            $(word).addClass('word');
            $(word).find('.word_btn').val(ev.currentTarget.value).text(ev.currentTarget.value);
            $(word).find('.word_rmv').on('click', function(ev){
                $(this).closest('.word').remove();
                that.map.map.ol_map.dispatchEvent('moveend');
            });
        });
    }
}