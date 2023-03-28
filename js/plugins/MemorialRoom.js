(function () {

    'use strict';

    let temporarilySvedVariables = {};
    let temporarilySvedSwitches = {};


    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "TEMPORARILY_SAVE_VARIABLES":
                TemporarilySaveVariables();
                break;
            case "TEMPORARILY_LOAD_VARIABLES":
                TemporarilyLoadVariables();
                break;
            case "SET_TEMPORARILY_VARIABLE":
                var id = parseInt(args[0]);
                var value = parseInt(args[1]);
                SetTemporarilyVariable(id, value)
                break;
            case "SET_TEMPORARILY_SWITCH":
                var id = parseInt(args[0]);
                var value = args[1] === "ON" ? true : false;
                SetTemporarilySwitch(args[0], args[1])
                break;
        }
    };

    function TemporarilySaveVariables() {
        var clonedeep = require('lodash/cloneDeep');
        temporarilySvedVariables = clonedeep($gameVariables);
        temporarilySvedSwitches = clonedeep($gameSwitches);
    }

    function TemporarilyLoadVariables() {
        var clonedeep = require('lodash/cloneDeep');
        $gameVariables = clonedeep(temporarilySvedVariables);
        $gameSwitches = clonedeep(temporarilySvedSwitches);
        temporarilySvedVariables = {};
        temporarilySvedSwitches = {};
    }

    function SetTemporarilyVariable(id, value) {
        temporarilySvedVariables.setValue(id, value);
    }
    function SetTemporarilySwitch(id, value) {
        temporarilySvedSwitches.setValue(id, value);
    }




})()