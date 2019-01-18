'use strict'
export {Menu}

class Menu{
    constructor(){
        $('.sup_menu').animate({'width': 'toggle'});
        $('.toggle_menu').on('click',function (ev) {
            //close in map.events  -> this.map.ol_map.on('click',
            $('.sup_menu').animate({'width': 'toggle'});
        });
    }
}