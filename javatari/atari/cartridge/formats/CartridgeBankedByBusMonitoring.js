/**
 * Created by ppeccin on 20/11/2014.
 */

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


