'use strict'
export {Dict};
var _ = require('lodash');

class Dict {

    constructor(data) {
        this.dict = data;
    }

    getDict() {
        return this.dict;
    }


// Function for swapping dictionaries
    set_lang(lang, el, default_lang) {
        let keyAr = Object.keys(this.dict);
        let dtAr = $(el).find("[data-translate]");

        for (let i = 0; i < dtAr.length; i++) {
            let item = dtAr[i];
            let k = $(item).attr("data-translate").toLowerCase();

            //замена по ключу
            if(item.attributes.placeholder && this.dict[item.attributes.placeholder.value] && this.dict[item.attributes.placeholder.value][lang]){
                $(item).attr('placeholder',this.dict[item.attributes.placeholder.value][lang]);
                continue;
            }
            if(item.attributes.title && this.dict[item.attributes.title.value] && this.dict[item.attributes.title.value][lang]){
                $(item).attr('title',this.dict[item.attributes.title.value][lang]);
            }
            if(item.value && this.dict[item.value] && this.dict[item.value][lang]){
                item.value = this.dict[item.value][lang];
            }
            if($(item).text() && this.dict[$(item).text()] && this.dict[$(item).text()][lang]){
                $(item).text(this.dict[$(item).text()][lang]);
            }
            //замена по аргументу
            if (this.dict[k]) {
                let def_lang = default_lang?default_lang:Object.keys(this.dict[k])[0];
                let val = this.dict[k][lang] ? this.dict[k][lang] : this.dict[k][def_lang];
                if(!val) {
                    for(let l in this.dict[k]){
                        if(this.dict[k][l]) {
                            val = this.dict[k][l];
                            break;
                        }
                    }
                }
                try {
                    //val = urlencode.decode(val);
                    val = val.replace(/\\n/g, String.fromCharCode(13, 10) )
                    val = val.replace('%0D',String.fromCharCode(13, 10))
                }catch(ex){
                    ;
                }

                if(item.isEntity)//a-frame
                    item.setAttribute('text','value',val);

                if(item.tagName.toLowerCase()==='input' || item.tagName.toLowerCase()==='textarea')
                    $(item).val(val);
                else if(item.tagName.toLowerCase()==='div')
                    $(item).text(val);
                else
                    $(item).html(val);

                if($(item).attr("title"))
                    $(item).attr("title", val);
                if($(item).attr("value"))
                    $(item).attr("value", val);

            }
        }
    }

    getValByKey(lang, k, default_lang) {

        let dict = this.dict;
        function findValue(k) {
            for (let l in Object.keys(dict[k])){
                if(dict[k][Object.keys(dict[k])[l]]) {
                    return dict[k][Object.keys(dict[k])[l]];
                    break;
                }
            }
        }
        try {
            let res = this.dict[k][lang] ?
                this.dict[k][lang] :
                (this.dict[k][default_lang] ? this.dict[k][default_lang] : findValue(k));
            return res.replace(/%0D/g,String.fromCharCode(13, 10)).replace(/%22/g,String.fromCharCode(22)).replace(/%10/g,String.fromCharCode(10));
        } catch (ex) {
            return '';
        }
    }

    getDictValue(lang, value) {
        let res = $.grep(Object.values(this.dict), function (a) {
            for (let l in Object.values(a))
                if (a[Object.keys(a)[l]].toLowerCase() === value.toLowerCase())
                    return a[lang];
        });

        if (res.length > 0 && res[0][lang])
            return res[0][lang];
        else
            return value;
    }

    getKeyByValue(lang, value) {
        let res = $.grep(Object.values(this.dict), function (a) {
            for (let l in Object.values(a))
                if (a[Object.keys(a)[l]].toLowerCase() === value.toLowerCase())
                    return Object.keys(a)[l];
        });

        if (res.length > 0)
            return res[0];
        else
            return null;
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
            let k = $(dtAr[i]).attr('data-translate').toLowerCase();
            let val = $(dtAr[i]).text() || $(dtAr[i]).val();
            if (dtAr[i].getAttribute('text') && dtAr[i].getAttribute('text').value)
                val = dtAr[i].getAttribute('text').value;
            if (!val)
                continue;

            if (dict[k] && !dict[k][to]) {
                let from = Object.keys(dict[k])[0];
                trAr[k] = {[from]: dict[k][from]}
            }
            // else if ((!dict[k] && !dict[k][to]) && !trAr[k])
            //     trAr[k] = {[from]: val};
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
                    //$("[data-translate='" + this.k + "']").parent().val(resp);

                },
                error: function (xhr, status, error) {
                    //let err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                    this.cb();
                },

                complete: function (data) {
                    if (data.status == 200) {
                        let add = data.responseJSON;
                        for (let k in add) {
                            //window.dict.dict = Object.assign(this.dict, add);
                            if (!window.dict.dict[k])
                                window.dict.dict[k] = {};
                            for (let l in add[k]) {
                                if (window.dict.dict[k][l])
                                    window.dict.dict[k][l] = {};
                                window.dict.dict[k][l] = add[k][l];
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
