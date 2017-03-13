// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.ROM = function(source, content, info, formatHint) {
"use strict";

    this.source = source;
    this.content = content;
    if (info) this.info = info;
    else this.info = jt.CartridgeCreator.produceInfo(this, formatHint);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: this.source,
            i: this.info
            // content not needed in savestates
        };
    };

};

jt.ROM.loadState = function(state) {
"use strict";
    return new jt.ROM(state.s, null, state.i);
};
