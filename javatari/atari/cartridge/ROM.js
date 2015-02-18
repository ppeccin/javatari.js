/**
 * Created by ppeccin on 14/01/2015.
 */

function ROM(source, content, info) {

    this.source = source;
    this.content = content;
    if (info) this.info = info;
    else this.info = CartridgeDatabase.produceInfo(this);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            source: this.source,
            info: this.info
            // content not needed in savestates
        };
    };

}

ROM.loadState = function(state) {
    return new ROM(state.source, null, state.info);
};
