// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.DOMPeripheralControls = function(room) {
"use strict";

    var self = this;

    function init() {
        initKeys();
    }

    this.connect = function(pConsoleControlsSocket, pCartridgeSocket) {
        consoleControlsSocket = pConsoleControlsSocket;
        cartridgeSocket = pCartridgeSocket;
    };

    this.connectPeripherals = function(pScreen, pSpeaker, pConsoleControls, pFileLoader) {
        screen = pScreen;
        speaker = pSpeaker;
        monitor = pScreen.getMonitor();
        consoleControls = pConsoleControls;
        fileLoader = pFileLoader;
    };

    this.getControlReport = function(control) {
        switch (control) {
            case controls.PADDLES_TOGGLE_MODE:
            case controls.TURBO_FIRE_TOGGLE:
            case controls.TOUCH_TOGGLE_DIR_BIG:
            case controls.HAPTIC_FEEDBACK_TOGGLE_MODE:
                return consoleControls.getControlReport(control);
            case controls.SCREEN_CRT_FILTER:
                return screen.getControlReport(control);
            case controls.SPEAKER_BUFFER_TOGGLE:
                return speaker.getControlReport(control);
        }
        return { label: "Unknown", active: false };
    };

    this.processKey = function(code, press) {
        if (!press) return false;
        var control = keyCodeMap[code] || keyCodeMap[code & EXCLUDE_SHIFT_MASK];
        if (!control) return false;

        self.controlActivated(control, !!(code & INCLUDE_SHIFT_MASK), false);     // Never secPort
        return true;
    };

    this.controlActivated = function(control, altPower, secPort) {                // Never secPort
        // All controls are Press-only and repeatable
        switch(control) {
            case controls.MACHINE_POWER_TOGGLE:
                consoleControls.processControl(jt.ConsoleControls.POWER, true);
                break;
            case controls.MACHINE_POWER_FRY:
                consoleControls.processControl(jt.ConsoleControls.POWER_FRY, true);
                break;
            case controls.MACHINE_LOAD_STATE_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.STATE, false, false, false);
                break;
            case controls.MACHINE_SAVE_STATE_FILE:
                consoleControls.processControl(jt.ConsoleControls.SAVE_STATE_FILE, true);
                break;
            case controls.MACHINE_LOAD_STATE_MENU:
                screen.openSaveStateDialog(false);
                break;
            case controls.MACHINE_SAVE_STATE_MENU:
                screen.openSaveStateDialog(true);
                break;
            case controls.CARTRIDGE_LOAD_RECENT:
                if (!mediaChangeDisabledWarning()) screen.openCartridgeChooserDialog(false, altPower, secPort);
                break;
            case controls.CARTRIDGE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ROM, altPower, secPort, false);
                break;
            case controls.CARTRIDGE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.ROM, altPower, secPort);
                break;
            case controls.CARTRIDGE_REMOVE:
                if (!mediaChangeDisabledWarning()) {
                    cartridgeSocket.insert(null, false);
                    if (room.netController) room.netController.processCartridgeInserted();
                }
                break;
            case controls.CARTRIDGE_LOAD_DATA_FILE:
                //if (cartridgeSocket.dataOperationNotSupportedMessage(secPort ? 1 : 0, false, false)) break;
                //fileLoader.openFileChooserDialog(OPEN_TYPE.CART_DATA, altPower, secPort, false);
                break;
            case controls.CARTRIDGE_SAVE_DATA_FILE:
                //cartridgeSocket.saveCartridgeDataFile(secPort ? 1 : 0);
                break;
            case controls.AUTO_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.AUTO, altPower, secPort, false);
                break;
            case controls.AUTO_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.AUTO, altPower, secPort, false);
                break;
            case controls.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case controls.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case controls.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case controls.SCREEN_DEFAULTS:
                consoleControlsSocket.setDefaults();
                monitor.setDefaults();
                monitor.showOSD("Default Settings", true);
                break;
            case controls.SCREEN_TOGGLE_MENU:
                screen.toggleMenuByKey();
                break;
            case controls.SCREEN_OPEN_HELP:
                screen.openHelp();
                break;
            case controls.SCREEN_OPEN_ABOUT:
                screen.openAbout();
                break;
            case controls.SCREEN_OPEN_SETTINGS:
                if (altPower) return this.controlActivated(controls.SCREEN_DEFAULTS);
                screen.openSettings();
                break;
            case controls.SCREEN_OPEN_QUICK_OPTIONS:
                screen.openQuickOptionsDialog();
                break;
            case controls.SCREEN_CONSOLE_PANEL_TOGGLE:
                screen.toggleConsolePanel();
                break;
            case controls.SCREEN_OPEN_NETPLAY:
                screen.openNetPlayDialog();
                break;
            case controls.P1_CONTROLS_TOGGLE:
                consoleControls.toggleP1ControlsMode(); break;
            case controls.JOYSTICKS_TOGGLE_MODE:
                consoleControls.toggleGamepadMode(); break;
            case controls.PADDLES_TOGGLE_MODE:
                consoleControls.togglePaddleMode(); break;
            case controls.TOUCH_TOGGLE_MODE:
                consoleControls.toggleTouchControlsMode(); break;
            case controls.TOUCH_TOGGLE_DIR_BIG:
                consoleControls.toggleTouchDirBig(); break;
            case controls.TURBO_FIRE_TOGGLE:
                consoleControls.toggleTurboFireSpeed(); break;
            case controls.HAPTIC_FEEDBACK_TOGGLE_MODE:
                consoleControls.toggleHapticFeedback(); break;
            case controls.CAPTURE_SCREEN:
                screen.saveScreenCapture(); break;
            case controls.SPEAKER_BUFFER_TOGGLE:
                speaker.toggleBufferBaseSize(); break;
            case controls.VIEWPORT_ORIGIN_MINUS:
                monitor.viewportOriginDecrease(); break;
            case controls.VIEWPORT_ORIGIN_PLUS:
                monitor.viewportOriginIncrease(); break;
        }
        if (SCREEN_FIXED_SIZE) return;
        switch(control) {
            case controls.SCREEN_ASPECT_MINUS:
                monitor.displayAspectDecrease(); break;
            case controls.SCREEN_ASPECT_PLUS:
                monitor.displayAspectIncrease(); break;
            case controls.SCREEN_SCALE_MINUS:
                monitor.displayScaleDecrease(); break;
            case controls.SCREEN_SCALE_PLUS:
                monitor.displayScaleIncrease(); break;
            case controls.VIEWPORT_SIZE_MINUS:
                monitor.viewportSizeDecrease(); break;
            case controls.VIEWPORT_SIZE_PLUS:
                monitor.viewportSizeIncrease(); break;
        }
    };

    var mediaChangeDisabledWarning = function() {
        if (Javatari.CARTRIDGE_CHANGE_DISABLED) {
            monitor.showOSD("Cartridge change is disabled!", true, true);
            return true;
        }
        return false;
    };

    var initKeys = function() {
        var k = jt.DOMKeys;

        keyCodeMap[KEY_LOAD_RECENT]           = controls.CARTRIDGE_LOAD_RECENT;
        keyCodeMap[KEY_LOAD_RECENT | k.ALT]   = controls.CARTRIDGE_LOAD_RECENT;
        keyCodeMap[KEY_LOAD_URL]            = controls.AUTO_LOAD_URL;
        keyCodeMap[KEY_LOAD_URL | k.ALT]    = controls.AUTO_LOAD_URL;
        keyCodeMap[KEY_CART_REMOVE]         = controls.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_CART_REMOVE | k.ALT] = controls.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_STATE_FILE]          = controls.MACHINE_SAVE_STATE_FILE;
        keyCodeMap[KEY_STATE_FILE | k.ALT]  = controls.MACHINE_SAVE_STATE_FILE;

        keyCodeMap[KEY_P1_CONTROLS_TOGGLE | k.ALT]    = controls.P1_CONTROLS_TOGGLE;
        keyCodeMap[KEY_PADDLES_TOGGLE | k.ALT]        = controls.PADDLES_TOGGLE_MODE;
        keyCodeMap[KEY_JOYSTICKS_TOGGLE | k.ALT]      = controls.JOYSTICKS_TOGGLE_MODE;
        keyCodeMap[KEY_TOUCH_TOGGLE | k.ALT]          = controls.TOUCH_TOGGLE_MODE;
        keyCodeMap[KEY_TURBO_FIRE_TOGGLE | k.ALT]     = controls.TURBO_FIRE_TOGGLE;

        keyCodeMap[KEY_CRT_FILTER | k.ALT]      = controls.SCREEN_CRT_FILTER;
        keyCodeMap[KEY_CRT_MODE | k.ALT] 	    = controls.SCREEN_CRT_MODE;
        keyCodeMap[KEY_SETTINGS | k.ALT]    	= controls.SCREEN_OPEN_SETTINGS;
        keyCodeMap[KEY_QUICK_OPTIONS | k.ALT] 	= controls.SCREEN_OPEN_QUICK_OPTIONS;
        keyCodeMap[KEY_CONSOLE_PANEL | k.ALT] 	= controls.SCREEN_CONSOLE_PANEL_TOGGLE;

        keyCodeMap[KEY_FULLSCREEN | k.ALT]  = controls.SCREEN_FULLSCREEN;

        keyCodeMap[KEY_UP | k.CONTROL | k.ALT]     = controls.SCREEN_SCALE_MINUS;
        keyCodeMap[KEY_DOWN | k.CONTROL | k.ALT]   = controls.SCREEN_SCALE_PLUS;
        keyCodeMap[KEY_LEFT | k.CONTROL | k.ALT]   = controls.SCREEN_ASPECT_MINUS;
        keyCodeMap[KEY_RIGHT | k.CONTROL | k.ALT]  = controls.SCREEN_ASPECT_PLUS;

        keyCodeMap[KEY_UP | k.SHIFT | k.CONTROL]     = controls.VIEWPORT_ORIGIN_MINUS;
        keyCodeMap[KEY_DOWN | k.SHIFT | k.CONTROL]   = controls.VIEWPORT_ORIGIN_PLUS;
        keyCodeMap[KEY_LEFT | k.SHIFT | k.CONTROL]   = controls.VIEWPORT_SIZE_MINUS;
        keyCodeMap[KEY_RIGHT | k.SHIFT | k.CONTROL]  = controls.VIEWPORT_SIZE_PLUS;

        keyCodeMap[KEY_MENU]         	  = controls.SCREEN_TOGGLE_MENU;
        keyCodeMap[KEY_DEFAULTS]          = controls.SCREEN_DEFAULTS;
        keyCodeMap[KEY_DEFAULTS | k.ALT]  = controls.SCREEN_DEFAULTS;

        keyCodeMap[KEY_CAPTURE_SCREEN | k.ALT] = controls.CAPTURE_SCREEN;

        keyCodeMap[KEY_SPEAKER_BUFFER | k.ALT] = controls.SPEAKER_BUFFER_TOGGLE;
    };


    var controls = jt.PeripheralControls;

    var consoleControlsSocket;
    var screen;
    var monitor;
    var speaker;
    var consoleControls;
    var fileLoader;
    var cartridgeSocket;

    var keyCodeMap = {};                // SHIFT is considered differently

    var EXCLUDE_SHIFT_MASK = ~jt.DOMKeys.SHIFT;
    var INCLUDE_SHIFT_MASK = jt.DOMKeys.SHIFT;

    var OPEN_TYPE = jt.FileLoader.OPEN_TYPE;

    var KEY_LEFT    = jt.DOMKeys.VK_LEFT.c;
    var KEY_UP      = jt.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = jt.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = jt.DOMKeys.VK_DOWN.c;

    var KEY_MENU      = jt.DOMKeys.VK_CONTEXT.c;
    var KEY_DEFAULTS  = jt.DOMKeys.VK_BACKSPACE.c;

    var KEY_CAPTURE_SCREEN  = jt.DOMKeys.VK_X.c;

    var KEY_SPEAKER_BUFFER  = jt.DOMKeys.VK_A.c;

    var KEY_LOAD_RECENT = jt.DOMKeys.VK_F5.c;
    var KEY_LOAD_URL    = jt.DOMKeys.VK_F6.c;
    var KEY_CART_REMOVE = jt.DOMKeys.VK_F7.c;

    var KEY_P1_CONTROLS_TOGGLE    = jt.DOMKeys.VK_K.c;
    var KEY_JOYSTICKS_TOGGLE      = jt.DOMKeys.VK_J.c;
    var KEY_PADDLES_TOGGLE        = jt.DOMKeys.VK_L.c;
    var KEY_TOUCH_TOGGLE          = jt.DOMKeys.VK_N.c;
    var KEY_TURBO_FIRE_TOGGLE     = jt.DOMKeys.VK_H.c;

    var KEY_CRT_MODE      = jt.DOMKeys.VK_R.c;
    var KEY_CRT_FILTER    = jt.DOMKeys.VK_T.c;
    var KEY_SETTINGS      = jt.DOMKeys.VK_Y.c;
    var KEY_QUICK_OPTIONS = jt.DOMKeys.VK_U.c;
    var KEY_CONSOLE_PANEL = jt.DOMKeys.VK_S.c;

    var KEY_FULLSCREEN  = jt.DOMKeys.VK_ENTER.c;

    var KEY_MACHINE_POWER  = jt.DOMKeys.VK_F1.c;
    var KEY_STATE_FILE     = jt.DOMKeys.VK_F8.c;

    var SCREEN_FIXED_SIZE = Javatari.SCREEN_RESIZE_DISABLED;


    init();

};
