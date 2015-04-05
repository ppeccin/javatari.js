// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function GamepadConsoleControls(domControls) {

    this.connect = function(pConsoleControlsSocket) {
        consoleControlsSocket = pConsoleControlsSocket;
    };

    this.connectScreen = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        supported = !!navigator.getGamepads;
        if (!supported) return;
        initPreferences();
        start();
    };

    this.powerOff = function() {
        supported = false;
    };

    this.toggleMode = function() {
        if (!supported) return;
        if (!started) {
            swappedMode = false;
            start();
        } else
            swappedMode = !swappedMode;
        if (started) screen.getMonitor().showOSD("Joystick input " + (swappedMode ? "Swapped" : "Normal"), true);
        else if (devices.isEmpty()) screen.getMonitor().showOSD("No Joysticks detected!", true);
        else screen.getMonitor().showOSD("Joysticks are disabled! Open Settings", true);
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
        if (joystick0 && joystick0.update() && joystick0.hasMoved())
            update(joystick0, joy0State, joy0Prefs, !swappedMode);
        //else {
        //    joystick0 = null;
        //    videoMonitor.showOSD((p1ControlsMode ? "P2" : "P1") + " Joystick disconnected", true);
        //}
        if (joystick1 && joystick1.update() && joystick1.hasMoved())
            update(joystick1, joy1State, joy1Prefs, swappedMode);
        //else {
        //    joystick1 = null;
        //    videoMonitor.showOSD((p1ControlsMode ? "P1" : "P2") + " Joystick disconnected", true);
        //}
    };

    var start = function() {
        joy0State = newControllerState();
        joy1State = newControllerState();
        joystick0 = new Joystick(joy0Prefs.device === -1 ? 0 : joy0Prefs.device, joy0Prefs);
        joystick1 = new Joystick(joy1Prefs.device === -1 ? 1 : joy1Prefs.device, joy1Prefs);
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
        if (joyButtonDetection === joystick)
            detectButton();
        else {
            var newButton = joystick.getButtonDigital(joyPrefs.button) || joystick.getButtonDigital(joyPrefs.button2);
            if (newButton !== joyState.button) {
                domControls.processKeyEvent(player0 ? Javatari.preferences.KP0BUT : Javatari.preferences.KP1BUT, newButton, 0);
                joyState.button = newButton;
            }
        }
        // Other Console controls
        var newSelect = joystick.getButtonDigital(joyPrefs.select);
        if (newSelect !== joyState.select) {
            domControls.processKeyEvent(DOMConsoleControls.KEY_SELECT, newSelect, 0);
            joyState.select = newSelect;
        }
        var newReset = joystick.getButtonDigital(joyPrefs.reset);
        if (newReset !== joyState.reset) {
            domControls.processKeyEvent(DOMConsoleControls.KEY_RESET, newReset, 0);
            joyState.reset = newReset;
        }
        var newPause = joystick.getButtonDigital(joyPrefs.pause);
        if (newPause !== joyState.pause) {
            domControls.processKeyEvent(DOMConsoleControls.KEY_PAUSE, newPause, DOMConsoleControls.KEY_ALT_MASK);
            joyState.pause = newPause;
        }
        var newFastSpeed = joystick.getButtonDigital(joyPrefs.fastSpeed);
        if (newFastSpeed !== joyState.fastSpeed) {
            domControls.processKeyEvent(DOMConsoleControls.KEY_FAST_SPEED, newFastSpeed, 0);
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

    var initPreferences = function() {
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

    var controls = ConsoleControls;
    var consoleControlsSocket;
    var screen;

    var started = true;
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

        this.update = function(gamepads) {
            gamepad = (gamepads || navigator.getGamepads())[index];
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
            var x = gamepad.axes[prefs.xAxis];
            var y = gamepad.axes[prefs.yAxis];
            if ((x < 0 ? -x : x) < prefs.deadzone) x = 0; else x *= prefs.xAxisSig;
            if ((y < 0 ? -y : y) < prefs.deadzone) y = 0; else y *= prefs.yAxisSig;
            if (x === 0 && y === 0) return -1;
            var dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1/16; if (dir >= 1) dir -= 1;
            return (dir * 8) | 0;
        };

        this.getPaddlePosition = function() {
            var pos = (gamepad.axes[prefs.paddleAxis] * prefs.paddleAxisSig * prefs.paddleSens + prefs.paddleCenter) | 0;
            if (pos < 0) pos = 0;
            else if (pos > 380) pos = 380;
            return pos;
        };

        var gamepad;
        var lastTimestamp = Number.MIN_VALUE;

    }

}


