//=============================================================================
// npc_mdfix.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc NPCプラグインをトラトリトル用に修正するプラグイン
 * @author Shun
 *
 * 
 * @help 
 * 
 * @param NonPlayerCharacters
 * @type struct<NonPlayerCharacter>[]
 * @default []
 * 
 * プラグインコマンド詳細
 * MD_SET_EST [ID] [VALUE] 発情度を設定する
 * MD_SET_URI [ID] [VALUE] 尿意を設定する
 * MD_GAIN_EST [ID] [VALUE] 発情度の増減をさせる
 * MD_GAIN_URI [ID] [VALUE] 尿意の増減をさせる
 * MD_CLEAR_PARAMETER すべてのパラメーターをリセットする
 * 
 */

/*~struct~NonPlayerCharacter:
* @param actor
* @type actor 
* 
* @param costume
* @type variable
* @default 0
*
* @param location
* @type variable
* @default 0
*
* @param talk
* @type variable
* @default 0
*
* @param relationship
* @type variable
* @default 0
*
* @param estrusGauge
* @type variable
* @default 0
*
* @param urinaryGauge
* @type variable
* @default 0
*
*/


(function () {
    'use strict';

    var convertEscapeCharacters = function (text) {
        if (text == null) text = '';
        var window = SceneManager._scene._windowLayer.children[0];
        return window ? window.convertEscapeCharacters(text) : text;
    };

    var parameters = PluginManager.parameters('npc_mdfix');
    var npcParameters = JSON.parse(parameters['NonPlayerCharacters']).map(npc => JSON.parse(npc));
    npcParameters.forEach(npc => {
        npc.actor = parseInt(npc.actor);
        npc.costume = parseInt(npc.costume);
        npc.location = parseInt(npc.location);
        npc.relationship = parseInt(npc.relationship);
        npc.urinaryGauge = parseInt(npc.urinaryGauge);
        npc.estrusGauge = parseInt(npc.estrusGauge);
    });


    //==============================
    // MB_NonPlayer
    //==============================
    MB_NonPlayer.prototype.initMembers = function () {
        Game_Event.prototype.initMembers.call(this);
        this._scheduler = new MB_CharacterScheduler(this);
        this._route = null;
        this._event = $globalMap.findEventDefault(this._data.name);
        this._locked = false;
        //$gameVariables.setValue(npcParameters[this.charaId].costume, 0);
    }

    MB_NonPlayer.prototype.start = function () {
        const startingEvent = $globalMap.nonPlayers().find(npc => npc.isStarting())
        if (!startingEvent) {
            Game_Event.prototype.start.call(this);
        }
    }

    MB_NonPlayer.prototype.checkToilet = function (mapId = this._mapId) {
        if ($gameActors.actor(this._data.id + 1).isLimitsUrinary()) {
            if (this.isSameMap()) {
                this.requestBalloon(6);
            }
            const toilet = $globalMap.nearToilet(mapId);
            this._scheduler.interrupt(toilet.mapId, toilet.x, toilet.y, toilet.direction, 0);
        }
    }

    MB_NonPlayer.prototype.advanceTheSchedule = function (hour, minute) {
        this._scheduler.advanceTheSchedule(hour, minute);
    }

    MB_NonPlayer.prototype.costume = function () {
        return $gameVariables.value(npcParameters[this.charaId].costume);
    }

    MB_NonPlayer.prototype.changeCostume = function (id) {
        $gameVariables.setValue(npcParameters[this.charaId].costume, id);
        let newName = this._data.image.split('_');
        newName[newName.length - 1] = id;
        this._data.image = newName.join('_');
    }

    MB_NonPlayer.prototype.setupPageSettings = function () {
        var page = this.page();
        var image = page.image;
        if (image.tileId > 0) {
            this.setTileImage(image.tileId);
        } else {
            this.setImage(image.characterName, image.characterIndex);
        }
        if (this._originalDirection !== image.direction) {
            this._originalDirection = image.direction;
            this._prelockDirection = 0;
            this.setDirectionFix(false);
            this.setDirection(image.direction);
        }
        if (this._originalPattern !== image.pattern) {
            this._originalPattern = image.pattern;
            this.setPattern(image.pattern);
        }
        //this.setMoveSpeed(page.moveSpeed);
        this.setMoveFrequency(page.moveFrequency);
        this.setPriorityType(page.priorityType);
        this.setWalkAnime(page.walkAnime);
        this.setStepAnime(page.stepAnime);
        this.setDirectionFix(page.directionFix);
        this.setThrough(page.through);
        this.setMoveRoute(page.moveRoute);
        this._moveType = page.moveType;
        this._trigger = page.trigger;
        if (this._trigger === 4) {
            this._interpreter = new Game_Interpreter();
        } else {
            this._interpreter = null;
        }
    };

    MB_NonPlayer.prototype.lock = function (toWardPlayer = true) {
        if (!this._locked) {
            this._prelockDirection = this.direction();
            if (toWardPlayer) {
                this.turnTowardPlayer();
            }
            this._locked = true;
        }
    }

    MB_NonPlayer.prototype.location = function () {
        return $gameVariables.value(npcParameters[this.charaId].location);
    }

    MB_NonPlayer.prototype.setLocation = function (location) {
        $gameVariables.setValue(npcParameters[this.charaId].location, location);
        $gameVariables.setValue(npcParameters[this.charaId].talk, 0);
    }

    MB_NonPlayer.prototype.startRouteExloration = function (x, y) {
        const start = new ExplorationNode(this._mapId, this._x, this._y);
        const goal = new ExplorationNode(this._mapId, x, y);
        this._route = new RouteExploration(this._mapId);
        this._route.start(start, goal);
    }

    MB_NonPlayer.prototype.findDirectionTo = function () {
        const postion = this._route.nextNode();
        if (postion) {
            var deltaX = postion.x - this._x;
            if (deltaX < 0) {
                return 4;
            }
            if (0 < deltaX) {
                return 6;
            }
            var deltaY = postion.y - this._y;
            if (deltaY < 0) {
                return 8;
            }
            if (0 < deltaY) {
                return 2;
            }
        }
        return 0;
    }

    MB_NonPlayer.prototype.moveStraight = function (d) {
        Game_Character.prototype.moveStraight.call(this, d)
        if (this.isMovementSucceeded()) {
            this._route.shift();
        }
    };

    MB_NonPlayer.prototype.makeSaveContents = function () {
        return {
            data: this._data,
            x: this._x,
            y: this._y,
            realX: this._realX,
            realY: this._realY,
            direction: this._direction,
            mapId: this._mapId,
            eventId: this._eventId,
            moveSpeed: this._moveSpeed,
            pageIndex: this._pageIndex,
            scheduler: this._scheduler.makeSaveContents()
        }

    }

    MB_NonPlayer.prototype.extractSaveContents = function (contents) {
        this._data = contents.data;
        this._x = contents.x;
        this._y = contents.y;
        this._realX = contents.realX;
        this._realY = contents.realY;
        this._direction = contents.direction;
        this._mapId = contents.mapId;
        this._eventId = contents.eventId;
        this._moveSpeed = contents.moveSpeed;
        this._pageIndex = contents.pageIndex;
        this._scheduler.extractSaveContents(contents.scheduler);
    }

    //==============================
    // Game_Player
    //==============================
    Game_Player.prototype.frontNpc = function () {
        var d = this.direction();
        var x = $gameMap.roundXWithDirection(this.x, d);
        var y = $gameMap.roundYWithDirection(this.y, d);
        return $gameMap.npcXy(x, y);
    };

    Game_Player.prototype.location = function () {
        return $gameVariables.value(npcParameters[0].location);
    }

    Game_Player.prototype.setLocation = function (location) {
        $gameVariables.setValue(npcParameters[0].location, location);
    }

    //==============================
    // Game_Map
    //==============================
    const _Game_Map_Initialize = Game_Map.prototype.initialize;
    Game_Map.prototype.initialize = function () {
        _Game_Map_Initialize.call(this);

        this.nonPlayerObjects = [];
    };

    Game_Map.prototype.npcXy = function (x, y) {
        return this.events()
            .filter(event => event.pos(x, y))
            .find(event => event instanceof MB_NonPlayer);
    };

    const _Game_Map_Setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function (mapId) {
        _Game_Map_Setup.apply(this, arguments);

        $globalMap.nonPlayers().forEach(npc => npc.endBalloon());
        this.nonPlayerObjects = $globalMap.nonPlayers().filter(npc => npc.isSameMap());
        this.nonPlayerObjects.forEach(npc => {
            this.addNpc(npc);
        });
    };

    Game_Map.prototype.addNpc = function (npc) {
        npc.setEventId(this._events.length);
        this.addEvent(npc);
        npc.refresh();
    }

    Game_Map.prototype.removeNpc = function (eventId) {
        this._events[eventId].setEventId(-1);
        this.removeEvent(eventId);
    }

    Game_Map.prototype.interpreter = function () {
        return this._interpreter;
    }

    Game_Map.prototype.terminateInterpreter = function (interpreter = this._interpreter) {
        const childInterpreter = interpreter.childInterpreter();
        if (childInterpreter) {
            return this.terminateInterpreter(childInterpreter);
        }
        else {
            return interpreter;
        }
    }

    //Game_Map.prototype.

    //==============================
    // Game_Interpreter
    //==============================
    Game_Interpreter.prototype.clear = function () {
        this._mapId = 0;
        this._eventId = 0;
        this._list = null;
        this._index = 0;
        this._waitCount = 0;
        this._waitMode = '';
        this._comments = '';
        this._character = null;
        this._childInterpreter = null;
        this._excuteCharacter = null;
    };

    Game_Interpreter.prototype.excuteCharacter = function () {
        return this._excuteCharacter;
    }

    Game_Interpreter.prototype.setExcuteCharacter = function (character) {
        this._excuteCharacter = character;
        this._mapId = character.mapId();
    }

    Game_Interpreter.prototype.childInterpreter = function () {
        return this._childInterpreter;
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "MD_GAIN_EST":
                var id = parseInt(convertEscapeCharacters(args[0]));
                var value = parseInt(convertEscapeCharacters(args[1]));
                $gameActors.actor(id + 1).gainEstrus(value);
                break;
            case "MD_GAIN_URI":
                var id = parseInt(convertEscapeCharacters(args[0]));
                var value = parseInt(convertEscapeCharacters(args[1]));
                $gameActors.actor(id + 1).gainUrinary(value);
                break;
            case "MD_SET_EST":
                var id = parseInt(convertEscapeCharacters(args[0]));
                var value = parseInt(convertEscapeCharacters(args[1]));
                $gameActors.actor(id + 1).setEstrus(value);
                break;
            case "MD_SET_URI":
                var id = parseInt(convertEscapeCharacters(args[0]));
                var value = parseInt(convertEscapeCharacters(args[1]));
                $gameActors.actor(id + 1).setUrinary(value);
                break;
            case "MD_CLEAR_PARAMETER":
                if (args.length > 0) {
                    var id = parseInt(convertEscapeCharacters(args[0]));
                    $gameActors.actor(id + 1).clearParameter();
                }
                else {
                    $gameActors._data.filter(actor => actor).forEach(actor => actor.clearParameter());
                }
                break;
        }
    };

    Game_Actor.prototype.clearParameter = function () {
        this.setEstrus(0);
        this.setUrinary(0);
    }

    Game_Actor.prototype.estrus = function () {
        return $gameVariables.value(npcParameters[this.actorId() - 1].estrusGauge);
    }

    Game_Actor.prototype.urinary = function () {
        return $gameVariables.value(npcParameters[this.actorId() - 1].urinaryGauge);
    }

    Game_Actor.prototype.gainEstrus = function (value) {
        value += this.estrus();
        $gameVariables.setValue(npcParameters[this.actorId() - 1].estrusGauge, value);
    }

    Game_Actor.prototype.gainUrinary = function (value) {
        value += this.urinary();
        $gameVariables.setValue(npcParameters[this.actorId() - 1].urinaryGauge, value);
    }

    Game_Actor.prototype.setEstrus = function (value) {
        $gameVariables.setValue(npcParameters[this.actorId() - 1].estrusGauge, value);
    }

    Game_Actor.prototype.setUrinary = function (value) {
        $gameVariables.setValue(npcParameters[this.actorId() - 1].urinaryGauge, value);
    }

    Game_Actor.prototype.isLimitsUrinary = function () {
        return 100 <= this.urinary();
    }

})();