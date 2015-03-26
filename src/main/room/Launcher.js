// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.start = function () {
    // Init preferences
    Javatari.preferencesLoad();
    // Get container elements
    if (!Javatari.screenElement) {
        Javatari.screenElement = document.getElementById(Javatari.SCREEN_ELEMENT_ID);
        if (!Javatari.screenElement)
            throw new Error('Javatari cannot be started. ' +
            'HTML document is missing screen element with id "' + Javatari.SCREEN_ELEMENT_ID + '"');
    }
    if (!Javatari.consolePanelElement)
        Javatari.consolePanelElement = document.getElementById(Javatari.CONSOLE_PANEL_ELEMENT_ID);
    // Build and start emulator
    Javatari.room = new Room(Javatari.screenElement, Javatari.consolePanelElement);
    Javatari.room.powerOn();
    // Auto-load ROM if specified
    if (Javatari.ROM_AUTO_LOAD_URL)
        Javatari.room.romLoader.loadFromURL(Javatari.ROM_AUTO_LOAD_URL);
    Util.log("started");

    // Emulator can only be started once
    delete Javatari.start;
};

Javatari.shutdown = function () {
    if (Javatari.room) Javatari.room.powerOff();
    delete Javatari.loadROMFromUrl;
    delete Javatari.screenElement;
    delete Javatari.consolePanelElement;
    delete Javatari.cartridge;
    delete Javatari.room;
    Util.log("shutdown");

    // Emulator can only be shutdown once
    delete Javatari.shutdown;
};

// Schedule automatic launch
window.addEventListener("load", function () {
    if (Javatari.start && Javatari.AUTO_START !== false)
         Javatari.start();
});
