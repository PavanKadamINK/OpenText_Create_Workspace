sap.ui.define([
], function () {
    "use strict";
    return {
        formatStatusText: function (sStatus) {
            if (!sStatus) {
                return "";
            }

            if (sStatus === "NO DATA") {
                return "DATA ISSUE";
            }
            return sStatus; // default
        }
    }
})