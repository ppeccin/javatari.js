// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.GamepadConsoleControls = function(consoleControls) {
"use strict";

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
        resetStates();
    };

    this.powerOff = function() {
        supported = false;
    };

    this.toggleMode = function() {
        if (!supported) {
            screen.showOSD("Joysticks unavailable (not supported by browser)", true, true);
            return;
        }
        ++mode; if (mode > 0) mode = -2;

        if (mode === -2) {
            joystick0 = joystick1 = null;
        } else if (mode === -1) {
            gamepadsDetectionDelay = 60;
            this.controlsClockPulse();
        }

        swappedMode = mode === 0;
        this.applyPreferences();
        resetStates();

        screen.showOSD("Gamepads " + this.getModeDesc(), true);
    };

    this.setPaddleMode = function(state) {
        if (!supported) return;
        paddleMode = state;
        joy0State.xPosition = joy1State.xPosition = -1;
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
        this.applyPreferences();
    };

    this.controlsClockPulse = function() {
        if (!supported || mode === -2) return;

        // Try to avoid polling at gamepads if none are present, as it may be expensive
        // Only try to detect connected gamepads once each 60 clocks (frames)
        if (++gamepadsDetectionDelay >= 60) gamepadsDetectionDelay = 0;
        if (!joystick0 && !joystick1 && gamepadsDetectionDelay !== 0) return;

        var gamepads = navigator.getGamepads();     // Just one poll per clock here then use it several times

        if (joystick0) {
            if (joystick0.update(gamepads)) {
                if (joystick0.hasMoved())
                    update(joystick0, joy0State, joy0Prefs, joy0Keys);
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
                    update(joystick1, joy1State, joy1Prefs, joy1Keys);
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
        screen.showOSD((joy0 ^ p1ControlsMode ^ swappedMode ? "P1" : "P2") + " Gamepad " + (conn ? "connected" : "disconnected"), joy0);
    };

    var detectNewJoystick = function(prefs, notPrefs, gamepads) {
        if (!gamepads || gamepads.length === 0) return;
        // Fixed index detection. Also allow the same gamepad to control both players
        var device = prefs.device;
        if (device >= 0)   // pref.device == -1 means "auto"
            return gamepads[device] && gamepads[device].buttons.length > 0 ? new Joystick(device, prefs) : null;
        // Auto detection
        for (var i = 0, len = gamepads.length; i < len; i++)
            if (gamepads[i] && gamepads[i].buttons.length > 0)
                if (i !== notPrefs.device && (!joystick0 || joystick0.index !== i) && (!joystick1 || joystick1.index !== i))
                    // New Joystick found!
                    return new Joystick(i, prefs);
    };

    var resetStates = function() {
        joy0State = newControllerState();
        joy1State = newControllerState();
    };

    var update = function (joystick, joyState, joyPrefs, joyKeys) {
        // Paddle Analog
        if (paddleMode && joyPrefs.paddleSens !== 0) {
            var newPosition = joystick.getPaddlePosition();
            if (newPosition !== joyState.xPosition) {
                joyState.xPosition = newPosition;
                consoleControls.processControlValue(joyPrefs.player ? controls.PADDLE1_POSITION : controls.PADDLE0_POSITION, newPosition);
            }
        }
        // Joystick direction (Analog or POV) and Paddle Digital (Analog or POV)
        var newDirection = joystick.getDPadDirection();
        if (newDirection === -1 && (!paddleMode || joyPrefs.paddleSens === 0))
            newDirection = joystick.getStickDirection();
        if (newDirection !== joyState.direction) {
            var newUp = false, newRight = false, newDown = false, newLeft = false;
            switch (newDirection) {
                case 0: newUp = true; break;
                case 1: newUp = newRight = true; break;
                case 2: newRight = true; break;
                case 3: newDown = newRight = true; break;
                case 4: newDown = true; break;
                case 5: newDown = newLeft = true; break;
                case 6: newLeft = true; break;
                case 7: newUp = newLeft = true; break;
            }
            consoleControls.processKey(joyKeys.up.c, newUp);
            consoleControls.processKey(joyKeys.right.c, newRight);
            consoleControls.processKey(joyKeys.down.c, newDown);
            consoleControls.processKey(joyKeys.left.c, newLeft);
            joyState.direction = newDirection;
        }
        // Joystick Normal Button
        var newButton = joystick.getButtonDigital(joyPrefs.button);
        if (newButton !== joyState.button) {
            consoleControls.processKey(joyKeys.button.c, newButton);
            joyState.button = newButton;
        }
        // Joystick Turbo Button
        newButton = joystick.getButtonDigital(joyPrefs.buttonT);
        if (newButton !== joyState.buttonT) {
            consoleControls.processKey(joyKeys.buttonT.c, newButton);
            joyState.buttonT = newButton;
        }
        // Other Console controls
        var newSelect = joystick.getButtonDigital(joyPrefs.select);
        if (newSelect !== joyState.select) {
            consoleControls.processControlState(controls.SELECT, newSelect);
            joyState.select = newSelect;
        }
        var newReset = joystick.getButtonDigital(joyPrefs.reset);
        if (newReset !== joyState.reset) {
            consoleControls.processControlState(controls.RESET, newReset);
            joyState.reset = newReset;
        }
        var newPause = joystick.getButtonDigital(joyPrefs.pause);
        if (newPause !== joyState.pause) {
            consoleControls.processControlState(controls.PAUSE, newPause);
            joyState.pause = newPause;
        }
        var newFastSpeed = joystick.getButtonDigital(joyPrefs.fastSpeed);
        if (newFastSpeed !== joyState.fastSpeed) {
            consoleControls.processControlState(controls.FAST_SPEED, newFastSpeed);
            joyState.fastSpeed = newFastSpeed;
        }
        var newSlowSpeed = joystick.getButtonDigital(joyPrefs.slowSpeed);
        if (newSlowSpeed !== joyState.slowSpeed) {
            consoleControls.processControlState(controls.SLOW_SPEED, newSlowSpeed);
            joyState.slowSpeed = newSlowSpeed;
        }
    };

    var newControllerState = function() {
        return {
            direction: -1,         // CENTER
            button: false, buttonT: false, select: false, reset: false, fastSpeed: false, pause: false,
            xPosition: -1          // PADDLE POSITION
        }
    };

    this.getModeDesc = function() {
        switch (mode) {
            case -1: return "AUTO";
            case 0:  return "AUTO (swapped)";
            default: return !supported ? "NOT SUPPORTED" : "DISABLED";
        }
    };

    this.applyPreferences = function() {
        var p0 = swappedMode ? 1 : 0;
        var p1 = p0 ? 0 : 1;
        joy0Prefs = prefs.joystickGamepads[p0];
        joy0Prefs.player = p1ControlsMode ^ swappedMode? 1 : 0;
        joy1Prefs = prefs.joystickGamepads[p1];
        joy1Prefs.player = p1ControlsMode ^ swappedMode ? 0 : 1;
        joy0Keys = prefs.joystickKeys[p0];
        joy1Keys = prefs.joystickKeys[p1];
    };


    var supported = false;
    var gamepadsDetectionDelay = -1;

    var controls = jt.ConsoleControls;
    var consoleControlsSocket;
    var screen;

    var mode = -1;
    var paddleMode = false;
    var swappedMode = false;
    var p1ControlsMode = false;

    var joystick0;
    var joystick1;
    var joy0State;
    var joy1State;
    var joy0Prefs;
    var joy1Prefs;
    var joy0Keys;
    var joy1Keys;

    var joyButtonDetection = null;

    var prefs = Javatari.userPreferences.current;


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
        var paddleAxis = prefs.paddleAxis;
        var paddleAxisSig = prefs.paddleAxisSig;
        var paddleSens = prefs.paddleSens * -190;
        var paddleCenter = prefs.paddleCenter * -190 + 190 - 5;
        var deadzone = prefs.deadzone;

        var lastTimestamp = Number.MIN_VALUE;

    }

};


