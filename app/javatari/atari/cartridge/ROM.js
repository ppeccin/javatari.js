// Copyright 2015 by Paulo Augusto Peccin. See licence.txt distributed with this file.

function ROM(source, content, info) {

    this.source = source;
    this.content = content;
    if (info) this.info = info;
    else this.info = CartridgeDatabase.produceInfo(this);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: this.source,
            i: this.info
            // content not needed in savestates
        };
    };

}

ROM.loadState = function(state) {
    return new ROM(state.s, null, state.i);
};
