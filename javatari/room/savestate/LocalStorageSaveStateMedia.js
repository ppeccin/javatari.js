/**
 * Created by ppeccin on 08/01/2015.
 */

function LocalStorageSaveStateMedia() {

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.registerForDownloadElement = function (element) {
        downloadLinkElementParent = element;
    };

    this.saveState = function(slot, state) {
        var data = buildDataFromState(state);
        return data && saveToLocalStorage("save" + slot, data);
    };

    this.loadState = function(slot) {
        var data = loadFromLocalStorage("save" + slot);
        return buildStateFromData(data);
    };

    this.saveStateFile = function(fileName, state) {
        var data = buildDataFromState(state);
        return data && startDownload(fileName || "JavatariSave", data);
    };

    this.loadStateFile = function(data) {
        return buildStateFromData(data);
    };

    this.saveResourceToFile = function(entry, data) {
        try {
            var res = data && JSON.stringify(data);
            return saveToLocalStorage(entry, res);
        } catch(ex) {
            // give up
        }
    };

    this.loadResourceFromFile = function(entry) {
        try {
            var res = loadFromLocalStorage(entry);
            return res && JSON.parse(res);
        } catch(ex) {
            // give up
        }
    };

    var saveToLocalStorage = function(entry, data) {
        if (!localStorage) return;

        localStorage["javatari" + entry] = data;
        return true;
    };

    var loadFromLocalStorage = function(entry) {
        if (!localStorage) return;

        return localStorage["javatari" + entry];
    };

    var buildDataFromState = function(state) {
        try {
            return SAVE_STATE_IDENTIFIER + JSON.stringify(state);
        } catch(ex) {
            // give up
        }
    };

    var buildStateFromData = function (data) {
        try {
            var id;
            if (data instanceof Array)
                id = Util.uInt8ArrayToByteString(data.slice(0, SAVE_STATE_IDENTIFIER.length));
            else
                id = data.substr(0, SAVE_STATE_IDENTIFIER.length);

            // Check for the identifier
            if (id !== SAVE_STATE_IDENTIFIER) return;

            var stateData = data.slice(SAVE_STATE_IDENTIFIER.length);
            if (stateData instanceof Array)
                stateData = Util.uInt8ArrayToByteString(stateData);

            return stateData && JSON.parse(stateData);
        } catch(e) {
        }
    };

    var startDownload = function (fileName, data) {
        if (!downloadLinkElement) createDownloadLinkElement();

        // Release previous URL
        if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);

        if (fileName) fileName = fileName + SAVE_STATE_FILE_EXTENSION;
        var blob = new Blob([data], {type: "data:application/octet-stream"});
        downloadLinkElement.download = fileName.trim();
        downloadLinkElement.href = (window.URL || window.webkitURL).createObjectURL(blob);
        downloadLinkElement.click();

        return true;
    };

    var createDownloadLinkElement = function () {
        downloadLinkElement = document.createElement('a');
        downloadLinkElement.style.display = "none";
        downloadLinkElement.href = "#";
        downloadLinkElementParent.appendChild(downloadLinkElement);
    };


    var downloadLinkElement;
    var downloadLinkElementParent;

    var SAVE_STATE_IDENTIFIER = "javatarijsstate!";
    var SAVE_STATE_FILE_EXTENSION = ".jst";

}
