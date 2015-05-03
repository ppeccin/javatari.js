// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.ConsolePanel = function(mainElement) {

    function init() {
        setupMain();
        setupButtons();
        setupCartridgeLabel();
    }

    this.connectPeripherals = function(pScreen, pROMLoader) {
        screen = pScreen;
        screen.getMonitor().addControlInputElements(this.keyControlsInputElements());
        pROMLoader.registerForDnD(mainElement);
    };

    this.connect = function(pControlsSocket, pCartridgeSocket) {
        controlsSocket = pControlsSocket;
        controlsSocket.addForwardedInput(this);
        controlsSocket.addRedefinitionListener(this);   	// Will fire a redefinition event
        cartridgeSocket = pCartridgeSocket;
        cartridgeSocket.addInsertionListener(this);		    // Will fire an insertion event
    };

    this.powerOn = function() {
        mainElement.style.visibility = "visible";
        refreshControls();
        refreshCartridge()
    };

    this.powerOff = function() {
        mainElement.style.visibility = "hidden";
        mainElement.style.display = "none";
    };

    this.keyControlsInputElements = function() {
        return [mainElement];
    };

    var refreshControls = function() {
        // Controls State
        setVisibility(powerButton, !controlsStateReport[controls.POWER]);
        setVisibility(colorButton, controlsStateReport[controls.BLACK_WHITE]);
        setVisibility(selectButton, controlsStateReport[controls.SELECT]);
        setVisibility(resetButton, controlsStateReport[controls.RESET]);
        setVisibility(p0DiffButton, controlsStateReport[controls.DIFFICULTY0]);
        setVisibility(p1DiffButton, controlsStateReport[controls.DIFFICULTY1]);
        refreshCartridge();
    };

    var refreshCartridge = function () {
        // Cartridge Image
        setVisibility(cartInsertedImage, cartridgeInserted);
        setVisibility(cartLabel, cartridgeInserted);

        // Cartridge Label
        cartLabel.innerHTML = (cartridgeInserted && cartridgeInserted.rom.info.l) || DEFAULT_CARTRIDGE_LABEL;
        if (cartridgeInserted && cartridgeInserted.rom.info.lc) {
            var colors = cartridgeInserted.rom.info.lc.trim().split(/\s+/);
            cartLabel.style.color = colors[0] || DEFAULT_CARTRIDGE_LABEL_COLOR;
            cartLabel.style.background = colors[1] || DEFAULT_CARTRIDGE_BACK_COLOR;
            cartLabel.style.borderColor = colors[2] || DEFAULT_CARTRIDGE_BORDER_COLOR;
        } else {
            cartLabel.style.color = DEFAULT_CARTRIDGE_LABEL_COLOR;
            cartLabel.style.background = DEFAULT_CARTRIDGE_BACK_COLOR;
            cartLabel.style.borderColor = DEFAULT_CARTRIDGE_BORDER_COLOR;
        }
    };

    var updateVisibleControlsState = function() {
        controlsSocket.controlsStateReport(controlsStateReport);
        refreshControls();
    };

    var setupMain = function () {
        mainElement.style.position = "relative";
        mainElement.style.width = "" + jt.ConsolePanel.DEFAULT_WIDTH + "px";
        mainElement.style.height = "" + jt.ConsolePanel.DEFAULT_HEIGHT + "px";
        mainElement.style.background = "black url(" + IMAGE_PATH + "sprites.png" + ") no-repeat";
        mainElement.style.outline = "none";
        mainElement.tabIndex = "-1";               // Make it focusable
    };

    var setupButtons = function() {
        powerButton  = addButton(31, 52 - 137, 25, 47, 2, -141);
        consoleControlButton(powerButton, controls.POWER, false);
        colorButton  = addButton(95, 52 - 137, 25, 47, -22, -141);
        consoleControlButton(colorButton, controls.BLACK_WHITE, false);
        selectButton = addButton(351, 52 - 137, 25, 47, -46, -141);
        consoleControlButton(selectButton, controls.SELECT, true);
        resetButton  = addButton(414, 52 - 137, 25, 47, -70, -141);
        consoleControlButton(resetButton, controls.RESET, true);
        p0DiffButton = addButton(162, 4 - 137, 33, 22, -94, -157);
        consoleControlButton(p0DiffButton, controls.DIFFICULTY0, false);
        p1DiffButton = addButton(275, 4 - 137, 33, 22, -94, -137);
        consoleControlButton(p1DiffButton, controls.DIFFICULTY1, false);

        cartInsertedImage =  addButton(141, 51 - 145, 189, 82, -127, -139);
        cartChangeButton = addButton(143, 51 - 144, 184, 55, 0, 0, true);
        monitorCartridgeControlButton(cartChangeButton, jt.Monitor.Controls.LOAD_CARTRIDGE_FILE);

        if (!Javatari.CARTRIDGE_CHANGE_DISABLED) {
            cartChangeFileButton = addButton(171, 51 - 86, 31, 30, 2, -188);
            monitorCartridgeControlButton(cartChangeFileButton, jt.Monitor.Controls.LOAD_CARTRIDGE_FILE);
            setVisibility(cartChangeFileButton, true);
            cartChangeURLButton = addButton(267, 51 - 86, 31, 30, -94, -188);
            monitorCartridgeControlButton(cartChangeURLButton, jt.Monitor.Controls.LOAD_CARTRIDGE_URL);
            setVisibility(cartChangeURLButton, true);
        }
    };

    var addButton = function(x, y, w, h, px, py, noImage) {
        var but = document.createElement('div');
        but.style.opacity = 0;
        but.style.position = "absolute";
        if (x > 0) but.style.left = "" + x + "px"; else but.style.right = "" + (-w - x) + "px";
        if (y > 0) but.style.top = "" + y + "px"; else but.style.bottom = "" + (-h - y) + "px";
        but.style.width = "" + w + "px";
        but.style.height = "" + h + "px";
        but.style.outline = "none";

        if (!noImage) {
            but.style.backgroundImage = "url(" + IMAGE_PATH + "sprites.png" + ")";
            but.style.backgroundPosition = "" + px + "px " + py + "px";
            but.style.backgroundRepeat = "no-repeat";
        }

        mainElement.appendChild(but);

        //but.style.boxSizing = "border-box";
        //but.style.backgroundOrigin = "border-box";
        //but.style.border = "1px solid yellow";

        return but;
    };

    var consoleControlButton = function (but, control, isHold) {
        if (control) {
            but.style.cursor = "pointer";
            var mouseDown;
            but.addEventListener("mousedown", function (e) {
                if (e.preventDefault) e.preventDefault();
                mouseDown = true;
                controlsSocket.controlStateChanged(control, true);
            });
            if (isHold) {
                but.addEventListener("mouseup", function (e) {
                    if (e.preventDefault) e.preventDefault();
                    mouseDown = false;
                    controlsSocket.controlStateChanged(control, false);
                });
                but.addEventListener("mouseleave", function (e) {
                    if (e.preventDefault) e.preventDefault();
                    if (!mouseDown) return;
                    mouseDown = false;
                    controlsSocket.controlStateChanged(control, false);
                });
            }
        }
    };

    var monitorCartridgeControlButton = function (but, control) {
        but.style.cursor = "pointer";
        // A "click" event and not a "mousedown" is necessary here. Without a click, FF does not open the Open File window
        // TODO Hotkeys for this are also not working in FF since they're not click events!
        but.addEventListener("click", function (e) {
            if (e.preventDefault) e.preventDefault();
            screen.getMonitor().controlActivated(control);
        });
    };

    var setVisibility = function(element, boo) {
        element.style.opacity = boo ? 1 : 0;
    };

    var setupCartridgeLabel = function() {
        // Adjust default colors for the label as per parameters
        var colors = (Javatari.CARTRIDGE_LABEL_COLORS || "").trim().split(/\s+/);
        if (colors[0]) DEFAULT_CARTRIDGE_LABEL_COLOR = colors[0];
        if (colors[1]) DEFAULT_CARTRIDGE_BACK_COLOR = colors[1];
        if (colors[2]) DEFAULT_CARTRIDGE_BORDER_COLOR = colors[2];

        cartLabel = document.createElement('div');
        cartLabel.style.position = "absolute";
        cartLabel.style.overflow = "hidden";
        cartLabel.style.textOverflow = "ellipsis";
        cartLabel.style.whiteSpace = "nowrap";
        cartLabel.style.top = "52px";
        cartLabel.style.left = "158px";
        cartLabel.style.width = "148px";
        cartLabel.style.height = "25px";
        cartLabel.style.padding = "0 2px";
        cartLabel.style.margin = "0";
        cartLabel.style.font = 'bold 14px/25px sans-serif';
        cartLabel.style.textAlign = "center";
        cartLabel.style.color = DEFAULT_CARTRIDGE_LABEL_COLOR;
        cartLabel.style.background = DEFAULT_CARTRIDGE_BACK_COLOR;
        cartLabel.style.border = "1px solid " + DEFAULT_CARTRIDGE_BORDER_COLOR;
        cartLabel.style.opacity = "0";
        cartLabel.innerHTML = "";
        monitorCartridgeControlButton(cartLabel, jt.Monitor.Controls.LOAD_CARTRIDGE_FILE);
        mainElement.appendChild(cartLabel);
    };



    // Controls interface  -----------------------------------

    var controls = jt.ConsoleControls;

    this.controlStateChanged = function(control, state) {
        if (visibleControls[control]) updateVisibleControlsState();
    };

    this.controlValueChanged = function(control, position) {
        //  Nothing to show for positional controls
    };

    this.controlsStateReport = function(report) {
        //  Nothing to report here
    };

    this.controlsStatesRedefined = function () {
        updateVisibleControlsState();
    };


    // Cartridge interface  ------------------------------------

    this.cartridgeInserted = function(cartridge) {
        cartridgeInserted = cartridge;
        refreshCartridge();
    };


    var screen;

    var controlsSocket;
    var controlsStateReport = {};

    var cartridgeSocket;
    var cartridgeInserted;

    var powerButton;
    var colorButton;
    var selectButton;
    var resetButton;
    var p0DiffButton;
    var p1DiffButton;
    var cartInsertedImage;
    var cartChangeButton;
    var cartChangeFileButton;
    var cartChangeURLButton;

    var cartLabel;

    var visibleControls = {};
    visibleControls[controls.POWER] = 1;
    visibleControls[controls.BLACK_WHITE] = 1;
    visibleControls[controls.SELECT] = 1;
    visibleControls[controls.RESET] = 1;
    visibleControls[controls.DIFFICULTY0] = 1;
    visibleControls[controls.DIFFICULTY1] = 1;


    var IMAGE_PATH = Javatari.IMAGES_PATH;
    var DEFAULT_CARTRIDGE_LABEL =       "JAVATARI.js";
    var DEFAULT_CARTRIDGE_LABEL_COLOR =  "#fa2525";
    var	DEFAULT_CARTRIDGE_BACK_COLOR =   "#101010";
    var	DEFAULT_CARTRIDGE_BORDER_COLOR = "transparent";


    init();

};

jt.ConsolePanel.DEFAULT_WIDTH = 465;
jt.ConsolePanel.DEFAULT_HEIGHT = 137;