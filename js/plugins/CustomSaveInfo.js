(function () {
    DataManager.makeSavefileInfo = function () {
        var info = {};
        info.globalId = this._globalId;
        info.title = $dataSystem.gameTitle;
        info.characters = $gameParty.charactersForSavefile();
        info.faces = $gameParty.facesForSavefile();
        info.playtime = $gameSystem.playtimeText();
        info.weekname = $gameSystem.chronus().getWeekName();
        info.mapid = $gameMap.mapId();
        info.totaldays = $gameSystem.chronus().getTotalDay();
        info.daytime = ("00" + $gameSystem.chronus().getHour()).slice(-2) + ":" + ("00" + $gameSystem.chronus().getMinute()).slice(-2);
        info.timestamp = Date.now();
        return info;
    };

    Window_SavefileList.prototype.drawContents = function (info, rect, valid) {
        var bottom = rect.y + rect.height;
        if (rect.width >= 420) {
            this.drawGameTitle(info, rect.x + 192, rect.y, rect.width - 192);
            // if (valid) {
            //     this.drawPartyCharacters(info, rect.x + 220, bottom - 4);
            // }
        }
        var lineHeight = this.lineHeight();
        var y2 = bottom - lineHeight;
        if (y2 >= lineHeight) {
            this.drawPlaytime(info, rect.x, rect.y, rect.width);
            this.drawMapName(info, rect.x + 192, y2, rect.width);
            this.drawTotalDays(info, rect.x + 470, y2, rect.width)
            this.drawDayTime(info, rect.x, y2, rect.width);
        }
    };

    Window_SavefileList.prototype.drawMapName = function (info, x, y, width) {
        if (info.mapid) {
            this.changeTextColor(this.systemColor());
            let mapName = this.mapName(parseInt(info.mapid));
            this.drawText(mapName, x, y, width, 'left');
            this.resetTextColor();
        }

    };

    Window_SavefileList.prototype.mapName = function (index) {
        switch (index) {
            case 2: case 32:
                return "少爷的房间";
            case 3: case 33:
                return "女仆的房间";
            case 4:
                return "大厅";
            case 5:
                return "食堂";
            case 6:
                return "后院";
            case 7:
                return "澡堂";
            case 8:
                return "图书室";
            case 9:
                return "庭院";
            case 10:
                return "招待室";
            case 43:
                return "卡丽娜的房间";
            case 44:
                return "米歇尔的房间";
            case 45:
                return "露西的房间";
            case 46:
                return "莎莉雅的房间";
            default:
                return "事件";
        }

    }

    Window_SavefileList.prototype.drawDayTime = function (info, x, y, width) {
        if (info.weekname && info.daytime) {
            this.changeTextColor(this.systemColor());
            this.drawText(info.weekname + "." + info.daytime, x, y, width, 'right');
            this.resetTextColor();
        }
    };

    Window_SavefileList.prototype.drawTotalDays = function (info, x, y, width) {
        if (info.totaldays) {
            let totalDays = info.totaldays;
            if (totalDays.length > 4) {
                totalDays = "999";
            }
            totalDays = ("" + totalDays).slice(-3);
            this.changeTextColor(this.systemColor());
            this.drawText("第" +　totalDays + "日", x, y, width, 'left');
            this.resetTextColor();
        }
    }



}
)()