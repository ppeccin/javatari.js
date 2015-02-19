/**
 * Created by ppeccin on 04/01/2015.
 */

function DOMConsoleControls() {
    var self = this;

    function init() {
        //joystickControls = new JoystickConsoleControls(this);
        initKeys();
    }

    this.connect = function(pControlsSocket, pCartridgeSocket) {
        if (cartridgeSocket) cartridgeSocket.removeInsertionListener(this);
        cartridgeSocket = pCartridgeSocket;
        cartridgeSocket.addInsertionListener(this);
        consoleControlsSocket = pControlsSocket;
        consoleControlsSocket.connectControls(this);
        //joystickControls.connect(controlsSocket);
    };

    this.connectScreenAndConsolePanel = function(screen, consolePanel) {
        videoMonitor = screen.getMonitor();
        //joystickControls.connectScreen(screen);
        this.addInputElements(screen.keyControlsInputElements());
        if (consolePanel) this.addInputElements(consolePanel.keyControlsInputElements());
    };

    this.powerOn = function() {
        //joystickControls.powerOn();
        if (PADDLES_MODE === 0) setPaddleMode(false, false);
        else if (PADDLES_MODE === 1) setPaddleMode(true, false);
    };

    this.powerOff = function() {
        setPaddleMode(false, false);
        //joystickControls.powerOff();
    };

    this.destroy = function() {
    };

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener("keydown", this.filteredKeyPressed);
            elements[i].addEventListener("keyup", this.filteredKeyReleased);
        }
    };

    this.toggleP1ControlsMode = function() {
        this.setP1ControlsMode(!p1ControlsMode);
        showModeOSD();
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
        this.initPreferences();
    };

    this.togglePaddleMode = function() {
        setPaddleMode(!paddleMode, true);
    };

    this.joystickControls = function() {
        return joystickControls;
    };

    this.filteredKeyPressed = function(event) {
        if (processKeyEvent(event, true))
            event.preventDefault();
    };

    this.filteredKeyReleased = function(event) {
        if (processKeyEvent(event, false))
            event.preventDefault();
    };

    this.cartridgeInserted = function(cartridge) {
        if (!cartridge || PADDLES_MODE >= 0) return;	// Does not interfere if Paddle Mode is forced
        var usePaddles = cartridge.rom.info.p === 1;
        if (paddleMode !== usePaddles) setPaddleMode(usePaddles, false);
    };

    this.clockPulse = function() {
        if (!paddleMode) return;
        // Update paddles position as time passes
        if (paddle0MovingRight) {
            if (!paddle0MovingLeft) {
                paddle0Position -= paddle0Speed;
                if (paddle0Position < 0) paddle0Position = 0;
                consoleControlsSocket.controlValueChanged(controls.PADDLE0_POSITION, paddle0Position);
            }
        } else if (paddle0MovingLeft) {
            paddle0Position += paddle0Speed;
            if (paddle0Position > 380) paddle0Position = 380;
            consoleControlsSocket.controlValueChanged(controls.PADDLE0_POSITION, paddle0Position);
        }
        if (paddle1MovingRight) {
            if (!paddle1MovingLeft) {
                paddle1Position -= paddle1Speed;
                if (paddle1Position < 0) paddle1Position = 0;
                consoleControlsSocket.controlValueChanged(controls.PADDLE1_POSITION, paddle1Position);
            }
        } else if (paddle1MovingLeft) {
            paddle1Position += paddle1Speed;
            if (paddle1Position > 380) paddle1Position = 380;
            consoleControlsSocket.controlValueChanged(controls.PADDLE1_POSITION, paddle1Position);
        }
    };

    var processKeyEvent = function(event, press) {
        var keyCode = event.keyCode;
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (checkLocalControlKey(keyCode, modifiers, press)) return true;
        var control = controlForEvent(keyCode, modifiers);
        if (control == null) return false;

        if (paddleMode)	control = translatePaddleModeButtons(control);
        var state = controlStateMap[control];
        if (!state || (state !== press)) {
            controlStateMap[control] = press;
            consoleControlsSocket.controlStateChanged(control, press);
        }
        return true;
    };

    var showModeOSD = function() {
        videoMonitor.showOSD("Controllers: " + (paddleMode ? "Paddles" : "Joysticks") + (p1ControlsMode ? ", Swapped" : ""), true);
    };

    var setPaddleMode = function(mode, showOSD) {
        paddleMode = mode;
        paddle0MovingLeft = paddle0MovingRight = paddle1MovingLeft = paddle1MovingRight = false;
        paddle0Speed = paddle1Speed = 2;
        paddle0Position = paddle1Position = (paddleMode ? 190 : -1);	// -1 = disconnected, won't charge POTs
        // Reset all controls to default state
        for (var i = 0; i < controls.playerDigitalControls.length; i++) {
            consoleControlsSocket.controlStateChanged(controls.playerDigitalControls[i], false);
        }
        consoleControlsSocket.controlValueChanged(controls.PADDLE0_POSITION, paddle0Position);
        consoleControlsSocket.controlValueChanged(controls.PADDLE1_POSITION, paddle1Position);
        //joystickControls.paddleMode(paddleMode);
        if (showOSD) showModeOSD();
    };

    var checkLocalControlKey = function(keyCode, modif, press) {
        var control;
        if (press) {
            if (modif === KEY_ALT_MASK)
                switch(keyCode) {
                    case KEY_TOGGLE_P1_MODE:
                        self.toggleP1ControlsMode();
                        return true;
                    case KEY_TOGGLE_JOYSTICK:
                        //joystickControls.toggleMode();
                        return true;
                    case KEY_TOGGLE_PADDLE:
                        self.togglePaddleMode(); return true;
                }
            if (paddleMode) {
                control = controlForEvent(keyCode, modif);
                if (control == null) return false;
                switch(control) {
                    case controls.JOY0_LEFT:
                        paddle0MovingLeft = true; return true;
                    case controls.JOY0_RIGHT:
                        paddle0MovingRight = true; return true;
                    case controls.JOY0_UP:
                        if (paddle0Speed < 10) paddle0Speed++;
                        videoMonitor.showOSD("P1 Paddle speed: " + paddle0Speed, true);
                        return true;
                    case controls.JOY0_DOWN:
                        if (paddle0Speed > 1) paddle0Speed--;
                        videoMonitor.showOSD("P1 Paddle speed: " + paddle0Speed, true);
                        return true;
                    case controls.JOY1_LEFT:
                        paddle1MovingLeft = true; return true;
                    case controls.JOY1_RIGHT:
                        paddle1MovingRight = true; return true;
                    case controls.JOY1_UP:
                        if (paddle1Speed < 10) paddle1Speed++;
                        videoMonitor.showOSD("P2 Paddle speed: " + paddle1Speed, true);
                        return true;
                    case controls.JOY1_DOWN:
                        if (paddle1Speed > 1) paddle1Speed--;
                        videoMonitor.showOSD("P2 Paddle speed: " + paddle1Speed, true);
                        return true;
                }
            }
        } else {
            if (paddleMode) {
                control = controlForEvent(keyCode, modif);
                if (control == null) return false;
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
        }
        return false;
    };

    var controlForEvent = function(keyCode, modif) {
        switch (modif) {
            case 0:
                var joy = joysticksCodeMap[keyCode];
                if (joy) return joy;
                return normalCodeMap[keyCode];
            case KEY_CTRL_MASK:
                return withCTRLCodeMap[keyCode];
            case KEY_ALT_MASK:
                return withALTCodeMap[keyCode];
        }
        return null;
    };

    var translatePaddleModeButtons = function(control) {
        switch (control) {
            case controls.JOY0_BUTTON: return controls.PADDLE0_BUTTON;
            case controls.JOY1_BUTTON: return controls.PADDLE1_BUTTON;
        }
        return control;
    };

    var initKeys = function() {
        self.initPreferences();

        normalCodeMap[KEY_POWER]            = controls.POWER;
        normalCodeMap[KEY_BLACK_WHITE]      = controls.BLACK_WHITE;
        normalCodeMap[KEY_DIFFICULTY0]      = controls.DIFFICULTY0;
        normalCodeMap[KEY_DIFFICULTY1]      = controls.DIFFICULTY1;
        normalCodeMap[KEY_SELECT]           = controls.SELECT;
        normalCodeMap[KEY_SELECT2]          = controls.SELECT;
        normalCodeMap[KEY_RESET]            = controls.RESET;
        normalCodeMap[KEY_FAST_SPEED]       = controls.FAST_SPEED;
        normalCodeMap[KEY_SAVE_STATE_FILE]  = controls.SAVE_STATE_FILE;
        normalCodeMap[KEY_CARTRIDGE_REMOVE] = controls.CARTRIDGE_REMOVE;

        withALTCodeMap[KEY_POWER]          = controls.POWER_FRY;
        withALTCodeMap[KEY_PAUSE]          = controls.PAUSE;
        withALTCodeMap[KEY_FRAME]          = controls.FRAME;
        withALTCodeMap[KEY_TRACE]          = controls.TRACE;
        withALTCodeMap[KEY_DEBUG]          = controls.DEBUG;
        withALTCodeMap[KEY_NO_COLLISIONS]  = controls.NO_COLLISIONS;
        withALTCodeMap[KEY_VIDEO_STANDARD] = controls.VIDEO_STANDARD;

        withCTRLCodeMap[KEY_STATE_0] = controls.SAVE_STATE_0;
        withCTRLCodeMap[KEY_STATE_0a] = controls.SAVE_STATE_0;
        withCTRLCodeMap[KEY_STATE_1] = controls.SAVE_STATE_1;
        withCTRLCodeMap[KEY_STATE_2] = controls.SAVE_STATE_2;
        withCTRLCodeMap[KEY_STATE_3] = controls.SAVE_STATE_3;
        withCTRLCodeMap[KEY_STATE_4] = controls.SAVE_STATE_4;
        withCTRLCodeMap[KEY_STATE_5] = controls.SAVE_STATE_5;
        withCTRLCodeMap[KEY_STATE_6] = controls.SAVE_STATE_6;
        withCTRLCodeMap[KEY_STATE_7] = controls.SAVE_STATE_7;
        withCTRLCodeMap[KEY_STATE_8] = controls.SAVE_STATE_8;
        withCTRLCodeMap[KEY_STATE_9] = controls.SAVE_STATE_9;
        withCTRLCodeMap[KEY_STATE_10] = controls.SAVE_STATE_10;
        withCTRLCodeMap[KEY_STATE_11] = controls.SAVE_STATE_11;
        withCTRLCodeMap[KEY_STATE_11a] = controls.SAVE_STATE_11;
        withCTRLCodeMap[KEY_STATE_12] = controls.SAVE_STATE_12;
        withCTRLCodeMap[KEY_STATE_12a] = controls.SAVE_STATE_12;

        withALTCodeMap[KEY_STATE_0] = controls.LOAD_STATE_0;
        withALTCodeMap[KEY_STATE_0a] = controls.LOAD_STATE_0;
        withALTCodeMap[KEY_STATE_1] = controls.LOAD_STATE_1;
        withALTCodeMap[KEY_STATE_2] = controls.LOAD_STATE_2;
        withALTCodeMap[KEY_STATE_3] = controls.LOAD_STATE_3;
        withALTCodeMap[KEY_STATE_4] = controls.LOAD_STATE_4;
        withALTCodeMap[KEY_STATE_5] = controls.LOAD_STATE_5;
        withALTCodeMap[KEY_STATE_6] = controls.LOAD_STATE_6;
        withALTCodeMap[KEY_STATE_7] = controls.LOAD_STATE_7;
        withALTCodeMap[KEY_STATE_8] = controls.LOAD_STATE_8;
        withALTCodeMap[KEY_STATE_9] = controls.LOAD_STATE_9;
        withALTCodeMap[KEY_STATE_10] = controls.LOAD_STATE_10;
        withALTCodeMap[KEY_STATE_11] = controls.LOAD_STATE_11;
        withALTCodeMap[KEY_STATE_11a] = controls.LOAD_STATE_11;
        withALTCodeMap[KEY_STATE_12] = controls.LOAD_STATE_12;
        withALTCodeMap[KEY_STATE_12a] = controls.LOAD_STATE_12;

        withALTCodeMap[KEY_CARTRIDGE_FORMAT]    = controls.CARTRIDGE_FORMAT;
        withALTCodeMap[KEY_CARTRIDGE_CLOCK_DEC] = controls.CARTRIDGE_CLOCK_DEC;
        withALTCodeMap[KEY_CARTRIDGE_CLOCK_INC] = controls.CARTRIDGE_CLOCK_INC;
    };

    this.initPreferences = function() {
        joysticksCodeMap = {};
        if (!p1ControlsMode) {
            joysticksCodeMap[KEY_P0_LEFT]    = controls.JOY0_LEFT;
            joysticksCodeMap[KEY_P0_UP]      = controls.JOY0_UP;
            joysticksCodeMap[KEY_P0_RIGHT]   = controls.JOY0_RIGHT;
            joysticksCodeMap[KEY_P0_DOWN]    = controls.JOY0_DOWN;
            joysticksCodeMap[KEY_P0_BUTTON]  = controls.JOY0_BUTTON;
            joysticksCodeMap[KEY_P0_BUTTON2] = controls.JOY0_BUTTON;
            joysticksCodeMap[KEY_P1_LEFT]    = controls.JOY1_LEFT;
            joysticksCodeMap[KEY_P1_UP]      = controls.JOY1_UP;
            joysticksCodeMap[KEY_P1_RIGHT]   = controls.JOY1_RIGHT;
            joysticksCodeMap[KEY_P1_DOWN]    = controls.JOY1_DOWN;
            joysticksCodeMap[KEY_P1_BUTTON]  = controls.JOY1_BUTTON;
            joysticksCodeMap[KEY_P1_BUTTON2] = controls.JOY1_BUTTON;
        } else {
            joysticksCodeMap[KEY_P0_LEFT]    = controls.JOY1_LEFT;
            joysticksCodeMap[KEY_P0_UP]      = controls.JOY1_UP;
            joysticksCodeMap[KEY_P0_RIGHT]   = controls.JOY1_RIGHT;
            joysticksCodeMap[KEY_P0_DOWN]    = controls.JOY1_DOWN;
            joysticksCodeMap[KEY_P0_BUTTON]  = controls.JOY1_BUTTON;
            joysticksCodeMap[KEY_P0_BUTTON2] = controls.JOY1_BUTTON;
            joysticksCodeMap[KEY_P1_LEFT]    = controls.JOY0_LEFT;
            joysticksCodeMap[KEY_P1_UP]      = controls.JOY0_UP;
            joysticksCodeMap[KEY_P1_RIGHT]   = controls.JOY0_RIGHT;
            joysticksCodeMap[KEY_P1_DOWN]    = controls.JOY0_DOWN;
            joysticksCodeMap[KEY_P1_BUTTON]  = controls.JOY0_BUTTON;
            joysticksCodeMap[KEY_P1_BUTTON2] = controls.JOY0_BUTTON;
        }
    };

    var controls = ConsoleControls;

    var p1ControlsMode = false;
    var paddleMode = false;

    var consoleControlsSocket;
    var cartridgeSocket;
    var videoMonitor;
    var joystickControls;

    var paddle0Position = 0;			// 380 = LEFT, 190 = MIDDLE, 0 = RIGHT
    var paddle0Speed = 3;				// 1 to 10
    var paddle0MovingLeft = false;
    var paddle0MovingRight = false;
    var paddle1Position = 0;
    var paddle1Speed = 3;
    var paddle1MovingLeft = false;
    var paddle1MovingRight = false;

    var joysticksCodeMap = {};
    var normalCodeMap = {};
    var withCTRLCodeMap = {};
    var withALTCodeMap = {};

    var controlStateMap =  {};


    // Default Key Values

    var KEY_P0_LEFT          = 37;     // VK_LEFT
    var KEY_P0_UP            = 38;     // VK_UP
    var KEY_P0_RIGHT         = 39;     // VK_RIGHT
    var KEY_P0_DOWN          = 40;     // VK_DOWN
    var KEY_P0_BUTTON        = 32;     // VK_SPACE
    var KEY_P0_BUTTON2       = 46;     // VK_DELETE
    var KEY_P1_LEFT          = 70;     // VK_F
    var KEY_P1_UP            = 84;     // VK_T
    var KEY_P1_RIGHT         = 72;     // VK_H
    var KEY_P1_DOWN          = 71;     // VK_G
    var KEY_P1_BUTTON        = 65;     // VK_A
    var KEY_P1_BUTTON2       = 190;    // VK_PERIOD

    var KEY_TOGGLE_JOYSTICK  = 74;     // VK_J;
    var KEY_TOGGLE_P1_MODE   = 75;     // VK_K;
    var KEY_TOGGLE_PADDLE    = 76;     // VK_L;
    var KEY_CARTRIDGE_FORMAT = 66;     // VK_B;
    var KEY_SELECT           = 122;    // VK_F11;
    var KEY_SELECT2          = 121;    // VK_F10;
    var KEY_RESET            = 123;    // VK_F12;
    var KEY_FAST_SPEED       = 9;      // VK_TAB
    var KEY_PAUSE            = 80;     // VK_P;

    var KEY_POWER            = 112;    // VK_F1;
    var KEY_BLACK_WHITE      = 113;    // VK_F2;
    var KEY_DIFFICULTY0      = 115;    // VK_F4;
    var KEY_DIFFICULTY1      = 120;    // VK_F9;

    var KEY_FRAME            = 70;     // VK_F;
    var KEY_TRACE            = 81;     // VK_Q;
    var KEY_DEBUG            = 68;     // VK_D;
    var KEY_NO_COLLISIONS    = 67;     // VK_C;
    var KEY_VIDEO_STANDARD   = 86;     // VK_V;

    var KEY_STATE_0          = 192;    // VK_QUOTE;
    var KEY_STATE_0a         = 222;    // VK_QUOTE;
    var KEY_STATE_1          = 49;     // VK_1;
    var KEY_STATE_2          = 50;     // VK_2;
    var KEY_STATE_3          = 51;     // VK_3;
    var KEY_STATE_4          = 52;     // VK_4;
    var KEY_STATE_5          = 53;     // VK_5;
    var KEY_STATE_6          = 54;     // VK_6;
    var KEY_STATE_7          = 55;     // VK_7;
    var KEY_STATE_8          = 56;     // VK_8;
    var KEY_STATE_9          = 57;     // VK_9;
    var KEY_STATE_10         = 48;     // VK_0;
    var KEY_STATE_11         = 189;    // VK_MINUS;
    var KEY_STATE_11a        = 173;    // VK_MINUS;
    var KEY_STATE_12         = 187;    // VK_EQUALS;
    var KEY_STATE_12a        = 61;     // VK_EQUALS;

    var KEY_SAVE_STATE_FILE  = 119;    // VK_F8

    var KEY_CARTRIDGE_CLOCK_DEC = 35;  // VK_END
    var KEY_CARTRIDGE_CLOCK_INC = 36;  // VK_HOME
    var KEY_CARTRIDGE_REMOVE    = 118; // VK_F7

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;

    var PADDLES_MODE = JavatariParameters.PADDLES_MODE;


    init();

}
