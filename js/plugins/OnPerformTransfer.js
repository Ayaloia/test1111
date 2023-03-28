
(function () {

    Game_Player.prototype.performTransfer = function () {
        if (this.isTransferring()) {
            this.setDirection(this._newDirection);
            if (this._newMapId !== $gameMap.mapId() || this._needsMapReload) {
                $gameMap.setup(this._newMapId);
                this._needsMapReload = false;
            }
            this.locate(this._newX, this._newY);
            // add
            this.onPerformTansfer();
            // add
            this.refresh();
            this.clearTransferInfo();
        }
    };

    Game_Player.prototype.onPerformTansfer = function () {
        let npc = $globalMap.nonPlayer(1);
        if (npc && npc.isSameMap()) {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[1], true);
        }
        else {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[1], false);
        }

        npc = $globalMap.nonPlayer(2);
        if (npc && npc.isSameMap()) {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[2], true);
        }
        else {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[2], false);
        }

        npc = $globalMap.nonPlayer(3);
        if (npc && npc.isSameMap()) {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[3], true);
        }
        else {
            $gameSwitches.setValue(IS_SAMEMAP_SWITCH[3], false);
        }
    }

})()

