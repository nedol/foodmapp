'use strict'
export {Profile};

require('jquery-ui')
// require('jquery-ui-touch-punch');
require('jquery.ui.touch');
require('bootstrap');

class Profile{

    constructor(profile){
        this.profile = !profile?{}:profile;
    }

    //Supplier
    InitSupplierProfile(user){
        let that = this;
        //profile iframe
        let browser =  $('#profile_container').find('.browser');
        $('#profile_container').css('display','block');
        browser.draggable();
        browser.attr('src', './profile.supplier.html');

        browser.off();
        browser.on('load', function () {
            browser[0].contentWindow.InitProfileSupplier(user,
            {
                readOnly: true,
                profilePictureURL: that.profile.avatar,
                enableEditing: false,
                enableDeleting:false,
                enableReplying: true,
                textareaPlaceholderText: 'Оставить комментарий',
                newestText: 'Новые',
                oldestText: 'Старые',
                popularText: 'Популярные',
                sendText: 'Послать',
                replyText: 'Ответить',
                editText: 'Изменить',
                editedText: 'Измененный',
                youText: 'Я',
                saveText: 'Сохранить',
                hideRepliesText: 'Скрыть'
            });

            if(that.profile) {
                $('input',browser.contents()).removeAttr('disabled');
                $('#email', browser.contents()).attr('disabled', true);
                if(!that.profile.email){
                    $('#email', browser.contents()).attr('placeholder','Не подтвержден. Проверьте почту');
                }else{
                    $('#email', browser.contents()).val(that.profile.email);
                }
                $('#name', browser.contents()).val(that.profile.name);
                $('#mobile', browser.contents()).val(that.profile.mobile);
                $('#address', browser.contents()).val(that.profile.address);
                $('#place', browser.contents()).val(that.profile.place);
                $('img.avatar', browser.contents()).attr('src',that.profile.avatar);
                $('img.avatar', browser.contents()).attr('thmb',that.profile.thmb);
                if(window.user.constructor.name==='Deliver'){
                    $('a[href=\'#settings\']',browser.contents()).css('display','none');
                }

                setTimeout(function () {
                    browser[0].contentWindow.profile_sup.InitRating();
                    browser[0].contentWindow.profile_sup.SetRatingReadonly();
                },500);
            }

            $('.title h1', browser.contents()).text('Мой профиль');
            $('.odr_ctrl', browser.contents()).on('click', function (ev) {
                $(that.ovc).find('.order').css('display', 'block');
                browser.css('display', 'none');
            });
            $('.close_browser', browser[0].contentWindow).on('click touchstart', function (ev) {
                browser[0].contentWindow.profile_sup.SaveSettings();
                $('#profile_container').css('display','none');
            });
        });
    }
    //Deliver
    InitDeliverProfile(){
        let that = this;
        //profile iframe
        let browser =  $('#profile_container').find('.browser');
        $('#profile_container').css('display','block');
        browser.draggable();

        browser.attr('src', './profile.deliver.html');

        browser.off();
        browser.on('load', function () {
            browser[0].contentWindow.InitProfileDeliver(window.user,
            {
                readOnly: true,
                profilePictureURL: that.profile.avatar,
                enableEditing: false,
                enableDeleting:false,
                enableReplying: true,
                textareaPlaceholderText: 'Оставить комментарий',
                newestText: 'Новые',
                oldestText: 'Старые',
                popularText: 'Популярные',
                sendText: 'Послать',
                replyText: 'Ответить',
                editText: 'Изменить',
                editedText: 'Измененный',
                youText: 'Я',
                saveText: 'Сохранить',
                hideRepliesText: 'Скрыть'
            });

            if(that.profile) {
                $('input',browser.contents()).removeAttr('disabled');
                $('#email', browser.contents()).attr('disabled', true);
                if(!that.profile.email){
                    $('#email', browser.contents()).attr('placeholder','Не подтвержден. Проверьте почту');
                }else{
                    $('#email', browser.contents()).val(that.profile.email);
                }
                $('#name', browser.contents()).val(that.profile.name);
                $('#mobile', browser.contents()).val(that.profile.mobile);
                $('#address', browser.contents()).val(that.profile.address);
                $('#place', browser.contents()).val(that.profile.place);

                setTimeout(function () {
                    browser[0].contentWindow.profile_sup.InitRating();
                    browser[0].contentWindow.profile_sup.SetRatingReadonly();
                },500);
            }
            $('.title h1', browser.contents()).text('Мой профиль');
            $('.odr_ctrl', browser.contents()).on('click', function (ev) {
                $(that.ovc).find('.order').css('display', 'block');
                browser.css('display', 'none');
            });
        });
    }
    //Customer
    LoadSupplierProfile(that, ovc, rating){
        //profile iframe
        let browser = ovc.find('.browser');
        let avatar = ovc.find('.avatar').attr('src');

        browser.attr('src', '../profile.supplier.html');
        browser.off('load');
        browser.on('load', function () {
            browser[0].contentWindow.InitProfileSupplier({supuid:that.uid,user:window.user.constructor.name},
            {   //comments settings
                readOnly: (that.appr && that.appr.cusuid===window.user.uid)?false:true,
                profilePictureURL: that.profile.thmb?that.profile.thmb:that.profile.avatar,
                enableEditing: true,
                enableDeleting:false,
                enableReplying: false,
                textareaPlaceholderText: 'Оставить комментарий',
                newestText: 'Новые',
                oldestText: 'Старые',
                popularText: 'Популярные',
                sendText: 'Послать',
                replyText: 'Ответить',
                editText: 'Изменить',
                editedText: 'Измененный',
                youText: 'Я',
                saveText: 'Сохранить',
                hideRepliesText: 'Скрыть'
            });

            if(that.profile) {
                // $('input',browser.contents()).prop('readonly', true);
                // $('input',browser.contents()).attr('placeholder', '');
                $('input',browser.contents()).attr('title', '');
                $('#name', browser.contents()).val(that.profile.name);
                $('#email', browser.contents()).val(that.profile.email);
                $('#mobile', browser.contents()).val(that.profile.mobile);
                $('#address', browser.contents()).val(that.profile.address);
                $('#place', browser.contents()).val(that.profile.place);

                browser[0].contentWindow.profile_sup.InitRating();
                if(that.appr && that.appr.cusuid!==window.user.uid)
                    browser[0].contentWindow.profile_sup.SetRatingReadonly();
                browser[0].contentWindow.profile_sup.SetRating(rating);

            }
            if(!window.user.profile.profile.type)
                $('a[href=\"#settings\"]', browser.contents()).parent('li').css('display','none');

            $('.odr_ctrl', browser.contents()).on('click', function (ev) {
                $(that.ovc).find('.order').css('display', 'block');
                browser.css('display', 'none');
            });
            $('.close_browser', browser.contents()).on('click touchstart', function (ev) {
                that.SaveOrder(that,window.sets.lang);
                that.offer = '';
                ovc.remove();
            });
        });
    }

    SaveProfile(){
        let browser =  $('#profile_container').find('.browser');
        browser[0].contentWindow.profile_sup.SaveProfile(window.user.uid, window.user.psw);
    }
    SaveSettings(){
        let browser =  $('#profile_container').find('.browser');
        browser[0].contentWindow.profile_sup.SaveSettings();
    }
}