// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.DOMPeripheralControls = function(room) {
"use strict";

    var self = this;

    function init() {
        initKeys();
    }

    this.connect = function(pCartridgeSocket) {
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
            case pc.PADDLES_TOGGLE_MODE:
            case pc.P1_CONTROLS_TOGGLE:
            case pc.TURBO_FIRE_TOGGLE:
            case pc.TOUCH_TOGGLE_DIR_BIG:
            case pc.HAPTIC_FEEDBACK_TOGGLE_MODE:
                return consoleControls.getControlReport(control);
            case pc.SCREEN_CRT_FILTER:
                return screen.getControlReport(control);
            case pc.SPEAKER_BUFFER_TOGGLE:
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
        // Check for NetPlay blocked controls
        if (room.netPlayMode === 2 && netClientDisabledControls.has(control))
                return room.showOSD("Function not available in NetPlay Client mode", true, true);

        // All controls are Press-only and repeatable
        switch(control) {
            case pc.CONSOLE_POWER_TOGGLE:
                consoleControls.processControlState(jt.ConsoleControls.POWER, true);
                break;
            case pc.CONSOLE_POWER_FRY:
                consoleControls.processControlState(jt.ConsoleControls.POWER_FRY, true);
                break;
            case pc.CONSOLE_LOAD_STATE_FILE:
                fileLoader.openFileChooserDialog(OPEN_TYPE.STATE, false, false, false);
                break;
            case pc.CONSOLE_SAVE_STATE_FILE:
                consoleControls.processControlState(jt.ConsoleControls.SAVE_STATE_FILE, true);
                break;
            case pc.CONSOLE_LOAD_STATE_MENU:
                screen.openSaveStateDialog(false);
                break;
            case pc.CONSOLE_SAVE_STATE_MENU:
                screen.openSaveStateDialog(true);
                break;
            case pc.CARTRIDGE_LOAD_RECENT:
                if (!mediaChangeDisabledWarning()) screen.openCartridgeChooserDialog(false, altPower, secPort);
                break;
            case pc.CARTRIDGE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ROM, altPower, secPort, false);
                break;
            case pc.CARTRIDGE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.ROM, altPower, secPort);
                break;
            case pc.CARTRIDGE_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.insert(null, false);
                break;
            case pc.CARTRIDGE_LOAD_DATA_FILE:
                //if (cartridgeSocket.dataOperationNotSupportedMessage(secPort ? 1 : 0, false, false)) break;
                //fileLoader.openFileChooserDialog(OPEN_TYPE.CART_DATA, altPower, secPort, false);
                break;
            case pc.CARTRIDGE_SAVE_DATA_FILE:
                //cartridgeSocket.saveCartridgeDataFile(secPort ? 1 : 0);
                break;
            case pc.CARTRIDGE_CHOOSE_FORMAT:
                if (!mediaChangeDisabledWarning()) screen.openCartridgeFormatDialog(altPower);
                break;
            case pc.AUTO_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.AUTO, altPower, secPort, false);
                break;
            case pc.AUTO_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.AUTO, altPower, secPort, false);
                break;
            case pc.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case pc.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case pc.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case pc.SCREEN_DEFAULTS:
                consoleControls.processControlState(jt.ConsoleControls.DEFAULTS, true);
                monitor.setDefaults();
                break;
            case pc.SCREEN_TOGGLE_MENU:
                screen.toggleMenuByKey();
                break;
            case pc.SCREEN_OPEN_HELP:
                screen.openHelp();
                break;
            case pc.SCREEN_OPEN_ABOUT:
                screen.openAbout();
                break;
            case pc.SCREEN_OPEN_SETTINGS:
                if (altPower) return this.controlActivated(pc.SCREEN_DEFAULTS);
                screen.openSettings();
                break;
            case pc.SCREEN_OPEN_QUICK_OPTIONS:
                screen.openQuickOptionsDialog();
                break;
            case pc.SCREEN_CONSOLE_PANEL_TOGGLE:
                screen.toggleConsolePanel();
                break;
            case pc.SCREEN_OPEN_NETPLAY:
                screen.openNetPlayDialog();
                break;
            case pc.P1_CONTROLS_TOGGLE:
                consoleControls.toggleP1ControlsMode(); break;
            case pc.JOYSTICKS_TOGGLE_MODE:
                consoleControls.toggleGamepadMode(); break;
            case pc.PADDLES_TOGGLE_MODE:
                consoleControls.togglePaddleMode(); break;
            case pc.TOUCH_TOGGLE_MODE:
                consoleControls.toggleTouchControlsMode(); break;
            case pc.TOUCH_TOGGLE_DIR_BIG:
                consoleControls.toggleTouchDirBig(); break;
            case pc.TURBO_FIRE_TOGGLE:
                consoleControls.toggleTurboFireSpeed(); break;
            case pc.HAPTIC_FEEDBACK_TOGGLE_MODE:
                consoleControls.toggleHapticFeedback(); break;
            case pc.CAPTURE_SCREEN:
                screen.saveScreenCapture(); break;
            case pc.SPEAKER_BUFFER_TOGGLE:
                speaker.toggleBufferBaseSize(); break;
            case pc.VIEWPORT_ORIGIN_MINUS:
                monitor.viewportOriginDecrease(); break;
            case pc.VIEWPORT_ORIGIN_PLUS:
                monitor.viewportOriginIncrease(); break;
        }
        if (SCREEN_FIXED_SIZE) return;
        switch(control) {
            case pc.SCREEN_ASPECT_MINUS:
                monitor.displayAspectDecrease(); break;
            case pc.SCREEN_ASPECT_PLUS:
                monitor.displayAspectIncrease(); break;
            case pc.SCREEN_SCALE_MINUS:
                monitor.displayScaleDecrease(); break;
            case pc.SCREEN_SCALE_PLUS:
                monitor.displayScaleIncrease(); break;
            case pc.VIEWPORT_SIZE_MINUS:
                monitor.viewportSizeDecrease(); break;
            case pc.VIEWPORT_SIZE_PLUS:
                monitor.viewportSizeIncrease(); break;
        }
    };

    var mediaChangeDisabledWarning = function() {
        if (Javatari.CARTRIDGE_CHANGE_DISABLED) {
            monitor.showOSD("Cartridge change is disabled!", true, true);
            return true;
        }
        if (room.netPlayMode === 2) {
            monitor.showOSD("Cartridge change is disabled in NetPlay Client mode!", true, true);
            return true;
        }
        return false;
    };
    this.mediaChangeDisabledWarning = mediaChangeDisabledWarning;

    var initKeys = function() {
        var k = jt.DOMKeys;

        keyCodeMap[KEY_LOAD_RECENT]         = pc.CARTRIDGE_LOAD_RECENT;
        keyCodeMap[KEY_LOAD_RECENT | k.ALT] = pc.CARTRIDGE_LOAD_RECENT;
        keyCodeMap[KEY_LOAD_URL]            = pc.AUTO_LOAD_URL;
        keyCodeMap[KEY_LOAD_URL | k.ALT]    = pc.AUTO_LOAD_URL;
        keyCodeMap[KEY_CART_REMOVE]         = pc.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_CART_REMOVE | k.ALT] = pc.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_STATE_FILE]          = pc.CONSOLE_SAVE_STATE_FILE;
        keyCodeMap[KEY_STATE_FILE | k.ALT]  = pc.CONSOLE_SAVE_STATE_FILE;

        keyCodeMap[KEY_P1_CONTROLS_TOGGLE | k.ALT]    = pc.P1_CONTROLS_TOGGLE;
        keyCodeMap[KEY_PADDLES_TOGGLE | k.ALT]        = pc.PADDLES_TOGGLE_MODE;
        keyCodeMap[KEY_JOYSTICKS_TOGGLE | k.ALT]      = pc.JOYSTICKS_TOGGLE_MODE;
        keyCodeMap[KEY_TOUCH_TOGGLE | k.ALT]          = pc.TOUCH_TOGGLE_MODE;
        keyCodeMap[KEY_TURBO_FIRE_TOGGLE | k.ALT]     = pc.TURBO_FIRE_TOGGLE;

        keyCodeMap[KEY_CRT_FILTER | k.ALT]      = pc.SCREEN_CRT_FILTER;
        keyCodeMap[KEY_CRT_MODE | k.ALT] 	    = pc.SCREEN_CRT_MODE;
        keyCodeMap[KEY_SETTINGS | k.ALT]    	= pc.SCREEN_OPEN_SETTINGS;
        keyCodeMap[KEY_QUICK_OPTIONS | k.ALT] 	= pc.SCREEN_OPEN_QUICK_OPTIONS;
        keyCodeMap[KEY_CONSOLE_PANEL | k.ALT] 	= pc.SCREEN_CONSOLE_PANEL_TOGGLE;

        keyCodeMap[KEY_FULLSCREEN | k.ALT]  = pc.SCREEN_FULLSCREEN;

        keyCodeMap[KEY_UP | k.CONTROL | k.ALT]     = pc.SCREEN_SCALE_MINUS;
        keyCodeMap[KEY_DOWN | k.CONTROL | k.ALT]   = pc.SCREEN_SCALE_PLUS;
        keyCodeMap[KEY_LEFT | k.CONTROL | k.ALT]   = pc.SCREEN_ASPECT_MINUS;
        keyCodeMap[KEY_RIGHT | k.CONTROL | k.ALT]  = pc.SCREEN_ASPECT_PLUS;

        keyCodeMap[KEY_UP | k.SHIFT | k.CONTROL]     = pc.VIEWPORT_ORIGIN_MINUS;
        keyCodeMap[KEY_DOWN | k.SHIFT | k.CONTROL]   = pc.VIEWPORT_ORIGIN_PLUS;
        keyCodeMap[KEY_LEFT | k.SHIFT | k.CONTROL]   = pc.VIEWPORT_SIZE_MINUS;
        keyCodeMap[KEY_RIGHT | k.SHIFT | k.CONTROL]  = pc.VIEWPORT_SIZE_PLUS;

        keyCodeMap[KEY_MENU]         	  = pc.SCREEN_TOGGLE_MENU;
        keyCodeMap[KEY_DEFAULTS]          = pc.SCREEN_DEFAULTS;
        keyCodeMap[KEY_DEFAULTS | k.ALT]  = pc.SCREEN_DEFAULTS;

        keyCodeMap[KEY_CAPTURE_SCREEN | k.ALT] = pc.CAPTURE_SCREEN;

        keyCodeMap[KEY_SPEAKER_BUFFER | k.ALT] = pc.SPEAKER_BUFFER_TOGGLE;
    };


    var pc = jt.PeripheralControls;

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


    var netClientDisabledControls = new Set([
        pc.CONSOLE_POWER_FRY,
        pc.CONSOLE_LOAD_STATE_FILE, pc.CONSOLE_SAVE_STATE_FILE, pc.CONSOLE_LOAD_STATE_MENU, pc.CONSOLE_SAVE_STATE_MENU,
        pc.CARTRIDGE_LOAD_RECENT,
        pc.CARTRIDGE_LOAD_FILE, pc.CARTRIDGE_LOAD_URL, pc.CARTRIDGE_REMOVE, pc.CARTRIDGE_LOAD_DATA_FILE, pc.CARTRIDGE_SAVE_DATA_FILE,
        pc.AUTO_LOAD_FILE, pc.AUTO_LOAD_URL
    ]);


    init();

};
