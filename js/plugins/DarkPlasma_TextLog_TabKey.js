(function () {
  'use strict';

  const _Scene_Map_isTextLogCalled = Scene_Map.prototype.isTextLogCalled;
  Scene_Map.prototype.isTextLogCalled = function () {
    return _Scene_Map_isTextLogCalled.call(this) || Input.isTriggered('tab');
  };

  const _Window_TextLog_isCancelTriggered = Window_TextLog.prototype.isCancelTriggered;
  Window_TextLog.prototype.isCancelTriggered = function () {
    return _Window_TextLog_isCancelTriggered.call(this) || Input.isTriggered('tab');
  };
})();