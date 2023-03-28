//=============================================================================
// globalmap.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc 広域マップクラスを定義するプラグイン
 * @author Shun / inazumasoft
 *
 * @help 
 * 広域マップクラスを定義します。
 * npc.js と timetable.js とを組み合わせてマップを跨いでの自律移動を実現します。
 * 
 * 本プラグインは
 * 各マップの接続情報の定義や取得、NPCへのアクセスを提供します。
 * 
 * プラグインコマンド詳細
 *
 * NPC_NEWDAY : 各 NPC のスケジュールを翌日に更新する
 * NPC_JUMPTIME [時] : 各 NPC のスケジュールを指定した時間に更新する
 * NPC_APPEAR [ID] :  指定した ID の NPC を出現させます
 * NPC_LEAVE [ID] : 指定した ID の NPC を退場させます 
 * NPC_INTERRUPT [ID] [mapId] [x] [y] [d] 指定したマップIDの
 * NPC_SETTARGET [ID] [target]
 * NPC_CLEARTARGET [ID]
 * NPC_SETSPEED [ID] [speed]
 * NPC_SETPOSITION [ID] [x] [y] [d] : NPC を指定した場所に移動させます
 * NPC_SETMAP [ID] [mapID] : NPC を指定した Map に移動させます
 */

(function () {
    'use strict';

    var convertEscapeCharacters = function (text) {
        if (text == null) text = '';
        var window = SceneManager._scene._windowLayer.children[0];
        return window ? window.convertEscapeCharacters(text) : text;
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "NPC_NEWDAY":
                var date = $gameSystem.chronus().dateData();
                $globalMap.nonPlayers().forEach(npc => npc.newDay(date));
                break;
            case "NPC_JUMPCURRENTTIME":
                var hour = $gameSystem.chronus().getHour();
                var minute = $gameSystem.chronus().getMinute();
                if (0 < args.length) {
                    var id = parseInt(convertEscapeCharacters(args[0]));
                    $globalMap.nonPlayer(id).jumpSpecifiedTime(hour, minute);
                }
                else {
                    $globalMap.nonPlayers().forEach(npc => npc.jumpSpecifiedTime(hour, minute));
                }
                break;
            case "NPC_JUMPTIME":
                if (2 < args.length) {
                    var id = parseInt(convertEscapeCharacters(args[0]));
                    var hour = parseInt(convertEscapeCharacters(args[1]));
                    var minute = parseInt(convertEscapeCharacters(args[2]));
                    $globalMap.nonPlayer(id).jumpSpecifiedTime(hour, minute);
                }
                else {
                    var hour = parseInt(convertEscapeCharacters(args[0]));
                    var minute = parseInt(convertEscapeCharacters(args[1]));
                    $globalMap.nonPlayers().forEach(npc => npc.jumpSpecifiedTime(hour, minute));
                }
                break;
            case "NPC_ADDTIME":
                var hour = $gameSystem.chronus().getHour();
                var minute = $gameSystem.chronus().getMinute();
                if (1 < args.length) {
                    var id = parseInt(convertEscapeCharacters(args[0]));
                    minute += parseInt(convertEscapeCharacters(args[1]));
                    $globalMap.nonPlayer(id).jumpSpecifiedTime(hour, minute);
                }
                else {
                    minute += parseInt(convertEscapeCharacters(args[0]));
                    $globalMap.nonPlayers().forEach(npc => npc.jumpSpecifiedTime(hour, minute));
                }
                break;
            case "NPC_ADVANCESCHEDULE":
                var hour = $gameSystem.chronus().getHour();
                var minute = $gameSystem.chronus().getMinute();
                if (1 < args.length) {
                    hour = parseInt(convertEscapeCharacters(args[1]));
                    minute = parseInt(convertEscapeCharacters(args[2]));
                }
                var id = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.nonPlayer(id).advanceTheSchedule(hour, minute);
                break;
            case "NPC_APPEAR":
                var id = parseInt(convertEscapeCharacters(args[0]));
                var hour = parseInt(convertEscapeCharacters(args[1]));
                if (!hour) {
                    hour = $gameSystem.chronus().getHour();
                }
                $globalMap.appearNonPlayer(id, hour);
                break;
            case "NPC_LEAVE":
                var id = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.leaveNonPlayer(id);
                break;
            case "NPC_INTERRUPT":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var mapId = parseInt(convertEscapeCharacters(args[1]));
                var x = parseInt(convertEscapeCharacters(args[2]));
                var y = parseInt(convertEscapeCharacters(args[3]));
                var d = parseInt(convertEscapeCharacters(args[4]));
                var subtractProgress = parseInt(convertEscapeCharacters(args[5]));
                subtractProgress = subtractProgress ? subtractProgress : 0;
                $globalMap.nonPlayers()[npcId - 1].interrupt(mapId, x, y, d, subtractProgress);
                break;
            case "NPC_CLEARDESTINATION":
                if (0 < args.length) {
                    var npcId = parseInt(convertEscapeCharacters(args[0]));
                    $globalMap.nonPlayer(npcId).clearDestination();
                }
                else {
                    $globalMap.nonPlayers().forEach(npc => npc.clearDestination());
                }

                break;
            case "NPC_CHECKAPPOINT":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var before = parseInt(convertEscapeCharacters(args[1])) || 0;
                $globalMap.nonPlayer(npcId).checkLastMinuteAppointments(before);
                break;
            case "NPC_CHECKTOILET":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.nonPlayer(npcId).checkToilet();
                break;
            case "NPC_SETTARGET":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var targetId = parseInt(convertEscapeCharacters(args[1]));
                var character = targetId > 0 ? $globalMap.nonPlayer(targetId) : $gamePlayer;
                $globalMap.nonPlayer(npcId).setTarget(character);
                break;
            case "NPC_CLEARTARGET":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                if (npcId) {
                    $globalMap.nonPlayer(npcId).setTarget(null);
                } else {
                    $globalMap.nonPlayers().forEach(npc => npc.setTarget(null));
                }
                break;
            case "NPC_SETSPEED":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var speed = parseFloat(convertEscapeCharacters(args[1]));
                $globalMap.nonPlayer(npcId).setMoveSpeed(speed);
                break;
            case "NPC_SETDIR":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var dir = parseFloat(convertEscapeCharacters(args[1]));
                if (dir === 0) {
                    $globalMap.nonPlayer(npcId).turnTowardPlayer();
                } else {
                    $globalMap.nonPlayer(npcId).setDirection(dir);
                }
                break;
            case "NPC_LOCK":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.nonPlayer(npcId).lock();
                break;
            case "NPC_UNLOCK":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.nonPlayer(npcId).unlock();
                break;
            case "NPC_SETPOSITION":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var npc = $globalMap.nonPlayer(npcId);
                var x = parseInt(convertEscapeCharacters(args[1]));
                var y = parseInt(convertEscapeCharacters(args[2]));
                var d = parseInt(convertEscapeCharacters(args[3]));
                d = d ? d : npc.direction();
                var mapId = npc.mapId();
                npc.setPosition(x, y, d, mapId);
                break;
            case "NPC_SETMAP":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var npc = $globalMap.nonPlayers()[npcId - 1];
                var mapId = parseInt(convertEscapeCharacters(args[1])) || $gameMap.mapId();
                npc.performTransfer(mapId, npc.x, npc.y, npc.direction());
                break;
            case "NPC_RESETPATTERN":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                $globalMap.nonPlayer(npcId).setPattern(1);
                break;
            case "NPC_PAUSE":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var npc = $globalMap.nonPlayer(npcId);
                var hour = parseInt(convertEscapeCharacters(args[1]));
                var minute = parseInt(convertEscapeCharacters(args[2]));
                npc.pause(hour, minute);
                break;
            case "NPC_RESUME":
                var npcId = parseInt(convertEscapeCharacters(args[0]));
                var npc = $globalMap.nonPlayers()[npcId - 1];
                npc.resume();
                break;
            case "NPC_CHANGECOSTUME":
                if (0 < args.length) {
                    var npcId = parseInt(convertEscapeCharacters(args[0]));
                    var costumeId = parseInt(convertEscapeCharacters(args[1]));
                    $globalMap.nonPlayer(npcId).changeCostume(costumeId);
                }
                else {
                    var costumeId = parseInt(convertEscapeCharacters(args[0]));
                    $globalMap.nonPlayers().forEach(npc => npc.changeCostume(costumeId));
                }

                break;
            case "GLOBALMAP_PAUSE":
                $globalMap.pause();
                break;
            case "GLOBALMAP_RESUME":
                $globalMap.resume();
                break;
        }
    };

    //==================================================
    // MB_NPCExcuteEvent
    // NPCが実行するイベントデータを保持、アクセサを提供するクラス
    //==================================================
    class MB_NPCExcuteEvent {
        constructor(mapId, eventId, event) {
            /**
             * @type {number}
             */
            this._mapId = mapId;
            /**
             * @type {number}
             */
            this._eventId = eventId;
            /**
             * @type {MB_NonPlayer}
             */
            this._character = null;
            /**
             * @type {RPG.Event}
             */
            this._event = event;
            /**
             * @type {number}
             */
            this._pageIndex = -1;
        }

        get x() {
            return this._event.x;
        }

        get y() {
            return this._event.y;
        }

        get meta() {
            return this._event.meta;
        }

        eventId() {
            return this._eventId;
        }

        mapId() {
            return this._mapId;
        }

        list() {
            return this.page().list;
        }

        page() {
            return this._event.pages[this._pageIndex];
        }

        setCharacter(chara) {
            this._character = chara;
        }

        setPosition(x, y) {
            this._event.x = x;
            this._event.y = y;
        }

        refresh(chara) {
            this.setCharacter(chara);
            this._pageIndex = this.findProperPageIndex();
        }

        findProperPageIndex() {
            var pages = this._event.pages;
            for (var i = pages.length - 1; i >= 0; i--) {
                var page = pages[i];
                if (this.meetsConditions(page)) {
                    return i;
                }
            }
            return -1;
        }

        meetsConditions(page) {
            var c = page.conditions;
            // if (c.switch1Valid) {
            //     if (!$gameSwitches.value(c.switch1Id)) {
            //         return false;
            //     }
            // } 
            if (c.switch2Valid) {
                if (!$gameSwitches.value(c.switch2Id)) {
                    return false;
                }
            }
            if (c.variableValid) {
                if ($gameVariables.value(c.variableId) < c.variableValue) {
                    return false;
                }
            }
            if (c.selfSwitchValid) {
                var key = [this._mapId, this._eventId, c.selfSwitchCh];
                if ($gameSelfSwitches.value(key) !== true) {
                    return false;
                }
            }
            if (c.itemValid) {
                var item = $dataItems[c.itemId];
                if (!$gameParty.hasItem(item)) {
                    return false;
                }
            }
            if (c.actorValid) {
                if (!(c.actorId - 1 === this._character.charaId)) {
                    return false;
                }
            }
            return true;
        };

        isParallel() {
            const page = this.page();
            if (!page) {
                return false
            }
            return page.trigger === 4;
        }

        isTile() {
            const page = this.page();
            if (!page) {
                return false
            }
            return page.priorityType === 0;
        };

        isNormalPriority() {
            const page = this.page();
            if (!page) {
                return false
            }
            return page.priorityType === 1;
        };

    }

    ClassRegister(MB_NPCExcuteEvent);

    //==================================================
    // MB_Map
    // 各マップの接続やリージョン情報
    // NPC実行イベントの配列を保持し、アクセサを提供するクラス
    //==================================================
    class MB_Map {
        /**
         * @param {number} mapId
         */
        constructor(mapId) {
            /**
             * @type {number}
             */
            this._mapId = mapId;
            /**
             * @type {RPG.Map}
             */
            this._data = {};
            /**
             * @type {Array<MB_NPCExcuteEvent>}
             */
            this._nonPlayerExcuteEvents = [];
            /**
             * @type {Array<Game_TrapEvent>}
             */
            this._traps = [];
            /**
             * @type {GlobalMap.MapIdToEntranceEventMap}
             */
            this._mapIdToEntranceMap = {};

            /**
             * @type {GlobalMap.Region}
             */
            this._region = {}

            this.readMapData();
            this.defineNpcExcuteEvents()
            this.defineEntrances();
            this.defineRegions();
        }

        get events() {
            return this._data.events;
        }

        get fields() {
            return this._region.fields;
        }

        get roads() {
            return this._region.roads;
        }

        get watersides() {
            return this._region.watersides;
        }

        get width() {
            return this._data.width;
        }

        get height() {
            return this._data.height;
        }

        get traps() {
            return this._traps;
        }

        static npcLocationTransferSwitch() {
            return 4;
        }

        static npcExcuteEventSwitch() {
            return 5;
        }

        /**
         * @param {RPG.Event} event 
         * @returns {Array<RPG.EventPage>}
        */
        static getPagesMeetsCondition(event, condition) {
            return event.pages
                .filter(
                    page => page.conditions.switch1Id == condition && page.conditions.switch1Valid
                ).map(page => page);
        }
        /**
         * @param {Array<RPG.EventPage>} pages 
         * @returns {Array<number>}
         */
        static getLocationTransferMapId(pages) {
            let mapIds = [];
            for (let i = 0; i < pages.length; i++) {
                const command = pages[i].list.find(cmd => cmd.code === MB_Enums.Event.Code.LocationTransfer);
                if (command) {
                    mapIds.push(command.parameters[1]);
                }
            }
            return mapIds;
        }

        readMapData() {
            const fs = require('fs');
            const path = require('path');
            const dir = DataManager.relativePath('data');
            const file = 'Map' + ('000' + this._mapId).slice(-3) + '.json';

            this._data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
            this._data.events.filter(e => e).forEach(e => DataManager.extractMetadata(e));
        }

        defineNpcExcuteEvents() {
            var clonedeep = require('lodash/cloneDeep');
            /**
             * @type {Array<RPG.Event>}
             */
            const events = clonedeep(this._data.events.filter(e => !!e));
            events.forEach(
                e => {

                    const pages = MB_Map.getPagesMeetsCondition(e, MB_Map.npcExcuteEventSwitch());
                    if (pages.length) {
                        e.pages = pages;
                        this._nonPlayerExcuteEvents.push(new MB_NPCExcuteEvent(this._mapId, e.id, e));
                    }
                });
        }

        defineEntrances() {
            var clonedeep = require('lodash/cloneDeep');
            const events = clonedeep(this._data.events.filter(e => !!e));
            events.forEach(e => {
                const pages = MB_Map.getPagesMeetsCondition(e, MB_Map.npcLocationTransferSwitch());
                if (pages.length) {
                    const mapIds = MB_Map.getLocationTransferMapId(pages);
                    if (mapIds) {
                        mapIds.forEach(mapId => {
                            if (this._mapIdToEntranceMap.hasOwnProperty(mapId)) {
                                throw new Error(`
                            定義済みのマップ接続を上書きしようとしました。
                            マップID ${this._mapId}
                            イベントID ${e.id}
                            イベント名 ${e.name}
                            `);
                            }
                            this._mapIdToEntranceMap[mapId] = new MB_Vector2(e.x, e.y)
                        });
                    }
                }
            })
        }

        defineRegions() {
            this._region.fields = [];
            this._region.watersides = [];
            this._region.roads = [];

            const w = this.width;
            const h = this.height;

            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    if (this.isFieldRegion(x, y)) {
                        this._region.fields.push(new MB_Vector2(x, y));
                    }
                    if (this.isWatersideRegion(x, y)) {
                        this._region.watersides.push(new MB_Vector2(x, y));
                    }
                    if (this.isRoadRegion(x, y)) {
                        this._region.roads.push(new MB_Vector2(x, y));
                    }
                }
            }
        }


        /**
         * 
         * @param {RPG.Event} event 
         */
        addNpcExcuteEvent(event, x, y) {
            var clonedeep = require('lodash/cloneDeep');
            event = clonedeep(event);
            const pages = MB_Map.getPagesMeetsCondition(event, MB_Map.npcExcuteEventSwitch());
            if (pages.length) {
                event.pages = pages;
                const lastIndex = this._nonPlayerExcuteEvents.length - 1;
                const eventId = this._nonPlayerExcuteEvents[lastIndex].eventId() + 1;
                const npcEvent = new MB_NPCExcuteEvent(this._mapId, eventId, event);
                npcEvent.setPosition(x, y);
                this._nonPlayerExcuteEvents.push(npcEvent);
            }
        }

        /**
         * 
         * @param {MB_NPCExcuteEvent} event 
         */
        removeNpcExcuteEvent(x, y) {
            const removeEvent = this._nonPlayerExcuteEvents.filter(
                event => event.x === x && event.y === y
            ).pop();
            this._nonPlayerExcuteEvents = this._nonPlayerExcuteEvents.filter(
                event => event !== removeEvent
            );
        }

        /**
          * @returns {Array<number>}
          */
        connectMapIds() {
            return Object.keys(this._mapIdToEntranceMap).map(id => parseInt(id));
        }

        /**
         * @param {number} mapId 
         * @returns {MB_Vector2}
         */
        entrance(mapId) {
            return this._mapIdToEntranceMap[mapId];
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {RPG.Event}
         */
        nonPlayerExcuteEvent(x, y) {
            return this._nonPlayerExcuteEvents.find(event => event.x === x && event.y === y);
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {Array<RPG.Event>}
         */
        nonPlayerExcuteEvents(x, y) {
            return this._nonPlayerExcuteEvents.filter(event => event.x === x && event.y === y);
        }

        /**
         * @param {number} eventId
         * @returns {MB_NPCExcuteEvent}
         */
        nonPlayerExcuteEventFromEventId(eventId) {
            return this._nonPlayerExcuteEvents.find(event => event.id === eventId);
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {number}
         */
        regionId(x, y) {
            return this.isValid(x, y) ? this.tileId(x, y, 5) : 0;
        };

        /**
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @returns {number}
         */
        tileId(x, y, z) {
            var width = this.width;
            var height = this.height;
            return this._data.data[(z * height + y) * width + x] || 0;
        };

        /**
         * @param {number} mapId 
         * @returns {boolean}
         */
        hasConnection(mapId) {
            return this._mapIdToEntranceMap[mapId] !== undefined;
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        isRoadRegion(x, y) {
            return this.regionId(x, y) === MB_Enums.Region.Road;
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        isFieldRegion(x, y) {
            return this.regionId(x, y) === MB_Enums.Region.Field;
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        isWatersideRegion(x, y) {
            return this.regionId(x, y) === MB_Enums.Region.Waterside;
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        isValid(x, y) {
            return x >= 0 && x < this.width && y >= 0 && y < this.height;
        };

        makeSaveContents(contents) {
            // contents.localMaps[this._mapId] = { traps: this._traps };
        }

        extractSaveContents(contents) {

            // this._traps = contents.localMaps[this._mapId].traps;
            // this._traps.forEach(trap => {
            //     this.addNpcExcuteEvent(trap.event(), trap.x, trap.y);
            // });
        };

    }

    ClassRegister(MB_Map);

    //==================================================
    // 各マップの接続情報などを持つ広域マップクラス
    //==================================================
    class MB_GlobalMap {

        constructor() {
            /**
             * @type {GlobalMap.MapIdToMapData}
             */
            this._data = {};
            /**
            * @type {GlobalMap.AdjacentMapIdToRootMapIdsMap}    
            * [srcMapId: string]: {      
            * [dstMapId: string]: Array<number>
            * };
            */
            this._rootCache = {};
            /**
             * @type {Array<MB_NonPlayer>}
             */
            this._nonPlayers = {};
            /**
            * @type {NPC.Events}
            * 
            */
            this._nonPlayerEvents = {};

            /**
             * @type {boolean}
             */
            this._pause = false;
        }

        static npcEventMapId() {
            return 999;
        }

        appearNonPlayer(npcId, hour) {
            const npc = this._nonPlayers[npcId];
            npc.setValidity(true);
            npc.jumpSpecifiedTime(hour);
            if (npc.isSameMap()) {
                $gameMap.addNpc(npc);
                SceneManager.currentScene().addMapObject(npc);
            }
        }

        leaveNonPlayer(id) {
            const npc = this._nonPlayers[id];
            npc.setValidity(false);
            if (npc.isSameMap()) {
                const scene = SceneManager.currentScene();
                scene.removeCharacter(npc);
                $gameMap.removeNpc(npc.eventId());
            }
        }

        setup() {
            this.setupEachMaps();
            this.setupNonPlayers();
        }

        setupEachMaps() {
            const fs = require('fs');
            const path = DataManager.relativePath('data');

            // Map の接続定義
            fs.readdirSync(path).forEach(file => {
                let mapId = file.match(/[0-9]{3}/);
                if (mapId) {
                    mapId = parseInt(mapId[0]);
                    this._data[mapId] = new MB_Map(mapId);
                }
            });
        }

        setupNonPlayers() {
            const fs = require('fs');
            const path = require('path');
            const dir = DataManager.relativePath('data');
            const file = 'Map' + ('000' + MB_GlobalMap.npcEventMapId()).slice(-3) + '.json';

            /**
             * @type {RPG.Map}
             */
            const mapdata = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
            mapdata.events.filter(e => e).forEach(e => DataManager.extractMetadata(e));

            mapdata.events.filter(e => e).forEach(e => {
                if (this._nonPlayerEvents[e.name] === undefined) {
                    this._nonPlayerEvents[e.name] = {};
                }
                if (e.meta.hasOwnProperty('default')) {
                    this._nonPlayerEvents[e.name].default = e;
                }
                if (e.meta.hasOwnProperty('greeting')) {
                    this._nonPlayerEvents[e.name].greeting = e;
                }
                if (e.meta.hasOwnProperty('mapId')) {
                    if (!this._nonPlayerEvents[e.name].hasOwnProperty('mapId')) {
                        this._nonPlayerEvents[e.name].mapId = {};
                    }
                    this._nonPlayerEvents[e.name].mapId[parseInt(e.meta.mapId)] = e;
                }
                if (e.meta.hasOwnProperty('dayOfWeek')) {
                    if (!this._nonPlayerEvents[e.name].hasOwnProperty('dayOfWeek')) {
                        this._nonPlayerEvents[e.name].dayOfWeek = [];
                    }
                    this._nonPlayerEvents[e.name].dayOfWeek.push(e);
                }
                if (e.meta.hasOwnProperty('gift')) {
                    this._nonPlayerEvents[e.name].gift = e;
                }
                if (e.meta.hasOwnProperty('birthDay')) {
                    this._nonPlayerEvents[e.name].birthDay = e;
                }
            });

            if (!Object.keys(this._nonPlayerEvents).length) {
                throw new Error(
                    `MapId:data/${MB_GlobalMap.npcEventMapId()}.json ファイルが見つかりません。
        NPCイベントの取得に失敗しました。`);
            }

            $dataNonPlayers.slice(1).forEach(npc => {
                this._nonPlayers[npc[0].id] = new MB_NonPlayer(npc[0]);
            });
        }

        update() {
            if (this._pause) {
                return;
            }
            this.nonPlayers().filter(npc => !npc.isSameMap()).forEach(npc => npc.update());
        }

        map(mapId) {
            return this._data[mapId];
        }

        nonPlayer(npcId) {
            return this._nonPlayers[npcId];
        }

        nonPlayers() {
            return Object.values(this._nonPlayers).filter(npc => npc.isValidity());;
        };

        nonPlayerEvents(characterName) {
            return this._nonPlayerEvents[characterName];
        }

        //同じマップIDのイベントを取得
        //特定マップでの専用イベントなどに
        findEventByMapId(characterName, mapId) {
            if (this._nonPlayerEvents[characterName].mapId) {
                return this._nonPlayerEvents[characterName].mapId[mapId];
            }
        };

        //同じ曜日のイベントを取得
        findEventByDayOfWeek(characterName, dayOfWeek) {
            if (this._nonPlayerEvents[characterName].dayOfWeek) {
                return this._nonPlayerEvents[characterName].dayOfWeek[dayOfWeek];
            }
        };

        //既定のイベントを取得
        findEventDefault(characterName) {
            return this._nonPlayerEvents[characterName].default;
        }

        pause() {
            this._pause = true;
        }

        resume() {
            this._pause = false;
        }

        // //誕生日イベントを取得
        // findEventByBirthday(characterName) {
        //     return this._nonPlayerEvents[characterName].birthday;
        // }

        // //祭日イベントを取得
        // findEventByHoliday(characterName, holiday) {
        //     if (this._nonPlayerEvents[characterName].holiday) {
        //         return this._nonPlayerEvents[characterName].holiday[holiday]
        //     };
        // }

        // //贈り物イベントを取得
        // findEventByGift(characterName) {
        //     return this._nonPlayerEvents[characterName].gift;
        // }

        // //挨拶イベントを取得
        // findEventByGreeting(characterName) {
        //     return this._nonPlayerEvents[characterName].greeting;
        // }

        route(dstMapId, srcMapId = $gameMap.mapId(), relayMapId = srcMapId) {

            if (this._rootCache[srcMapId][dstMapId].indexOf(relayMapId) >= 0) {
                return false
            };

            this._rootCache[srcMapId][dstMapId].push(relayMapId);

            if (!this._data.hasOwnProperty(relayMapId)) {
                throw new Error(`MapId:${relayMapId}に有効な場所移動イベントが存在しません。`);
            }

            if (this._data[relayMapId].hasConnection(dstMapId)) {
                this._rootCache[srcMapId][dstMapId].push(dstMapId);
                return this._rootCache[srcMapId][dstMapId];
            }
            else {
                let result = this._data[relayMapId].connectMapIds().find(mapId => this.route(dstMapId, srcMapId, mapId) !== false);

                if (result) {
                    return this._rootCache[srcMapId][dstMapId];
                };

                this._rootCache[srcMapId][dstMapId].pop();
                return false;
            }

        };

        routeFromMapToMap(dstMapId, srcMapId = $gameMap.mapId()) {

            if (dstMapId === srcMapId) {
                return [dstMapId];
            }

            if (this._rootCache[srcMapId] === undefined) {
                this._rootCache[srcMapId] = {};
            }
            else if (this._rootCache[srcMapId][dstMapId] !== undefined) {
                return this._rootCache[srcMapId][dstMapId].slice();
            }

            this._rootCache[srcMapId][dstMapId] = [];
            return this.route(dstMapId, srcMapId).slice();
        };

        // 移動元 srcMapId と移動先 dstMapId を引数として
        // 移動先の入り口となる座標を取得する
        // NPCが移動する際に向かう先として使用する
        entranceFromMaptoMap(dstMapId, srcMapId) {
            return this._data[srcMapId].entrance(dstMapId);
        };

        // 移動元 srcMapId と移動先 dstMapId を引数として
        // 移動先の出口となる座標を取得する
        // NPCがマップ移動を行った際の初期座標として使用する
        exitFromMaptoMap(dstMapId, srcMapId) {
            return this._data[dstMapId].entrance(srcMapId);
        };

        makeSaveContents(contents) {
            contents.globalMap = {
                nonPlayers: this.npcMakeSaveContents(contents)
            };
            contents.localMaps = {};
            Object.values(this._data).forEach(
                localMap => localMap.makeSaveContents(contents)
            );
        }

        npcMakeSaveContents() {
            const nonPlayers = {};
            Object.keys(this._nonPlayers).forEach(key =>
                nonPlayers[key] = this._nonPlayers[key].makeSaveContents()
            )
            return nonPlayers;
        }

        extractSaveContents(contents) {
            this.setup();
            this.npcExtractSaveContents(contents);

            Object.values(this._data).forEach(
                localMap => localMap.extractSaveContents(contents)
            );
        };

        npcExtractSaveContents(contents) {
            Object.keys(this._nonPlayers).forEach(
                key => this._nonPlayers[key].extractSaveContents(contents.globalMap.nonPlayers[key])
            )
            this.nonPlayers().forEach(npc => npc.onLoadContents());
        }
    }

    ClassRegister(MB_GlobalMap);


})();