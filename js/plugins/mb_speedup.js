/*:ja
 * @plugindesc 倍速化プラグイン
 * 
 * @help
 * controlキー押下で倍速モードの切り替えをします。
 * 倍速モード中は、プレイヤーとNPCのキャラ速度が2倍になります。
 * 
 */
(() => {
    "use strict";
    const DEFAULT_SPEED = 1;
    let times = DEFAULT_SPEED;

    const _Game_Chronus_getAutoAddInterval = Game_Chronus.prototype.getAutoAddInterval;
    Game_Chronus.prototype.getAutoAddInterval = function() {
        let baseInterval = _Game_Chronus_getAutoAddInterval.call(this);
        if(times <= 0) {
            return baseInterval;
        } else {
            let interval = Math.max(1, Math.floor(baseInterval / times));
            return interval;
        }
    };
    Game_Player.prototype.realMoveSpeed = function() {
        let speed = Game_Character.prototype.realMoveSpeed.call(this);
        return getCurrentSpeed(speed);
    };
    MB_NonPlayer.prototype.realMoveSpeed = function() {
        let speed = Game_Event.prototype.realMoveSpeed.call(this);
        return getCurrentSpeed(speed);
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if(!$gameMap.isEventRunning()) {
            if(Input.isTriggered("control")) {
                times = (times === DEFAULT_SPEED) ? 2 : DEFAULT_SPEED;
            }    
        }
    }
    
    function getCurrentSpeed(baseSpeed) {
        return baseSpeed + Math.max(0, times - 1);
    }

})();