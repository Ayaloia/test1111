
(function () {

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "STEP_COUNT":
                if (args[0]) {
                    if ("ON" === args[0].toUpperCase()) {
                        $gameParty.enableStepCount();
                    }
                    else {
                        $gameParty.disableStepCount();
                    }
                }
                break;
        }
    };

    var _Initialize = Game_Party.prototype.initialize;
    Game_Party.prototype.initialize = function () {
        _Initialize.call(this);
        this.enableStepCount()
    }

    Game_Party.prototype.increaseSteps = function () {
        if (this._isStepCount) {
            this._steps++;
        }
    };

    Game_Party.prototype.enableStepCount = function () {
        this._isStepCount = true;
    }

    Game_Party.prototype.disableStepCount = function () {
        this._isStepCount = false;
    }

})()