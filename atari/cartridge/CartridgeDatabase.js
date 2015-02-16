/**
 * Created by ppeccin on 14/01/2015.
 */

function CartridgeDatabase() {

    this.createCartridgeFromRom = function(rom) {
        // Try to build the Cartridge if a supported format is found
        var options = getFormatOptions(rom);
        if (options.length === 0) return;

        // Choose the best option
        var bestOption = options[0];
        console.log(">>> " + bestOption.name + ": " + bestOption.desc + ", priority: " + bestOption.priority);
        return bestOption.createCartridgeFromRom(rom);
    };

    this.createCartridgeFromSaveState = function(saveState) {
        return CartridgeFormats[saveState.format].createCartridgeFromSaveState(saveState);
    };

    var getFormatOptions = function(rom) {
        var options = [];
        var option;
        for (var format in CartridgeFormats) {
            option = CartridgeFormats[format].tryFormat(rom);
            if (!option) continue;	    	    // rejected by format
            //boostPriority(option, rom.info);	// adjust priority based on ROM info
            options.push(option);
        }

        // If no Format could be found, throw error
        if (options.length === 0)
            throw new Error("Unsupported ROM Format. Size: " + rom.content.length);

        // Sort according to priority
        options.sort(function formatOptionComparator(a, b) {
           return a.priority - b.priority;
        });

        return options;
    };

}

CartridgeDatabase = new CartridgeDatabase();
