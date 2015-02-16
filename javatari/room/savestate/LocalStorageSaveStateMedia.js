/**
 * Created by ppeccin on 08/01/2015.
 */

function LocalStorageSaveStateMedia() {

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.saveStateFile = function(state) {
        return internalSaveToFile("javatarisavefile", state);
    };

    this.saveState = function(slot, state) {
        return internalSaveToFile("javatarisave" + slot, state);
    };

    this.loadState = function(slot) {
        return internalLoadFromFile("javatarisave" + slot);
    };

    this.saveResourceToFile = function(fileName, data) {
        return internalSaveToFile(fileName, data);
    };

    this.loadResourceFromFile = function(fileName) {
        return internalLoadFromFile(fileName);
    };

    var internalSaveToFile = function(fileName, data) {
        if (!localStorage) return null;

        localStorage[fileName] = JSON.stringify(data);
        return data;
    };

    var internalLoadFromFile = function(fileName) {
        if (!localStorage) return null;

        var data = localStorage[fileName];
        try {
            if (data) return JSON.parse(data);
        } catch(e) {
            return null;
        }
    };

}
