(function () {
    Scene_Save.prototype.onSavefileOk = function () {
        Scene_File.prototype.onSavefileOk.call(this);
        $gameSystem.onBeforeSave();
        this.avoidNonSaveData();
        if (DataManager.saveGame(this.savefileId())) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
        this.restoreNonSaveData();
    };

    Scene_Base.prototype.avoidNonSaveData = function () {
        $gameMap.avoidNonSaveData();
    }

    Scene_Base.prototype.restoreNonSaveData = function () {
        $gameMap.restoreNonSaveData();
    }


    Game_Map.prototype.avoidNonSaveData = function () {
        /**
         * @type {Array<RPG.Event>}
         */
        $gameTemp.events = []
        for (let i = 0; i < this._events.length; i++) {
            if (this._events[i] instanceof MB_NonPlayer) {
                $gameTemp.events[i] = this._events[i];
                this._events[i] = null;
            }
        }

        $gameTemp.nonPlayerObjects = this.nonPlayerObjects;
        this.nonPlayerObjects = null;
    }

    Game_Map.prototype.restoreNonSaveData = function () {
        for (let i = 0; i < this._events.length; i++) {
            if ($gameTemp.events[i] instanceof MB_NonPlayer) {
                this._events[i] = $gameTemp.events[i];
            }
        }
        this.nonPlayerObjects = $gameTemp.nonPlayerObjects;
        delete $gameTemp.events;
        delete $gameTemp.nonPlayerObjects;
    }

})();
