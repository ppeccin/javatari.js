// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Util = new function() {

    this.log = function(str) {
        console.log(">> Javatari: " + str);
    };

    this.message = function(str) {
        alert(str);
    };

    this.arraysEqual = function(a, b) {
        var i = a.length;
        if (i !== b.length) return false;
        while (i--)
            if (a[i] !== b[i]) return false;
        return true;
    };

    this.arrayFill = function(arr, val) {
        var i = arr.length;
        while(i--)
            arr[i] = val;
        return arr;
    };

    this.arrayFillFunc = function(arr, func) {
        var i = arr.length;
        while(i--)
            arr[i] = func(i);
        return arr;
    };

    this.arrayFillWithArrayClone = function(arr, val) {
        var i = arr.length;
        while(i--)
            arr[i] = val.slice(0);
        return arr;
    };

    this.arrayFillSegment = function(arr, from, to, val) {
        //noinspection UnnecessaryLocalVariableJS
        var i = to;
        while(i-- > from)
            arr[i] = val;
        return arr;
    };

    this.arrayCopy = function(src, srcPos, dest, destPos, length) {
        var finalSrcPos = srcPos + length;
        while(srcPos < finalSrcPos)
            dest[destPos++] = src[srcPos++];
    };

    this.arrayCopy2 = function(src, srcPos, dest, destPos, length) {
        for (var i = length - 1; i >= 0; --i)
        dest[destPos + i] = src[srcPos + i];
    };

    this.uInt32ArrayCopyToUInt8Array = function(src, srcPos, dest, destPos, length) {
        var finalSrcPos = srcPos + length;
        destPos *= 4;
        while(srcPos < finalSrcPos) {
            var val =  src[srcPos++];
            dest[destPos++] = val & 255;
            dest[destPos++] = (val >> 8) & 255;
            dest[destPos++] = (val >> 16) & 255;
            dest[destPos++] = val >>> 24;
        }
    };

    this.arrayCopyCircularSourceWithStep = function(src, srcPos, srcLength, srcStep, dest, destPos, destLength) {
        var s = srcPos;
        var d = destPos;
        var destEnd = destPos + destLength;
        while (d < destEnd) {
            dest[d] = src[s | 0];   // as integer
            d++;
            s += srcStep;
            if (s >= srcLength) s -= srcLength;
        }
    };

    this.arrayRemove = function(arr, element) {
        var i = arr.indexOf(element);
        if (i < 0) return;
        arr.splice(i, 1);
    };

    this.booleanArrayToByteString = function(boos) {
        var str = "";
        for(var i = 0, len = boos.length; i < len; i++)
            str += boos[i] ? "1" : "0";
        return str;
    };

    this.byteStringToBooleanArray = function(str) {
        var boos = [];
        for(var i = 0, n = str.length; i < n; i++)
            boos.push(str.charAt(i) === "1");
        return boos;
    };

    // Only 8 bit values
    this.uInt8ArrayToByteString = function(ints) {
        var str = "";
        for(var i = 0, len = ints.length; i < len; i++)
            str += String.fromCharCode(ints[i] & 0xff);
        return str;
    };

    this.byteStringToUInt8Array = function(str) {
        var ints = [];
        for(var i = 0, len = str.length; i < len; i++)
            ints.push(str.charCodeAt(i) & 0xff);
        return ints;
    };

    // Only 32 bit values
    this.uInt32ArrayToByteString = function(ints) {
        var str = "";
        for(var i = 0, len = ints.length; i < len; i++) {
            var val = ints[i];
            str += String.fromCharCode((val & 0xff000000) >>> 24);
            str += String.fromCharCode((val & 0xff0000) >>> 16);
            str += String.fromCharCode((val & 0xff00) >>> 8);
            str += String.fromCharCode(val & 0xff);
        }
        return str;
    };

    this.byteStringToUInt32Array = function(str) {
        var ints = [];
        for(var i = 0, len = str.length; i < len;)
            ints.push((str.charCodeAt(i++) * (1 << 24)) + (str.charCodeAt(i++) << 16) + (str.charCodeAt(i++) << 8) + str.charCodeAt(i++));
        return ints;
    };

    // Only 8 bit values, inner arrays of the same length
    this.uInt8BiArrayToByteString = function(ints) {
        var str = "";
        for(var a = 0, lenA = ints.length; a < lenA; a++)
            for(var b = 0, lenB = ints[a].length; b < lenB; b++)
                str += String.fromCharCode(ints[a][b] & 0xff);
        return str;
    };

    // only inner arrays of the same length
    this.byteStringToUInt8BiArray = function(str, innerLength) {
        var outer = [];
        for(var a = 0, len = str.length; a < len;) {
            var inner = new Array(innerLength);
            for(var b = 0; b < innerLength; b++)
                inner[b] = str.charCodeAt(a++) & 0xff;
            outer.push(inner);
        }
        return outer;
    };

    this.reverseInt = function(val, bits) {
        var res = 0;
        for (var d = 0, e = bits - 1, s = e; s > 0; ++d, --e, s -= 2) {
            res |= (val & (1 << d)) << s;
            res |= (val & (1 << e)) >> s;
        }
        return res;
    };

    this.reverseInt8 = function(val) {
        return ((val & 0x01) << 7) | ((val & 0x02) << 5) | ((val & 0x04) << 3) | ((val & 0x08) << 1) | ((val & 0x10) >> 1) | ((val & 0x20) >> 3) | ((val & 0x40) >> 5) | ((val & 0x80) >> 7);
    };

    this.browserInfo = function() {
        if (this.browserInfoAvailable) return this.browserInfoAvailable;

        var ua = navigator.userAgent;
        var temp;
        var m = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(m[1])) {
            temp = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return this.browserInfoAvailable = { name:'IE', version: (temp[1] || '') };
        }
        if (m[1] === 'Chrome') {
            temp = ua.match(/\bOPR\/(\d+)/);
            if (temp != null) return this.browserInfoAvailable = { name:'Opera', version: temp[1] };
        }
        m = m[2] ? [m[1], m[2]]: [ navigator.appName, navigator.appVersion, '-?' ];
        if ((temp = ua.match(/version\/(\d+)/i)) != null) m.splice(1, 1, temp[1]);
        return this.browserInfoAvailable = {
            name: m[0].toUpperCase(),
            version: m[1]
        };
    };

};


