sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("com.sap.winslow.otbulkcreateproject.controller.View1", {

        onInit: function () {
            this._selectedFile = null;
            this.excelData = [];
        },

        onOpenUploadDialog: function () {
            var oUploader = this.byId("excelUploader");
            if (oUploader) oUploader.clear();
            this._selectedFile = null;
            this.byId("excelUploadDialog").open();
        },

        onCloseUploadDialog: function () {
            this.byId("excelUploadDialog").close();
        },

        onCreateOpenTextProject: function () {
            var that = this;

            if (!this._oProjectDialog) {
                sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.sap.winslow.otbulkcreateproject.fragment.ProjectDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oProjectDialog = oDialog;
                    that.getView().addDependent(oDialog);
                    that._openProjectDialog();

                    var oTable = that.byId("projectTable");
                    if (oTable) oTable.removeSelections();
                });
            } else {
                this._openProjectDialog();
                var oTable = that.byId("projectTable");
                if (oTable) oTable.removeSelections();
            }
        },

        onConfirmProjects: function () {
            var oTable = this.byId("projectTable");
            var oSelectedItem = oTable.getSelectedItem(); // gets the selected row
            if (!oSelectedItem) return MessageToast.show("Please select a project first!");
            // Get the binding context of the selected row
            var oContext = oSelectedItem.getBindingContext();
            var sJobID = oContext.getProperty("YY1_JobID_PPH");  // get Job ID
            this.onBulkCreatePress([String(sJobID)]);

            this._oProjectDialog.close();
        },

        onCloseProjectDialog: function () {
            this._oProjectDialog.close();
        },

        _openProjectDialog: function () {
            var oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "projectTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [
                new sap.ui.model.Filter("YY1_JobID_PPH", sap.ui.model.FilterOperator.NE, "")
            ];
            oBinding.filter(aFilters);
            this._oProjectDialog.open();
        },

        onFileChange: function (oEvent) {
            const file = oEvent.getParameter("files")[0];
            this._selectedFile = file;
            if (!file) return MessageToast.show("No file selected");
            this._import(file);
        },

        _import: function (file) {
            var reader = new FileReader();
            var that = this;

            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);

                var workbook = XLSX.read(data, { type: "array" });

                // take first sheet
                var sheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[sheetName];

                // convert to JSON
                var excelData = XLSX.utils.sheet_to_json(worksheet);
                that.excelData = excelData;
                console.log("Excel Data:", excelData);
                MessageToast.show("Excel read successfully. Rows: " + excelData.length);
            };
            reader.onerror = function (err) {
                console.log("File read error", err);
            };
            reader.readAsArrayBuffer(file);
        },

        onConfirmUpload: function () {
            if (!this._selectedFile) return MessageToast.show("Please select an Excel file first");

            MessageToast.show("Uploading " + this._selectedFile.name);
            this.byId("excelUploadDialog").close();
            this.onBulkCreatePress(this.excelData.map(i => String(i["Job ID"])));
        },

        onBulkCreatePress: function (aJobIDs) {
            var oView = this.getView();
            var oModel = oView.getModel();

            oView.setBusy(true);

            oModel.create("/BulkOTCreation", {
                JobIDs: aJobIDs
            }, {
                success: function (oData) {
                    oView.setBusy(false);
                    sap.m.MessageBox.success(oData.BulkOTCreation || "Bulk processing started successfully");
                },
                error: function (oError) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Error while calling BulkOTCreation");
                }
            });
        },
        onFileSizeExceeds: function () {
            MessageToast.show("File size exceeds the 5 MB limit. Please choose a smaller file.");
        },
        onJobIdFilterChange: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue");
            const oTable = this.byId("projectTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const oFilter = new sap.ui.model.Filter(
                    "YY1_JobID_PPH",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );
                oBinding.filter([oFilter]);
            } else {
                // clear filter if input is empty
                oBinding.filter([]);
            }
        },
        // onBeforeRebindTable: function (oEvent) {
        //     var oBindingParams = oEvent.getParameter("bindingParams");

        //     // Clear existing sorters if needed
        //     oBindingParams.sorter = [];

        //     // Use exact property name from metadata
        //     oBindingParams.sorter.push(new sap.ui.model.Sorter("CreatedAt", true)); // descending
        // },




    });
});
