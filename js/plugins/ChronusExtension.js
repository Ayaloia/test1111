//=============================================================================
// ChronusExtension.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun
// ----------------------------------------------------------------------------

/*:
 * @plugindesc Chronus プラグインの機能を拡張するプラグイン
 * @author Shun
 *
 *
 */

Chronus = {
    WeatherType: {
        Fine: 0,
        Rain: 1,
        Storm: 2,
        Snow: 3
    }
};

(function () {
    Game_Chronus.prototype.dateData = function () {
        const date = {};
        date.year = this.getYear();
        date.month = this.getMonth();
        date.day = this.getDay();
        date.hour = this.getHour();
        date.week = {};
        date.week.id = this.getWeekIndex();
        date.week.name = this.getWeekName();
        date.timezone = {};
        date.timezone.id = this.getTimeZone();
        date.timezone.name = this.getTimeZoneName();
        date.weather = {};
        date.weather.type = this.getWeatherType();
        date.weather.typeId = this.getWeatherTypeId();

        return date;
    }

})();