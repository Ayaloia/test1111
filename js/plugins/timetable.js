

class MB_TimeTable {
    constructor(charaId, numberOfDaysInWeek) {
        this._data = [];

        if ($dataTimeTable.length <= charaId) {
            //throw new Error(`NpcId:${charaId} は未定義です。`);
        }

        var clonedeep = require('lodash/cloneDeep');
        let charaTable = clonedeep($dataTimeTable[charaId]);
        charaTable.forEach(table => table.dayOfWeekId = table.dayOfWeekId.split(',').map(num => parseInt(num)));

        if (charaTable) {
            for (let i = 0; i < numberOfDaysInWeek; i++) {
                const field = charaTable.filter(timeTable => timeTable.dayOfWeekId.contains(i))
                if (field) {
                    this._data[i] = field;
                }
                else {
                    this._data[i] = [];
                }

            }
        }
    }
    table(dayOfWeek) {
        return this._data[dayOfWeek];
    }

    field(dayOfWeek, column) {
        const table = this.table(dayOfWeek);
        if (table.length <= column) {
            return this.table(dayOfWeek)[table.length - 1];
        }
        return table[column];
    }

    time(dayOfWeek, column) {
        return this.hour(dayOfWeek, column) * 60 + this.minute(dayOfWeek, column);
    }

    hour(dayOfWeek, column) {
        return this.field(dayOfWeek, column).hour;
    }

    minute(dayOfWeek, column) {
        return this.field(dayOfWeek, column).minute;
    }

    mapId(dayOfWeek, column) {
        return this.field(dayOfWeek, column).mapId;
    };

    mapGroup(dayOfWeek, column) {
        return this.field(dayOfWeek, column).mapGroup;
    };

    mapName(dayOfWeek, column) {
        return this.field(dayOfWeek, column).mapName;
    };

    location(dayOfWeek, column) {
        return this.field(dayOfWeek, column).location;
    }

    destination(dayOfWeek, column) {
        const field = this.field(dayOfWeek, column);
        return { mapId: field.mapId, x: field.x, y: field.y, direction: field.direction };
    };

    moveSpeed(dayOfWeek, column) {
        return this.field(dayOfWeek, column).moveSpeed;
    };

    switch(dayOfWeek, column) {
        return this.field(dayOfWeek, column).switch;
    }
}
ClassRegister(MB_TimeTable);

class MB_CharacterScheduler {
    constructor(character) {
        this._character = character;
        // 一日の始まりの時間
        this._startedTime = 0;
        this._currentTime = 0;
        this._pause = false;
        this._resumeTime = 0;
        this._dayOfWeek = 0;
        this._timeTable = new MB_TimeTable(character.charaId, $gameSystem.chronus().getDaysOfWeek());
        this._destination = {};
        this._destinationStack = [];
        this._target = null;
        this._progress = 1;
        this._route = [];

        const dest = this._timeTable.destination(this._dayOfWeek, 0);
        //        const location = this._timeTable.location(this._dayOfWeek, 0);
        const speed = this._timeTable.moveSpeed(this._dayOfWeek, 0);
        this._character.setPosition(dest.x, dest.y, dest.direction, dest.mapId);
        //this._character.setLocation(location);
        this._character.setMoveSpeed(speed);

    }

    jumpSpecifiedTime(hour, minute) {

        if (this.isAppear()) {
            // check hour
            this.changeSwitch(false);
            const lastProgress = this._progress;
            this.advanceTheSchedule(hour, minute);

            if (this._progress < lastProgress) {
                this._progress = lastProgress;
            }

            const dest = this._timeTable.destination(this._dayOfWeek, this._progress);
            const location = this._timeTable.location(this._dayOfWeek, this._progress);
            const speed = this._timeTable.moveSpeed(this._dayOfWeek, this._progress);
            this._character.performTransfer(dest.mapId, dest.x, dest.y, dest.direction);
            this._character.setLocation(location);
            this._character.setMoveSpeed(speed);
            this.setTime(hour, minute);
            this.changeSwitch(true);
            this._progress++;
        }
    }


    advanceTheSchedule(hour, minute) {
        hour = hour || this._timeTable.hour()
        let time = hour * 60 + minute;

        while (true) {
            let estimatedTime = this._timeTable.hour(this._dayOfWeek, this._progress) * 60;
            estimatedTime += this._timeTable.minute(this._dayOfWeek, this._progress);

            if (estimatedTime === time) {
                break;
            }

            if (estimatedTime < time) {
                this._progress++;
            }
            else {
                this._progress--;
                break;
            }

            if (this.isTerminated()) {
                this._progress--;
                break;
            }
        }
    }

    clearDestination() {
        this._destination = {};
        this._destinationStack = [];
        this._route = [];
    }

    setTime(hour, minute) {
        this._currentTime = hour * 60 + minute;
        if (this._startedTime > this._currentTime) {
            this._currentTime += 60 * 24;
        }
    }

    setTarget(target) {
        this._target = target;
        if (this._target) {
            if (this.isExistDestination()) {
                this._destinationStack.push(this._destination);
            }
        }
        else {
            if (!this.checkDestinationStack()) {
                if (!this.checkAppointments()) {
                    this._destination = this._timeTable.destination(this._dayOfWeek, this._progress - 1)
                    this._progress -= 1;
                    this.setRoute();
                }
            }
        }
    }

    destination() {
        return this._destination;
    }

    position() {
        return {
            x: this._character.x,
            y: this._character.y,
            mapId: this._character.mapId(),
            direction: this._character.direction()
        }
    }

    newday(date) {
        this._startTime = date.hour;
        this._currentTime = date.hour;
        const dayOfWeek = date.week.id;
        this._dayOfWeek = dayOfWeek >= $gameSystem.chronus().getDaysOfWeek() ? 0 : dayOfWeek;

        this._destination = {};
        this._progress = 0;
        this._route = [];

        if (this.isAppear()) {
            const dest = this._timeTable.destination(this._dayOfWeek, this._progress);
            this._character.setPosition(dest.x, dest.y, dest.direction, dest.mapId);
            this._progress = 1;
        }
        else {
            this._character.setPosition(-1, -1, 0, -1);
            //アップデートの必要がないNPCを退避するメソッドをつくる
            //$globalMap.removeNonPlayer(this._character.charaId());
        }
    }

    update(hour, minute) {
        // 登場しない日は npc の配列から除去したほうがいいかもね。
        if (!this.isAppear()) {
            return;
        }
        // if ($gameMap.isEventRunning()) {
        //     return;
        // }
        if (this._pause) {
            if (hour * 60 + minute < this._resumeTime) {
                return;
            }
            else {
                this._pause = false;
                this._resumeTime = 0;
            }
        }
        if (this._target) {
            let mapId = $gameMap.mapId();
            mapId = this._target instanceof Game_Event ? this._target.mapId() : mapId;

            this._destination = { mapId: mapId, x: this._target.x, y: this._target.y, direction: this._target.direction() };
            this.setRoute();
        }
        if (this.isExistDestination()) {
            this.goTowardsDestination();
        }
        else if (this.checkDestinationStack()) {
            this.goTowardsDestination();
        }
        else {
            if (this._currentTime !== hour * 60 + minute) {
                this.setTime(hour, minute);
                if (!this.isTerminated()) {
                    this.checkAppointments();
                }
            }
        }
    }

    checkAppointments() {
        let estimatedTime = this._timeTable.time(this._dayOfWeek, this._progress);
        if (estimatedTime < this._startedTime) {
            estimatedTime += 60 * 24;
        }

        if (estimatedTime <= this._currentTime) {
            this._destination = this._timeTable.destination(this._dayOfWeek, this._progress);
            this._character.setMoveSpeed(this._timeTable.moveSpeed(this._dayOfWeek, this._progress));
            this.setRoute();
            return true;
        }
        return false;
    }

    checkLastMinuteAppointments(minus) {
        this.setTime(100, 0);
        this._progress -= minus;
        this.checkAppointments();
    }

    setRoute() {
        this.changeSwitch(false);
        if (this._destination.mapId !== this._character.mapId()) {
            this._route = $globalMap.routeFromMapToMap(this._destination.mapId, this._character.mapId());
            this._route.shift();

            const entrance = $globalMap.entranceFromMaptoMap(this._route[0], this._character.mapId());
            this._character.startRouteExloration(entrance.x, entrance.y);
        }
        else {
            this._character.startRouteExloration(this._destination.x, this._destination.y);
            this._route = [];
        }
    }

    goTowardsDestination() {
        if (this._route.length > 0) {
            this.goTowardsRelayPoint();
        }
        else {
            let direction = this._character.findDirectionTo(this._destination.x, this._destination.y);

            if (direction > 0) {
                //this._character.checkEventTriggerTouchFront(this._character.direction());
                this._character.moveStraight(direction);
            }
            else {
                this.arrival();
            }
        }
    }

    goTowardsRelayPoint() {
        let entrance = $globalMap.entranceFromMaptoMap(this._route[0], this._character.mapId());
        const direction = this._character.findDirectionTo(entrance.x, entrance.y);

        if (direction > 0) {
            //this._character.checkEventTriggerTouchFront(this._character.direction());
            this._character.moveStraight(direction);
        }
        else {
            const mapId = this._route.shift();
            const exit = $globalMap.exitFromMaptoMap(mapId, this._character.mapId());
            this._character.performTransfer(mapId, exit.x, exit.y, this._character.direction());

            if (this._route.length > 0) {
                let entrance = $globalMap.entranceFromMaptoMap(this._route[0], this._character.mapId());
                this._character.startRouteExloration(entrance.x, entrance.y);
            }
            else {
                this._character.startRouteExloration(this._destination.x, this._destination.y);
            }


        }
    }



    checkDestinationStack() {
        if (0 < this._destinationStack.length) {
            this._destination = this._destinationStack.pop();
            this.setRoute();
            return true;
        }
        return false;

    }

    pause(hour, minute) {
        this._pause = true;
        this._resumeTime = $gameSystem.chronus().getHour() * 60 + $gameSystem.chronus().getMinute() + hour * 60 + minute;
    }

    resume() {
        this._pause = false;
        this._resumeTime = 0;
    }

    interrupt(mapId, x, y, direction, subtractProgress = 1) {
        if (this._target) {
            this._target = null;
            this._destination = {};
        }
        if (this.isExistDestination()) {
            this._destinationStack.push(this._destination);
        }
        this._destination = { x: x, y: y, mapId: mapId, direction: direction };
        this._progress -= subtractProgress;
        this.setRoute();
    }

    arrival() {
        this._character.setDirection(this._destination.direction);
        this._character.checkEventTriggerTouchFront(this._destination.direction);
        this.changeSwitch(true);
        this._destination = {};
        this._progress += 1;
    }

    changeSwitch(value) {
        let progress = this._progress
        if (!value) {
            progress -= 1;
        }
        if (progress < 0) {
            return;
        }
        const switchId = this._timeTable.switch(this._dayOfWeek, progress);
        if (switchId) {
            $gameSwitches.setValue(switchId, value)
        }
    }

    isExistDestination() {
        return Object.keys(this._destination).length > 0 ? true : false;
    }

    isAppear() {
        return this._timeTable.table(this._dayOfWeek).length > 0;
    }

    isTerminated() {
        return this._timeTable.table(this._dayOfWeek).length - 1 < this._progress;
    }

    makeSaveContents() {
        return {
            startedTime: this._startedTime,
            currentTime: this._currentTime,
            pause: this._pause,
            resumeTime: this._resumeTime,
            dayOfWeek: this._dayOfWeek,
            destination: this._destination,
            destinationStack: this._destinationStack,
            target: this._target,
            progress: this._progress,
            route: this._route
        }
    }

    extractSaveContents(contents) {
        this._startedTime = contents.startedTime;
        this._currentTime = contents.currentTime;
        this._pause = contents.pause;
        this._resumeTime = contents.resumeTime;
        this._dayOfWeek = contents.dayOfWeek;
        this._destination = contents.destination;
        this._destinationStack = contents.destinationStack;
        this._target = contents.target;
        this._progress = contents.progress;
        this._route = contents.route;
    }
}

ClassRegister(MB_CharacterScheduler);