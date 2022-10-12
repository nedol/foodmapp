'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
// require('bootstrap');
// require('bootstrap-select');
import proj from 'ol/proj';
// import 'tablesorter/dist/css/theme.default.min.css';
import 'tablesorter/dist/css/theme.blue.css';
import 'tablesorter/dist/css/jquery.tablesorter.pager.min.css';

import 'tablesorter/dist/css/theme.bootstrap_4.min.css';
import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/widget.grouping.min.css';


require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
require('tablesorter/dist/js/widgets/widget-filter.min.js');
require ('tablesorter/dist/js/widgets/widget-pager.min.js');
// require ('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.tablesorter.pager.min.js');
// require('tablesorter/dist/js/widgets/widget-stickyHeaders.min.js');
// require('tablesorter/dist/js/widgets/widget-grouping.min.js');

// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';

import {OfferOrder} from "./init.frame";
import {Dict} from '../dict/dict.js';
import {Utils} from "../utils/utils";
let utils = new Utils();

import {UtilsMap} from "../utils/utils.map.js";

import wNumb from "wnumb";

let _ = require('lodash');
let md5 = require('md5');

export class MPCustomer{
    constructor(type){
        let that = this;
        
        this.path  ="http://localhost:5500/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = "https://delivery-angels.ru/server";
        else
            this.path = host_port;

        this.type = type;
        this.items = {};

        $('#mp_frame_div').load('./customer/mp.customer.html?v='+ new Date().getTime(),async  function () {

            let promise = new Promise(
                function (resolve, reject) {
                    that.InitOffers(resolve);
                });

            let res = await promise;

            for(let i in $('.tr_item').toArray()){
                let tr = $('.tr_item').toArray()[i];
                let title = $(tr).find('[data-translate]').attr('data-translate');
                window.db.GetApproved(window.user.date, $(tr).attr('supuid'), window.user.uid, function (res) {
                    if (res && res.data[title]) {
                        $(tr).addClass('approved');
                        if (!$('.cat_div[href="#tab_' + $(tr).attr('category') + '"]', $('.mp_categories')).find('.mp_appr_cnt')[0])
                            $('.cat_div[href="#tab_' + $(tr).attr('category') + '"]', $('.mp_categories')).append('<span class="mp_appr_cnt badge badge-pill badge-success">' + 1 + '</span>')
                        else {
                            let cnt = $('.cat_div[href="#tab_' + $(tr).attr('category') + '"]', $('.mp_categories')).find('.mp_appr_cnt').text();
                            $('.cat_div[href="#tab_' + $(tr).attr('category') + '"]', $('.mp_categories')).find('.mp_appr_cnt').text(cnt++);
                        }
                    }
                });
            }

            $('#address').val(window.user.profile.profile.address);

            let sups = $('.tr_item:not(.approved)').map(function(){
                return $(this).attr("supuid");
            }).get();
            sups = _.uniq(sups);
            for(let i in sups) {
                window.db.GetOrder(window.user.date, sups[i], window.user.uid, function (res) {

                    if (res === -1) {
                        return;
                    }
                    for(let title in res.data) {
                        let tr = $('[data-translate="' + title + '"]').closest('tr');

                        if (res.data && res.data[title] && res.data[title]['ordlist']) {
                            let qnty = 0;
                            for (let i  in res.data[title]['ordlist']) {
                                let ord = res.data[title]['ordlist'][i];
                                if (ord.qnty === 0)
                                    continue;
                                tr.find('.dropdown-item:contains(' + i + ')').attr('order', JSON.stringify(ord));
                                tr.find('.ord_amount').text(ord.qnty).val(ord.qnty);
                                tr.addClass(res.data[title].status);
                                tr.prependTo(tr.parent());

                                if (!$(tr).hasClass('approved')) {
                                    let cnt = $('.cat_div[href="#tab_' + tr.attr('category') + '"]', $('.mp_categories')).find('.mp_ord_cnt').text();
                                    if (cnt) {
                                        cnt = parseInt(cnt) + ord.qnty;
                                        $('.cat_div[href="#tab_' + tr.attr('category') + '"]', $('.mp_categories')).find('.mp_ord_cnt').text(String(cnt));
                                    } else {
                                        cnt = String(ord.qnty);
                                        $('.cat_div[href="#tab_' + tr.attr('category') + '"]', $('.mp_categories')).append('<span class="mp_ord_cnt badge badge-pill badge-danger">' + cnt + '</span>')
                                    }
                                }
                            }
                        }
                    }

                    that.items = that.GetOrderItems();
                });
            }

            that.dialog = $("#popup").dialog({
                autoOpen: false,
                height: $(window).height(),
                width:'100%',
                modal: false,
                open: function (event, ui) {
                    $('#popup').css('display','');
                    // Will fire when this popup is opened
                    // jQuery UI Dialog widget

                    $('.mp').tablesorter({
                        theme: 'bootstrap',
                        headers: {
                            // disable sorting of the first & second column - before we would have to had made two entries
                            // note that "first-name" is a class on the span INSIDE the first column th cell
                            '.nosorting' : {
                                // disable it by setting the property sorter to false
                                sorter: false
                            }
                        },
                        widthFixed: true,
                        headerTemplate: '{content} {icon}', // Add icon for various themes
                        widgets: ['columns','zebra', 'filter','pager'],
                        widgetOptions: {

                            zebra : [ "even", "odd" ],
                            // ** NOTE: All default ajax options have been removed from this demo,
                            // see the example-widget-pager-ajax demo for a full list of pager
                            // options

                            // css class names that are added
                            pager_css: {
                                container   : 'tablesorter-pager',    // class added to make included pager.css file work
                                errorRow    : 'tablesorter-errorRow', // error information row (don't include period at beginning); styled in theme file
                                disabled    : 'disabled'              // class added to arrows @ extremes (i.e. prev/first arrows "disabled" on first page)
                            },

                            // jQuery selectors
                            pager_selectors: {
                                container   : '.pager',       // target the pager markup (wrapper)
                                first       : '.first',       // go to first page arrow
                                prev        : '.prev',        // previous page arrow
                                next        : '.next',        // next page arrow
                                last        : '.last',        // go to last page arrow
                                gotoPage    : '.gotoPage',    // go to page selector - select dropdown that sets the current page
                                pageDisplay : '.pagedisplay', // location of where the "output" is displayed
                                pageSize    : '.pagesize'     // page size selector - select dropdown that sets the "size" option
                            },

                            // output default: '{page}/{totalPages}'
                            // possible variables: {size}, {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
                            // also {page:input} & {startRow:input} will add a modifiable input in place of the value
                            pager_output: '{startRow:input} – {endRow} / {totalRows} '+ (window.sysdict.getDictValue(window.sets.lang,"записей")), // '{page}/{totalPages}'

                            // apply disabled classname to the pager arrows when the rows at either extreme is visible
                            pager_updateArrows: true,

                            // starting page of the pager (zero based index)
                            pager_startPage: 0,

                            // Reset pager to this page after filtering; set to desired page number
                            // (zero-based index), or false to not change page at filter start
                            pager_pageReset: 0,

                            // Number of visible rows
                            pager_size: 10,

                            // f true, child rows will be counted towards the pager set size
                            pager_countChildRows: false,

                            // Save pager page & size if the storage script is loaded (requires $.tablesorter.storage in jquery.tablesorter.widgets.js)
                            pager_savePages: true,

                            // Saves tablesorter paging to custom key if defined. Key parameter name
                            // used by the $.tablesorter.storage function. Useful if you have
                            // multiple tables defined
                            pager_storageKey: "tablesorter-pager",

                            // if true, the table will remain the same height no matter how many records are displayed. The space is made up by an empty
                            // table row set to a height to compensate; default is false
                            pager_fixedHeight: false,

                            // remove rows from the table to speed up the sort of large tables.
                            // setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
                            pager_removeRows: false, // removing rows in larger tables speeds up the sort


                        }
                    })
                    .bind('pagerChange pagerComplete pagerInitialized pageMoved', function(e, c) {
                        var p = c.pager, // NEW with the widget... it returns config, instead of config.pager
                            msg = '"</span> event triggered, ' + (e.type === 'pagerChange' ? 'going to' : 'now on') +
                                ' page <span class="typ">' + (p.page + 1) + '/' + p.totalPages + '</span>';
                        $('#display')
                            .append('<li><span class="str">"' + e.type + msg + '</li>')
                            .find('li:first').remove();
                    });

                    that.updateUI();

                    window.sysdict.set_lang(window.sets.lang,$('#popup')[0]);

                    // Disable / Enable
                    // **************
                    $('.toggle').click(function() {
                        var mode = /Disable/.test( $(this).text() );
                        $('table').trigger( (mode ? 'disable' : 'enable') + 'Pager');
                        $(this).text( (mode ? 'Enable' : 'Disable') + 'Pager');
                        return false;
                    });
                    $('table').bind('pagerChange', function() {
                        // pager automatically enables when table is sorted.
                        $('.toggle').text('Disable Pager');
                    });

                    // clear storage (page & size)
                    $('.clear-pager-data').click(function() {
                        // clears user set page & size from local storage, so on page
                        // reload the page & size resets to the original settings
                        $.tablesorter.storage( $('table'), 'tablesorter-pager', '' );
                    });

                    // go to page 1 showing 10 rows
                    $('.goto').click(function() {
                        // triggering "pageAndSize" without parameters will reset the
                        // pager to page 1 and the original set size (10 by default)
                        // $('table').trigger('pageAndSize')
                        $('table').trigger('pageAndSize', [1, 10]);
                    });
                    // $(".mp").trigger('applyWidgets');

                    $('.ui-dialog-titlebar-close').css('display','none');
                    $('input[data-column="3"]').css('display','none');
                    $('input[data-column="5"]').css('display','none');
                    $('input[data-column="6"]').css('display','none');

                    $('#close_frame').on('click touchstart', function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        that.Close(function (ev) {

                        });

                        // dialog.dialog('close');
                    });

                   $('<div class="empty_space" style="display:block;height: 1700px;visibility: hidden"></div>')
                       .insertAfter( $('.tablesorter',$('#popup')));

                }
            });

            that.SetSlider();

            $('#address').attr('placeholder', window.sysdict.getDictValue(window.sets.lang,"введите адрес доставки"));
            $('#address').val(window.user.profile.profile.address);

            that.dialog.dialog("open");

            $('td[image] img').on('click', function (ev) {
                if (!$(this).hasClass('scaled_img')) {
                    $(this).attr('base_width', parseInt($(this).css('width')));
                    $(this).attr('base_height', parseInt($(this).css('height')));
                    $(this).addClass('scaled_img');
                    $(this).css('width', window.innerWidth);
                    $(this).css('height', 'auto');
                    $(this).css('padding', '15');
                    $(this).closest('img_container').css('position','absolute').css('z-index','100');
                    this.scrollIntoView();
                }else{
                    $(this).closest('img_container').css('position','').css('z-index','0');
                    $(this).css('width', $(this).attr('base_width'));
                    $(this).css('padding', '10');
                    $(this).removeClass('scaled_img');
                }
            });

            $('.items_cnt',$('.mp_categories')).addClass('badge-light');
            $($('.items_cnt',$('.mp_categories'))[0]).removeClass('badge-light').addClass('badge-primary');

            if(that.type==='deliver'){
                $('tr .icofont-food-cart').addClass('icofont-fast-delivery').removeClass('icofont-food-cart');
            }else if(that.type==='marketer'){
                $('tr .icofont-fast-delivery').addClass('icofont-food-cart').removeClass('icofont-fast-delivery');
            }

            $('.loader').css('display','none');

        });

    }


    async Close(cb) {
        
        let that = this;

        let items = this.GetOrderItems();

        if(md5(JSON.stringify(this.items))!==md5(JSON.stringify(items))) {

            if(that.type==='deliver' && !window.user.profile.profile.address && $('#address').parent().css('display')==='none') {

                $('#address').parent().css('display', 'block');
                $('#address').focus();

                $('#address').on('change', async function () {
                    window.db.GetSettings(function (obj) {
                        if (!obj[0])
                            obj[0] = {};

                        obj[0].profile.address = $('#address').val();
                        window.user.profile.profile.address = $('#address').val();
                        if (window.user.profile.profile.address) {
                            window.db.SetObject('setStore', obj[0], function (res) {

                            });
                        }
                    });
                });

                $('#address_loc').off();
                $('#address_loc').on('click', this,  (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    if ($('#popup').css('display')==='none') {

                        $('#popup').css('display', 'block');
                        $('#marker', window.document).css('display', 'none');
                        $(window.user.map.ol_map).off('moveend');
                        if ($('#address').val().includes(';')) {
                            let zoom = parseInt(window.user.map.ol_map.getView().getZoom());
                            window.user.map.geo.SearchPlace($('#address').val().split(';'), zoom, function (res) {
                                try {
                                    let adr = res.street + ',' + res.house;
                                    if(adr.includes('undefined')) {
                                        $('#address').attr('placeholder', adr).val('');
                                    }else
                                        $('#address').val(adr);

                                    $('#address').focus();
                                    //$('#address')[0].select();
                                    $('#address').trigger('click');

                                    return false;
                                } catch (ex) {

                                }
                            });
                        }
                    } else {
                        $('#popup').css('display', 'none');
                        let h = $('#address_loc').parent().offset().top + 8 + $('#address_loc').width() + 2;
                        $('#marker', window.document).css('display', 'block');
                        window.user.map.ol_map.getView().setZoom(19);
                        window.user.map.FlyToLocation(window.sets.coords.gps);
                        $(window.user.map.ol_map).on('moveend', (ev) => {
                            that.moveend = ev;
                            let loc = proj.toLonLat(ev.target.focus_);
                            $('#address').attr('loc', JSON.stringify([loc[1], loc[0]]));
                            $('#address').val(String(loc[1].toFixed(6)) + ';' + String(loc[0].toFixed(6)));
                            return false;
                        });
                    }
                });

                return false;
            }

            this.SaveOrders(items,function (res) {
                if(res) {
                    $('#cart_but').trigger('click');
                }
            });
        }

        this.start_cat = null;
        $('.mp_categories').empty();
        $('.tr_item').remove();
        $("#popup").remove();
        $('.loader').css('display','none');
        cb();

    }

    InitOffers(resolve){
        let that = this;

        that.path  ='https://delivery-angels.ru/server/';


        that.sum = 0;
        let inv_period = '', inv_qnty = '', tr_class='', tr_disabled='',tr_style = '';

        let extent = window.user.map.ol_map.getView().calculateExtent();
        let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');

        let features = [];
        let layers = window.user.map.ol_map.getLayers();
        let util = new UtilsMap();
        for(let l in layers.array_) {
            let layer = layers.array_[l];
            if (layer.type === "VECTOR" && layer !== layers.circleLayer) {
                let f_s = layer.getSource().getFeatures();
                _.each(f_s, function(f) {
                    if(f.values_.obj && f.values_.obj.profile.type==='deliver') {
                        if (util.IsInsideRadius(window.user.map, f)) {
                            features.push(f.values_.obj);
                        }
                    }
                });
            }
        }

        window.db.GetRangeSupplier(window.user.date,
            parseFloat(tr_ext[1]), parseFloat(tr_ext[0]), parseFloat(tr_ext[3]), parseFloat(tr_ext[2]),
            // $('.category[state="1"]')[0].id,
            (f_s)=> {
            if(f_s[0])
               features = _.unionBy(features, f_s,'uid');
            if(features.length===0) {
                that.Close(function () {

                });
                return;
            }
            let cnt = 0;
            for(let f in features){
                if(features[f].profile.type!==that.type) {
                    if (f == features.length - 1)
                        resolve(that.start_cat);
                    continue;
                }
                let dict = new Dict(features[f].dict.dict);

                for (let o in features[f].data) {
                    if (parseInt($('#' + o).attr('state')) === 0) {
                        ++cnt;
                        continue;
                    }

                    let addTab=  function (cat_tab, cat_img, active){
                        let cat_str = '';
                        if($('#'+cat_tab).closest('.cat_div')[0])
                            cat_str = $('#'+cat_tab).closest('.cat_div')[0].outerHTML;
                        else if(!cat_str)// let cat_str = cat_img?'<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">':
                            cat_str =
                                '<div class="cat_div  text-center" data-toggle="tab" href="#tab_'+cat_tab+'">'+
                                '<span id="'+cat_tab+'" class="category icofont-brand-natgeo"  extra="false" title="'+cat_tab+'" state="0"></span>'+
                                '<h6 class="title">'+cat_tab+'</h6>'+
                                '<span class="cat_cnt badge badge-pill badge-light">0</span>'+
                                '</div>';
                        if ($('[href="#tab_' + cat_tab + '"]',$('#popup')).length === 0) {
                            $(cat_str).insertBefore($('#add_tab_li',$('#popup')));
                            $('.cat_cnt',$('#popup')).addClass('items_cnt').removeClass('cat_cnt');
                        }
                    }

                    let tbody = $('tbody',$('.mp'));
                    if(!$('#' + o)[0])
                        continue;
                    if(!$('.mp_categories #' + o,$('#popup'))[0]) {
                        addTab(o, $('#' + o)[0].outerHTML, '');
                    }

                    let setPrice = function (index, packlist, prev_pl, el) {
                        let cat_tab = o;
                        $(el).find('.pack_list').empty();

                        let pl = utils.ReverseObject(packlist);

                        let ml = features[f].data[cat_tab][index].packlist;
                        $(el).find('.pack_btn').attr('packlist', JSON.stringify(pl));
                        for (let p in pl) {

                            let ml_val;
                            if (!ml || !ml[p])
                                ml_val = 0;
                            else
                                ml_val = parseFloat(ml[p]);

                            let data;
                            if (pl[p].price)
                                data = (parseFloat(pl[p].price.replace(/[^.-a-z0-9+]+/gi, ''))).toFixed(2);
                            else
                                data = (parseFloat(pl[p])).toFixed(2);

                            if (!data) {
                                $(el).find('.order_container').css('visibility', 'hidden');
                                continue;
                            }

                            $(el).find('.item_price').attr('base',  pl[p].price?pl[p].price.replace(/[^.-a-z0-9+]+/gi, ''):pl[p]);

                            if (!$('.carousel_price[title=' + features[f].data[cat_tab][index].title + ']').text())
                                $('.carousel_price[title=' + features[f].data[cat_tab][index].title + ']').text(data);
                            if (data)
                                pl[p] = data;
                            $('a[href="#tab_' + cat_tab + '"]').css('display', 'block');
                            $(el).find('.dropdown').css('visibility', 'visible');
                            // if(that.profile.type==='deliver' && (!that.offer[cat_tab][i].markuplist || !that.offer[cat_tab][i].markuplist[p]))
                            //     continue;

                            $(el).find('.pack_list').append("<a class='dropdown-item' role='packitem' pack='"+p+"'>" +
                                dict.getValByKey(window.sets.lang,p,features[f].profile.lang)+
                                "</a>");
                            $(el).find('.pack_list').css('left','20px');
                            $(el).find('.pack_btn').text(dict.getValByKey(window.sets.lang,p,features[f].profile.lang));
                            $(el).find('.pack_btn').attr('pack', p);




                            let price = {
                                'ru': (data ? data : ""),
                                'en': (data ? data : ""),
                                'fr': (data ? data : "")
                            }[window.sets.lang];

                            if (features[f].data[cat_tab][index].bargain === 'true') {
                                $(el).find('.item_price').attr('contenteditable', 'true');
                                $(el).find('.item_price').attr('placeholder', price);
                            } else {
                                $(el).find('.item_price').removeAttr('placeholder');
                                $(el).find('.item_price').text(price);
                            }

                            if ($(el).find('a.dropdown-item').length > 1) {
                                $(el).find('.pack_btn').addClass('dropdown-toggle');
                                $(el).find('.pack_btn').attr('data-toggle', 'dropdown');
                            }
                        }

                        $(el).find('a[role=packitem]').on('click', {pl: pl}, function (ev) {
                            that.changed = true;
                            $(this).closest('tr').find('.pack_btn').text($(ev.target).text());
                            let pl = ev.data.pl;
                            let price = parseFloat(pl[$(ev.target).attr('pack')]).toFixed(2);

                            if (features[f].data[cat_tab][index].bargain === 'true') {
                                $(this).closest('tr').find('.item_price').attr('contenteditable', 'true');
                                $(this).closest('tr').find('.item_price').attr('placeholder', price.price ? price.price : price);
                                $(el).find('.item_price').removeAttr('placeholder');
                                $(this).closest('tr').find('.item_price').text(price.price ? price.price : price);
                            } else {
                                $(this).closest('tr').find('.item_price').text(price.price ? price.price : price);
                            }
                            $(el).find('.ord_amount').text('0');
                            let ord = $(this).closest('tr .dropdown-item:contains('+$(ev.target).text()+')').attr('order');
                            if(ord) {
                                ord = JSON.parse(ord);
                                $(el).find('.ord_amount').text(String(ord.qnty));
                                $(el).closest('tr').addClass('ordered')
                            }

                        });
                    }

                    for (let i in features[f].data[o]) {
                        if(!$('#' + o)[0]) {
                            cnt++;
                            continue;
                        }
                        let item = features[f].data[o][i];

                        if(!item.packlist)
                            continue;

                        if (features[f].uid && !$("tr." + features[f].uid)[0]) {

                            let tr = $('.tr_tmplt', $('.mp')).clone();
                            tr.removeClass('tr_tmplt');
                            tr.addClass('tr_item');
                            tr.css('display', '');
                            tr.attr('supuid', features[f].uid);
                            tr.attr('type', features[f].profile.type);
                            tr.attr('category',o);
                            // tr.addStyle(tr__style);
                            // tr.addAttr_ibute(tr__disabled);

                            tr.find('td[title] div').prepend(dict.getValByKey(window.sets.lang, item.title, features[f].profile.lang));
                            tr.find('td[title] div').attr('data-translate',item.title);
                            if(dict.getValByKey(window.sets.lang, item.content_text.value, features[f].profile.lang) &&
                                dict.getValByKey(window.sets.lang, item.content_text.value, features[f].profile.lang).length>50) {
                                tr.find('td[image] button[data-toggle="collapse"]').css('display', 'block');
                                tr.find('td[image] button[data-toggle="collapse"]').on('click touchstart', function () {
                                    $(this).siblings('.img_container').find('.collapse').collapse('toggle');
                                });
                            }

                            tr.find('td[image].content_text').append(dict.getValByKey(window.sets.lang, item.content_text.value, features[f].profile.lang));
                            tr.find('td[image].content_text').on('click touchstart',function (ev) {
                               //$(this).collapse('hide');
                            });

                            if(item.img) {
                                if (item.img.src.includes('http'))
                                    tr.find('td[image] img').attr('src', (item.cert[0] ? item.cert[0].src : item.img['src']));
                                else
                                    tr.find('td[image] img').attr('src', that.path + '/images/' + item.img['src']);
                            }else if(item.cert[0]) {
                                if(item.cert[0].src.includes('http'))
                                    tr.find('td[image] img').attr('src', item.cert[0].src);
                                else
                                    tr.find('td[image] img').attr('src', that.path + '/images/' + item.cert[0].src);
                            }

                            if(features[f].profile.type===that.type) {
                                // tr.find('td[type] .pickup').append('<br>' + features[f].profile.place);
                                // tr.attr('pickup',features[f].profile.place);
                                tr.find('td[type] img').attr('src', features[f].profile.avatar?that.path + '/images/' + features[f].profile.avatar:'').on('click', function () {
                                    if (window.user.constructor.name === 'Customer') {
                                        if (!window.user.viewer) {
                                            window.user.viewer = new OfferOrder();
                                        }
                                        window.user.viewer.InitCustomerOrder(features[f]);
                                        // that.Close();
                                    }
                                });
                            }

                            if(!that.start_cat) {
                                that.start_cat = o;
                                $('.cat_div[href="#tab_'+o+'"]',$('.mp_categories')).addClass('active');
                            }

                            setPrice(i, item.packlist, item.prev_packlist, tr);

                            if(tr.attr('category')===that.start_cat)
                                tr.prependTo($('tbody',$('.mp')));
                            else
                                tr.prependTo($('.thidden',$('#popup')));

                            $.each(features[f].data[o][i].extra, function (e, el) {
                                if (!el)
                                    return;
                                $(tr).find('.extra_collapse').css('display', 'block');
                                let row = $('.row.tmplt_extra').clone();
                                $(row).removeClass('tmplt_extra');
                                $(row).css('height', 'auto');
                                $(row).css('visibility', 'visible');

                                if (e) {
                                    // $(row).insertBefore($(menu_item).find('.row.tmplt_extra'));
                                    $(tr).find('.extras').append(row);
                                    $(tr).find('.extras').addClass('show');
                                }
                                $(row).find('.extra_title').text(dict.getValByKey(window.sets.lang, e, features[f].profile.lang));
                                $(row).find('.extra_price').text(el.price);
                            });

                          }
                    }

                    $('.cat_div #'+o,$('#popup')).siblings('.items_cnt').text($('tr[category='+o+']',$('#popup')).length);
                }

                if (f == features.length - 1) {
                    resolve(that.start_cat);
                }
            }

            $('.increase').on('click', function (ev) {
                let cntrl = $(ev.target).closest();
                let amnt = parseInt($(this).siblings('.extra_amount').text()) + 1;
                $(ev.target).closest('.increase').siblings('.extra_amount').text(amnt);
            });

            $('.reduce').on('click', function (ev) {
                if (parseInt($(this).siblings('.extra_amount').text()) > 0) {
                    let amnt = parseInt($(this).siblings('.extra_amount').text()) - 1;
                    $(ev.target).closest('.reduce').siblings('.extra_amount').text(amnt);
                }
            });

            $('.increase_ord').on('click', function (ev) {
                let tr = $(ev.target).closest('tr');
                let amnt = parseInt($(this).siblings('.ord_amount').text()) + 1;
                let price = $(tr).find('.item_price').text();
                if (!price)
                    price = $(tr).find('.item_price').attr('placeholder');
                $(tr).find('.ord_amount').text(amnt);
                let cur_pack = $(tr).find('.pack_btn').text();
                $(tr).find('.dropdown-item:contains(' + cur_pack + ')').attr('order', JSON.stringify({
                    qnty: amnt,
                    price: price
                }));
            });

            $('.reduce_ord').on('click', function (ev) {
                let tr = $(ev.target).closest('tr');
                if (parseInt($(this).siblings('.ord_amount').text()) > 0) {
                    let amnt = parseInt($(this).siblings('.ord_amount').text()) - 1;
                    // if(amnt==0){
                    //     that.DeleteOrder(this);
                    // }
                    let price = $(tr).find('.item_price').text();
                    if (!price)
                        price = $(tr).find('.item_price').attr('placeholder');
                    $(tr).find('.ord_amount').text(amnt);
                    let cur_pack = $(tr).find('.pack_btn').text();
                    $(tr).find('.dropdown-item:contains(' + cur_pack + ')').attr('order', JSON.stringify({
                        qnty: amnt,
                        price: price
                    }));
                    if (parseInt($(this).siblings('.ord_amount').text()) === 0) {
                        $(this).closest('td').attr('deleted', true);
                        return false;
                    }
                }
            });

            $('.cat_div').on('click',function (ev) {

                let id = $(ev.target).attr('id');

                $('.cat_div').removeClass('active');
                $(ev.target).closest('.cat_div').addClass('active');

                $('.items_cnt',$('.mp_categories')).addClass('badge-light');
                $(this).find('.items_cnt',$('.mp_categories')).removeClass('badge-light').addClass('badge-primary');

                $('.mp').trigger('disablePager');

                $('tr[category]',$('.mp')).appendTo($('.thidden',$('#popup')));
                $('tr[category='+id+']',$('.thidden')).prependTo($('tbody',$('.mp'))).css('display','');

                $('.mp').trigger('enablePager');

                that.SetSlider();

                $('.tr_item',$('.mp'))[0].scrollIntoView();
                $('.mp_categories')[0].scrollIntoView();

            });

        });
    }

    GetOrderItems(){
        let that = this;

        let obj = {};
        $('tr[supuid]').each(function (i, el) {

            let cat = $(el).attr('category');

            let ordlist = {};

            let ddi = $(el).find('.pack_list .dropdown-item').toArray();
            for(let i in ddi){
                if(!$(ddi[i]).attr('order'))
                    continue;
                let ord = JSON.parse($(ddi[i]).attr('order'));
                ordlist[ddi[i].text] = {
                    qnty: parseInt(ord.qnty),
                    price: ord.price
                };
            }

            let extralist={};
            $(el).find('.extra_amount').each(function(i,el){
                if(parseInt($(el).text())>0){
                    extralist[$(el).closest('.row').find('.extra_title').text()] = {qnty: parseInt($(el).text()),price:parseFloat($(el).closest('.row').find('.extra_price').text())};
                }
            });

            if(Object.keys(ordlist).length===0)
                return;

            let supuid = $(el).attr('supuid');
            if(!obj[supuid])
                obj[supuid] = {data:{}};

            let status = '';
            if($(el).find('button.ord_amount').text()>0)
                status = 'checked';
            if($(el).hasClass('ordered'))
                status = 'ordered'
            if($(el).hasClass('approved'))
                status = 'approved';

            if(parseInt($(el).find('button.ord_amount').text())!==0 || status){
                obj[supuid].data[$(el).find('td[title] div').attr('data-translate')] = {
                    cat: cat,
                    image: $(el).find('.img_container img')[0].src,
                    ordlist: ordlist,
                    extralist: extralist,
                    status: status,
                    email: window.user.profile.profile.email,
                    mobile: window.user.profile.profile.mobile
                }
            }

            obj[supuid]['period'] = $(window.document).find('.sel_period').text();

            if($(el).attr('type')==='marketer') {
                obj[supuid]['address'] = $(el).attr('pickup');
            }else if($(el).attr('type')==='deliver') {
                obj[supuid]['address'] = window.user.profile.profile.address;
            }

            if($(el).find('.comment')[0])
                obj[supuid]['comment'] = $(el).find('.comment')[0].value;
            obj[supuid]['supuid'] = $(el).attr('supuid');
            obj[supuid]['cusuid'] = window.user.uid;
            obj[supuid]['date'] = window.user.date;
        });

        return obj;
    }

    DeleteOrder(el) {
        let that = this;
        if(confirm( window.sysdict.getDictValue(window.sets.lang,"Удалить из заказа?"))){
            $(el).closest('tr').find('.qnty').text('0');
            that.SaveOrderItems(function () {
                // $('tbody').empty();
                // that.FillOrders();
                // return;
            });
        }
    }

    SaveOrders(items,cb) {

        let that = this;

        $('.loader').css('display','block');
        let keys = Object.keys(items);
        for(let s in keys) {
            let supuid = Object.keys(items)[s];

            window.user.UpdateOrderLocal(items[supuid], function (res) {
                $('.loader').css('display', 'none');
                if(keys.length-1==s)
                    cb(items);
            });
        }

    }

    SaveOrderItems(cb){

        for(let o in window.user.orders) {
            let order = window.user.orders[o];
            for(let p in order.data) {
                if ($('[title="' + p + '"]').length > 0) {
                    window.db.SetObject('orderStore', order, function (res) {

                    });
                }
            }
        }

        window.user.SetOrdCnt();
    }


    SetSlider() {
        let that = this;
        let ar  = $('.tr_item .item_price', $('.mp')).map(function(){ return parseFloat(this.innerText) });

        let min  = _.min(ar);
        let max  = _.max(ar);
        let step = parseInt((max-min)/100);

        try {
            if(!$('#slider')[0].noUiSlider){
            //     $('#slider')[0].noUiSlider.destroy();

                noUiSlider.create($('#slider')[0], {
                    start: [min, max],
                    connect: true,
                    tooltips: [true, wNumb({decimals: (min < 100 ? 2 : 0)})],
                    step: step,
                    range: {
                        'min': min - 10 * step,
                        'max': max + 10 * step
                    }
                });

                $('#slider')[0].noUiSlider.on("change", function (ev) {
                    $('tr .item_price', $('.mp')).map(function () {
                        if (parseFloat(this.innerText) < parseFloat(ev[0]) || parseFloat(this.innerText) > parseFloat(ev[1]))
                            $(this).closest('tr').appendTo($('.thidden', $('#popup')));
                    });

                    $('.tr_item[category=' + that.start_cat + '] .item_price', $('.thidden')).map(function () {
                        if (parseFloat(this.innerText) >= parseFloat(ev[0]) && parseFloat(this.innerText) <= parseFloat(ev[1]))
                            $(this).closest('tr').prependTo($('tbody', $('.mp'))).css('display', '');
                    });
                });

            }else {
                try {

                    $('#slider')[0].noUiSlider.updateOptions({
                            start: [min, max],
                            tooltips: [true, wNumb({decimals: (min < 100 ? 2 : 0)})],
                            step: step,
                            range: {
                                'min': min - 10 * step,
                                'max': max + 10 * step
                            }
                        }, // Object
                        true // Boolean 'fireSetEvent'
                    );
                    $('#slider').removeAttr('disabled');
                }catch (ex){
                    $('#slider').attr('disabled','true');
                }
            }
        }catch(ex){

        }
    }

    updateUI() {
        $('.mp_categories').insertBefore($('.ui-dialog-titlebar')[0]);
        $('.pager').insertBefore($('.ui-dialog-titlebar')[0]);
        $('.address_div').insertBefore($('.ui-dialog-titlebar')[0]);
        $('.ui-dialog-titlebar').css('display','none');

        $('td[data-column="3"] input').replaceWith($('#slider')[0]);
    }
}


//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9