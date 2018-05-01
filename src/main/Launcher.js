// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.start = function (consolePowerOn) {
"use strict";

    // Emulator can only be started once
    delete Javatari.start;
    delete Javatari.preLoadImagesAndStart;

    // Init preferences
    Javatari.userPreferences.load();

    // Get container elements
    if (!Javatari.screenElement) {
        Javatari.screenElement = document.getElementById(Javatari.SCREEN_ELEMENT_ID);
        if (!Javatari.screenElement)
            throw new Error('Javatari cannot be started. ' +
            'HTML document is missing screen element with id "' + Javatari.SCREEN_ELEMENT_ID + '"');
    }

    // Apply Configuration, including Machine Type and URL Parameters if allowed
    jt.Configurator.applyConfig();

    // Build and start emulator
    if (consolePowerOn === undefined) consolePowerOn = Javatari.AUTO_POWER_ON_DELAY >= 0;
    Javatari.room = new jt.Room(Javatari.screenElement, consolePowerOn);
    Javatari.room.powerOn();
    jt.Util.log("version " + Javatari.VERSION + " started");

    // Prepare ROM Database
    jt.CartridgeDatabase.uncompress();

    // NetPlay! auto-join Session?
    var joinSession = Javatari.NETPLAY_JOIN;

    // Auto-load BIOS, Expansions, State, Cartridges, Disks and Tape files if specified and downloadable
    if (!joinSession && Javatari.STATE_URL) {
        // State loading, Console will Auto Power on
        new jt.MultiDownloader(
            [{ url: Javatari.STATE_URL }],
            function onAllSuccess(urls) {
                Javatari.room.start(function() {
                    Javatari.room.fileLoader.loadFromContent(urls[0].url, urls[0].content, jt.FileLoader.OPEN_TYPE.STATE, 0, false);
                });
            }
        ).start();
    } else {
        // Normal media loading. Power Console on only after all files are loaded and inserted
        var mediaURLs = joinSession ? [] : jt.Configurator.mediaURLSpecs();       // Skip media loading if joining Session
        new jt.MultiDownloader(
            mediaURLs,
            function onAllSuccess() {
                Javatari.room.start(joinSession
                    ? function() { Javatari.room.getNetClient().joinSession(joinSession, Javatari.NETPLAY_NICK); }
                    : undefined
                );
            }
        ).start();
    }

    Javatari.shutdown = function () {
        if (Javatari.room) Javatari.room.powerOff();
        jt.Util.log("shutdown");
    };

};

// Pre-load images if needed and start emulator as soon as all are loaded and DOM is ready
Javatari.preLoadImagesAndStart = function() {
    var domReady = false;
    var imagesToLoad = jt.Images.embedded ? 0 : jt.Images.count;

    function tryStart(bypass) {
        if (Javatari.start && Javatari.AUTO_START && (bypass || (domReady && imagesToLoad === 0)))
            Javatari.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryStart(false);
    });

    if (imagesToLoad > 0) {
        for (var i in jt.Images.urls) {
            var img = new Image();
            img.src = jt.Images.urls[i];
            img.onload = function () {
                imagesToLoad--;
                tryStart(false);
            };
        }
    }

    window.addEventListener("load", function() {
        tryStart(true);
    });
};

// AppCache update control
if (window.applicationCache) {
    function onUpdateReady() {
        alert("A new version is available!\nJavatari will restart...");
        window.applicationCache.swapCache();
        window.location.reload();
    }
    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) onUpdateReady();
    else window.applicationCache.addEventListener("updateready", onUpdateReady);
}

Javatari.VERSION = "5.0";

// Start pre-loading images right away
Javatari.preLoadImagesAndStart();
