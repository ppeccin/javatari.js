// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.FileLoader = function(room, recentStoredROMs, peripheralControls) {
"use strict";

    var self = this;

    this.connect = function(pConsole) {
        console = pConsole;
        cartridgeSocket = console.getCartridgeSocket();
        saveStateSocket = console.getSavestateSocket();
    };

    this.registerForDnD = function (element) {
        element.addEventListener("dragover", onDragOver, false);
        element.addEventListener("drop", onDrop, false);
    };

    this.registerForFileInputElement = function (element) {
        fileInputElementParent = element;
    };

    this.openFileChooserDialog = function (openType, altPower, inSecondaryPort, asExpansion) {
        if (!fileInputElement) createFileInputElement();
        fileInputElement.multiple = INPUT_MULTI[OPEN_TYPE[openType] || OPEN_TYPE.AUTO];
        fileInputElement.accept = INPUT_ACCEPT[OPEN_TYPE[openType] || OPEN_TYPE.AUTO];

        chooserOpenType = openType;
        chooserPort = inSecondaryPort ? 1 : 0;
        chooserAltPower = altPower;
        chooserAsExpansion = asExpansion;
        fileInputElement.click();
    };

    this.openURLChooserDialog = function (openType, altPower, inSecondaryPort, asExpansion) {
        var port = inSecondaryPort ? 1 : 0;
        var url;
        try {
            url = localStorage && localStorage[LOCAL_STORAGE_LAST_URL_KEY];
        } catch (e) {
            // give up
        }

        var wasPaused = console.systemPause(true);

        url = prompt("Load file from URL:", url || "");
        url = url && url.toString().trim();

        if (url) {
            try {
                localStorage[LOCAL_STORAGE_LAST_URL_KEY] = url;
            } catch (e) {
                // give up
            }
            this.readFromURL(url, openType, port, altPower, asExpansion, function () {
                if (!wasPaused) console.systemPause(false);
            });
        } else {
            if (!wasPaused) console.systemPause(false);
        }
    };

    this.readFromFile = function (file, openType, port, altPower, asExpansion, then) {      // Auto detects type
        jt.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            var content = new Uint8Array(event.target.result);
            var aFile = { name: file.name, content: content, lastModifiedDate: file.lastModified ? new Date(file.lastModified) : file.lastModifiedDate };     // lastModifiedDate deprecated?
            self.loadFromFile(aFile, openType, port, altPower, asExpansion);
            if (then) then(true);
        };
        reader.onerror = function (event) {
            showError("File reading error: " + event.target.error.name + DIR_NOT_SUPPORTED_HINT);     // Directories not supported
            if (then) then(false);
        };

        reader.readAsArrayBuffer(file);
    };

    this.readFromURL = function (url, openType, port, altPower, asExpansion, then) {
        new jt.MultiDownloader(
            [{ url: url }],
            function onAllSuccess(urls) {
                var aFile = { name: url, content: urls[0].content, lastModifiedDate: null };
                self.loadFromFile(aFile, openType, port, altPower, asExpansion);
                if (then) then(true);
            },
            function onAnyError(urls) {
                showError("URL reading error: " + urls[0].error);
                if (then) then(false);
            }
        ).start();
    };

    this.readFromFiles = function (files, openType, port, altPower, asExpansion, then) {
        var reader = new jt.MultiFileReader(files,
            function onSuccessAll(files) {
                self.loadFromFiles(files, openType, port, altPower, asExpansion);
                if (then) then(true);
            },
            function onFirstError(files, error, known) {
                if (!known) error += DIR_NOT_SUPPORTED_HINT;                  // Directories not supported
                showError("File reading error: " + error);
                if (then) then(false);
            }
        );
        reader.start();
    };

    this.loadFromContent = function(name, content, openType, port, altPower, asExpansion, format) {
        return this.loadFromFile({ name: name, content: content }, openType, port, altPower, asExpansion, format);
    };

    this.loadFromFile = function(file, openType, port, altPower, asExpansion, format) {
        var zip, mes;
        zip = jt.Util.checkContentIsZIP(file.content);
        if (zip) {
            try {
                // Try normal loading from files
                var files = jt.Util.getZIPFilesSorted(zip);
                if (tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, format, true)) return;
            } catch(ez) {
                jt.Util.error(ez);      // Error decompressing files. Abort
            }
        } else {
            // Try normal loading from files
            if (tryLoadFilesAsMedia([file], openType, port, altPower, asExpansion, format, false)) return;
        }
        showError("No valid " + TYPE_DESC[openType] + " found.")
    };

    this.loadFromFiles = function(files, openType, port, altPower, asExpansion) {
        // Sort files by name
        files = jt.Util.asNormalArray(files).slice(0);
        files.sort(function sortFiles(a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });

        if (tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, null, false)) return;
        showError("No valid " + TYPE_DESC[openType] + " found.")
    };

    this.loadROM = function(rom, port, altPower, chooserAsExpansion) {
        var cart = jt.CartridgeCreator.createCartridgeFromRom(rom);
        if (!cart) return false;
        cartridgeSocket.insert(cart, !altPower);
        recentStoredROMs.storeROM(rom);
        return true;
    };

    function tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, format, filesFromZIP) {
        // Try as Single media (first found)
        for (var i = 0; i < files.length; i++)
            if (tryLoadFileAsSingleMedia(files[i], openType, port, altPower, asExpansion, format, filesFromZIP)) return true;
        return false;
    }

    function tryLoadFileAsSingleMedia(file, openType, port, altPower, asExpansion, format, fileFromZIP, stopRecursion) {
        try {
            if (fileFromZIP && !file.content) file.content = file.asUint8Array();
            var content = file.content;

            if (!stopRecursion) {
                var zip = jt.Util.checkContentIsZIP(content);
                if (zip) {
                    var files = jt.Util.getZIPFilesSorted(zip);
                    for (var i = 0; i < files.length; i++)
                        if (tryLoadFileAsSingleMedia(files[i], openType, port, altPower, asExpansion, format, true, true)) return true;
                    return false;
                }
            }

            var gzip = jt.Util.checkContentIsGZIP(content);
            if (gzip) return tryLoadFileAsSingleMedia({ name: file.name, content: gzip }, openType, port, altPower, asExpansion, format, false, true);
        } catch (ez) {
            jt.Util.error(ez);      // Error decompressing files. Abort
            return false;
        }

        return tryLoadContentAsSingleMedia(file.name, content, openType, port, altPower, asExpansion, format);
    }

    function tryLoadContentAsSingleMedia(name, content, openType, port, altPower, asExpansion, format) {
        openType = openType || OPEN_TYPE.AUTO;
        // Try as a SaveState file
        if (openType === OPEN_TYPE.STATE || openType === OPEN_TYPE.AUTO)
            if (saveStateSocket.loadStateFile(content)) return true;
        // Try as Cartridge Data (SRAM, etc)
        if (openType === OPEN_TYPE.CART_DATA || openType === OPEN_TYPE.AUTO)
            if (cartridgeSocket.loadCartridgeData(port, name, content)) return true;
        // Try to load as ROM (Cartridge)
        if (openType === OPEN_TYPE.ROM || openType === OPEN_TYPE.AUTO) {
            var rom = new jt.ROM(name, content, null, format);
            return self.loadROM(rom, port, altPower, asExpansion);
        }
        // Not a valid content
        return false;
    }

    function onFileInputChange(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();
        e.target.focus();
        if (!this.files || this.files.length === 0) return;           // this will have a property "files"!

        var files = jt.Util.asNormalArray(this.files);

        // Tries to clear the last selected file so the same file can be chosen
        try {
            fileInputElement.value = "";
        } catch (ex) {
            // Ignore
        }

        var wasPaused = console.systemPause(true);
        var resume = function (s) {
            if (!wasPaused) console.systemPause(false);
        };

        if (files && files.length > 0) {
            if (files.length === 1)
                self.readFromFile(files[0], chooserOpenType, chooserPort, chooserAltPower, chooserAsExpansion, resume);
            else
                self.readFromFiles(files, chooserOpenType, chooserPort, chooserAltPower, chooserAsExpansion, resume);
        }

        return false;
    }

    function onDragOver(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer) {
            if (Javatari.CARTRIDGE_CHANGE_DISABLED)
                e.dataTransfer.dropEffect = "none";
            else if (e.ctrlKey)
                e.dataTransfer.dropEffect = "copy";
            else if (e.altKey)
                e.dataTransfer.dropEffect = "link";
        }

        dragButtons = e.buttons > 0 ? e.buttons : MOUSE_BUT1_MASK;      // If buttons not supported, consider it a left-click
    }

    function onDrop(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();
        e.target.focus();

        if (!e.dataTransfer) return;
        if (peripheralControls.mediaChangeDisabledWarning()) return;

        var wasPaused = console.systemPause(true);

        var port = e.shiftKey ? 1 : 0;
        var altPower = dragButtons & MOUSE_BUT2_MASK;
        var asExpansion = e.ctrlKey;

        var openType = OPEN_TYPE.AUTO;

        // Try to get local file/files if present
        var files = e.dataTransfer && e.dataTransfer.files;
        var resume = function (s) {
            if (!wasPaused) console.systemPause(false);
        };
        if (files && files.length > 0) {
            if (files.length === 1)
                self.readFromFile(files[0], openType, port, altPower, asExpansion, resume);
            else
                self.readFromFiles(files, openType, port, altPower, asExpansion, resume);
        } else {
            // If not, try to get URL
            var url = e.dataTransfer.getData("text");
            if (url && url.length > 0)
                self.readFromURL(url, openType, port, altPower, asExpansion, resume);
            else
                resume();
        }
    }

    function showError(message) {
        jt.Util.message("Could not load file(s):\n\n" + message + "\n");
    }

    function createFileInputElement() {
        fileInputElement = document.createElement("input");
        fileInputElement.id = "jt-file-loader-input";
        fileInputElement.type = "file";
        fileInputElement.multiple = true;
        fileInputElement.accept = INPUT_ACCEPT.AUTO;
        fileInputElement.style.display = "none";
        fileInputElement.addEventListener("change", onFileInputChange);
        fileInputElementParent.appendChild(fileInputElement);
    }


    var console;
    var cartridgeSocket;
    var saveStateSocket;

    var fileInputElement;
    var fileInputElementParent;

    var chooserOpenType;
    var chooserPort = 0;
    var chooserAltPower = false;
    var chooserAsExpansion = false;

    var dragButtons = 1;

    var MOUSE_BUT1_MASK = 1;
    var MOUSE_BUT2_MASK = 2;


    var OPEN_TYPE = jt.FileLoader.OPEN_TYPE;
    this.OPEN_TYPE = OPEN_TYPE;                         // For the programatic interface

    var INPUT_ACCEPT = {
        ROM:   ".bin,.BIN,.rom,.ROM,.a26,.A26,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP",
        STATE: ".jst,.JST",
        CART_DATA: ".dat,.DAT,.sram,.SRAM",
        AUTO:   ".bin,.BIN,.rom,.ROM,.a26,.A26,.jst,.JST,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP"
    };

    var INPUT_MULTI = {
        ROM:   false,
        STATE: false,
        CART_DATA: false,
        AUTO:   false
    };

    var TYPE_DESC = {
        ROM:   "ROM",
        STATE: "Savestate",
        CART_DATA: "Cartridge Data",
        AUTO:   "ROM"
    };

    var LOCAL_STORAGE_LAST_URL_KEY = "javatarilasturl";

    var DIR_NOT_SUPPORTED_HINT = '\n\nIMPORTANT: Directories are not supported for loading!';

    Javatari.fileLoader = this;

};

jt.FileLoader.OPEN_TYPE = {  AUTO: "AUTO", ROM: "ROM", STATE: "STATE", CART_DATA: "CART_DATA" };