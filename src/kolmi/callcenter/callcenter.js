require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require('bootstrap');


$(window).on('load', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    $('.card').mouseleave(function (ev) {

        if($(ev.currentTarget).hasClass('ui-draggable')) {
            $(ev.currentTarget).draggable('destroy');
            $(ev.currentTarget).css('z-index', 100);
        }
    });

    $('.card').mouseenter(function (ev) {
        if($('.callObject',$(ev.currentTarget).find('iframe.kolmi').contents()).css('display')!=='none'){
            if(!$(ev.currentTarget).hasClass('ui-draggable')) {
                $(ev.currentTarget).draggable({
                    revert: true
                });
                $(ev.currentTarget).css('z-index', 200);
            }
        }
    });
    $('.kolmi_operator').droppable({
        drop: function( event, ui ) {
            let user = $(ui.draggable[0]).find('iframe')[0].contentWindow.user;
            if($(this).find('iframe')[0].contentWindow.user.DC)
                $(this).find('iframe')[0].contentWindow.user.DC.SendRedirect(
                    {uid:user.uid,abonent:user.abonent,name:$(ui.draggable).find('.oper_name').text(),pcPull:user.pcPull[user.trans].params});
        }
    });
});