//export {Dict};
var md5 = require('md5');

module.exports = class Dict {

    constructor(data){
        this.dict = data.dict;
    }

    getDict(){
        return this.dict;
    }


// Function for swapping dictionaries
    set_lang (lang, el) {
        let keyAr = Object.keys(this.dict);
        let dtAr = $(el).find("[data-translate]");
        for(let i=0;i<dtAr.length;i++){
            let item = dtAr[i];
            let key = $(item).attr("data-translate").toLowerCase();
            if ($.inArray(key,keyAr)!==-1) {
                if (this.dict[key][lang]) {
                    if($(item).text())
                        $(item).text(this.dict[key][lang]);
                    if($(item).attr("title"))
                        $(item).attr("title", this.dict[key][lang]);
                    if($(item).attr("placeholder"))
                        $(item).attr("placeholder", this.dict[key][lang]);
                    if($(item).attr("value"))
                        $(item).attr("value", this.dict[key][lang]);
                }
            }
        }
    }

    getDictValue(lang, value) {
        let res = $.grep(Object.values(this.dict),function (a) {
            for(let l in Object.values(a))
                if(a[Object.keys(a)[l]]===value)
                    return a[lang];
        });

        if(res.length>0 && res[0][lang])
            return res[0][lang];
        else
            value;
    }


    Translate(sel_lang, admin, cb) {

        let lang = $('.selectpicker option:selected').val().toLowerCase().substring(0, 2);
        let dict = this.getDict();

        let trAr = {};
        let dtAr = $('[data-translate]');
        for (let i = 0; i < dtAr.length; i++) {
            let key = $(dtAr[i]).attr('data-translate').toLowerCase();
            let val = $(dtAr[i]).text()||$(dtAr[i]).val();
            if ((!dict[key] || !dict[key][sel_lang]) && !trAr[key])
                trAr[key] = {[lang]: val};
        }

        if(Object.keys(trAr).length>0) {

            let data_obj = {
                "func": "translate",
                "data": JSON.stringify(trAr),
                "from": lang,
                "to": sel_lang
            }

            $.ajax({
                url: host_port,
                method: "POST",
                dataType: 'json',
                data: data_obj,
                dict: dict,
                cb:cb,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                success: function (resp) {
                    //$("[data-translate='" + this.key + "']").parent().val(resp);

                },
                error: function (xhr, status, error) {
                    //let err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                    //alert(xhr.responseText);
                },

                complete: function (data) {
                    if (data.status == 200) {
                        let add = data.responseJSON;
                        for(let key in add) {
                            //window.dict.dict = Object.assign(this.dict, add);
                            if(!window.dict.dict[key])
                                window.dict.dict[key] = {};
                            for(let l in add[key]) {
                                if(window.dict.dict[key][l])
                                    window.dict.dict[key][l] = {};
                                window.dict.dict[key][l] = add[key][l];
                            }
                        }
                        window.dict.set_lang(sel_lang,$("#offer_editor") );

                        if(this.cb)
                            this.cb();
                    }
                },
            });
        }else{
            if(cb)
                cb();
        }
    }


}
