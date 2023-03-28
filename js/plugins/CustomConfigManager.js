(function () {
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "START_SCENE":
                SceneManager._scene._messageWindow.setPlayScene(true);
                break;
            case "END_SCENE":
                SceneManager._scene._messageWindow.setPlayScene(false);
                break;
        }
    }

    ConfigManager.forciblyMakeTransparent = true;
    ConfigManager.autoSaveSlotNumber = 0;

    ConfigManager.makeData = function () {
        var config = {};
        config.alwaysDash = this.alwaysDash;
        config.commandRemember = this.commandRemember;
        config.bgmVolume = this.bgmVolume;
        config.bgsVolume = this.bgsVolume;
        config.meVolume = this.meVolume;
        config.seVolume = this.seVolume;
        config.forciblyMakeTransparent = this.forciblyMakeTransparent;
        config.autoSaveSlotNumber = this.autoSaveSlotNumber;
        return config;
    };

    ConfigManager.applyData = function (config) {
        this.alwaysDash = this.readFlag(config, 'alwaysDash');
        this.commandRemember = this.readFlag(config, 'commandRemember');
        this.bgmVolume = this.readVolume(config, 'bgmVolume');
        this.bgsVolume = this.readVolume(config, 'bgsVolume');
        this.meVolume = this.readVolume(config, 'meVolume');
        this.seVolume = this.readVolume(config, 'seVolume');

        if (config['forciblyMakeTransparent']) {
            this.forciblyMakeTransparent = this.readFlag(config, 'forciblyMakeTransparent');
        }
        if (config['autoSaveSlotNumber']) {
            this.autoSaveSlotNumber = this.readVolume(config, 'autoSaveSlotNumber');
        }
    };

    const WindowMessageInitMembers = Window_Message.prototype.initMembers;
    Window_Message.prototype.initMembers = function () {
        WindowMessageInitMembers.call(this);
        this._playScene = false;
    }

    Window_Message.prototype.setPlayScene = function (flag) {
        this._playScene = flag;
    }

    Window_Message.prototype.setBackgroundType = function (type) {
        if (this._playScene && ConfigManager.forciblyMakeTransparent) {
            this.opacity = 0;
        } else {
            if (type === 0) {
                this.opacity = 255;
            } else {
                this.opacity = 0;
            }
        }

        if (type === 1) {
            this.showBackgroundDimmer();
        } else {
            this.hideBackgroundDimmer();
        }
    };

    Window_Options.prototype.makeCommandList = function () {
        this.addCustumOptions();
        //this.addGeneralOptions();
        this.addVolumeOptions();
    };

    Window_Options.prototype.addCustumOptions = function () {
        this.addCommand("自动存档", 'autoSaveSlotNumber');
        this.addCommand("自动隐藏窗口", 'forciblyMakeTransparent');
    };

    Window_Options.prototype.statusText = function (index) {
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            return this.volumeStatusText(value);
        } else if (this.isAutoSaveSymbol(symbol)) {
            return this.autoSaveStatusText(value);
        }
        else {
            return this.booleanStatusText(value);
        }
    };

    Window_Options.prototype.processOk = function () {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value += this.volumeOffset();
            if (value > 100) {
                value = 0;
            }
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else if (this.isAutoSaveSymbol(symbol)) {
            value += 1;
            value = value.clamp(0, 3);
            this.changeValue(symbol, value);
        }
        else {
            this.changeValue(symbol, !value);
        }
    };

    Window_Options.prototype.cursorRight = function (wrap) {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value += this.volumeOffset();
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else if (this.isAutoSaveSymbol(symbol)) {
            value += 1;
            value = value.clamp(0, 3);
            this.changeValue(symbol, value);
        }

        else {
            this.changeValue(symbol, true);
        }
    };

    Window_Options.prototype.cursorLeft = function (wrap) {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value -= this.volumeOffset();
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else if (this.isAutoSaveSymbol(symbol)) {
            value -= 1;
            value = value.clamp(0, 3);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, false);
        }
    };

    Window_Options.prototype.isAutoSaveSymbol = function (symbol) {
        return symbol.contains('autoSaveSlotNumber');
    };

    Window_Options.prototype.autoSaveStatusText = function (value) {
        switch (value) {
            case 0:
                return "关闭";
            case 1:
                return "最近";
            case 2:
                return "档 1"
            case 3:
                return "档 20"
        }

    }

})();