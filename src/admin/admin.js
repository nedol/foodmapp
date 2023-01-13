import { Сетка } from '../../network';

import { Utils } from '../utils/utils';

(async function Entry() {
  let promise = new Promise((resolve, reject) => {
    $.getJSON('../../src/host/host.json', function (data) {
      window.con_param = data;
      resolve();
    });
  });
  let res = await promise;

  window.network = new Сетка(window.con_param.host_ws);
})();

window.OnClickButton = function () {
  const utils = new Utils();

  const psw = utils.getParameterByName('psw');
  const data_post = {
    proj: 'd2d',
    user: 'Admin',
    func: 'remimgfs',
    host: location.origin,
    psw: psw,
  };

  window.network.SendMessage(data_post, function (obj) {
    console.log(obj.res);
  });
};
