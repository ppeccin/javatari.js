/**
 * Created by ppeccin on 01/02/2015.
 */

Javatari =  {

    CARTRIDGE_CHANGE_DISABLED:    false,
    SCREEN_RESIZE_DISABLED:       false,
    SCREEN_FULLSCREEN_DISABLED:   false,
    SCREEN_OPENING_SIZE:          2,             // 1 .. 4
    SCREEN_CONTROL_BAR:           0              // 0 = Always, 1 = Hover, 2 = Legacy

};


Javatari.init = function(screenElement, consolePanelElement) {

    Javatari.screenElement = screenElement;
    Javatari.consolePanelElement = consolePanelElement;

    Javatari.room = new Room(screenElement, consolePanelElement);
    Javatari.room.powerOn();

};


