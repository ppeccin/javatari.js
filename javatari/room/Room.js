/**
 * Created by ppeccin on 20/11/2014.
 */

function Room(screenElement, consolePanelElement, cartridgeProvided) {
    var self = this;

    function init() {
        if (!screenElement)
            throw new Error('Javatari cannot be started. ' +
                'HTML document is missing screen element with id "' + JavatariParameters.SCREEN_ELEMENT_ID + '"');

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
        if (self.consolePanel) this.consolePanel.powerOff();
        self.controls.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
    };

    var insertCartridgeProvidedIfNoneInserted = function() {
        if (self.console.getCartridgeSocket().inserted()) return;
        if (cartridgeProvided) self.console.getCartridgeSocket().insert(cartridgeProvided, false);
    };

    var buildPeripherals = function() {
        self.romLoader = new ROMLoader();
        self.screen = new CanvasDisplay(screenElement);
        self.screen.connectROMLoader(self.romLoader);
        if (consolePanelElement) {
            self.consolePanel = new CanvasConsolePanel(consolePanelElement);
            self.consolePanel.connectScreenAndROMLoader(self.screen, self.romLoader);
        }
        self.speaker = new Speaker();
        self.controls = new DOMConsoleControls();
        self.controls.connectScreenAndConsolePanel(self.screen, self.consolePanel);
        self.stateMedia = new LocalStorageSaveStateMedia();
    };

    var buildAndPlugConsole = function() {
        self.console = new AtariConsole();
        self.controls.connect(self.console.getControlsSocket(), self.console.getCartridgeSocket());
        self.screen.connect(self.console.getVideoOutput(), self.console.getControlsSocket(), self.console.getCartridgeSocket());
        if (self.consolePanel) self.consolePanel.connect(self.console.getControlsSocket(), self.console.getCartridgeSocket(), self.controls);
        self.speaker.connect(self.console.getAudioOutput());
        self.stateMedia.connect(self.console.getSavestateSocket());
        self.romLoader.connect(self.console.getCartridgeSocket());
    };


    this.screen = null;
    this.consolePanel = null;
    this.speaker = null;
    this.controls = null;
    this.console = null;
    this.stateMedia = null;
    this.romLoader = null;


    init();

}
