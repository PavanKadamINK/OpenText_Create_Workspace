sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
     "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator" 
], function (Controller, MessageToast,Filter,FilterOperator) {
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
                    this.byId("jobIdFilter").setValue("");
                });
            } else {
                this._openProjectDialog();
                var oTable = that.byId("projectTable");
                if (oTable) oTable.removeSelections();
                this.byId("jobIdFilter").setValue("");

            }
        },

        onConfirmProjects: function () {
            var oTable = this.byId("projectTable");
            var aSelectedItems = oTable.getSelectedItems(); // multiple selection
            // No selection
            if (aSelectedItems.length === 0) return MessageToast.show("Please select at least one project!");
            // More than 10 selected
            if (aSelectedItems.length > 10) return sap.m.MessageBox.error("You can select a maximum of 10 projects only.");
            // Collect Job IDs
            var aJobIDs = [];
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext();
                var sJobID = oContext.getProperty("YY1_JobID_PPH");
                aJobIDs.push(String(sJobID));
            });
            // Call your function with array of JobIDs
            this.onBulkCreatePress(aJobIDs);
            this._oProjectDialog.close();
        },

        onCloseProjectDialog: function () {
            this._oProjectDialog.close();
        },

        _openProjectDialog: function () {
            var oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "projectTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [
                new Filter("YY1_JobID_PPH", FilterOperator.NE, "")
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
            var sQuery = oEvent.getParameter("newValue");
            var oSearchField = oEvent.getSource();

            // ✅ Allow only numbers
            var sNumericQuery = sQuery.replace(/[^0-9]/g, "");

            // Update field if user typed letters
            if (sQuery !== sNumericQuery) oSearchField.setValue(sNumericQuery);
            
            var oTable = this.byId("projectTable");
            var oBinding = oTable.getBinding("items");
            if (sNumericQuery) {
                var oFilter = new Filter("YY1_JobID_PPH",FilterOperator.Contains,sNumericQuery);
                oBinding.filter([oFilter]);
            } else {
                // clear filter if input is empty
                oBinding.filter([]);
            }
        },
        onSearch: function () {
            this.byId("idOpentextlogtable").rebindTable();
        },
        onClearFilter: function () {
            var oComboBox = this.byId("statusComboBox");
            oComboBox.setSelectedKey("")
        },
        onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            var oComboBox = this.byId("statusComboBox");
            var sStatus = oComboBox.getSelectedKey(); // SUCCESS / ERROR
            if (sStatus) oBindingParams.filters.push(new Filter("Status",FilterOperator.EQ,sStatus))
        },







    });
});
