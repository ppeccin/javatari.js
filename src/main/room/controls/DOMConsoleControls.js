// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.DOMConsoleControls = function(room, keyForwardControls) {
"use strict";

    var self = this;

    function init() {
        gamepadControls = new jt.GamepadConsoleControls(self);
        touchControls = new jt.DOMTouchControls(self);
        self.applyPreferences();
    }

    this.connect = function(pControlsSocket) {
        consoleControlsSocket = pControlsSocket;
        consoleControlsSocket.connectControls(this);
        gamepadControls.connect(pControlsSocket);
        touchControls.connect(pControlsSocket);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
        gamepadControls.connectScreen(pScreen);
        touchControls.connectScreen(pScreen);
    };

    this.addKeyInputElement = function(element) {
        element.addEventListener("keydown", this.keyDown);
        element.addEventListener("keyup", this.keyUp);
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        touchControls.setupTouchControlsIfNeeded(mainElement)
    };

    this.powerOn = function() {
        preventIEHelp();
        gamepadControls.powerOn();
        touchControls.powerOn();
        if (PADDLES_MODE === 0) setPaddleMode(false, false);
        else if (PADDLES_MODE === 1) setPaddleMode(true, false);
    };

    this.powerOff = function() {
        setPaddleMode(false, false);
        gamepadControls.powerOff();
        touchControls.powerOff();
    };

    this.releaseControllers = function() {
        for (var c in keyStateMap) if (keyStateMap[c]) {
            processControlState(c, false);
            keyStateMap[c] = false;
        }
        paddle0MovingLeft = paddle0MovingRight = paddle1MovingLeft = paddle1MovingRight = false;
        turboControlState[controls.JOY0_BUTTON] = turboControlState[controls.JOY1_BUTTON] = false;
        touchControls.releaseControllers();
    };

    this.getTouchControls = function() {
        return touchControls;
    };

    this.toggleP1ControlsMode = function() {
        this.setP1ControlsMode(!p1ControlsMode);
        showModeOSD();
        fireModeStateUpdate();
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
        gamepadControls.setP1ControlsMode(state);
        touchControls.setP1ControlsMode(state);
        this.releaseControllers();
        initKeys();
    };

    this.isP1ControlsMode = function() {
        return p1ControlsMode;
    };

    this.togglePaddleMode = function() {
        setPaddleMode(!paddleMode, true);
        fireModeStateUpdate();
    };

    this.isPaddleMode = function() {
        return paddleMode;
    };

    this.setP1ControlsAndPaddleMode = function(p1, paddle) {
        this.setP1ControlsMode(p1);
        setPaddleMode(paddle, false);
        fireModeStateUpdate();
    };

    this.toggleGamepadMode = function() {
        gamepadControls.toggleMode();
        fireModeStateUpdate();
    };

    this.getGamepadModeDesc = function() {
        return gamepadControls.getModeDesc();
    };

    this.toggleTouchControlsMode = function() {
        touchControls.toggleMode();
        fireModeStateUpdate();
    };

    this.toggleTouchDirBig = function() {
        touchControls.toggleTouchDirBig();
    };

    this.toggleTurboFireSpeed = function() {
        setTurboFireSpeed((turboFireSpeed + 1) % 11);
        screen.showOSD("Turbo Fire" + (turboFireSpeed ? " speed: " + this.getTurboFireSpeedDesc() : ": OFF"), true);

        // Persist
        prefs.turboFireSpeed = turboFireSpeed;
        Javatari.userPreferences.setDirty();
        Javatari.userPreferences.save();
    };

    function setTurboFireSpeed(speed) {
        turboFireSpeed = speed;
        turboFireClocks = turboFireSpeed ? (60 / turboFirePerSecond[turboFireSpeed]) | 0 : 0;
        turboFireFlipClock = (turboFireClocks / 2) | 0;
        turboFireClockCount = 0;
    }

    this.getTurboFireSpeedDesc = function() {
        return turboFireSpeed ? turboFireSpeed + "x" : "OFF";
    };

    this.getControlReport = function(control) {
        switch (control) {
            case jt.PeripheralControls.P1_CONTROLS_TOGGLE:
                return { label: p1ControlsMode ? "ON" : "OFF", active: p1ControlsMode };
            case jt.PeripheralControls.PADDLES_TOGGLE_MODE:
                return { label: paddleMode ? "ON" : "OFF", active: paddleMode };
            case jt.PeripheralControls.TOUCH_TOGGLE_DIR_BIG:
                return { label: touchControls.isDirBig() ? "ON" : "OFF", active: touchControls.isDirBig() };
            case jt.PeripheralControls.HAPTIC_FEEDBACK_TOGGLE_MODE:
                return { label: hapticFeedbackEnabled ? "ON" : "OFF", active: !!hapticFeedbackEnabled };
            case jt.PeripheralControls.TURBO_FIRE_TOGGLE:
                return { label: this.getTurboFireSpeedDesc(), active: !!turboFireSpeed };
        }
        return { label: "Unknown", active: false };
    };

    this.consolePowerAndUserPauseStateUpdate = function(power, paused) {
        touchControls.consolePowerAndUserPauseStateUpdate(power, paused);
    };

    this.keyDown = function(e) {
        return processKeyEvent(e, true);
    };

    this.keyUp = function(e) {
        return processKeyEvent(e, false);
    };

    this.controlsClockPulse = function() {
        // Turbo fire
        if (turboFireClocks) {
            --turboFireClockCount;
            // State flipped?
            if (turboFireClockCount === turboFireFlipClock || turboFireClockCount === 0) {
                var state = turboFireClockCount > 0;
                if (turboControlState[controls.JOY0_BUTTON]) processControlState(controls.JOY0_BUTTON, state);
                if (turboControlState[controls.JOY1_BUTTON]) processControlState(controls.JOY1_BUTTON, state);
            }
            if (turboFireClockCount <= 0) turboFireClockCount = turboFireClocks;        // restart cycle
        }

        gamepadControls.controlsClockPulse();

        // Update paddles position as time passes
        if (paddleMode) {
            if (paddle0MovingRight) {
                if (!paddle0MovingLeft) {
                    paddle0Position -= paddle0Speed;
                    if (paddle0Position < 0) paddle0Position = 0;
                    processControlValue(controls.PADDLE0_POSITION, paddle0Position);
                }
            } else if (paddle0MovingLeft) {
                paddle0Position += paddle0Speed;
                if (paddle0Position > 380) paddle0Position = 380;
                processControlValue(controls.PADDLE0_POSITION, paddle0Position);
            }
            if (paddle1MovingRight) {
                if (!paddle1MovingLeft) {
                    paddle1Position -= paddle1Speed;
                    if (paddle1Position < 0) paddle1Position = 0;
                    processControlValue(controls.PADDLE1_POSITION, paddle1Position);
                }
            } else if (paddle1MovingLeft) {
                paddle1Position += paddle1Speed;
                if (paddle1Position > 380) paddle1Position = 380;
                processControlValue(controls.PADDLE1_POSITION, paddle1Position);
            }
        }
    };

    this.toggleHapticFeedback = function() {
        if (hapticFeedbackCapable) {
            hapticFeedbackEnabled = !hapticFeedbackEnabled;
            prefs.hapticFeedback = hapticFeedbackEnabled;
            Javatari.userPreferences.setDirty();
        } else
            screen.showOSD("Haptic Feedback not available", true, true);
    };

    this.hapticFeedback = function() {
        if (hapticFeedbackEnabled) navigator.vibrate(8);
    };

    this.hapticFeedbackOnTouch = function(e) {
        if (hapticFeedbackEnabled && (e.type === "touchstart" || e.type === "touchend" || e.type === "touchmove")) navigator.vibrate(8);
    };

    this.cartridgeInserted = function(cartridge) {
        if (!cartridge || PADDLES_MODE >= 0) return;	// Does not interfere if Paddle Mode is forced
        var usePaddles = cartridge.rom.info.p === 1;
        if (paddleMode !== usePaddles) setPaddleMode(usePaddles, false);
    };

    function processKeyEvent(e, press) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        var code = jt.DOMKeys.codeForKeyboardEvent(e);
        self.processKey(code, press);

        return false;
    }

    this.processKey = function(code, press) {
        // Check Turbo Fire buttons
        var control = turboKeyCodeMap[code];
        if (control) {
            if (press === turboControlState[control]) return;
            if (press) turboFireClockCount = turboFireFlipClock;                    // Ensure correct timing for press/release cycle (TODO affects both controllers!)
            turboControlState[control] = press;
        } else {
            // Normal controls
            control = keyCodeMap[code];
            if (!control) return keyForwardControls.processKey(code, press);        // Next in chain
            if (press === keyStateMap[control]) return;
            keyStateMap[control] = press;
        }
        processControlState(control, press);
    };

    this.applyPreferences = function() {
        initKeys();
        setTurboFireSpeed(prefs.turboFireSpeed);
        touchControls.applyPreferences();
        gamepadControls.applyPreferences();
    };

    function processControlState(control, press) {
        // Paddles first
        if (paddleMode) {
            control = translatePaddleModeButtons(control);
            if (tryPaddleControl(control, press)) return;
        }

        // Then other controls
        if (room.netController)
            room.netController.processLocalControlState(control, press);
        else
            consoleControlsSocket.controlStateChanged(control, press);
    }
    this.processControlState = processControlState;

    function processControlValue(control, value) {
        if (room.netController)
            room.netController.processLocalControlValue(control, value);
        else
            consoleControlsSocket.controlValueChanged(control, value);
    }
    this.processControlValue = processControlValue;

    var preventIEHelp = function() {
        window.onhelp = function () {
            return false;
        };
    };

    var translatePaddleModeButtons = function(control) {
        switch (control) {
            case controls.JOY0_BUTTON: return controls.PADDLE0_BUTTON;
            case controls.JOY1_BUTTON: return controls.PADDLE1_BUTTON;
            default: return control;
        }
    };

    var tryPaddleControl = function(control, press) {
        if (press) {
            switch(control) {
                case controls.JOY0_LEFT:
                    paddle0MovingLeft = true; return true;
                case controls.JOY0_RIGHT:
                    paddle0MovingRight = true; return true;
                case controls.JOY0_UP:
                    if (paddle0Speed < 10) paddle0Speed++;
                    screen.showOSD("P1 Paddle speed: " + paddle0Speed, true);
                    return true;
                case controls.JOY0_DOWN:
                    if (paddle0Speed > 1) paddle0Speed--;
                    screen.showOSD("P1 Paddle speed: " + paddle0Speed, true);
                    return true;
                case controls.JOY1_LEFT:
                    paddle1MovingLeft = true; return true;
                case controls.JOY1_RIGHT:
                    paddle1MovingRight = true; return true;
                case controls.JOY1_UP:
                    if (paddle1Speed < 10) paddle1Speed++;
                    screen.showOSD("P2 Paddle speed: " + paddle1Speed, true);
                    return true;
                case controls.JOY1_DOWN:
                    if (paddle1Speed > 1) paddle1Speed--;
                    screen.showOSD("P2 Paddle speed: " + paddle1Speed, true);
                    return true;
            }
        } else {
            switch(control) {
                case controls.JOY0_LEFT:
                    paddle0MovingLeft = false; return true;
                case controls.JOY0_RIGHT:
                    paddle0MovingRight = false; return true;
                case controls.JOY1_LEFT:
                    paddle1MovingLeft = false; return true;
                case controls.JOY1_RIGHT:
                    paddle1MovingRight = false; return true;
            }
        }
        return false;
    };

    var setPaddleMode = function(mode, showOSD) {
        if (paddleMode !== mode) self.releaseControllers();
        paddleMode = mode;
        paddle0Speed = paddle1Speed = 2;
        paddle0Position = paddle1Position = (paddleMode ? 190 : -1);	// -1 = disconnected, won't charge POTs
        // Only send Paddles connection reset when not in NetPlay Client mode
        if (room.netPlayMode !== 2) {
            processControlValue(controls.PADDLE0_POSITION, paddle0Position);
            processControlValue(controls.PADDLE1_POSITION, paddle1Position);
        }
        gamepadControls.setPaddleMode(paddleMode);
        if (showOSD) showModeOSD();
    };

    var showModeOSD = function() {
        screen.showOSD("Controllers: " + (paddleMode ? "Paddles" : "Joysticks") + (p1ControlsMode ? ", Swapped" : ""), true);
    };

    function fireModeStateUpdate() {
        screen.controlsModeStateUpdate();
    }

    var initKeys = function() {
        var k = jt.DOMKeys;

        keyCodeMap = {};
        keyStateMap = {};
        turboKeyCodeMap = {};

        // Fixed keys

        keyCodeMap[KEY_POWER]                   = controls.POWER;
        keyCodeMap[KEY_POWER | k.ALT]           = controls.POWER;

        keyCodeMap[KEY_POWER | k.SHIFT]         = controls.POWER_FRY;
        keyCodeMap[KEY_POWER | k.SHIFT | k.ALT] = controls.POWER_FRY;

        keyCodeMap[KEY_BW]                      = controls.BLACK_WHITE;
        keyCodeMap[KEY_BW | k.ALT]              = controls.BLACK_WHITE;

        keyCodeMap[KEY_SELECT]                  = controls.SELECT;
        keyCodeMap[KEY_SELECT | k.ALT]          = controls.SELECT;

        keyCodeMap[KEY_RESET]                   = controls.RESET;
        keyCodeMap[KEY_RESET | k.ALT]           = controls.RESET;

        keyCodeMap[KEY_DIFF_0]                  = controls.DIFFICULTY0;
        keyCodeMap[KEY_DIFF_0 | k.ALT]          = controls.DIFFICULTY0;

        keyCodeMap[KEY_DIFF_1]                  = controls.DIFFICULTY1;
        keyCodeMap[KEY_DIFF_1 | k.ALT]          = controls.DIFFICULTY1;

        keyCodeMap[KEY_SPEED]                   = controls.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.ALT]           = controls.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT]         = controls.SLOW_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT | k.ALT] = controls.SLOW_SPEED;

        keyCodeMap[KEY_INC_SPEED | k.SHIFT | k.ALT]    = controls.INC_SPEED;
        keyCodeMap[KEY_DEC_SPEED | k.SHIFT | k.ALT]    = controls.DEC_SPEED;
        keyCodeMap[KEY_NORMAL_SPEED | k.SHIFT | k.ALT] = controls.NORMAL_SPEED;
        keyCodeMap[KEY_MIN_SPEED | k.SHIFT | k.ALT]    = controls.MIN_SPEED;

        keyCodeMap[KEY_PAUSE | k.ALT]           = controls.PAUSE;
        keyCodeMap[KEY_PAUSE | k.SHIFT | k.ALT] = controls.PAUSE_AUDIO_ON;
        keyCodeMap[KEY_FRAME | k.ALT]           = controls.FRAME;
        keyCodeMap[KEY_FRAMEa | k.ALT]          = controls.FRAME;
        keyCodeMap[KEY_TRACE | k.ALT]           = controls.TRACE;
        keyCodeMap[KEY_INFO | k.ALT]            = controls.SHOW_INFO;
        keyCodeMap[KEY_DEBUG | k.ALT]           = controls.DEBUG;
        keyCodeMap[KEY_NO_COLLISIONS | k.ALT]   = controls.NO_COLLISIONS;
        keyCodeMap[KEY_VIDEO_STANDARD | k.ALT]  = controls.VIDEO_STANDARD;
        keyCodeMap[KEY_VIDEO_STANDARD2 | k.ALT] = controls.VIDEO_STANDARD;
        keyCodeMap[KEY_VSYNCH | k.ALT]          = controls.VSYNCH;

        keyCodeMap[KEY_STATE_0 | k.CONTROL]           = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.CONTROL]          = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.CONTROL | k.ALT]  = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.CONTROL]           = controls.SAVE_STATE_1;
        keyCodeMap[KEY_STATE_1 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.CONTROL]           = controls.SAVE_STATE_2;
        keyCodeMap[KEY_STATE_2 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.CONTROL]           = controls.SAVE_STATE_3;
        keyCodeMap[KEY_STATE_3 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.CONTROL]           = controls.SAVE_STATE_4;
        keyCodeMap[KEY_STATE_4 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.CONTROL]           = controls.SAVE_STATE_5;
        keyCodeMap[KEY_STATE_5 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.CONTROL]           = controls.SAVE_STATE_6;
        keyCodeMap[KEY_STATE_6 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.CONTROL]           = controls.SAVE_STATE_7;
        keyCodeMap[KEY_STATE_7 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.CONTROL]           = controls.SAVE_STATE_8;
        keyCodeMap[KEY_STATE_8 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.CONTROL]           = controls.SAVE_STATE_9;
        keyCodeMap[KEY_STATE_9 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.CONTROL]          = controls.SAVE_STATE_10;
        keyCodeMap[KEY_STATE_10 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.CONTROL]          = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.CONTROL]         = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_11 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.CONTROL | k.ALT] = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.CONTROL]          = controls.SAVE_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.CONTROL]         = controls.SAVE_STATE_12;
        keyCodeMap[KEY_STATE_12 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.CONTROL | k.ALT] = controls.SAVE_STATE_12;

        keyCodeMap[KEY_STATE_0 | k.ALT]   = controls.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.ALT]  = controls.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.ALT]   = controls.LOAD_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.ALT]   = controls.LOAD_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.ALT]   = controls.LOAD_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.ALT]   = controls.LOAD_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.ALT]   = controls.LOAD_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.ALT]   = controls.LOAD_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.ALT]   = controls.LOAD_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.ALT]   = controls.LOAD_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.ALT]   = controls.LOAD_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.ALT]  = controls.LOAD_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.ALT]  = controls.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.ALT] = controls.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.ALT]  = controls.LOAD_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.ALT] = controls.LOAD_STATE_12;

        // Configurable in preferences

        var a = p1ControlsMode ? 1 : 0;
        var b = p1ControlsMode ? 0 : 1;

        keyCodeMap[prefs.joystickKeys[a].left.c] = controls.JOY0_LEFT;
        keyCodeMap[prefs.joystickKeys[a].up.c] = controls.JOY0_UP;
        keyCodeMap[prefs.joystickKeys[a].right.c] = controls.JOY0_RIGHT;
        keyCodeMap[prefs.joystickKeys[a].down.c] = controls.JOY0_DOWN;
        keyCodeMap[prefs.joystickKeys[a].button.c] = controls.JOY0_BUTTON;
        keyCodeMap[prefs.joystickKeys[b].left.c] = controls.JOY1_LEFT;
        keyCodeMap[prefs.joystickKeys[b].up.c] = controls.JOY1_UP;
        keyCodeMap[prefs.joystickKeys[b].right.c] = controls.JOY1_RIGHT;
        keyCodeMap[prefs.joystickKeys[b].down.c] = controls.JOY1_DOWN;
        keyCodeMap[prefs.joystickKeys[b].button.c] = controls.JOY1_BUTTON;

        turboKeyCodeMap[prefs.joystickKeys[a].buttonT.c] = controls.JOY0_BUTTON;
        turboKeyCodeMap[prefs.joystickKeys[b].buttonT.c] = controls.JOY1_BUTTON;
    };


    var controls = jt.ConsoleControls;

    var consoleControlsSocket;
    var screen;

    var keyCodeMap;
    var keyStateMap;
    var turboKeyCodeMap;

    var turboControlState = {};

    var prefs = Javatari.userPreferences.current;

    var p1ControlsMode = false;
    var paddleMode = false;

    var hapticFeedbackCapable = !!navigator.vibrate;
    var hapticFeedbackEnabled = hapticFeedbackCapable && !!prefs.hapticFeedback;

    var turboFireSpeed = 0, turboFireClocks = 0, turboFireClockCount = 0, turboFireFlipClock = 0;
    var turboFirePerSecond = [ 0, 1, 2, 2.4, 3, 4, 5, 6, 7.5, 10, 12 ];

    var paddle0Position = 0;			// 380 = LEFT, 190 = MIDDLE, 0 = RIGHT
    var paddle0Speed = 3;				// 1 to 10
    var paddle0MovingLeft = false;
    var paddle0MovingRight = false;
    var paddle1Position = 0;
    var paddle1Speed = 3;
    var paddle1MovingLeft = false;
    var paddle1MovingRight = false;

    var gamepadControls;
    var touchControls;

    var PADDLES_MODE = Javatari.PADDLES_MODE;


    // Default Key Values

    var KEY_POWER            = jt.DOMKeys.VK_F1.c;
    var KEY_BW               = jt.DOMKeys.VK_F2.c;
    var KEY_SELECT           = jt.DOMKeys.VK_F11.c;
    var KEY_RESET            = jt.DOMKeys.VK_F12.c;

    var KEY_DIFF_0           = jt.DOMKeys.VK_F4.c;
    var KEY_DIFF_1           = jt.DOMKeys.VK_F9.c;

    var KEY_SPEED            = jt.DOMKeys.VK_TAB.c;

    var KEY_INC_SPEED        = jt.DOMKeys.VK_UP.c;
    var KEY_DEC_SPEED        = jt.DOMKeys.VK_DOWN.c;
    var KEY_NORMAL_SPEED     = jt.DOMKeys.VK_RIGHT.c;
    var KEY_MIN_SPEED        = jt.DOMKeys.VK_LEFT.c;

    var KEY_PAUSE            = jt.DOMKeys.VK_P.c;
    var KEY_FRAME            = jt.DOMKeys.VK_O.c;
    var KEY_FRAMEa           = jt.DOMKeys.VK_F.c;

    var KEY_DEBUG            = jt.DOMKeys.VK_D.c;
    var KEY_TRACE            = jt.DOMKeys.VK_VOID;
    var KEY_INFO             = jt.DOMKeys.VK_I.c;
    var KEY_NO_COLLISIONS    = jt.DOMKeys.VK_C.c;
    var KEY_VIDEO_STANDARD   = jt.DOMKeys.VK_V.c;
    var KEY_VIDEO_STANDARD2  = jt.DOMKeys.VK_Q.c;
    var KEY_VSYNCH           = jt.DOMKeys.VK_W.c;

    var KEY_STATE_0          = jt.DOMKeys.VK_QUOTE.c;
    var KEY_STATE_0a         = jt.DOMKeys.VK_BACKQUOTE.c;
    var KEY_STATE_1          = jt.DOMKeys.VK_1.c;
    var KEY_STATE_2          = jt.DOMKeys.VK_2.c;
    var KEY_STATE_3          = jt.DOMKeys.VK_3.c;
    var KEY_STATE_4          = jt.DOMKeys.VK_4.c;
    var KEY_STATE_5          = jt.DOMKeys.VK_5.c;
    var KEY_STATE_6          = jt.DOMKeys.VK_6.c;
    var KEY_STATE_7          = jt.DOMKeys.VK_7.c;
    var KEY_STATE_8          = jt.DOMKeys.VK_8.c;
    var KEY_STATE_9          = jt.DOMKeys.VK_9.c;
    var KEY_STATE_10         = jt.DOMKeys.VK_0.c;
    var KEY_STATE_11         = jt.DOMKeys.VK_MINUS.c;
    var KEY_STATE_11a        = jt.DOMKeys.VK_FF_MINUS.c;
    var KEY_STATE_12         = jt.DOMKeys.VK_EQUALS.c;
    var KEY_STATE_12a        = jt.DOMKeys.VK_FF_EQUALS.c;


    init();

    jt.DOMConsoleControls.hapticFeedback = this.hapticFeedback;
    jt.DOMConsoleControls.hapticFeedbackOnTouch = this.hapticFeedbackOnTouch;

};
