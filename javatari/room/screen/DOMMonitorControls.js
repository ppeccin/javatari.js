/**
 * Created by ppeccin on 23/01/2015.
 */

function DOMMonitorControls(monitor) {

    function init() {
        initKeys();
    }

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++)
            elements[i].addEventListener("keydown", this.filteredKeyPressed);
    };

    this.filteredKeyPressed = function(event) {
        if (processKeyEvent(event))
            event.preventDefault();
    };

    var processKeyEvent = function(event) {
        var keyCode = event.keyCode;
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
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
        keyCodeMap[KEY_CART_FILE]       = Monitor.Controls.LOAD_CARTRIDGE_FILE;
        keyCodeMap[KEY_CART_URL]        = Monitor.Controls.LOAD_CARTRIDGE_URL;
        keyCodeMap[KEY_CART_EMPTY]      = Monitor.Controls.LOAD_CARTRIDGE_EMPTY;
        keyCodeMap[KEY_CART_SAVESTATE]  = Monitor.Controls.SAVE_STATE_CARTRIDGE;
        keyCodeMap[KEY_EXIT]            = Monitor.Controls.EXIT;

        keyAltCodeMap[KEY_CRT_FILTER]   = Monitor.Controls.CRT_FILTER;
        keyAltCodeMap[KEY_DEBUG]     	= Monitor.Controls.DEBUG;
        keyAltCodeMap[KEY_STATS]    	= Monitor.Controls.STATS;
        keyAltCodeMap[KEY_CRT_MODES] 	= Monitor.Controls.CRT_MODES;
        keyAltCodeMap[KEY_CART_FILE] 	= Monitor.Controls.LOAD_CARTRIDGE_FILE_NO_AUTO_POWER;
        keyAltCodeMap[KEY_CART_URL]  	= Monitor.Controls.LOAD_CARTRIDGE_URL_NO_AUTO_POWER;
        keyAltCodeMap[KEY_FULLSCREEN]  	= Monitor.Controls.FULLSCREEN;

        keyShiftCodeMap[KEY_UP]     = Monitor.Controls.SIZE_MINUS;
        keyShiftCodeMap[KEY_DOWN]   = Monitor.Controls.SIZE_PLUS;
        keyShiftCodeMap[KEY_LEFT]   = Monitor.Controls.SIZE_MINUS;
        keyShiftCodeMap[KEY_RIGHT]  = Monitor.Controls.SIZE_PLUS;

        keyShiftAltCodeMap[KEY_UP]     = Monitor.Controls.SCALE_Y_MINUS;
        keyShiftAltCodeMap[KEY_DOWN]   = Monitor.Controls.SCALE_Y_PLUS;
        keyShiftAltCodeMap[KEY_LEFT]   = Monitor.Controls.SCALE_X_MINUS;
        keyShiftAltCodeMap[KEY_RIGHT]  = Monitor.Controls.SCALE_X_PLUS;

        keyControlAltCodeMap[KEY_UP]     = Monitor.Controls.ORIGIN_Y_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = Monitor.Controls.ORIGIN_Y_PLUS;
        keyControlAltCodeMap[KEY_LEFT]   = Monitor.Controls.ORIGIN_X_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = Monitor.Controls.ORIGIN_X_PLUS;

        keyShiftControlCodeMap[KEY_UP]    = Monitor.Controls.HEIGHT_MINUS;
        keyShiftControlCodeMap[KEY_DOWN]  = Monitor.Controls.HEIGHT_PLUS;
        keyShiftControlCodeMap[KEY_LEFT]  = Monitor.Controls.WIDTH_MINUS;
        keyShiftControlCodeMap[KEY_RIGHT] = Monitor.Controls.WIDTH_PLUS;

        keyShiftCodeMap[KEY_CART_PASTE_INS] = Monitor.Controls.LOAD_CARTRIDGE_PASTE;
        keyControlCodeMap[KEY_CART_PASTE_V] = Monitor.Controls.LOAD_CARTRIDGE_PASTE;

        keyCodeMap[KEY_SIZE_DEFAULT] = Monitor.Controls.SIZE_DEFAULT;
    };


    var keyCodeMap = {};
    var keyShiftCodeMap = {};
    var keyAltCodeMap = {};
    var keyShiftControlCodeMap = {};
    var keyShiftAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};


    var KEY_LEFT           = 37;        // VK_LEFT
    var KEY_UP             = 38;        // VK_UP
    var KEY_RIGHT          = 39;        // VK_RIGHT
    var KEY_DOWN           = 40;        // VK_DOWN

    var KEY_SIZE_DEFAULT   = 8;         // VK_BACK_SPACE

    var KEY_CART_FILE      = 116;       // VK_F5
    var KEY_CART_URL       = 117;       // VK_F6
    var KEY_CART_PASTE_V   = 86;        // VK_V
    var KEY_CART_PASTE_INS = 45;        // VK_INSERT;
    var KEY_CART_EMPTY     = 118;       // VK_F7
    var KEY_CART_SAVESTATE = 119;       // VK_F8

    var KEY_CRT_FILTER     = 84;        // VK_T
    var KEY_CRT_MODES      = 82;        // VK_R

    var KEY_DEBUG          = 68;        // VK_D
    var KEY_STATS          = 71;        // VK_G

    var KEY_FULLSCREEN     = 13;        // VK_ESC

    var KEY_EXIT           = 27;        // VK_ESC

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

}
