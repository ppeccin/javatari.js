// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

JavatariCode.DOMMonitorControls = function(monitor) {

    function init() {
        initKeys();
    }

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++)
            elements[i].addEventListener("keydown", this.filteredKeyPressed);
    };

    this.filteredKeyPressed = function(event) {
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (processKeyPress(event.keyCode, modifiers))
            event.preventDefault();
    };

    var processKeyPress = function(keyCode, modifiers) {
        var control = controlForEvent(keyCode, modifiers);
        if (!control) return false;
        monitor.controlActivated(control);
        return true;
    };

    var controlForEvent = function(keyCode, modif) {
        switch (modif) {
            case 0:
                return keyCodeMap[keyCode];
            case KEY_ALT_MASK:
                return keyAltCodeMap[keyCode];
            case KEY_SHIFT_MASK:
                return keyShiftCodeMap[keyCode];
            case KEY_CTRL_MASK:
                return keyControlCodeMap[keyCode];
            case KEY_CTRL_MASK | KEY_ALT_MASK:
                return keyControlAltCodeMap[keyCode];
            case KEY_SHIFT_MASK | KEY_CTRL_MASK:
                return keyShiftControlCodeMap[keyCode];
            case KEY_SHIFT_MASK | KEY_ALT_MASK:
                return keyShiftAltCodeMap[keyCode];
        }
        return null;
    };

    var initKeys = function() {
        var monControls = JavatariCode.Monitor.Controls;

        keyCodeMap[KEY_CART_FILE]       = monControls.LOAD_CARTRIDGE_FILE;
        keyCodeMap[KEY_CART_URL]        = monControls.LOAD_CARTRIDGE_URL;

        keyAltCodeMap[KEY_CART_FILE]    = monControls.LOAD_CARTRIDGE_FILE;
        keyAltCodeMap[KEY_CART_URL]     = monControls.LOAD_CARTRIDGE_URL;

        keyCodeMap[KEY_EXIT]            = monControls.EXIT;

        keyAltCodeMap[KEY_CRT_FILTER]   = monControls.CRT_FILTER;
        keyAltCodeMap[KEY_DEBUG]     	= monControls.DEBUG;
        keyAltCodeMap[KEY_STATS]    	= monControls.STATS;
        keyAltCodeMap[KEY_CRT_MODES] 	= monControls.CRT_MODES;
        keyAltCodeMap[KEY_FULLSCREEN]  	= monControls.FULLSCREEN;

        keyControlCodeMap[KEY_CART_FILE] = monControls.LOAD_CARTRIDGE_FILE_NO_AUTO_POWER;
        keyControlCodeMap[KEY_CART_URL]  = monControls.LOAD_CARTRIDGE_URL_NO_AUTO_POWER;

        keyShiftCodeMap[KEY_UP]     = monControls.SIZE_MINUS;
        keyShiftCodeMap[KEY_DOWN]   = monControls.SIZE_PLUS;
        keyShiftCodeMap[KEY_LEFT]   = monControls.SIZE_MINUS;
        keyShiftCodeMap[KEY_RIGHT]  = monControls.SIZE_PLUS;

        keyShiftAltCodeMap[KEY_UP]     = monControls.SCALE_Y_MINUS;
        keyShiftAltCodeMap[KEY_DOWN]   = monControls.SCALE_Y_PLUS;
        keyShiftAltCodeMap[KEY_LEFT]   = monControls.SCALE_X_MINUS;
        keyShiftAltCodeMap[KEY_RIGHT]  = monControls.SCALE_X_PLUS;

        keyControlAltCodeMap[KEY_UP]     = monControls.ORIGIN_Y_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = monControls.ORIGIN_Y_PLUS;
        keyControlAltCodeMap[KEY_LEFT]   = monControls.ORIGIN_X_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = monControls.ORIGIN_X_PLUS;

        keyShiftControlCodeMap[KEY_UP]    = monControls.HEIGHT_MINUS;
        keyShiftControlCodeMap[KEY_DOWN]  = monControls.HEIGHT_PLUS;
        keyShiftControlCodeMap[KEY_LEFT]  = monControls.WIDTH_MINUS;
        keyShiftControlCodeMap[KEY_RIGHT] = monControls.WIDTH_PLUS;

        keyShiftCodeMap[KEY_CART_PASTE_INS] = monControls.LOAD_CARTRIDGE_PASTE;
        keyControlCodeMap[KEY_CART_PASTE_V] = monControls.LOAD_CARTRIDGE_PASTE;

        keyCodeMap[KEY_SIZE_DEFAULT] = monControls.SIZE_DEFAULT;
    };


    var keyCodeMap = {};
    var keyShiftCodeMap = {};
    var keyAltCodeMap = {};
    var keyShiftControlCodeMap = {};
    var keyShiftAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};


    var KEY_LEFT           = JavatariCode.Keys.VK_LEFT.c;
    var KEY_UP             = JavatariCode.Keys.VK_UP.c;
    var KEY_RIGHT          = JavatariCode.Keys.VK_RIGHT.c;
    var KEY_DOWN           = JavatariCode.Keys.VK_DOWN.c;

    var KEY_SIZE_DEFAULT   = JavatariCode.Keys.VK_BACK_SPACE.c;

    var KEY_CART_FILE      = JavatariCode.Keys.VK_F5.c;
    var KEY_CART_URL       = JavatariCode.Keys.VK_F6.c;
    var KEY_CART_PASTE_V   = JavatariCode.Keys.VK_V.c;
    var KEY_CART_PASTE_INS = JavatariCode.Keys.VK_INSERT.c;

    var KEY_CRT_FILTER     = JavatariCode.Keys.VK_T.c;
    var KEY_CRT_MODES      = JavatariCode.Keys.VK_R.c;

    var KEY_DEBUG          = JavatariCode.Keys.VK_D.c;
    var KEY_STATS          = JavatariCode.Keys.VK_G.c;

    var KEY_FULLSCREEN     = JavatariCode.Keys.VK_ENTER.c;

    var KEY_EXIT           = JavatariCode.Keys.VK_ESCAPE.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

};
