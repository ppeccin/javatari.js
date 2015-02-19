/**
 * Created by ppeccin on 08/01/2015.
 */

function LocalStorageSaveStateMedia() {

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.saveStateFile = function(state) {
        return internalStartDownload("JavatariSave.jst", state);
    };

    this.saveState = function(slot, state) {
        return internalSaveToStorage("javatarisave" + slot, state);
    };

    this.loadState = function(slot) {
        return internalLoadFromStorage("javatarisave" + slot);
    };

    this.saveResourceToFile = function(entry, data) {
        return internalSaveToStorage(entry, data);
    };

    this.loadResourceFromFile = function(entry) {
        return internalLoadFromStorage(entry);
    };

    var internalSaveToStorage = function(entry, data) {
        if (!localStorage) return null;

        localStorage[entry] = JSON.stringify(data);
        return data;
    };

    var internalLoadFromStorage = function(entry) {
        if (!localStorage) return null;

        var data = localStorage[entry];
        try {
            if (data) return JSON.parse(data);
        } catch(e) {
            return null;
        }
    };

    var internalStartDownload = function (fileName, data) {
        // TODO Create and maintain only one link element inside a controlled parent

        var content = JSON.stringify(data);
        var blob = new Blob([content], {type: "data:application/octet-stream"});
        var link = document.createElement('a');
        link.download = fileName.trim();
        link.href = (window.URL || window.webkitURL).createObjectURL(blob);
        link.style.display = "none";
        document.body.appendChild(link);

        link.click();

        return true;
    };

}
