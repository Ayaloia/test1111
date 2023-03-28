//=============================================================================
// monbokulibrary.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc globalmap.jsの修正プラグイン
 * @author Shun / inazuma_soft
 * 
 * @help 
 * Project Monboku 用に作成したプラグイン類を使用できるように
 * 外部のファイルに定義されている関連の拡張メソッドやオブジェクトを追加するものです。
 * 
 */

var MB_Enums = {
    Event: {
        Code: {
            LocationTransfer: 201
        }
    }
}

function ClassRegister(klass) {
    const key = klass.name;
    window[key] = klass;
}

(function () {

    class MB_Vector2 {
        constructor(x, y) {
            this.x = x ? x : 0;
            this.y = y ? y : 0;
        }

        equals(vector) {
            return this.x === vector.x && this.y === vector.y;
        }

        subtraction(vector) {
            this.x = - vector.x;
            this.y = - vector.y;
        }

        addition(vector) {
            this.x += vector.x;
            this.y += vector.y;
        }
    }

    ClassRegister(MB_Vector2);

    //========================================
    // DataManager
    //========================================
    DataManager.relativePath = function (subPath) {
        const path = require('path');
        const base = path.dirname(process.mainModule.filename);
        return path.join(base, subPath);
    };

    //========================================
    // Game_Event
    //========================================
    Game_Event.prototype.isOverlappingWithPlayer = function () {
        return $gamePlayer.x === this.x && $gamePlayer.y === this.y;
    };

    Game_Event.prototype.isOverlappingWithCharacter = function () {
        const events = $gameMap.eventsXy(this.x, this.y).filter(event => this !== event);
        return events.length > 0;
    };

    //========================================
    // Game_Map
    //========================================
    Game_Map.prototype.addEvent = function (event) {
        this._events.push(event);
    }

    Game_Map.prototype.removeEvent = function (eventId) {
        this._events[eventId] = null;
    }

    //========================================
    // Scene_Map
    //========================================
    Scene_Map.prototype.addMapObject = function (object) {
        this._spriteset.addCharacter(object);
    };

    Scene_Map.prototype.removeCharacter = function (character) {
        this._spriteset.removeCharacter(character);
    };

    //========================================
    // Spriteset_Map
    //========================================
    Spriteset_Map.prototype.addCharacter = function (character) {
        const sprite = new Sprite_Character(character);
        const index = this._characterSprites.push(sprite);
        this._tilemap.addChild(this._characterSprites[index - 1]);
    };

    Spriteset_Map.prototype.removeCharacter = function (character) {
        const finded = this._characterSprites.find(
            (sprite) => sprite._character === character
        );
        const index = this._characterSprites.indexOf(finded);
        if (index < 0) {
            return;
        }
        this._characterSprites.splice(index, 1);
        finded.endBalloon();
        this._tilemap.removeChild(finded);
    };

    Game_CharacterBase.prototype.realMoveSpeed = function () {
        return this._moveSpeed + (this.isDashing() ? 1.25 : 0);
    };

    //========================================
    // SceneManager
    //========================================
    SceneManager.currentScene = function () {
        return this._scene;
    };

    var _Game_CharacterBaseInitMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase.prototype.initMembers = function () {
        _Game_CharacterBaseInitMembers.call(this);
    }

    Game_CharacterBase.prototype.location = function () {
        return null;
    }

    Game_CharacterBase.prototype.setLocation = function (location) {
    }

    Game_CharacterBase.prototype.equalLocation = function (character) {
        return this.location() === character.location();
    }

    Game_CharacterBase.prototype.closeByCharacter = function (character, distance) {
        return Math.abs(this.x - character.x) + Math.abs(this.y - character.y) <= distance;
    }

    Game_CharacterBase.prototype.isSameLocation = function (character) {
        return this.equalLocation(character) && this.closeByCharacter(character, 6);
    }

    Game_CharacterBase.prototype.isOppositeDirection = function (character) {
        return this.direction() + character.direction() === 10;
    }

    Game_CharacterBase.prototype.isFaceToFace = function (character) {
        var d = this.direction();
        var x = $gameMap.roundXWithDirection(this.x, d);
        var y = $gameMap.roundYWithDirection(this.y, d);
        return this.isOppositeDirection(character) && character.x === x && character.y === y;
    }

    Game_CharacterBase.prototype.equalDirection = function (character) {
        return this.direction() === character.direction();
    }

    Game_CharacterBase.prototype.isBehindTheCharacter = function (character) {
        var d = this.direction();
        var x = $gameMap.roundXWithDirection(this.x, d);
        var y = $gameMap.roundYWithDirection(this.y, d);
        return this.equalDirection(character) && character.x === x && character.y === y;
    }

    Game_CharacterBase.prototype.isSideTheCharacter = function (character) {
        var d = this.direction();
        var x = $gameMap.roundXWithDirection(this.x, d);
        var y = $gameMap.roundYWithDirection(this.y, d);
        return !this.isOppositeDirection(character) && !this.equalDirection(character) && character.x === x && character.y === y;
    }

})();
