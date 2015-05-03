// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.start = function () {
    // Init preferences
    Javatari.preferences.load();
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
    Javatari.room = new jt.Room(Javatari.screenElement, Javatari.consolePanelElement);
    Javatari.room.powerOn();
    // Auto-load ROM if specified
    if (Javatari.ROM_AUTO_LOAD_URL)
        Javatari.room.romLoader.loadFromURL(Javatari.ROM_AUTO_LOAD_URL);

    Javatari.shutdown = function () {
        if (Javatari.room) Javatari.room.powerOff();
        jt.Util.log("shutdown");
        delete Javatari;
    };

    // Emulator can only be started once
    delete Javatari.start;
    delete Javatari.preLoadImagesAndStart;

    jt.Util.log(Javatari.VERSION + " started");
};


// Pre-load images and start emulator as soon as all are loaded and DOM is ready
Javatari.preLoadImagesAndStart = function() {
    var images = [ "sprites.png", "logo.png", "screenborder.png" ];
    var numImages = images.length;

    var domReady = false;
    var imagesToLoad = numImages;
    function tryLaunch(bypass) {
        if (Javatari.start && Javatari.AUTO_START !== false && (bypass || (domReady && imagesToLoad === 0)))
            Javatari.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryLaunch(false);
    });

    for (var i = 0; i < numImages; i++) {
        var img = new Image();
        img.src = Javatari.IMAGES_PATH + images[i];
        img.onload = function() {
            imagesToLoad--;
            tryLaunch(false);
        };
    }

    window.addEventListener("load", function() {
        tryLaunch(true);
    });

};

// Start pre-loading images right away
Javatari.preLoadImagesAndStart();
