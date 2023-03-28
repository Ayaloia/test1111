//=============================================================================
// globalmap_mdfix.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc globalmap.jsの修正プラグイン
 * @author Shun
 * 
 * @param Npc Location Transfer Switch
 * @desc NPC が場所移動に使用するイベントを指定するためのスイッチID
 * @type switch
 * @default 1
 * 
 * @param Npc Excute Event Switch
 * @desc NPC が実行するイベントページを指定するスイッチID
 * @type switch
 * @default 2
 * 
 * @param Npc Event Map Id
 * @desc NPC のイベントデータを格納した MapId
 * @default 1
 * 
 * @param Road Region Id
 * @desc 歩く経路を指定するリージョンID
 * @default 1
 * 
 * @param Primary Road Region Id
 * @desc 優先的に歩く経路を指定するリージョンID
 * @default 2
 * 
 * @param Save Npc Data
 * @desc Npc データを保存するか
 * @type boolean
 * @default true
 * 
 * @help 
 * 本プラグインは
 * globalmapプラグイン をメイドさんゲー用に修正
 * 本来別のファイルに定義されている関連の拡張メソッドを追加するものです。
 * 
 */

$globalMap = null;

(function () {
    'use strict';

    var parameters = PluginManager.parameters('globalmap_mdfix');
    var npcExcuteEventSwitch = parseInt(parameters['Npc Excute Event Switch'] || 1);
    var npcLocationTransferSwitch = parseInt(parameters['Npc Location Transfer Switch'] || 1);
    var npcEventMapId = parseInt(parameters['Npc Event Map Id'] || 1);
    var roadRegionId = parseInt(parameters['Road Region Id'] || 1);
    var primaryRoadRegionId = parseInt(parameters['Primary Road Region Id'] || 2);
    var saveNpcData = parameters['Save Npc Data'] === 'true' ? true : false;

    //==============================
    // MB_Map
    //==============================
    MB_Map.prototype.defineRegions = function () {
        this._region.fields = [];
        this._region.watersides = [];
        this._region.roads = [];
        this._region.primaryRoads = [];

        const w = this.width;
        const h = this.height;

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                if (this.isRoadRegion(x, y)) {
                    this._region.roads.push(new MB_Vector2(x, y));
                }
            }
        }
    }

    MB_Map.prototype.isRoadRegion = function (x, y) {
        var id = this.regionId(x, y) & roadRegionId;
        return id === roadRegionId;
    }

    MB_Map.prototype.isPrimaryRoadRegion = function (x, y) {
        var id = this.regionId(x, y) & primaryRoadRegionId
        return id === primaryRoadRegionId;
    }

    MB_Map.npcLocationTransferSwitch = function () {
        return npcLocationTransferSwitch;
    }

    MB_Map.npcExcuteEventSwitch = function () {
        return npcExcuteEventSwitch;
    }

    //==============================
    // MB_GlobalMap
    //==============================
    MB_GlobalMap.npcEventMapId = function () {
        return npcEventMapId;
    }

    MB_GlobalMap.prototype.nearToilet = function (mapId) {
        const toilets = $dataToilet.filter(data => data).map(data => data[0]);
        return toilets.find(data => data.id === mapId);
    }

    //========================================
    // Scene_Map
    //========================================
    var _SceneMapUpdateMain = Scene_Map.prototype.updateMain;
    Scene_Map.prototype.updateMain = function () {
        $globalMap.update();
        _SceneMapUpdateMain.call(this);
    };

    //========================================
    // DataManager
    //========================================
    const _MB_DataManagerCreateGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function () {
        _MB_DataManagerCreateGameObjects.call(this);
        $globalMap = new MB_GlobalMap();
    };

    const _DataManager_SetupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function () {
        _DataManager_SetupNewGame.call(this);
        $globalMap.setup();
    };

    var _DataManagerMakeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function () {
        // A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
        var contents = _DataManagerMakeSaveContents.call(this);
        if (saveNpcData) {
            $globalMap.makeSaveContents(contents);
        }
        return contents;
    };

    var _DataManagerEXtractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManagerEXtractSaveContents.call(this, contents);
        if (saveNpcData) {
            $globalMap.extractSaveContents(contents);
        }
    };

})()