//=============================================================================
// AddVersionInfo.js
// ----------------------------------------------------------------------------
// (C) 2021 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc ゲームタイトルとセーブデータにバージョン情報を追加します
 * @author Shun / inazumasoft
 *
 * @help 
 * ゲームタイトルとセーブデータにバージョン情報を追加します
 * また、内部的に過去バージョンの履歴を持たせることでデバッグに役立てます
 * 
 * @param VersionPrefix
 * @type string
 * @desc バージョン情報の前に追加される文字
 * @default v
 * 
 * @param VersionInfo
 * @type string
 * @desc タイトル、及びセーブデータに追加されるバージョン情報
 * 
 */

(function () {

    let parameters = PluginManager.parameters('AddVersionInfo');
    const prefix = parameters['VersionPrefix'];
    const version = parameters['VersionInfo'];

    function GameVersion() {
        return " " + prefix + version;
    }

    let _Game_System_Initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_Initialize.call(this);
        this._gameVersion = GameVersion();
        this._gameVersionHistory = [];
    };

    Game_System.prototype.gameVersionCheck = function () {
        if (this._gameVersion !== GameVersion()) {
            if (this._gameVersion) {
                this._gameVersionHistory.push(this._gameVersion);
            }
            else {
                this._gameVersionHistory = [];
                this._gameVersionHistory.push('undefined');
            }

            this._gameVersion = GameVersion();
        }
    }

    let _DataManagerMakeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function () {
        let info = _DataManagerMakeSavefileInfo.call(this);
        info.title += GameVersion();
        return info;
    };

    Scene_Boot.prototype.updateDocumentTitle = function () {
        document.title = $dataSystem.gameTitle + GameVersion();
    };

    let _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager_extractSaveContents.apply(this, arguments);
        $gameSystem.gameVersionCheck();
    };

})()