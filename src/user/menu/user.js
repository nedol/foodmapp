export {User};
import {MD5} from '../utils/utils';

//let  user = user || {};
let User = new user();
function user() {
    this.uname = '';
    this.psw = '';
    this.email = '';
    this.sid = '';
    this.level = 0;

    let  obj = localStorage.getItem(MD5("uname"));
    if (obj) {
        uObj = JSON.parse(obj);
        this.uname = uObj.uname;
        this.psw = uObj.psw;
        this.email = uObj.email;
        this.sid = uObj.sid;
        this.level = uObj.level;
    }

}

User = new user();

user.prototype.IsLogin =  function(){

    let  obj = localStorage.getItem(MD5("uname"));
    if (obj) {
        uObj = JSON.parse(obj);
        if(uObj.uid)
            return true;
    }
    return false;
}

user.prototype.Login = function() {

    let  obj = JSON.parse(localStorage.getItem(MD5("uname")));

    if(!obj)
        return;

    try {

        let  url = http + host + "/php/auth/registry.php?hash="+MD5(obj.psw)+
            "&email="+obj.email+
            "&user="+obj.uname+
            "&XDEBUG_SESSION_START=PHPSTORM";

        let  data = "bl="+JSON.stringify(buckList)+"&hash="+MD5(obj.psw)+"&email="+obj.email+"&user="+obj.uname;

        $.ajax({
            url: url,
            method: "GET",
            dataType: 'json',
            // headers: {"access-control-allow-origin": "some value"},
            //data:formData,
            contentType: false,
            cache: false,
            processData: false,
            crossDomain: true,
            // xhrFields: {
            //     withCredentials: true
            // },
            success: function (data) {
                if(data) {
                    for(let  i=0; i<data.length; i++) {
                        if (data[i].uid && data[0].sid) {
                            uObj ={
                                "psw": obj.psw,
                                "email": obj.email,
                                "uname": obj.uname,
                                "uid": data[i].uid,
                                "sid": data[i].sid,
                                "level": data[i].level
                            };

                            let  str = JSON.stringify(uObj);
                            localStorage.setItem(MD5("uname"), str);

                            if( $('#auth_modal').prop('open'))
                                OnCloseAuth();

                            $('#auth').css('visibility', 'hidden');

                            //SyncServer();
                            $(".close").trigger("click");
                        }

                        if (data[i].msg)
                            alert(data[i].msg);
                    }
                }
            },
            error: function (xhr, status, error) {
                //let  err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
            },
            complete: function (data) {
                //console.log(data.responseText);
            },
        });

    }catch(ex){
        console.log(ex);
    }
}