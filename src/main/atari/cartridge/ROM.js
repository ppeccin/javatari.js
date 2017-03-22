// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.ROM = function(source, content, info, formatHint) {
"use strict";

    this.source = source;
    this.content = content;
    if (info) this.info = info;
    else this.info = jt.CartridgeCreator.produceInfo(this, formatHint);


    // Savestate  -------------------------------------------

    this.saveState = function(includeContent) {
        return {
            s: this.source,
            i: this.info,
            c: includeContent ? jt.Util.compressInt8BitArrayToStringBase64(this.content) : null     // content may not be needed in savestates
        };
    };

};

jt.ROM.loadState = function(state) {
"use strict";
    var c = state.c ? jt.Util.uncompressStringBase64ToInt8BitArray(state.c) : null;
    return new jt.ROM(state.s, c, state.i);
};
