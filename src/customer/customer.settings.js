export {CustomerSettings}
import {Settings} from "../profile/settings";


class CustomerSettings {
    constructor(db,uid){
        this.db = db;
    }

    Open() {
        let that = this;
        that.fillForm();

        $('input').on('change', function (ev) {
           $(this).attr('changed', true);
        });
    }

    fillForm(){
        this.db.GetSettings(function (data) {
            for(let i in data[0].profile){
                if(i==='avatar'){
                    $('.avatar').attr('src',data[0].profile[i]);
                    continue;
                }
                if(i)
                    $('input[id='+i+']').val(data[0].profile[i]);
            }
        });

    }

    Close() {
        let items = this.GetProfileItems();
    }

    GetProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='profile') {
                that.db.GetSettings(function (data) {
                    let profile = data[0].profile;
                    $(tab).find('input[changed]').each(function (index, inp) {
                        if($(this).attr('type')==='file'){
                            profile['avatar'] = $(this).siblings('img').attr('src');
                            return;
                        }
                        profile[inp.id] = $(inp).val();
                    });
                    data[0]['profile'] = profile;
                    that.db.SetObject('setStore', data[0], function (res) {
                        
                    });
                });

            }
        });
    }

}

