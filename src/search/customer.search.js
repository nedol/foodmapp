
require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
require('tablesorter/dist/js/widgets/widget-scroller.min.js');

import proj from 'ol/proj';

import {Utils} from "../utils/utils";
let utils = new Utils();

import 'tablesorter/dist/css/theme.default.min.css';

import {Dict} from '../dict/dict.js';

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    window.InitCustomerSearch = function (data) {
        if(!window.cus_search )
            window.cus_search = new CustomerSearch();
        window.cus_search.OpenSearch(data);
    };
});

export class CustomerSearch{

    constructor(){

    }

    OpenSearch(data){

        let that = this;
        let date = window.parent.user.date;
        that.sum = 0;

        for(let i in data) {
            let sup = data[i];
            let dict = new Dict(sup.dict.dict);
            let gps = proj.toLonLat(window.parent.sets.coords.gps);


            $("<tr style='text-align: center;'>" +
                "<td  style='margin: 10px'>"+dict.getValByKey(window.parent.sets.lang,sup.obj.title)+"</td>" +
                "<td>"+sup.profile.name+"</td>" +
                "<td>"+(utils.LatLonToMeters(gps[1],gps[0],sup.loc[1],sup.loc[0])/1000).toFixed(0)+" км</td>" +
                "<td  style='margin: 10px'>"+Object.keys(sup.obj.packlist)[0]+":"+sup.obj.packlist[Object.keys(sup.obj.packlist)[0]]+"</td>"+
                "<td></td>"+
                "</tr>").appendTo($('tbody'));
        }


        $('table').tablesorter({
            theme: 'blue',
            widgets: ['zebra', 'column'],
            resizable_includeFooter:true,
            usNumberFormat: false,
            sortReset: true,
            sortRestart: true,
            sortInitialOrder: 'desc',
            widthFixed: true
        });

    }

    Close(cb) {
        $('tbody').empty();
        $.tablesorter.destroy( $('table')[0], true, function () {

        });
        cb();
    }

}