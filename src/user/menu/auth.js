export {InitAuth,OnClickAuth};
import {User} from './user';

var md5 = require('md5');

let uObj, transition;

function InitAuth() {

    if(!User.IsLogin()){
        $('#auth').css('visibility','visible');
    }else{
        User.Login();
    }

    $('#register').submit(function(e) {
        e.preventDefault(); // avoid to execute the actual submit of the form.

        User.uname = $(this).find('input[type="text"]').val();
        User.psw = $(this).find('input[type="password"]').val();
        User.email = $(this).find('input[type="email"]').val();

        let str = JSON.stringify({"psw":User.psw,"email": User.email,"uname": User.uname,"uid":"","sid":""});//JSON.stringify()
        localStorage.setItem(md5("uname"),str);//

        User.Login();

        return false;
    });

    $('#close_auth').on('click',OnCloseAuth);

};


function OnClickAuth(el){

    $('head').append('<link rel="stylesheet" type="text/css" href="../libs/jquery/mobile/1.4.5/jquery.mobile-1.4.5.min.css">');

    $('#auth_modal')[0].showModal();
    transition = setTimeout(function() {
        $('#auth_modal').addClass('dialog-scale');
    }, .5);

    $('#menu_items').slideToggle('slow', function () { });
    //$('#menu_container').slideToggle('slow', function () { });

}


function OnCloseAuth(){

    $('#auth_modal')[0].close();
    $('#auth_modal').removeClass('dialog-scale');
    // $('#settings_modal').remove();
    clearTimeout(transition);
    $('head').find('link').last().remove();//remove last file from html file
}

function OnClickBucket(el){
    $("#bucket").attr('drag',true);
}

