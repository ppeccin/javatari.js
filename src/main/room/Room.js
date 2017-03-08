// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Room = function(screenElement, consoleStartPowerOn) {
"use strict";

    var self = this;

    function init() {
        buildPeripherals();
        buildAndPlugConsole();
    }

    this.powerOn = function() {
        self.screen.powerOn();
        self.speaker.powerOn();
        self.consoleControls.powerOn();
        self.setLoading(true);
        roomPowerOnTime = Date.now();
    };

    this.powerOff = function() {
        self.console.powerOff();
        self.consoleControls.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
    };

    this.setLoading = function(boo) {
        if (this.isLoading === boo) return;
        this.isLoading = boo;
        this.console.setLoading(this.isLoading);
        this.screen.setLoading(this.isLoading);
    };

    this.start = function(startAction) {
        jt.Clock.detectHostNativeFPSAndCallback(function() {
            afterPowerONDelay(function () {
                self.setLoading(false);
                self.screen.start(startAction || consolePowerOnStartAction);
            });
        });
    };

    function afterPowerONDelay(func) {
        var wait = Javatari.AUTO_POWER_ON_DELAY;
        if (wait >= 0 && JavatariFullScreenSetup.shouldStartInFullScreen()) wait += 1400;   // Wait a bit more
        wait -= (Date.now() - roomPowerOnTime);
        if (wait < 1) wait = 1;
        setTimeout(func, wait);
    }

    function consolePowerOnStartAction() {
        if (consoleStartPowerOn) self.console.userPowerOn(false);
    }

    function buildPeripherals() {
        self.peripheralControls = new jt.DOMPeripheralControls();
        self.consoleControls = new jt.DOMConsoleControls(self.peripheralControls);
        self.fileDownloader = new jt.FileDownloader();
        self.stateMedia = new jt.LocalStorageSaveStateMedia();
        self.fileLoader = new jt.FileLoader();
        self.speaker = new jt.WebAudioSpeaker(screenElement);
        self.screen = new jt.CanvasDisplay(screenElement);

        self.fileDownloader.connectPeripherals(self.screen);
        self.screen.connectPeripherals(self.fileLoader, self.fileDownloader, self.consoleControls, self.peripheralControls, self.stateMedia);
        self.speaker.connectPeripherals(self.screen);
        self.consoleControls.connectPeripherals(self.screen);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.peripheralControls.connectPeripherals(self.screen, self.speaker, self.consoleControls, self.fileLoader);
    }

    function buildAndPlugConsole() {
        self.console = new jt.AtariConsole();
        self.stateMedia.connect(self.console.getSavestateSocket());
        self.fileLoader.connect(self.console);
        self.screen.connect(self.console);
        self.speaker.connect(self.console.getAudioSocket());
        self.consoleControls.connect(self.console.getConsoleControlsSocket());
        self.peripheralControls.connect(self.console.getConsoleControlsSocket(), self.console.getCartridgeSocket());
        // Cartridge Data operations unavailable self.console.getCartridgeSocket().connectFileDownloader(self.fileDownloader);
    }


    this.console = null;
    this.screen = null;
    this.speaker = null;
    this.consoleControls = null;
    this.fileDownloader = null;
    this.stateMedia = null;
    this.fileLoader = null;
    this.peripheralControls = null;

    this.isLoading = false;

    var roomPowerOnTime;


    init();

};

