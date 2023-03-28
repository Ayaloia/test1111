
//=============================================================================
// SelfSwitchExpansion.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// https://twitter.com/inazuma_soft
// https://ci-en.dlsite.com/creator/2713
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc セルフスイッチの一括リセット機能を提供します
 * @author Shun
 *
 * @help 
 * 
 * プラグインコマンド
 *
 * RESET_SELFSWITCH : [A~D] [ONCHANGE]
 * 第一引数　アルファベットの A から D を指定します
 * 第二引数　true false のいずれかを指定します
 * 
 * セルフスイッチを変更した際に既定の動作ではイベントのリフレッシュ処理などが入ります
 * ONCHANGE を false に設定した場合はリフレッシュ処理が入りません
 */

(function () {
    'use strict'
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "RESET_SELFSWITCH":
                var onChange = args[1].toLowerCase() === 'false' ? false : true;
                $gameSelfSwitches.resetSwitch(args[0], onChange);
                break;
        }
    };

    Game_SelfSwitches.prototype.resetSwitch = function (name, onChange = true) {
        Object.keys(this._data)
            .filter(key => key.split(',')[2] === name)
            .forEach(key => this._data[key] = false);
        if (onChange) {
            this.onChange();
        }
    };

    Game_CharacterBase.prototype.setSelfSwitch = function () {
    }

    Game_Event.prototype.setSelfSwitch = function (name, value) {
        const key = [this._mapId, this._eventId, name];
        $gameSelfSwitches.setValue(key, value);
    }

})()