export {CustomerSettings}
import {Settings} from "../profile/settings";


class CustomerSettings {
    constructor(db,uid){
        this.db = db;
    }

    Open() {
        let that = this;

        this.db.GetSettings(function (res) {
            if(res){
                that.profile = res;
                that.fillForm();
            }
        });
    }

    fillForm(){
        $('input[name=last_name]', ).text(this.profile[0].name);
    }
}

