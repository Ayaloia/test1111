Input.clear = function () {
    this._currentState = {};
    this._previousState = {};
    this._gamepadStates = [];
    this._latestButton = null;
    this._pressedButton = {};

    const _mapper = Object.values(Input.keyMapper).concat(Object.values(Input.gamepadMapper), Object.values(Input.mapItemSlot));
    _mapper.forEach(key => {
        this._pressedButton[key] = {
            prev: false,
            last: false,
            time: 0
        }
    });
    this._pressedTime = 0;
    this._dir4 = 0;
    this._dir8 = 0;
    this._preferredAxis = '';
    this._date = 0;
};

Input.update = function () {
    this._pollGamepads();

    Object.keys(this._pressedButton).forEach(key => {
        this._pressedButton[key].prev = this._pressedButton[key].last;
        if (this._currentState[key]) {
            this._pressedButton[key].last = true;
        }
        else {
            this._pressedButton[key].last = false;
            this._pressedButton[key].time = 0;
        }
        if (this._pressedButton[key].last && this._pressedButton[key].prev) {
            this._pressedButton[key].time++;
        }

    });

    if (this._currentState[this._latestButton]) {
        this._pressedTime++;
    } else {
        this._latestButton = null;
    }
    for (var name in this._currentState) {
        if (this._currentState[name] && !this._previousState[name]) {
            this._latestButton = name;
            this._pressedTime = 0;
            this._date = Date.now();
        }
        this._previousState[name] = this._currentState[name];
    }
    this._updateDirection();
};

Input.isPressed = function (keyName) {
    const state = this._pressedButton[keyName];
    if (state.last && state.prev) {
        return true;
    }
    return false;
};

Input.isReleased = function (keyName) {
    const state = this._pressedButton[keyName];
    if (state.prev && !state.last) {
        return true;
    }
    return false;
};

Input.isTriggered = function (keyName) {
    if (this._isEscapeCompatible(keyName) && this.isTriggered('escape')) {
        return true;
    } else {
        const state = this._pressedButton[keyName];
        return state.last && !state.prev;
    }
};

Input.isRepeated = function (keyName) {
    if (this._isEscapeCompatible(keyName) && this.isRepeated('escape')) {
        return true;
    } else {
        const state = this._pressedButton[keyName]
        return (state.last &&
            (state.time === 0 ||
                (state.time >= this.keyRepeatWait &&
                    state.time % this.keyRepeatInterval === 0)));
    }
};

Input.isAny = function () {
    return Object.values(this._pressedButton).find(v => v.prev) !== undefined;
}

Input.keyMapper = {
    8: 'cancel',   // backspace
    9: 'tab',       // tab
    13: 'ok',       // enter
    16: 'shift',    // shift
    17: 'control',  // control
    18: 'alt',      // alt
    27: 'escape',   // escape
    32: 'space',       // space
    33: 'pageup',   // pageup
    34: 'pagedown', // pagedown
    37: 'left',     // left arrow
    38: 'up',       // up arrow
    39: 'right',    // right arrow
    40: 'down',     // down arrow
    45: 'cancel',   // insert
    46: 'escape',
    //81: 'pageup',   // Q
    //87: 'pagedown', // W
    88: 'escape',   // X
    90: 'ok',       // Z
    //67: 'menu',     // C
    93: 'escape',
    96: 'escape',   // numpad 0
    98: 'down',     // numpad 2
    100: 'left',    // numpad 4
    102: 'right',   // numpad 6
    104: 'up',      // numpad 8    
    120: 'debug',   // F9
    219: 'home',  // [
    221: 'end',  // ]
    35: 'end',      // end
    36: 'home',     // home
    87: 'up',       // W
    65: 'left',     // A
    83: 'down',     // S
    68: 'right',    // D
    81: 'home',     // Q
    69: 'end',      // E
    82: 'pageup',   // R
    70: 'pagedown', // F
};


Input.gamepadMapper = {
    0: 'ok',        // A
    1: 'cancel',    // B
    2: 'shift',     // X
    3: 'menu',      // Y
    4: 'home',      // LB
    5: 'end',       // RB
    6: 'pageup',    // Left Trigger
    7: 'pagedown',  // Right Trigger
    8: 'back',      // Back
    9: 'start',     // Start
    // 10: 'start',    // L3
    // 11: 'reset',    // R3
    12: 'up',       // D-pad up
    13: 'down',     // D-pad down
    14: 'left',     // D-pad left
    15: 'right',    // D-pad right
};

/**
 * MKR_MapItemSlot
 */
Input.mapItemSlot = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: 'a'
};

TouchInput._onMouseMove = function (event) {
    if (this._mousePressed) {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        this._onMove(x, y);
    }
    else {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        this._onReleaseMove(x, y);
    }

};

TouchInput._onReleaseMove = function (x, y) {
    this._events.releaseMoved = true;
    this._x = x;
    this._y = y;
}

TouchInput.isReleaseMoved = function () {
    return this._releaseMoved;
}

// by トリアコンタン MouseWheelExtend.js
var _TouchInput_update2 = TouchInput.update;
TouchInput.update = function () {
    _TouchInput_update2.apply(this, arguments);
    this._middleTriggered = this._events.middleTriggered;
    this._events.middleTriggered = false;

    this._releaseMoved = this._events.releaseMoved;
    this._events.releaseMoved = false;
};

var _TouchInput__onMiddleButtonDown = TouchInput._onMiddleButtonDown;
TouchInput._onMiddleButtonDown = function (event) {
    _TouchInput__onMiddleButtonDown.apply(this, arguments);
    this._events.middleTriggered = true;
};

TouchInput.isMiddleTriggered = function () {
    return this._middleTriggered;
};