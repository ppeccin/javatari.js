// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.GamepadConsoleControls = function(domControls) {

    this.connect = function(pConsoleControlsSocket) {
        consoleControlsSocket = pConsoleControlsSocket;
    };

    this.connectScreen = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        supported = !!navigator.getGamepads;
        if (!supported) return;
        this.applyPreferences();
        initStates();
    };

    this.powerOff = function() {
        supported = false;
    };

    this.toggleMode = function() {
        if (!supported) return;
        initStates();
        swappedMode = !swappedMode;
        screen.getMonitor().showOSD("Gamepad input " + (swappedMode ? "Swapped" : "Normal"), true);
    };

    this.setPaddleMode = function(state) {
        if (!supported) return;
        paddleMode = state;
        joy0State.xPosition = joy1State.xPosition = -1;
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
    };

    this.clockPulse = function() {
        if (!supported) return;

        // Try to avoid polling at gamepads if none are present, as it may be expensive
        // Only try to detect connected gamepads once each 60 clocks (frames)
        if (++gamepadsDetectionDelay >= 60) gamepadsDetectionDelay = 0;
        if (!joystick0 && !joystick1 && gamepadsDetectionDelay !== 0) return;

        var gamepads = navigator.getGamepads();     // Just one poll per clock here then use it several times

        if (joystick0) {
            if (joystick0.update(gamepads)) {
                if (joystick0.hasMoved())
                    update(joystick0, joy0State, joy0Prefs, !swappedMode);
            } else {
                joystick0 = null;
                joystickConnectionMessage(true, false);
            }
        } else {
            if (gamepadsDetectionDelay === 0) {
                joystick0 = detectNewJoystick(joy0Prefs, joy1Prefs, gamepads);
                if (joystick0) joystickConnectionMessage(true, true);
            }
        }

        if (joystick1) {
            if (joystick1.update(gamepads)) {
                if (joystick1.hasMoved())
                    update(joystick1, joy1State, joy1Prefs, swappedMode);
            } else {
                joystick1 = null;
                joystickConnectionMessage(false, false);
            }
        } else {
            if (gamepadsDetectionDelay === 0) {
                joystick1 = detectNewJoystick(joy1Prefs, joy0Prefs, gamepads);
                if (joystick1) joystickConnectionMessage(false, true);
            }
        }
    };

    var joystickConnectionMessage = function (joy0, conn) {
        screen.getMonitor().showOSD((joy0 ^ p1ControlsMode ^ swappedMode ? "P1" : "P2") + " Gamepad " + (conn ? "connected" : "disconnected"), joy0);
    };

    var detectNewJoystick = function(prefs, notPrefs, gamepads) {
        if (!gamepads || gamepads.length === 0) return;
        // Fixed index detection. Also allow the same gamepad to control both  players
        if (prefs.device >= 0)   // pref.device == -1 means "auto"
            return gamepads[prefs.device] ? new Joystick(prefs.device, prefs) : null;
        // Auto detection
        for (var i = 0, len = gamepads.length; i < len; i++)
            if (gamepads[i])
                if (i !== notPrefs.device && (!joystick0 || joystick0.index !== i) && (!joystick1 || joystick1.index !== i))
                    // New Joystick found!
                    return new Joystick(i, prefs);
    };

    var initStates = function() {
        joy0State = newControllerState();
        joy1State = newControllerState();
    };

    var update = function(joystick, joyState, joyPrefs, player0) {
        // Paddle Analog
        if (paddleMode && joyPrefs.paddleSens !== 0) {
            var newPosition = joystick.getPaddlePosition();
            if (newPosition !== joyState.xPosition) {
                joyState.xPosition = newPosition;
                consoleControlsSocket.controlValueChanged(player0 ^ p1ControlsMode ? controls.PADDLE0_POSITION : controls.PADDLE1_POSITION, newPosition);
            }
        }
        // Joystick direction (Analog or POV) and Paddle Digital (Analog or POV)
        var newDirection = joystick.getDPadDirection();
        if (newDirection === -1 && (!paddleMode || joyPrefs.paddleSens === 0))
            newDirection = joystick.getStickDirection();
        if (newDirection !== joyState.direction) {
            var newUP = newDirection === 7 || newDirection === 0 || newDirection == 1;
            var newRIGHT = newDirection === 1 || newDirection === 2 || newDirection === 3;
            var newDOWN = newDirection === 3 || newDirection === 4 || newDirection === 5;
            var newLEFT = newDirection === 5 || newDirection === 6 || newDirection === 7;
            if (player0) {
                domControls.processKeyEvent(Javatari.preferences.KP0UP, newUP, 0);
                domControls.processKeyEvent(Javatari.preferences.KP0RIGHT, newRIGHT, 0);
                domControls.processKeyEvent(Javatari.preferences.KP0DOWN, newDOWN, 0);
                domControls.processKeyEvent(Javatari.preferences.KP0LEFT, newLEFT, 0);
            } else {
                domControls.processKeyEvent(Javatari.preferences.KP1UP, newUP, 0);
                domControls.processKeyEvent(Javatari.preferences.KP1RIGHT, newRIGHT, 0);
                domControls.processKeyEvent(Javatari.preferences.KP1DOWN, newDOWN, 0);
                domControls.processKeyEvent(Javatari.preferences.KP1LEFT, newLEFT, 0);
            }
            joyState.direction = newDirection;
        }
        // Joystick button
        if (joyButtonDetection === joystick) {
            detectButton();
            return;
        } else {
            var newButton = joystick.getButtonDigital(joyPrefs.button) || joystick.getButtonDigital(joyPrefs.button2);
            if (newButton !== joyState.button) {
                domControls.processKeyEvent(player0 ? Javatari.preferences.KP0BUT : Javatari.preferences.KP1BUT, newButton, 0);
                joyState.button = newButton;
            }
        }
        // Other Console controls
        var newSelect = joystick.getButtonDigital(joyPrefs.select);
        if (newSelect !== joyState.select) {
            domControls.processKeyEvent(jt.DOMConsoleControls.KEY_SELECT, newSelect, 0);
            joyState.select = newSelect;
        }
        var newReset = joystick.getButtonDigital(joyPrefs.reset);
        if (newReset !== joyState.reset) {
            domControls.processKeyEvent(jt.DOMConsoleControls.KEY_RESET, newReset, 0);
            joyState.reset = newReset;
        }
        var newPause = joystick.getButtonDigital(joyPrefs.pause);
        if (newPause !== joyState.pause) {
            domControls.processKeyEvent(jt.DOMConsoleControls.KEY_PAUSE, newPause, jt.DOMConsoleControls.KEY_ALT_MASK);
            joyState.pause = newPause;
        }
        var newFastSpeed = joystick.getButtonDigital(joyPrefs.fastSpeed);
        if (newFastSpeed !== joyState.fastSpeed) {
            domControls.processKeyEvent(jt.DOMConsoleControls.KEY_FAST_SPEED, newFastSpeed, 0);
            joyState.fastSpeed = newFastSpeed;
        }
    };

    var newControllerState = function() {
        return {
            direction: -1,         // CENTER
            button: false, select: false, reset: false, fastSpeed: false, pause: false,
            xPosition: -1          // PADDLE POSITION
        }
    };

    var detectButton = function() {
    };

    this.applyPreferences = function() {
        joy0Prefs = {
            device         : Javatari.preferences.JP0DEVICE,
            xAxis          : Javatari.preferences.JP0XAXIS,
            xAxisSig       : Javatari.preferences.JP0XAXISSIG,
            yAxis          : Javatari.preferences.JP0YAXIS,
            yAxisSig       : Javatari.preferences.JP0YAXISSIG,
            paddleAxis     : Javatari.preferences.JP0PAXIS,
            paddleAxisSig  : Javatari.preferences.JP0PAXISSIG,
            button         : Javatari.preferences.JP0BUT,
            button2        : Javatari.preferences.JP0BUT2,
            select         : Javatari.preferences.JP0SELECT,
            reset          : Javatari.preferences.JP0RESET,
            pause          : Javatari.preferences.JP0PAUSE,
            fastSpeed      : Javatari.preferences.JP0FAST,
            paddleCenter   : Javatari.preferences.JP0PCENTER * -190 + 190 - 5,
            paddleSens     : Javatari.preferences.JP0PSENS * -190,
            deadzone       : Javatari.preferences.JP0DEADZONE
        };
        joy1Prefs = {
            device         : Javatari.preferences.JP1DEVICE,
            xAxis          : Javatari.preferences.JP1XAXIS,
            xAxisSig       : Javatari.preferences.JP1XAXISSIG,
            yAxis          : Javatari.preferences.JP1YAXIS,
            yAxisSig       : Javatari.preferences.JP1YAXISSIG,
            paddleAxis     : Javatari.preferences.JP1PAXIS,
            paddleAxisSig  : Javatari.preferences.JP1PAXISSIG,
            button         : Javatari.preferences.JP1BUT,
            button2        : Javatari.preferences.JP1BUT2,
            select         : Javatari.preferences.JP1SELECT,
            reset          : Javatari.preferences.JP1RESET,
            pause          : Javatari.preferences.JP1PAUSE,
            fastSpeed      : Javatari.preferences.JP1FAST,
            paddleCenter   : Javatari.preferences.JP1PCENTER * -190 + 190 - 5,
            paddleSens     : Javatari.preferences.JP1PSENS * -190,
            deadzone       : Javatari.preferences.JP1DEADZONE
        };
    };


    var supported = false;
    var gamepadsDetectionDelay = -1;

    var controls = jt.ConsoleControls;
    var consoleControlsSocket;
    var screen;

    var paddleMode = false;
    var swappedMode = false;
    var p1ControlsMode = false;

    var joystick0;
    var joystick1;
    var joy0State;
    var joy1State;
    var joy0Prefs;
    var joy1Prefs;

    var joyButtonDetection = null;


    function Joystick(index, prefs) {

        this.index = index;

        this.update = function(gamepads) {
            gamepad = gamepads[index];
            return !!gamepad;
        };

        this.hasMoved = function() {
            var newTime = gamepad.timestamp;
            if (newTime) {
                if (newTime > lastTimestamp) {
                    lastTimestamp = newTime;
                    return true;
                } else
                    return false;
            } else
                return true;        // Always true if the timestamp property is not supported
        };

        this.getButtonDigital = function(butIndex) {
            var b = gamepad.buttons[butIndex];
            if (typeof(b) === "object") return b.pressed || b.value > 0.5;
            else return b > 0.5;
        };

        this.getDPadDirection = function() {
            if (this.getButtonDigital(12)) {
                if (this.getButtonDigital(15)) return 1;                // NORTHEAST
                else if (this.getButtonDigital(14)) return 7;           // NORTHWEST
                else return 0;                                          // NORTH
            } else if (this.getButtonDigital(13)) {
                if (this.getButtonDigital(15)) return 3;                // SOUTHEAST
                else if (this.getButtonDigital(14)) return 5;           // SOUTHWEST
                else return 4;                                          // SOUTH
            } else if (this.getButtonDigital(14)) return 6;             // WEST
            else if (this.getButtonDigital(15)) return 2;               // EAST
            else return -1;                                             // CENTER
        };

        this.getStickDirection = function() {
            var x = gamepad.axes[xAxis];
            var y = gamepad.axes[yAxis];
            if ((x < 0 ? -x : x) < deadzone) x = 0; else x *= xAxisSig;
            if ((y < 0 ? -y : y) < deadzone) y = 0; else y *= yAxisSig;
            if (x === 0 && y === 0) return -1;
            var dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1/16; if (dir >= 1) dir -= 1;
            return (dir * 8) | 0;
        };

        this.getPaddlePosition = function() {
            var pos = (gamepad.axes[paddleAxis] * paddleAxisSig * paddleSens + paddleCenter) | 0;
            if (pos < 0) pos = 0;
            else if (pos > 380) pos = 380;
            return pos;
        };

        var gamepad;

        var xAxis = prefs.xAxis;
        var yAxis = prefs.yAxis;
        var xAxisSig = prefs.xAxisSig;
        var yAxisSig = prefs.yAxisSig;
        var deadzone = prefs.deadzone;
        var paddleAxis = prefs.paddleAxis;
        var paddleAxisSig = prefs.paddleAxisSig;
        var paddleSens = prefs.paddleSens;
        var paddleCenter = prefs.paddleCenter;

        var lastTimestamp = Number.MIN_VALUE;

    }

};


