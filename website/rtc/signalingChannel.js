/**
 * Created by android on 27.04.2018.
 */
export{SignalingChannel}
import axios from 'axios';

class SignalingChannel{

    constructor(local){
        this.host = ''+(local?'http://localhost:3000':https"//nedol.ru/server/');
    }


    SendParamsWaitingAnswer(params, rtc_client, cb){
        let this_obj = this;
        axios.post(this.host, JSON.stringify(params))
            .then(function (response) {
                trace('Recieved response from server');
                cb(response.data);
            })
            .catch(function (error) {//waiting for rem_client
                if(!rtc_client.rtc_params['rem_desc'] || !rtc_client.rtc_params['rem_cand'])
                    this_obj.SendParamsWaitingAnswer(params, rtc_client, cb);
            });
    }
}