/* export default function webAudioTouchUnlock(context) {
  return new Promise(function(resolve, reject) {
    if (context.state === 'suspended' && 'ontouchstart' in window) {
      var unlock = function() {
        context.resume().then(
          function() {
            document.body.removeEventListener('touchstart', unlock);
            document.body.removeEventListener('touchend', unlock);

            resolve(true);
          },
          function(reason) {
            reject(reason);
          }
        );
      };

      document.body.addEventListener('touchstart', unlock, false);
      document.body.addEventListener('touchend', unlock, false);
    } else {
      resolve(false);
    }
  });
} */

export default function webAudioTouchUnlock(context) {
  return new Promise(function(resolve, reject) {
    if (!context || !(context instanceof (window.AudioContext || window.webkitAudioContext))) {
      reject('WebAudioTouchUnlock: You need to pass an instance of AudioContext to this method call');
      return;
    }
    if (context.state === 'suspended' && 'ontouchstart' in window) {
      var unlock_1 = function() {
        context.resume().then(
          function() {
            document.body.removeEventListener('touchstart', unlock_1);
            document.body.removeEventListener('touchend', unlock_1);
            resolve(true);
          },
          function(reason) {
            reject(reason);
          }
        );
      };
      document.body.addEventListener('touchstart', unlock_1, false);
      document.body.addEventListener('touchend', unlock_1, false);
    } else {
      resolve(false);
    }
  });
}