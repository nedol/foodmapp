'use strict'
export {videoPano};


class videoPano{

    constructor() {


    }

    OpenPano(path){

        $('#cube_menu')[0].setAttribute('visible','false');
        $('a-sky')[0].setAttribute('visible','false');
        $('a-videosphere')[0].setAttribute('visible','true');
        $('a-videosphere')[0].setAttribute('src',path);
        if(path==='#start'){
            $('#hack_logo').css('display','block');

        }
        else if(path==='#hall'){
            $('#hack_logo').css('display','block');
            $('#hall_set')[0].setAttribute('visible', 'true');

        }
    }



    ClosePano(){
        $('a-videosphere')[0].setAttribute('src','');
        $('a-videosphere')[0].setAttribute('visible','false');
    }

}


//////////////////
// WEBPACK FOOTER
// ./videoPano.js
// module id = 211
// module chunks = 0