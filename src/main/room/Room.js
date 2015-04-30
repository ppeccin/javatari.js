// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

JavatariCode.Room = function(screenElement, consolePanelElement, cartridgeProvided) {
    var self = this;

    function init() {
        buildPeripherals();
        buildAndPlugConsole();
    }

    this.powerOn = function(paused) {
        self.screen.powerOn();
        if (self.consolePanel) this.consolePanel.powerOn();
        self.speaker.powerOn();
        self.controls.powerOn();
        insertCartridgeProvidedIfNoneInserted();
        if (self.console.getCartridgeSocket().inserted() && !self.console.powerIsOn) self.console.powerOn(paused);
    };

    this.powerOff = function() {
        self.console.powerOff();
        self.controls.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
        if (self.consolePanel) this.consolePanel.powerOff();
    };

    var insertCartridgeProvidedIfNoneInserted = function() {
        if (self.console.getCartridgeSocket().inserted()) return;
        if (cartridgeProvided) self.console.getCartridgeSocket().insert(cartridgeProvided, false);
    };

    var buildPeripherals = function() {
        self.stateMedia = new JavatariCode.LocalStorageSaveStateMedia();
        self.romLoader = new JavatariCode.ROMLoader();
        self.screen = new JavatariCode.CanvasDisplay(screenElement);
        self.screen.connectPeripherals(self.romLoader, self.stateMedia);
        if (consolePanelElement) {
            self.consolePanel = new JavatariCode.ConsolePanel(consolePanelElement);
            self.consolePanel.connectPeripherals(self.screen, self.romLoader);
        }
        self.speaker = new JavatariCode.WebAudioSpeaker();
        self.controls = new JavatariCode.DOMConsoleControls();
        self.controls.connectPeripherals(self.screen, self.consolePanel);
    };

    var buildAndPlugConsole = function() {
        self.console = new JavatariCode.AtariConsole();
        self.stateMedia.connect(self.console.getSavestateSocket());
        self.romLoader.connect(self.console.getCartridgeSocket(), self.console.getSavestateSocket());
        self.screen.connect(self.console.getVideoOutput(), self.console.getControlsSocket(), self.console.getCartridgeSocket());
        if (self.consolePanel) self.consolePanel.connect(self.console.getControlsSocket(), self.console.getCartridgeSocket(), self.controls);
        self.speaker.connect(self.console.getAudioOutput());
        self.controls.connect(self.console.getControlsSocket(), self.console.getCartridgeSocket());
    };


    this.screen = null;
    this.consolePanel = null;
    this.speaker = null;
    this.controls = null;
    this.console = null;
    this.stateMedia = null;
    this.romLoader = null;


    init();

};

