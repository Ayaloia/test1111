(function () {

    window.IS_SAMEMAP_SWITCH = {
        1: 246,
        2: 346,
        3: 446
    }

    class MB_NpcData {
        constructor(character) {
            this._id = character.id;
            this._name = character.name;
            this._image = character.image;
            this._affection = character.affection;
            this._relationship = character.relationship;
            this._validity = character.validity;
            this._received = {};
        }

        get id() {
            return this._id;
        }

        get name() {
            return this._name;
        }

        get image() {
            return this._image;
        }

        set image(value) {
            this._image = value;
        }

        get validity() {
            return this._validity;
        }

        set validity(value) {
            this._validity = value;
        }

        gainAffection(value) {
            this._affection += value;
        }

        changeRelationship(value) {
            this._relationship = value;
        }

    }

    ClassRegister(MB_NpcData);

    class MB_NonPlayer extends Game_Event {

        static receiveItemIdStoredVariableId() {
            return 1;
        }

        static receiveItemNameStoredVariableId() {
            return 2;
        }

        initialize(character) {
            this._data = new MB_NpcData(character);
            this._event = null;
            this._scheduler = null;

            Game_Character.prototype.initialize.call(this);
            this._eventId = -1;
            this._moveSpeed = 3;

            //Game_NonPlayerに必要な変数        
            this._greeted = false;
            this._received = false;

            this._characterCollidCount = 0;
        }

        initMembers() {
            super.initMembers();

            this._scheduler = new MB_CharacterScheduler(this);
            this._event = $globalMap.findEventDefault(this._data.name);
            this._locked = false;
        }

        checkLastMinuteAppointments(minus) {
            this._scheduler.checkLastMinuteAppointments(minus);
        }

        jumpSpecifiedTime(hour, minute = 0) {
            this.unlock();
            this.setDirectionFix(false);
            this.clearDestination();
            this._scheduler.jumpSpecifiedTime(hour, minute);
        }

        clearDestination() {
            this._scheduler.clearDestination();
            this._route = [];
        }

        newDay(date) {
            this._scheduler.newday(date);
            this.refresh();
        }

        findEvent() {
            let event = null
            if (!this._greeted) {
                this._event = $globalMap.findEventDefault(this._data.name);
            }
            if (!event) {
                event = $globalMap.findEventByMapId(this._data.name, this._mapId);
            }
            if (!event) {
                const dayOfWeek = $gameSystem.chronus().getDaysOfWeek();
                event = $globalMap.findEventByDayOfWeek(this._data.name, dayOfWeek);
            };
            if (!event) {
                event = $globalMap.findEventDefault(this._data.name);
            };
            if (!event) {
                throw new Error(`NPC:${this._data.name} 適切なNPCイベントが見つかりませんでした。`)
            }
            this._event = event;
            this.refresh();
        }

        //=============================================================================
        // データ取得
        //=============================================================================
        get charaId() {
            return this._data.id;
        }
        get name() {
            return this._data.name;
        }

        event() {
            return this._event;
        }

        character() {
            return $globalMap.nonPlayer(this._data.id);
        }

        characterName() {
            return this._data.image;
        }

        favorite(itemId) {
            return $dataFavorite[itemId][0][this._data.id];
        }

        mapId() {
            return this._mapId;
        };

        //=============================================================================
        // データ設定
        //=============================================================================

        setPosition(x, y, d = 2, mapId = this._mapId) {
            super.setPosition(x, y);
            this._mapId = mapId;
            this.setDirectionFix(false);
            this.setDirection(d);
            this.checkEventTriggerHere();
        }

        setTarget(target) {
            this._scheduler.setTarget(target);
        }

        setGreeted() {
            this._greeted = true;
        }

        setEventId(id) {
            this._eventId = id;
        }

        setValidity(flag) {
            this._data.validity = flag;
        }


        //=============================================================================
        // Update処理
        //=============================================================================

        update() {
            if (!$gameMap.isEventRunning() && !this._locked) {
                var wasMoving = this.isMoving();
                Game_Character.prototype.update.call(this);
                if (!this.isMoving()) {
                    this.updateNonmoving(wasMoving);
                }
            }
            this.updateParallel();
        }

        updateMove() {
            super.updateMove();
            this._characterCollidCount = 0;
        }

        updateNonmoving(wasMoving) {
            if (wasMoving) {
                this.checkEventTriggerHere();
            }
        };

        updateStop() {
            if (this._locked) {
                this.resetStopCount();
                return;
            }

            const hour = $gameSystem.chronus().getHour();
            const minute = $gameSystem.chronus().getMinute();

            this._scheduler.update(hour, minute);

            //そのうち自律移動についても考える。
            if (false)
                this.updateSelfMovement();
        }

        updateParallel() {
            if (this._interpreter) {
                this._interpreter.update();
                if (!this._interpreter.isRunning()) {
                    this._interpreter = null;
                }
            }
        };

        checkEventTriggerHere() {
            const events = this.excuteEvent(this.x, this.y);
            events.forEach(event => {
                if (event && event.isTile()) {
                    this.setupInterpreter(event);
                }
            })
        };

        checkEventTriggerTouch(x, y) {
            if (!this._interpreter) {
                const events = this.excuteEvent(x, y);

                events.forEach(event => {
                    if (event && event.isNormalPriority()) {
                        this.setupInterpreter(event);
                        return;
                    }
                })

            }
            if (this.isSameMap()) {
                if (this._trigger === 2 && $gamePlayer.pos(x, y)) {
                    if (!this.isJumping() && this.isNormalPriority()) {
                        this.start();
                    }
                }
            }
        }

        excuteEvent(x, y) {
            const events = $globalMap.map(this._mapId).nonPlayerExcuteEvents(x, y);
            events.forEach(event => event.refresh(this))
            return events;
        }

        performTransfer(mapId, x, y, d) {
            const lastMapId = this._mapId;
            this.setPosition(x, y, d, mapId);
            if (lastMapId !== mapId) {
                if (this.isSameMap()) {
                    const scene = SceneManager.currentScene();
                    scene.addMapObject(this);
                    $gameMap.addNpc(this);
                    this.findEvent();
                    this.refresh();
                }
                if (lastMapId === $gameMap.mapId()) {
                    const scene = SceneManager.currentScene();
                    scene.removeCharacter(this);
                    this.endBalloon();
                    $gameMap.removeNpc(this._eventId);
                }
            }
            this.onPerformTransfer();
        }

        onPerformTransfer() {
            if (this.isSameMap()) {
                $gameSwitches.setValue(IS_SAMEMAP_SWITCH[this._data.id], true)
            } else {
                $gameSwitches.setValue(IS_SAMEMAP_SWITCH[this._data.id], false)
            }
            this.unlock();
        }

        /**
         * 
         * @param {MB_NPCExcuteEvent} event 
         */
        setupInterpreter(event) {

            if (!event.page()) {
                return;
            }
            if (event.isParallel()) {
                this._interpreter = new Game_Interpreter();
                this._interpreter.setup(event.list(), event.eventId());
                this._interpreter.setExcuteCharacter(this);
            }
            else {
                if ($gameMap.isEventRunning()) {
                    $gameMap.terminateInterpreter().setupChild(event.list(), event.eventId());
                    $gameMap.terminateInterpreter().setExcuteCharacter(this);
                } else {
                    $gameMap.interpreter().setup(event.list(), event.eventId());
                    $gameMap.interpreter().setExcuteCharacter(this);
                }

            }
        }

        //=============================================================================
        // フロー制御
        //=============================================================================

        start() {
            // if ($gamePlayer.hasItem()) {
            //     const item = $gamePlayer.listedItem(true);
            //     this.receiveGift(item);
            // }
            //else
            if (this.isAlreadyGreeted()) {
                super.start();
            }
            else {
                this.greet();
            }
        }

        greet(skipEvent = false) {
            if (!skipEvent) {
                super.start();
            }
            if (!this._greeted) {
                this._greeted = true;
                this._data.gainAffection(50);
                //$gameMap.addFinishEventListener(this.findEvent.bind(this));
            }
        }

        receiveGift(item) {
            if (this.isAlreadyReceived()) {
                this._pageIndex = 7;
            }
            else {

                const preference = this.favorite(item.id);
                this._pageIndex = preference + 3;
                this._data.gainAffection(preference * 100);
                this._received = true;

                $gameVariables._data[MB_NonPlayer.receiveItemIdStoredVariableId()] = item.id;
                $gameVariables._data[MB_NonPlayer.receiveItemNameStoredVariableId()] = item.name;

                $gamePlayer.consumptionItem();

            }
            this._event = $globalMap.findEventByGift(this._data.name);
            super.start();
            //$gameMap.addFinishEventListener(this.findEvent.bind(this));
        }

        interrupt(mapId, x, y, d, subtractProgress = 1) {
            this._scheduler.interrupt(mapId, x, y, d, subtractProgress);
        }

        pause(hour, minute) {
            this._scheduler.pause(hour, minute);
        }
        resume() {
            this._scheduler.resume();
        }

        isAlreadyReceived() {
            return this._received;
        }

        isAlreadyGreeted() {
            return this._greeted;
        }

        isSameMap() {
            return this._mapId === $gameMap.mapId();
        }

        isValidity() {
            return this._data.validity;
        }

        //=============================================================================
        // 既存処理の上書き
        //=============================================================================

        findDirectionTo(goalX, goalY) {
            var searchLimit = this.searchLimit();
            var mapWidth = $gameMap.width();
            var nodeList = [];
            var openList = [];
            var closedList = [];
            var start = {};
            var best = start;

            if (this.x === goalX && this.y === goalY) {
                return 0;
            }

            start.parent = null;
            start.x = this.x;
            start.y = this.y;
            start.g = 0;
            start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
            nodeList.push(start);
            openList.push(start.y * mapWidth + start.x);

            while (nodeList.length > 0) {
                var bestIndex = 0;
                for (var i = 0; i < nodeList.length; i++) {
                    if (nodeList[i].f < nodeList[bestIndex].f) {
                        bestIndex = i;
                    }
                }

                var current = nodeList[bestIndex];
                var x1 = current.x;
                var y1 = current.y;
                var pos1 = y1 * mapWidth + x1;
                var g1 = current.g;

                nodeList.splice(bestIndex, 1);
                openList.splice(openList.indexOf(pos1), 1);
                closedList.push(pos1);

                if (current.x === goalX && current.y === goalY) {
                    best = current;
                    break;
                }

                if (g1 >= searchLimit) {
                    continue;
                }

                for (var j = 0; j < 4; j++) {
                    var direction = 2 + j * 2;
                    var x2 = $gameMap.roundXWithDirection(x1, direction);
                    var y2 = $gameMap.roundYWithDirection(y1, direction);
                    var pos2 = y2 * mapWidth + x2;

                    if (closedList.contains(pos2)) {
                        continue;
                    }

                    if (!$globalMap.map(this._mapId).isRoadRegion(x2, y2)) {
                        continue;
                    }

                    var g2 = g1 + 1;
                    var index2 = openList.indexOf(pos2);

                    if (index2 < 0 || g2 < nodeList[index2].g) {
                        var neighbor;
                        if (index2 >= 0) {
                            neighbor = nodeList[index2];
                        } else {
                            neighbor = {};
                            nodeList.push(neighbor);
                            openList.push(pos2);
                        }
                        neighbor.parent = current;
                        neighbor.x = x2;
                        neighbor.y = y2;
                        neighbor.g = g2;
                        neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
                        neighbor.f -= $globalMap.map(this._mapId).isPrimaryRoadRegion(x2, y2) ? 10 : 0;

                        if (!best || neighbor.f - neighbor.g < best.f - best.g) {
                            best = neighbor;
                        }

                    }
                }
            }

            var node = best;
            while (node.parent && node.parent !== start) {
                node = node.parent;
            }

            var deltaX1 = $gameMap.deltaX(node.x, start.x);
            var deltaY1 = $gameMap.deltaY(node.y, start.y);
            if (deltaY1 > 0) {
                return 2;
            } else if (deltaX1 < 0) {
                return 4;
            } else if (deltaX1 > 0) {
                return 6;
            } else if (deltaY1 < 0) {
                return 8;
            }

            var deltaX2 = this.deltaXFrom(goalX);
            var deltaY2 = this.deltaYFrom(goalY);
            if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
                return deltaX2 > 0 ? 4 : 6;
            } else if (deltaY2 !== 0) {
                return deltaY2 > 0 ? 8 : 2;
            }

            return 0;
        };

        canPass2(x, y, d) {
            var x2 = $gameMap.roundXWithDirection(x, d);
            var y2 = $gameMap.roundYWithDirection(y, d);
            if (!$gameMap.isValid(x2, y2)) {
                return false;
            }
            if (this.isThrough() || this.isDebugThrough()) {
                return true;
            }
            if (!this.isMapPassable(x, y, d)) {
                return false;
            }
            return true;
        }

        ignoreRoad() {
            if (this._data.id === 1) {
                return $gameSwitches.value(331);
            }
            return false;
        }

        //A*アルゴリズムのサーチリミット
        //50マス先までサーチできる、広大なマップでは注意が必要
        searchLimit() {
            return 50;
        }

        canPass(x, y, d) {
            var x2 = $gameMap.roundXWithDirection(x, d);
            var y2 = $gameMap.roundYWithDirection(y, d);
            if (this.isSameMap()) {

                if (!$gameMap.isValid(x2, y2)) {
                    return false;
                }
                if (!$globalMap.map(this._mapId).isRoadRegion(x2, y2)) {
                    return false;
                }
                if (this.isThrough() || this.isDebugThrough()) {
                    return true;
                }
                if (!this.isMapPassable(x, y, d)) {
                    return false;
                }
                if (this.isCollidedWithCharacters(x2, y2)) {
                    if (60 < this._characterCollidCount) {
                        this._characterCollidCount = 0;
                        return true;
                    }
                    this._characterCollidCount++;
                    return false;
                }
                return true;
            }
            else {
                if (!$globalMap.map(this._mapId).isRoadRegion(x2, y2)) {
                    return false;
                }
                if (this.isCollidedWithNPCExcuteEvents(x2, y2)) {
                    if (5 < this._characterCollidCount) {
                        this._characterCollidCount = 0;
                        return true;
                    }
                    this._characterCollidCount++;
                    return false;
                }
            }
            return true;
        }

        updateAnimation() {
            this.updateAnimationCount();
            if (this._animationCount >= this.animationWait()) {
                this.updatePattern();
                this._animationCount = 0;
            }
        };

        //NPCどうしの衝突を無しに
        isCollidedWithEvents(x, y) {
            var events = $gameMap.eventsXyNt(x, y);
            return events.some(function (event) {
                return event.isNormalPriority() && !(event instanceof MB_NonPlayer);
            });
        };

        isCollidedWithNPCExcuteEvents(x, y) {
            const events = $globalMap.map(this._mapId).nonPlayerExcuteEvents(x, y);

            for (let i = 0; i < events.length; i++) {
                events[i].refresh(this);
                if (events[i].isNormalPriority()) {
                    return true;
                }
            }

            return false;
        }

        refresh() {
            var newPageIndex = this._erased ? -1 : this.findProperPageIndex();

            if (this._pageIndex !== newPageIndex) {
                this._pageIndex = newPageIndex;
                this.setupPage();
            }
            this.refreshBushDepth();
        };

        onLoadContents() {
            if (this.isSameMap()) {
                $gameMap._events[this._eventId] = this;
            }
            this.setupPageSettings();
            this._event = $globalMap.findEventDefault(this._data.name);
            if (this._scheduler.isExistDestination()) {
                this._scheduler.setRoute();
            }
        };

    }

    ClassRegister(MB_NonPlayer);

})();