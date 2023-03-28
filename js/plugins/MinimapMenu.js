(function () {


    const MapPinPosition = {
        2: {
            x: 231,
            y: 64
        },
        3: {
            x: 231,
            y: 150
        },
        4: {
            x: 348,
            y: 172
        },
        5: {
            x: 401,
            y: 64
        },
        6: {
            x: 538,
            y: 23
        },
        7: {
            x: 457,
            y: 152
        },
        8: {
            x: 237,
            y: 238
        },
        9: {
            x: 348,
            y: 297
        },
        10: {
            x: 451,
            y: 238
        }
    }

    class NpcInfomation extends Sprite {

        static comment(characterId) {
            switch (characterId) {
                case 0:
                    return $gameVariables.value(210);
                case 1:
                    return $gameVariables.value(410);
                case 2:
                    return $gameVariables.value(310);
                case 3:
                    return $gameVariables.value(190);
            }
        }

        constructor(x, y) {
            super();
            this._height = 100;
            this._width = 400;
            this.createRelationship();
            this.createEventOpen();
            this.createComment();
            this.move(x, y);
        }

        createRelationship() {
            this._relationship = new Sprite();
            this.addChild(this._relationship);
            this._relationship.anchor.set(0.5, 0.5);
            this._relationship.move(236, 47);

        }

        createEventOpen() {
            this._eventOpen = new Sprite();
            this.addChild(this._eventOpen);
            this._eventOpen.move(204, 4);
            this._eventOpen.bitmap = ImageManager.loadMinimap('open');
            this.hideEventOpen();
        }

        createComment() {
            this._comment = new Sprite(new Bitmap(280, 32));
            this.addChild(this._comment);
            this._comment.move(96, 68);

            this._comment.bitmap.fontFace = "Comment";
            this._comment.bitmap.fontSize = 18;
            this._comment.bitmap.textColor = '#2a2522';
            this._comment.bitmap.outlineColor = 'rgba(246,234,210,0.8)';
        }

        setRelationship(love) {
            this._relationship.bitmap = ImageManager.loadMinimap('love_' + ('00' + love).slice(-2));
        }

        setComment(charaId) {
            var width = this._comment.bitmap.width;
            var height = this._comment.bitmap.height;
            this._comment.bitmap.drawText(NpcInfomation.comment(charaId), 0, 0, width, height, 'center');
        }

        showEventOpen() {
            this._eventOpen.visible = true;
        }

        hideEventOpen() {
            this._eventOpen.visible = false;
        }

    }

    class Scene_Minimap extends Scene_MenuBase {

        static pinPosition(mapId, num) {
            let postion = MapPinPosition[mapId];

            if (mapId !== 6) {
                return { x: postion.x + num * 22, y: postion.y };
            }
            else {
                switch (num) {
                    case 0:
                        return postion;
                    case 1:
                        return { x: postion.x + 22, y: postion.y };
                    case 2:
                        return { x: postion.x, y: postion.y + 22 };
                    case 3:
                        return { x: postion.x + 22, y: postion.y + 22 };
                }

            }

        }

        static relationship(index) {
            switch (index) {
                case 0:
                    return $gameVariables.value(204);
                case 1:
                    return $gameVariables.value(404);
                case 2:
                    return $gameVariables.value(304);
                case 3:
                    return $gameVariables.value(184);
            }
        }

        static isEventOpen(index) {
            switch (index) {
                case 0:
                    return $gameSwitches.value(350);
                case 1:
                    return $gameSwitches.value(450);
                case 2:
                    return $gameSwitches.value(400);
                case 3:
                    return $gameSwitches.value(500);
            }
        }

        create() {
            Scene_Base.prototype.create.call(this);
            this.createBackground();
            this.createNpcInfomations();
            this.createMapPins();
            this.createCommandButtons();
        }

        createBackground() {
            this._backgroundSprite = new Sprite();
            this._backgroundSprite.bitmap = ImageManager.loadMinimap('background');
            this.addChild(this._backgroundSprite);
        }

        createNpcInfomations() {
            /**
             * @type {NpcInfomation[]}
             */
            this._npcInfos = [];
            for (let row = 0; row < 2; row++)
                for (let col = 0; col < 2; col++) {
                    const sprite = new NpcInfomation(col * 384, row * 102 + 380)
                    this._npcInfos.push(sprite);
                    this.addChild(sprite);
                }

            for (let i = 0; i < 4; i++) {
                this._npcInfos[i].setRelationship(Scene_Minimap.relationship(i));
                this._npcInfos[i].setComment(i);
                // if (Scene_Minimap.isEventOpen(i)) {
                //     this._npcInfos[i].showEventOpen();
                // }
                // else {
                //     this._npcInfos[i].hideEventOpen();
                // }
            }
        }

        createMapPins() {
            /**
             * @type {Sprite[]}
             */
            this._pins = [];
            for (let i = 0; i < 4; i++) {
                this._pins[i] = new Sprite(ImageManager.loadMinimap('pin_' + i));
                this._pins[i].anchor.set(0.5, 0.5);
                this.addChild(this._pins[i]);
                if (i !== 3) {

                    const pos = Scene_Minimap.pinPosition($globalMap.nonPlayer(i + 1).mapId(), i);
                    this._pins[i].move(pos.x, pos.y);
                }
                else {
                    // サリア専用処理
                    const pos = Scene_Minimap.pinPosition(3, i);
                    this._pins[i].move(pos.x, pos.y);
                }

            }
        }

        createCommandButtons() {
            this._index = Scene_Minimap._lastCommandSymbol;
            /**
             * @type {Sprite_Button[]}
             */
            this._buttons = [];
            this.createItemsButton();
            this.createOptionButton();
            this.createSaveButton();
            this.select(this._index);
        };

        createItemsButton() {
            this._itemsButtonSprite = new Sprite_Button();
            this._itemsButtonSprite.bitmap = ImageManager.loadMinimap('button_items');
            this._itemsButtonSprite.move(15, 9);
            this._itemsButtonSprite.setColorTone(this.disableColor());
            this._itemsButtonSprite.setClickHandler(this.onItemsButtonDown.bind(this));
            this._buttons.push(this._itemsButtonSprite);
            this.addChild(this._itemsButtonSprite);
        };

        createOptionButton() {
            this._optionButtonSprite = new Sprite_Button();
            this._optionButtonSprite.bitmap = ImageManager.loadMinimap('button_option');
            this._optionButtonSprite.move(15, 84);
            this._optionButtonSprite.setColorTone(this.disableColor());
            this._optionButtonSprite.setClickHandler(this.onOptionButtonDown.bind(this));
            this._buttons.push(this._optionButtonSprite);
            this.addChild(this._optionButtonSprite);
        };

        createSaveButton() {
            this._saveButtonSprite = new Sprite_Button();
            this._saveButtonSprite.bitmap = ImageManager.loadMinimap('button_save');
            this._saveButtonSprite.move(15, 159);
            this._saveButtonSprite.setColorTone(this.disableColor());
            this._saveButtonSprite.setClickHandler(this.onSaveButtonDown.bind(this));
            this._buttons.push(this._saveButtonSprite);
            this.addChild(this._saveButtonSprite);
        };

        update() {
            super.update();
            if (TouchInput.isReleaseMoved()) {
                this.processMouseMove();
            }
            else {
                this.processCursorMove();
            }
            this.triggerButtonAction()
        }

        index() {
            return this._index;
        };

        maxItems() {
            return this._buttons.length;
        }

        processMouseMove() {
            const lastIndex = this.index();
            let index = -1;
            if (this._itemsButtonSprite.isButtonTouched()) {
                index = 0;
            }
            if (this._optionButtonSprite.isButtonTouched()) {
                index = 1;
            }
            if (this._saveButtonSprite.isButtonTouched()) {
                index = 2;
            }
            this.select(index);
            if (this.index() !== lastIndex && index >= 0) {
                SoundManager.playCursor();
            }
        }

        processCursorMove() {
            const lastIndex = this.index();
            if (Input.isRepeated('down')) {
                this.cursorDown();
            }
            if (Input.isRepeated('up')) {
                this.cursorUp();
            }
            if (this.index() !== lastIndex) {
                SoundManager.playCursor();
            }
        };

        cursorDown() {
            const index = this.index() + 1;
            if (index < this.maxItems()) {
                this.select(index);
            }
            else {
                this.select(0);
            }
        };

        cursorUp() {
            const index = this.index() - 1;
            if (index < 0) {
                this.select(this.maxItems() - 1);
            }
            else {
                this.select(index);
            }
        };

        select(index) {
            this.disableCurrentButton();
            this._index = index;
            if (index >= 0) {
                this.enableCurrentButton();
            }
            //this.callUpdateHelp();
        };

        enableCurrentButton() {
            if (this._index >= 0) {
                this._buttons[this._index].setColorTone(this.enableColor());
            }
        }

        disableCurrentButton() {
            if (this._index >= 0) {
                this._buttons[this._index].setColorTone(this.disableColor());
            }
        }


        enableColor() {
            return [0, 0, 0, 0];
        }

        disableColor() {
            return [-64, -64, -64, 0];
        }

        onSaveButtonDown() {
            Scene_Minimap._lastCommandSymbol = this._index;
            SceneManager.push(Scene_Save);
        }

        onItemsButtonDown() {
            Scene_Minimap._lastCommandSymbol = this._index;
            SceneManager.push(Scene_Item);
        }

        onOptionButtonDown() {
            Scene_Minimap._lastCommandSymbol = this._index;
            SceneManager.push(Scene_Options);
        }

        triggerButtonAction() {
            if (Input.isTriggered('ok')) {
                this.processOk();
                return;
            }
            if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                this.processCancel();
                return;
            }
        }

        processOk() {
            if (this._index >= 0) {
                this._buttons[this._index].callClickHandler();
            }
        }

        processCancel() {
            SoundManager.playCancel();
            Scene_Minimap._lastCommandSymbol = 0;
            this.popScene();
        };

    }

    Scene_Minimap._lastCommandSymbol = 0;

    // Open Menu Screen
    Game_Interpreter.prototype.command351 = function () {
        if (!$gameParty.inBattle()) {
            SceneManager.push(Scene_Minimap);
            Window_MenuCommand.initCommandPosition();
        }
        return true;
    };

    Scene_Map.prototype.callMenu = function () {
        SoundManager.playOk();
        SceneManager.push(Scene_Minimap);
        Window_MenuCommand.initCommandPosition();
        $gameTemp.clearDestination();
        this._mapNameWindow.hide();
        this._waitCount = 2;
    };

    ImageManager.loadMinimap = function (filename, hue) {
        return this.loadBitmap('img/ui/minimap/', filename, hue, true);
    };

    ClassRegister(Scene_Minimap);
})()