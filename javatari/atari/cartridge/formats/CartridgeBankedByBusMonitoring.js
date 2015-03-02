/**
 * Created by ppeccin on 20/11/2014.
 */

// Implements generic bank switching using unmasked address access via bus monitoring (outside Cart area)

function CartridgeBankedByBusMonitoring(rom, format) {

    this.needsBusMonitoring = function() {
        return true;
    };

    this.monitorBusBeforeRead = function(address, data) {
    };

    this.monitorBusBeforeWrite = function(address, val) {
    };

}

CartridgeBankedByBusMonitoring.prototype = Cartridge.base;

CartridgeBankedByBusMonitoring.base = new CartridgeBankedByBusMonitoring();


