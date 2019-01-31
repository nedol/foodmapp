'use strict'
export {Profile};


class Profile{

    constructor(profile){
        this.profile = !profile?{}:profile;
    }
    //Supplier
    OpenMyProfile(ev){
        let that = ev.data;
        //profile iframe
        let browser =  $('#profile_container').find('.browser');
        $('#profile_container').css('display','block');
        browser.draggable();
        browser.attr('src', '../src/profile/supplier.html');

        browser.off();
        browser.on('load', function () {
            browser[0].contentWindow.InitProfileSupplier({supuid:that.uid,user:window.user.constructor.name},
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
                $('#name', browser.contents()).val(that.profile.profile.name);
                $('#email', browser.contents()).val(that.profile.profile.email);
                $('#mobile', browser.contents()).val(that.profile.profile.mobile);
                $('#address', browser.contents()).val(that.profile.profile.address);

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
            $('.close_browser', browser.contents()).on('click touchstart', function (ev) {
                $('#profile_container').css('display','none');
            });
        });
    }

    //Customer
    OpenSupplierProfile(that,ovc, rating){
        //profile iframe
        let browser = ovc.find('.browser');
        let avatar = ovc.find('.avatar').attr('src');
        browser.draggable();
        browser.attr('src', '../src/profile/supplier.html');
        browser.on('load', function () {
            browser[0].contentWindow.InitProfileSupplier({supuid:that.uid,user:window.user.constructor.name},
                {   //comments settings
                    readOnly: (that.appr.cusuid===window.user.uid)?false:true,
                    profilePictureURL: that.profile.avatar?that.profile.avatar:avatar,
                    enableEditing: false,
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
                    hideRepliesText: 'Скрыть'});

            if(that.profile) {
                $('input',browser.contents()).removeAttr('disabled');
                $('#name', browser.contents()).val(that.profile.name);
                $('#email', browser.contents()).val(that.profile.email);
                $('#mobile', browser.contents()).val(that.profile.mobile);
                $('#address', browser.contents()).val(that.profile.address);

                browser[0].contentWindow.profile_sup.InitRating();
                if(that.appr.cusuid!==window.user.uid)
                    browser[0].contentWindow.profile_sup.SetRatingReadonly();
                browser[0].contentWindow.profile_sup.SetRating(rating);

            }

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
}