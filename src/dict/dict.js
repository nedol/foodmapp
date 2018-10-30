'use strict'
export {Dict};
var md5 = require('md5');
var urlencode = require('urlencode');

class Dict {

    constructor(data) {
        this.dict = data;
    }

    getDict() {
        return this.dict;
    }


// Function for swapping dictionaries
    set_lang(lang, el) {
        let keyAr = Object.keys(this.dict);
        let dtAr = $(el).find("[data-translate]");
        for (let i = 0; i < dtAr.length; i++) {
            let item = dtAr[i];
            let key = $(item).attr("data-translate").toLowerCase();
            if (this.dict[key]) {

                let val = this.dict[key][lang] ? this.dict[key][lang] : this.dict[key]['en'];
                try {
                    val = urlencode.decode(val);
                }catch(ex){
                    ;
                }

                if(item.isEntity)
                    item.setAttribute('text','value',val);
                if($(item).text())
                    $(item).text(val);
                if($(item).val())
                    $(item).val(val);
                if($(item).attr("title"))
                    $(item).attr("title", val);
                if($(item).attr("placeholder"))
                    $(item).attr("placeholder", val);
                if($(item).attr("value"))
                    $(item).attr("value", val);

            }
        }
    }

    getValByKey(lang, key) {

        try {
            let val = this.dict[key][lang] ?
                this.dict[key][lang] :
                (this.dict[key]['en'] ? this.dict[key]['en'] : '');
            return val;
        } catch (ex) {
            return '';
        }
    }

    getDictValue(lang, value) {
        let res = $.grep(Object.values(this.dict), function (a) {
            for (let l in Object.values(a))
                if (a[Object.keys(a)[l]] === value)
                    return a[lang];
        });

        if (res.length > 0 && res[0][lang])
            return res[0][lang];
        else
            return value;
    }


    Translate(from, to, cb) {

        if (from === to) {
            cb();
            return;
        }
        let dict = this.getDict();
        let trAr = {};
        let dtAr = $('[data-translate]');
        for (let i = 0; i < dtAr.length; i++) {
            let key = $(dtAr[i]).attr('data-translate').toLowerCase();
            let val = $(dtAr[i]).text() || $(dtAr[i]).val();
            if (dtAr[i].getAttribute('text') && dtAr[i].getAttribute('text').value)
                val = dtAr[i].getAttribute('text').value;
            if (!val)
                continue;

            if (dict[key] && !dict[key][to]) {
                let from = Object.keys(dict[key])[0];
                trAr[key] = {[from]: dict[key][from]}
            }
            // else if ((!dict[key] && !dict[key][to]) && !trAr[key])
            //     trAr[key] = {[from]: val};
        }


        if (Object.keys(trAr).length > 0) {

            let data_obj = {
                "proj":"bm",
                "func": "translate",
                "data": JSON.stringify(trAr),
                "to": to
            }

            $.ajax({
                url: host_port,
                method: "POST",
                dataType: 'json',
                data: data_obj,
                dict: dict,
                cb: cb,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                success: function (resp) {
                    //$("[data-translate='" + this.key + "']").parent().val(resp);

                },
                error: function (xhr, status, error) {
                    //let err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                    this.cb();
                },

                complete: function (data) {
                    if (data.status == 200) {
                        let add = data.responseJSON;
                        for (let key in add) {
                            //window.dict.dict = Object.assign(this.dict, add);
                            if (!window.dict.dict[key])
                                window.dict.dict[key] = {};
                            for (let l in add[key]) {
                                if (window.dict.dict[key][l])
                                    window.dict.dict[key][l] = {};
                                window.dict.dict[key][l] = add[key][l];
                            }
                        }

                        if (this.cb)
                            this.cb();
                    }
                },
            });
        } else {
            if (cb)
                cb();
        }
    }


}
