// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function Settings() {
    var self = this;

    this.show = function (page) {
        if (!this.panel) create(this);
        refreshData();
        if (page) this.setPage(page);
        this.panel.style.display = "block";
        this.panel.focus();
    };

    this.hide = function () {
        this.panel.style.display = "none";
        Javatari.room.screen.focus();
    };

    self.setPage = function (page) {
        var contentPosition = {
            "HELP": "0",
            "CONTROLS": "-560px",
            "ABOUT": "-1120px"
        }[page];
        var selectionPosition = {
            "HELP": "0",
            "CONTROLS": "33.3%",
            "ABOUT": "66.6%"
        }[page];

        if (contentPosition) self["content"].style.left = contentPosition;
        if (selectionPosition) self["menu-selection"].style.left = selectionPosition;

        self["menu-help"].classList[page === "HELP" ? "add" : "remove"]("selected");
        self["menu-controls"].classList[page === "CONTROLS" ? "add" : "remove"]("selected");
        self["menu-about"].classList[page === "ABOUT" ? "add" : "remove"]("selected");
    };

    var create = function () {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = Settings.css();
        document.head.appendChild(styles);

        self.panel = document.createElement("div");
        self.panel.innerHTML = Settings.html();
        self.panel.style.outline = "none";
        self.panel.tabIndex = -1;
        document.body.appendChild(self.panel);

        delete Settings.html;
        delete Settings.css;

        setFields();
        setEvents();
    };

    // Automatic set fields for each child element that has the "id" attribute
    var setFields = function () {
        traverseDOM(self.panel, function (element) {
            if (element.id) self[element.id] = element;
        });

        function traverseDOM(element, func) {
            func(element);
            var child = element.childNodes;
            for (var i = 0; i < child.length; i++) {
                traverseDOM(child[i], func);
            }
        }
    };

    var setEvents = function () {
        // Close the modal with a click outside
        self.panel.addEventListener("click", function (e) {
            e.stopPropagation();
            self.hide();
        });
        // Or hitting ESC
        self.panel.addEventListener("keydown", function (e) {
            e.preventDefault();
            //e.stopPropagation();
            if (e.keyCode === KEY_CLOSE)
                self.hide();
        });


        // No not close the modal with a click inside
        self["modal"].addEventListener("click", function (e) {
            e.stopPropagation();
        });

        self["menu-help"].addEventListener("click", function () {
            self.setPage("HELP");
        });
        self["menu-controls"].addEventListener("click", function () {
            self.setPage("CONTROLS");
        });
        self["menu-about"].addEventListener("click", function () {
            self.setPage("ABOUT");
        });

    };

    var refreshData = function () {
        self["browserinfo"].innerHTML = navigator.userAgent;

        if (Javatari.room.controls.isPaddleMode()) {
            self["control-p1-controller"].style.backgroundPositionY = "-91px";
            self["control-p2-controller"].style.backgroundPositionY = "-91px";
            self["control-p1-up-label"].innerHTML = self["control-p2-up-label"].innerHTML = "+ Speed";
            self["control-p1-down-label"].innerHTML = self["control-p2-down-label"].innerHTML = "- Speed";
        } else {
            self["control-p1-controller"].style.backgroundPositionY = "0";
            self["control-p2-controller"].style.backgroundPositionY = "0";
            self["control-p1-up-label"].innerHTML = self["control-p2-up-label"].innerHTML = "Up";
            self["control-p1-down-label"].innerHTML = self["control-p2-down-label"].innerHTML = "Down";

        }
        var swapped = Javatari.room.controls.isP1ControlsMode();
        self["control-p1-label"].innerHTML = "Player " + (swapped ? "2" : "1");
        self["control-p2-label"].innerHTML = "Player " + (swapped ? "1" : "2");

        for (var control in controlKeys) {
            if (control === controlRedefining) {
                self[control].classList.add("redefining");
                self[control].innerHTML = "?";
            } else {
                self[control].classList.remove("redefining");
                self[control].innerHTML = KeyNames[Javatari.preferences[controlKeys[control]]];
            }
        }
    };


    var controlKeys = {
        "control-p1-button1": "KP0BUT",
        "control-p1-button2": "KP0BUT2",
        "control-p1-up": "KP0UP",
        "control-p1-left": "KP0LEFT",
        "control-p1-right": "KP0RIGHT",
        "control-p1-down": "KP0DOWN",
        "control-p2-button1": "KP1BUT",
        "control-p2-button2": "KP1BUT2",
        "control-p2-up": "KP1UP",
        "control-p2-left": "KP1LEFT",
        "control-p2-right": "KP1RIGHT",
        "control-p2-down": "KP1DOWN"
    };

    var controlRedefining = null;

    var KEY_CLOSE = 27;        // VK_ESC

}

