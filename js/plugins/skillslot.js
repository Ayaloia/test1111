//=============================================================================
// SkillSlot.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc マップシーンにスキルスロットを追加します
 * @author Shun / inazumasoft
 *
 * @help 
 * トラトリトル用プラグイン
 * マップシーンにスキルスロットを追加します
 * 
 * @param ChangeSound
 * @type file
 * @desc スロット切り替え時のSEを指定します
 * 
 * @param EpUpdatedCallCommon
 * @type common_event
 * @desc Epゲージがアップデートされた後に呼び出されるコモンイベント（廃止）
 * 
 * プラグインコマンド詳細
 * SS_HIDE スキルスロットを非表示にします
 * SS_SHOW スキルスロットを表示にします
 *
 */

(function () {
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        switch (command) {
            case "SS_HIDE":
                $skillSlot.hide();
                break;
            case "SS_SHOW":
                $skillSlot.show();
                break;
        }
    }

})();

(function () {

    var parameters = PluginManager.parameters('skillslot');
    var changeSound = parameters['ChangeSound'].split('/')[2];
    var epUpdatedCallCommon = parseInt(parameters['EpUpdatedCallCommon']);

    window.$skillSlot = null;

    const _DataManagerCreateGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function () {
        _DataManagerCreateGameObjects.call(this);
        $skillSlot = new MapSkillContainer(1);
    };

    const _DataManagerMakeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function () {
        // A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
        var contents = _DataManagerMakeSaveContents.call(this);
        contents.skillSlot = $skillSlot.makeSaveContents();
        return contents;
    };

    const _DataManagerExtractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManagerExtractSaveContents.call(this, contents);
        $skillSlot.extractSaveContents(contents.skillSlot);
    };

    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function () {
        _Scene_Map_createDisplayObjects.call(this);
        this.createSkillSlot();
    };

    Scene_Map.prototype.createSkillSlot = function () {
        this.addChild($skillSlot);
    };

    class MapSkillContainer extends Sprite {
        constructor(actorId) {
            super();
            this._actorId = actorId;
            this._mpGauge = new MapMpGaugeMount(this.actor().mp, this.actor().mmp);
            this._epGauge = new MapEpGaugeMount(this.actor().tp, 100);
            this._slot = new MapSkillSlot(this._actorId);
            this.addChild(this._mpGauge);
            this.addChild(this._epGauge);
            this.addChild(this._slot);
            this._hiding = false;
        }

        actor() {
            return $gameActors.actor(this._actorId);
        }

        update() {
            super.update();
        }

        hide() {
            this._hiding = true;
            this.updateVisibility();
        };

        show() {
            this._hiding = false;
            this.updateVisibility();
        };

        updateVisibility() {
            this.visible = !this._hiding;
        };

        refresh() {
            this._slot.refresh();
        }

        setMp(mp) {
            this._mpGauge.setValue(mp);

        }

        setMmp(mmp) {
            this._mpGauge.setMax(mmp);
        }

        setEp(ep) {
            this._epGauge.setValue(ep);
        }

        setMep(mep) {
            this._epGauge.setMax(mep);
        }

        makeSaveContents() {
            return {
                slot: this._slot.makeSaveContents(),
                hiding: this._hiding
            };
        }

        extractSaveContents(contents) {
            const actor = $gameActors.actor(this._actorId);
            this.setMmp(actor.mmp);
            this.setMp(actor.mp);
            this.setEp(actor.tp);
            // this._epGauge.refresh();
            this._slot.extractSaveContents(contents.slot);
            this._hiding = contents.hiding;
            this.updateVisibility();
        }

        isHidden() {
            return this._hiding;
        }
    }

    class MapSkillSlot extends Sprite {

        constructor(actorId) {
            const bitmap = ImageManager.loadUI('skillslot');
            super(bitmap);

            this._actorId = actorId;
            this._icons = [];
            this._bufferedInput = null;

            this.initIndex();
            if (bitmap.isReady()) {
                this.createIcons();
            }
            else {
                bitmap.addLoadListener(this.createIcons.bind(this));
            }
        }

        get iconNumber() {
            return 3
        }

        get centerPosition() {
            return { x: this.bitmap.width / 2, y: this.bitmap.height / 2 }
        }

        get leftPosition() {
            return { x: 24, y: this.bitmap.height / 2 }
        }

        get rightPosition() {
            return { x: this.bitmap.width - 24, y: this.bitmap.height / 2 }
        }

        actor() {
            return $gameActors.actor(this._actorId);
        }

        initIndex() {
            /**
             * @type {Array<RPG.Skill>} 
             */
            const skills = this.actor().skills()
                .filter(skill => $gameParty.canUse(skill));

            if (skills.length === 0) {
                this._skillId = 0;
            }
            else {
                this._skillId = skills[0].id;
            }
        }

        update() {
            super.update();
            this.checkInput();
        }

        checkInput() {
            if (!this.isEnable()) {
                this._bufferedInput = false;
                return;
            }

            if (this._bufferedInput) {
                if (!$gamePlayer.isMoving()) {
                    this.useSkill();
                    this._bufferedInput = false;
                    return;
                }
            }

            if (Input.isTriggered('space') || Input.isTriggered('shift') || TouchInput.isMiddleTriggered()) {
                if ($gamePlayer.isMoving()) {
                    this._bufferedInput = true;
                } else {
                    this.useSkill();
                }
                return;
            }
            if (Input.isRepeated('home') && !Input.isPressed('end')) {
                this.playChangeSound();
                this.changePreviousSkill();
                return;
            }
            if (Input.isRepeated('end') && !Input.isPressed('home')) {
                this.playChangeSound();
                this.changeNextSkill();
                return;
            }

            var threshold = 20;
            if (TouchInput.wheelY >= threshold) {
                this.playChangeSound();
                this.changePreviousSkill();
            }
            if (TouchInput.wheelY <= -threshold) {
                this.playChangeSound();
                this.changeNextSkill();
            }
        }

        useSkill() {
            const item = $dataSkills[this._skillId];
            this.actor().useItem(item);
            const action = new Game_Action(this.actor());
            action.setItemObject(item);
            $gameParty.itemTargetActors(item).forEach(function (target) {
                for (let i = 0; i < action.numRepeats(); i++) {
                    action.apply(target);
                }
            }, this);
            $gamePlayer.requestAnimation(item.animationId);
            action.applyGlobal();
        }

        changePreviousSkill() {
            const skillIds = this.learnedSkillIds();
            const currentIndex = skillIds.indexOf(this._skillId);
            if (currentIndex === 0) {
                this._skillId = skillIds[skillIds.length - 1];
            }
            else {
                this._skillId = skillIds[currentIndex - 1];
            }
            this.refreshSkillIcon();
        }

        changeNextSkill() {
            const skillIds = this.learnedSkillIds();
            const currentIndex = skillIds.indexOf(this._skillId);
            if (currentIndex === skillIds.length - 1) {
                this._skillId = skillIds[0];
            }
            else {
                this._skillId = skillIds[currentIndex + 1];
            }
            this.refreshSkillIcon();
        }

        playChangeSound() {
            AudioManager.playSe({
                name: changeSound,
                pan: 0,
                pitch: 100,
                volume: 90
            });
        }

        createIcons() {
            /**
             * @type {Array<MapSkillIcon>} 
             */

            for (let i = 0; i < this.iconNumber; i++) {
                this._icons[i] = new MapSkillIcon();
                this.addChild(this._icons[i]);
            }
            this.refreshSkillIcon();
        }

        learnedSkillIds() {
            return this.actor().skills()
                .filter(skill => $gameParty.canUse(skill))
                .map(skill => skill.id);
        }

        displaySkillIds() {
            if (this._skillId === 0) {
                return new Array(3).fill(0);
            }
            const skillIds = [this._skillId];

            const skills = this.learnedSkillIds();

            const currentIndex = skills.indexOf(this._skillId);
            if (skills.length - 1 === currentIndex) {
                skillIds.push(skills[0]);
            }
            else {
                skillIds.push(skills[currentIndex + 1]);
            }

            if (currentIndex === 0) {
                skillIds.push(skills[skills.length - 1]);
            }
            else {
                skillIds.push(skills[currentIndex - 1]);
            }

            return skillIds;
        }

        refresh() {
            const skills = this.actor().skills()
                .filter(skill => $gameParty.canUse(skill));
            if (skills.length > 0) {
                if (!this.isEnable()) {
                    this._skillId = skills[0].id;
                }
            }
            else {
                this._skillId = 0;
            }
            this.refreshSkillIcon();
        }

        refreshSkillIcon() {
            const displaySkillIds = this.displaySkillIds();

            for (let i = 0; i < this.iconNumber; i++) {
                this._icons[i].setIconIndex(displaySkillIds[i]);

                let pos = this.iconPosition(i);
                this._icons[i].move(pos.x, pos.y);

                let scale = this.iconScale(i);
                this._icons[i].scale.set(scale.x, scale.y);
            }
        }

        iconPosition(index) {
            if (index === 0) {
                return this.centerPosition;
            }
            if (index === 1) {
                return this.rightPosition;
            }
            return this.leftPosition;
        }

        iconScale(index) {
            if (index === 0) {
                return { x: 1.0, y: 1.0 };
            }
            return { x: 0.6667, y: 0.6667 };
        }

        isEnable() {

            return this._skillId > 0 &&
                !this.parent.isHidden() &&
                !$gameMap.isEventRunning();

        }

        makeSaveContents() {
            return {
                skillId: this._skillId,
                hiding: this._hiding
            };
        }

        extractSaveContents(contents) {
            this._skillId = contents.skillId;
            this._hiding = contents.hiding;
            this.createIcons();
            this.refresh();
        }

    }

    class MapSkillIcon extends Sprite {
        constructor() {
            super();
            this.initMembers();
            this.loadBitmap();
        }

        initMembers() {
            this._iconIndex = 0;
            this._animationCount = 0;
            this._animationIndex = 0;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
        }

        loadBitmap() {
            this.bitmap = ImageManager.loadUI('IconSet');
            this.setFrame(0, 0, 0, 0);
        }

        setIconIndex(skillId) {
            if (skillId === 0) {
                this._iconIndex = 0;
            }
            else {
                this._iconIndex = $dataSkills[skillId].iconIndex;
            }

            var pw = 48;
            var ph = 48;
            var sx = this._iconIndex % 16 * pw;
            var sy = Math.floor(this._iconIndex / 16) * ph;
            this.setFrame(sx, sy, pw, ph);
        }
    }

    class MapGaugeMount extends Sprite {
        /**
         * 
         * @param {Bitmap} bitmap 
         * @param {number} value 
         * @param {number} max 
         */
        constructor(bitmap, value, max) {
            super(bitmap);

            if (bitmap.isReady()) {
                this.onLoaded(value, max);
            }
            else {
                bitmap.addLoadListener(this.onLoaded.bind(this, value, max));
            }
        }

        onLoaded(value, max) {
            this.createBar(value, max);
            this.createNumber(value, max);
        }

        createBar(value, max) {
            this._bar = null;
        }

        createNumber(value, max) {
            this._number = new NumberOfSprite(value, max);
            this._number.move(this.x + this.width / 2, this.y + this.height / 2);
            this.addChild(this._number);
        }

        setValue(value) {
            this._bar.setValue(value);
            this._number.setValue(value);
        }

        setMax(max) {
            this._bar.setMax(max);
            this._number.setMax(max);
        }
    }

    class MapMpGaugeMount extends MapGaugeMount {
        constructor(value, max) {
            const bitmap = ImageManager.loadUI('mpGaugeMount');
            super(bitmap, value, max);
            this.move(59, 16)
        }

        createBar(value, max) {
            this._bar = new MapMpGaugeBar(value, max);
            this.addChild(this._bar);
        }

    }

    class MapEpGaugeMount extends MapGaugeMount {
        constructor(value, max) {
            const bitmap = ImageManager.loadUI('epGaugeMount');
            super(bitmap, value, max);
            this.move(32, 101);
        }
        createBar(value, max) {
            this._bar = new MapEpGaugeBar(value, max);
            this.addChild(this._bar);
        }
    }

    class NumberOfSprite extends Sprite {
        /**
         * 
         * @param {number} value 
         * @param {number} max 
         * @param {string} fontFace 
         * @param {number} fontSize 
         */
        constructor(value, max) {
            super();
            this._max = max.toString();
            this._value = this.spacingValue(value);
            this.initBitmap();

            this.anchor.set(0.5, 0.5);
            this.x = 100;

            this.draw();
        }

        /**
         * 
         * @param {number} value 
         */
        setValue(value) {
            /**
             * @type {string}
             */
            this._value = this.spacingValue(value);
            this.draw();
        }

        spacingValue(value) {
            let space = "";
            for (let i = 0; i < this._max.length; i++) {
                space += " ";
            }
            return (space + value.toString()).slice(-this._max.length);;
        }

        /**
         * 
         * @param {number} value 
         */
        setMax(value) {
            //const lastMax = this._max;
            this._max = value.toString();
            // if (lastMax.length !== this._max.length) {
            //     this._max = newValue;
            // }
            this.draw();
        }

        calcHeight() {
            return this.fontSize() + this.outlineWidth();
        }

        calcWidth() {
            return (this._max.length * 2 + 1) * this.fontSize();
        }

        fontFace() {
            return 'Comment';
        }

        fontSize() {
            return 18;
        }

        outlineWidth() {
            return 4;
        }

        initBitmap() {
            this.bitmap = new Bitmap(this.calcWidth(), this.calcHeight());
            this.bitmap.fontFace = this.fontFace();
            this.bitmap.fontSize = this.fontSize();
            this.bitmap.outlineWidth = this.outlineWidth();
        }

        text() {
            return this._value + "/" + this._max;
        }

        draw() {
            this.bitmap.clear();
            this.bitmap.drawText(this.text(), 0, 0, this.bitmap.width, this.bitmap.height, "center");

        }

        update() {

        }
    }

    class MapGaugeBar extends Sprite {

        static UpdateFrame() {
            return 30;
        }

        constructor(bitmap, value, max, vertical = false) {
            super(bitmap);
            this._value = value;
            this._max = max;
            this._rate = value / max;
            this._lastRate = 1.0;
            this._count = 0;
            this._vertical = vertical;
            if (bitmap.isReady()) {
                this.onLoaded();
            }
            else {
                bitmap.addLoadListener(this.onLoaded.bind(this));
            }
        }

        onLoaded() {
            this._originalWidth = this.width;
            this._originalHeight = this.height;
            this.refresh();
        }

        /**
         * 
         * @param {number} value 
         */
        setMax(max) {
            this._max = max;
            this._rate = (this._value / this._max).clamp(0.0, 1.0);
            this._count = MapGaugeBar.UpdateFrame();
        }

        /**
         * 
         * @param {number} value 
         */
        setValue(value) {
            this._value = value;
            this._rate = (this._value / this._max).clamp(0.0, 1.0);
            this._count = MapGaugeBar.UpdateFrame();
        }

        update() {
            if (0 < this._count) {
                if (this._count === MapEpGaugeBar.UpdateFrame()) {
                    this.onStartUpdate();
                }

                this._count--;

                if (this.isVertical()) {
                    this.updateHeight();
                }
                else {
                    this.updateWidth();
                }

                if (this._count === 0) {
                    this.onFinishUpdated();
                }
            }
        }

        refresh() {
            this._lastRate = this._rate;
            this._count = 0;
            if (this.isVertical()) {
                this.updateHeight();
            }
            else {
                this.updateWidth();
            }
        }

        onStartUpdate() { }

        onFinishUpdated() {
            this._lastRate = this._rate;
        }

        updateWidth() {
            const scale = this.lerp(1 - this._count / MapGaugeBar.UpdateFrame());
            this.setFrame(0, 0, this._originalWidth * scale, this._originalHeight);
        }

        updateHeight() {
            const scale = this.lerp(1 - this._count / MapGaugeBar.UpdateFrame());
            const h = Math.round(this._originalHeight * scale);
            this.setFrame(0, this._originalHeight - h, this._originalWidth, h);
        }

        lerp(t) {
            return (this._rate - this._lastRate) * t + this._lastRate;
        }

        isVertical() {
            return this._vertical;
        }
    }

    class MapMpGaugeBar extends MapGaugeBar {
        constructor(value, maxValue) {
            const bitmap = ImageManager.loadUI('mpGaugeBar');
            super(bitmap, value, maxValue);
            if (bitmap.isReady()) {
                this.updateWidth();
            }

            this.x = 6;
            this.y = 6;
        }
    }

    class MapEpGaugeBar extends MapGaugeBar {
        constructor(value, maxValue) {
            const bitmap = ImageManager.loadUI('epGaugebar');
            super(bitmap, value, maxValue, true);
            this._lastRate = 0.0;
            if (bitmap.isReady()) {
                this.updateHeight();
            }
            this.move(18, 72)
            this.anchor.y = 1;
        }

        onLoaded() {
            super.onLoaded();
            this.height = 0;
        }

        onStartUpdate() {
            if (this._lastValue < this._value) {
                $gameSystem.disableMenu();
            }
        }

        onFinishUpdated() {
            super.onFinishUpdated();
            $gameSystem.enableMenu();
        }
    }

    const _GameActorInitMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function () {
        _GameActorInitMembers.call(this);
        this._maxTp = 100;
    };

    const _GameActorLearnSkill = Game_Actor.prototype.learnSkill;
    Game_Actor.prototype.learnSkill = function (skillId) {
        _GameActorLearnSkill.call(this, skillId);

        /** @type {MapSkillSlot} */
        $skillSlot.refresh();
    };

    Game_Actor.prototype.maxTp = function () {
        return this._maxTp ? this._maxTp : 100;
    }

    Game_Party.prototype.itemTargetActors = function (item) {
        let actor, action;
        actor = $gameParty.leader();
        action = new Game_Action(actor);
        action.setItemObject(item);

        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return $gameParty.members();
        } else {
            return [actor];
        }
    };

    Game_Battler.prototype.gainMp = function (value) {
        this._result.mpDamage = -value;
        this.setMp(this.mp + value);
        $skillSlot.setMp(this.mp);
    };

    Game_Battler.prototype.gainTp = function (value) {
        this._result.tpDamage = -value;
        this.setTp(this.tp + value);
        $skillSlot.setEp(this.tp);
    };

    Game_BattlerBase.prototype.addParam = function (paramId, value) {
        this._paramPlus[paramId] += value;
        this.refresh();
        if (paramId === 1) {
            $skillSlot.setMmp(this.mmp);
        }
        if (paramId === 8) {
            this._maxTp += value;
            $skillSlot.setMep(this._maxTp);
        }
    };


    ImageManager.loadUI = function (filename, hue) {
        return this.loadBitmap('img/ui/', filename, hue, true);
    };

    ClassRegister(MapSkillContainer);
    ClassRegister(MapSkillSlot);
    ClassRegister(MapSkillIcon);
    ClassRegister(MapGaugeMount);
    ClassRegister(MapMpGaugeMount);
    ClassRegister(MapEpGaugeMount);
    ClassRegister(MapGaugeBar);
    ClassRegister(MapEpGaugeBar);
    ClassRegister(MapMpGaugeBar);

    Game_Player.prototype.isDashButtonPressed = function () {
        return true;
    };

})();