//=============================================================================
// TrapEvent.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc 指定したマップのイベントを別のマップに生成します。
 * @author Shun / inazumasoft
 *
 * @help 
 * 
 * 
 * @param Template Map Id
 * @type number
 * @default 1
 * 
 * 
 * プラグインコマンド詳細
 *
 */

(function () {

    function numberToMapFile(number) {
        return 'data/Map' + ('000' + number).slice(-3) + '.json';
    }

    const parameters = PluginManager.parameters('TrapEvent');
    const templateMapFile = numberToMapFile(parameters['Template Map Id']);

    const fs = require('fs');
    const path = DataManager.relativePath(templateMapFile);
    window.$dataTraps = JSON.parse(fs.readFileSync(path, 'utf8')).events;
    $dataTraps.filter(p => p).forEach(prefab => DataManager.extractMetadata(prefab));

    var convertEscapeCharacters = function (text) {
        if (text == null) text = '';
        var window = SceneManager._scene._windowLayer.children[0];
        return window ? window.convertEscapeCharacters(text) : text;
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {

            case "MB_CREATE_TRAP":
                var id = parseInt(args[0]);
                if (isNaN(id)) {
                    var event = $dataTraps.filter(e => e).find(event => event.name == args[0]);
                    id = event.id;
                }

                var x = parseInt(convertEscapeCharacters(args[1]));
                var y = parseInt(convertEscapeCharacters(args[2]));

                $globalMap.map($gameMap.mapId()).setTrap(id, x, y);
                break;

            case "MB_REMOVE_TRAP":
                var mapId = parseInt(convertEscapeCharacters(args[0]));
                var x = parseInt(convertEscapeCharacters(args[1]));
                var y = parseInt(convertEscapeCharacters(args[2]));

                $globalMap.map(mapId).removeTrap(x, y);
                break;

        }
    }


    class Game_TrapEvent extends Game_Event {

        initialize(mapId, eventId, x, y) {
            Game_Character.prototype.initialize.call(this);
            this._mapId = mapId;
            this._originalId = eventId;
            this._eventId = $gameMap._events.length;
            this.locate(x, y);
            this.refresh();
        }

        event() {
            return $dataTraps[this._originalId];
        }

        originaleventId() {
            return this._originalId;
        }
    }

    MB_Map.prototype.setTrap = function (eventId, x, y) {
        const trap = new Game_TrapEvent(this._mapId, eventId, x, y);
        $gameMap.addEvent(trap);
        SceneManager.currentScene().addMapObject(trap);
        this._traps.push(trap);

        const event = $dataTraps[eventId];
        this.addNpcExcuteEvent(event, x, y);
    }

    MB_Map.prototype.removeTrap = function (x, y) {
        if ($gameMap.mapId() === this._mapId) {
            const trap = $gameMap.eventsXy(x, y).find(trap => trap instanceof Game_TrapEvent);
            $gameMap.removeEvent(trap.eventId());
            const scene = SceneManager.currentScene();
            scene.removeCharacter(trap);
        }
        const target = this._traps.find(trap => trap.x === x && trap.y === y);
        this._traps = this._traps.filter(trap => trap !== target);
        this.removeNpcExcuteEvent(x, y)
    }

    ClassRegister(Game_TrapEvent);

    Game_Map.prototype.setupEvents = function () {
        this._events = [];
        for (let i = 0; i < $dataMap.events.length; i++) {
            if ($dataMap.events[i]) {
                this._events[i] = new Game_Event(this._mapId, i);
            }
        }
        const localMaps = $globalMap.map(this._mapId);
        if (localMaps) {
            localMaps.traps.forEach(trap => {
                trap._eventId = this._events.length;
                this._events.push(trap);
            })
        }

        this._commonEvents = this.parallelCommonEvents().map(function (commonEvent) {
            return new Game_CommonEvent(commonEvent.id);
        });
        this.refreshTileEvents();
    };

    Game_Map.prototype.trapEventXy = function (x, y) {
        this.eventsXy(x, y).filter(event => event instanceof Game_TrapEvent);
    }

})();