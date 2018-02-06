/**
 * Personium
 * Copyright 2016 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function snapshot() {
}

var uEventSnapshot = new snapshot();

/**
 * The purpose of this function is to get the Snapshot's Path.
 */
snapshot.prototype.getSnapshotPath = function(fileName) {
	var name = "";
	if (fileName) {
		name = "/" + fileName;
	}
	return getClientStore().baseURL + sessionStorage.selectedcell + "/__snapshot" + name;
};

/**
 * The purpose of this function is to return selected collection name from odata grid 
 */
snapshot.prototype.getSelectedSnapshotName = function(){
    var snapshotNameList = [];
    var noOfCollections = $("#snapshotTable tbody tr").length;
    for(var index = 0; index < noOfCollections; index++){
        if($("#wdrowid" + index).hasClass("selectRow")){
            snapshotNameList.push(document.getElementById("col" + index).title);
        }
    }
    return snapshotNameList.join(",");
};

/**
 * The purpose of this function is to set property pane header.
 */
snapshot.prototype.setPropsPaneHeader = function(strHeader) {
	$('#eventLogPropsPaneHeader').html(strHeader);
	$('#eventLogPropsPaneHeader').attr('title', strHeader);
};

snapshot.prototype.initSnapshot = function () {
	var currentFolderURL = uEventSnapshot.getSnapshotPath();
	var pathArray = currentFolderURL.split('/');
	var currentCollectionName = pathArray[(pathArray.length) - 1];
	uBoxDetail.populatePropertiesList(currentFolderURL, currentFolderURL, currentCollectionName, false, "");
	uBoxAcl.showSelectedResourceCount(0);
	uEventSnapshot.createEventSnapshotDetailsTable();
}

/**
 * The purpose of this function is to create event log details table.
 * 
 * @param logFolderName
 */
snapshot.prototype.createEventSnapshotDetailsTable = function () {
	$("#snapshotTable").find("tbody tr").remove();
	$("#snapshotchkSelectall").attr('checked', false);
	
	this.disableDownloadButton();
	this.disableImportButton();
	this.enableExportButton();

	var snapshotPath = uEventSnapshot.getSnapshotPath();
	var snapshotList = objOdata.getCollectionList(snapshotPath);
	var recordSize = snapshotList.length;
	var arrName = new Array();
	var arrLastModifiedDate = new Array();
	var dynamicTable = "";
	$("#snapshotTable tbody").scrollTop(0);
	for ( var count = 0; count < recordSize; count++) {
		var arrayData = snapshotList[count];
		var collectionURL = arrayData.Name;
		arrName[count] = arrayData.Name;
		arrLastModifiedDate[count] = arrayData.Date;
		var contentLength = arrayData.ContentLength;
		var type = arrayData.Type;
		var fileType = "'"+type+"'";
		var collectionName = decodeURIComponent(objOdata.getName(arrName[count].toString()));	
		var aclCollectionName = "'"+collectionName+"'";
		var collectionURLValueTemp = "'" + collectionURL + "'";
		collectionURLValueTemp = decodeURIComponent(collectionURLValueTemp);
		var lastModifiedDate = objCommon.convertEpochDateToReadableFormat(arrLastModifiedDate[count]);
		dynamicTable += '<tr class="dynamicRow" id = "wdrowid'+count+'" onclick="objCommon.rowSelect(this,'+ "'wdrowid'" +','+ "'wdchkBox'"+','+ "'row'" +','+ "'btnDeleSnapshot'" +','+ "'snapshotchkSelectall'" +','+ count +',' + recordSize + ','+"'editBtn'"+','+aclCollectionName+','+false+', '+fileType+','+"'snapshotTable'"+');"><input type="hidden" id = "fileTypeId'+count+'" value="'+fileType+'"/>';
		dynamicTable = objOdata.createRows(dynamicTable, collectionName,
			lastModifiedDate, collectionURL, type, count, contentLength);
	}
	if (recordSize == 0) {
		$("#snapshotTable thead tr").addClass('mainTableHeaderRow');
		var emptyFolderTextMessage = getUiProps().MSG0415;
		var emptyFolderMsg = '<tr id="msg"><td id="msg" colspan="4" style="width:100%;"><div id="dvemptyTableOdataMessageFile" style="margin-left: 50%;" class="emptyFolderMessage"' + 
		'>'+emptyFolderTextMessage+'</div></td><td id="msg"></td></tr>';
		dynamicTable = emptyFolderMsg;
	} else {
		$("#snapshotTable thead tr").addClass('mainTableHeaderRow');
		$("#snapshotTable tbody").addClass('webDavTableTbody');
	}
	$("#snapshotTable tbody").append(dynamicTable);
	$(".boxDetailTable tbody tr:even").css("background-color", "#F4F4F4");
	objOdata.setMarginForEmptyFolderMessage();
};

/**
 * The purpose of this function is to get path of event log file.
 * 
 * @param baseUrl
 * @param cellName
 * @param logFolderName
 * @param logFileName
 * @returns {String}
 */
snapshot.prototype.getLogFilePath = function (baseUrl, cellName, logFolderName, logFileName) {
	if (!baseUrl.endsWith("/")) {
		baseUrl += "/";
	}
	var path = baseUrl+cellName+"/__log/";
	path += logFolderName;
	if (!path.endsWith("/")) {
		path += "/";
	}
	path += logFileName;
	return path;
};

/**
 * The purpose of this function is to refresh event log table.
 */
snapshot.prototype.refreshEventSnapshotTable = function() {
	uFileDownload.disableDownloadArea();
	this.initSnapshot();
};

/**
 * The purpose of this function is to perform check all operation.
 * 
 * @param cBox
 */
snapshot.prototype.checkAll = function (cBox) {
	uFileDownload.disableDownloadArea();
	var buttonId = '#btnDeleSnapshot';
	objCommon.disableDeleteIcon(buttonId);
	objOdata.checkBoxSelectOData(cBox, buttonId);
	objCommon.showSelectedRow(document.getElementById("snapshotchkSelectall"),"row","wdrowid");
	var noOfRecords = $("#snapshotTable > tbody > tr").length;
	if ($("#snapshotchkSelectall").is(':checked')) {
		if(noOfRecords >= 1) { 
			objCommon.activateCollectionDeleteIcon(buttonId);
		}
		if(noOfRecords > 1) {
			uBoxAcl.showSelectedResourceCount(noOfRecords);
		} else if(noOfRecords == 1){
			var checkedCollectionName = "";
			for ( var index = 0; index < noOfRecords; index++) {
				if ($('#wdchkBox' + index).is(':checked')) {
					checkedCollectionName = $("#boxDetailLink_"+index).text();
					break;
				}
			}
			var currentFolderURL = sessionStorage.Path;
			var urlArray = currentFolderURL.split("/");
			var len = urlArray.length;
			urlArray[len] = checkedCollectionName;
			var checkedCollectionURL = urlArray.join("/");
			var selectedFileType = objOdata.getFileType();
			uBoxDetail.populatePropertiesList(checkedCollectionURL, checkedCollectionURL, checkedCollectionName, false, selectedFileType);
			uEventSnapshot.disableDownloadButton();
		}
	}else{
		var lengthBreadCrumb = $("#tblBoxBreadCrum tbody tr").length;
		var type ="";
		if(lengthBreadCrumb == 1){
			type = "box";
		}else if(lengthBreadCrumb > 1){
			type = "folder";
		}
		var currentFolderURL = uEventSnapshot.getSnapshotPath();
		var pathArray = currentFolderURL.split('/');
		var currentCollectionName = pathArray[(pathArray.length) - 1];
		var target = document.getElementById('spinner');
		var spinner = new Spinner(opts).spin(target);
		setTimeout(function() {
			uBoxDetail.populatePropertiesList(currentFolderURL, currentFolderURL, currentCollectionName, false, type);
			uBoxAcl.showSelectedResourceCount(0);
			spinner.stop();
		}, 1);
	}
	objOdata.setMarginForSelectedResourcesMessage();
/*
	if (cBox.checked == true) { 
		$("#snapshotTable tbody tr ").addClass('selectRow');
		$(".chkClass").attr('checked', true); 
		if (logFolderName.length > 0) {
			this.enableDownloadButton();
		}
		return true;
	}
	$("#snapshotTable tbody tr ").removeClass('selectRow');
	$(".chkClass").attr('checked', false);
	this.disableDownloadButton();
	var isInsideFolder = $('#anchorRootSnapshot').hasClass("linkLogBreadCrumb");
	if(!isInsideFolder) {
		this.setPropsPaneHeader("Snapshot");
	}
*/
};

snapshot.prototype.openDeleteSnapshotDetailEntityPopUp = function() {
	if($("#btnDeleSnapshot").hasClass("deleteIconWebDavEnabled")){
			uEventSnapshot.openPopUpWindow('#snapshotFileDeleteDialogBox','#snapshotFileDeleteModalWindow');
	}
}

/**
 * The purpose of this function is to enable download button. 
 */
snapshot.prototype.enableDownloadButton = function () {
	$("#dvDownLoadIcon").removeClass();
	$("#dvDownLoadText").removeClass();
	$("#dvDownLoadIcon").addClass("downloadWebDavIconEnabled");
	$("#dvDownLoadText").addClass("downloadWebDavTextEnabled");
	uEventSnapshot.downloadHoverEffect();
	document.getElementById('downloadWebDavWrapper').style.pointerEvents = 'auto';
};


/**
 * The purpose of this function is to disable download button.
 */
snapshot.prototype.disableDownloadButton = function() {
	$("#dvDownLoadIcon").removeClass();
	$("#dvDownLoadText").removeClass();
	$("#dvDownloadIcon").removeAttr('style');
	$("#dvDownloadText").removeAttr('style');
	$("#dvDownLoadIcon").addClass("downloadWebDavIconDisabled");
	$("#dvDownLoadText").addClass("downloadWebDavTextDisabled");
	document.getElementById('downloadWebDavWrapper').style.pointerEvents = 'none';
};

/**
 * The purpose of this function is to enable download button. 
 */
snapshot.prototype.enableImportButton = function () {
	$("#importCellIcon").removeClass();
	$("#importCellText").removeClass();
	$("#importCellIcon").addClass("uploadWebDavIconEnabled");
	$("#importCellText").addClass("uploadWebDavTextEnabled");
	uEventSnapshot.downloadHoverEffect();
	document.getElementById('importCellWrapper').style.pointerEvents = 'auto';
};


/**
 * The purpose of this function is to disable download button.
 */
snapshot.prototype.disableImportButton = function() {
	$("#importCellIcon").removeClass();
	$("#importCellText").removeClass();
	$("#importCellIcon").removeAttr('style');
	$("#importCellText").removeAttr('style');
	$("#importCellIcon").addClass("uploadWebDavIconDisabled");
	$("#importCellText").addClass("uploadWebDavTextDisabled");
	document.getElementById('importCellWrapper').style.pointerEvents = 'none';
};

/**
 * The purpose of this function is to enable download button. 
 */
snapshot.prototype.enableExportButton = function () {
	$("#exportCellIcon").removeClass();
	$("#exportCellText").removeClass();
	$("#exportCellIcon").addClass("downloadWebDavIconEnabled");
	$("#exportCellText").addClass("downloadWebDavTextEnabled");
	uEventSnapshot.downloadHoverEffect();
	document.getElementById('exportCellWrapper').style.pointerEvents = 'auto';
};

/**
 * The purpose of this method is to show hover effect on Download file area.
 */
snapshot.prototype.downloadHoverEffect = function(){
	$("#exportCellWrapper").hover(function(){
		$("#exportCellIcon").css("background","url(./images/newSprite.png) no-repeat -16px -823px");
		$("#exportCellText").css("color","#c80000");
		$("#exportCellWrapper").css("cursor","pointer");
	},function(){
		$("#exportCellIcon").css("background","url(./images/newSprite.png) no-repeat -16px -790px");
		$("#exportCellText").css("color","#1b1b1b");
	});
};

/**
 * The purpose of this method is to show hover effect on Download file area.
 */
snapshot.prototype.exportHoverEffect = function(){
	$("#exportWebDavWrapper").hover(function(){
		$("#dvDownLoadIcon").css("background","url(./images/newSprite.png) no-repeat -16px -823px");
		$("#dvDownLoadText").css("color","#c80000");
		$("#downloadWebDavWrapper").css("cursor","pointer");
	},function(){
		$("#dvDownLoadIcon").css("background","url(./images/newSprite.png) no-repeat -16px -790px");
		$("#dvDownLoadText").css("color","#1b1b1b");
	});
};

/**
 * The purpose of this method is to perform attach file operation
 */
snapshot.prototype.attachFile = function () {
    var file = document.getElementById('fileID').files[0];
    objOdata.fileName = document.getElementById("fileID").value;
	var spinner = "";
    if(file) {
     objOdata.spinner = objOdata.showSpinnerForUploadFile();
      document.getElementById("dvGreyOut").style.display = 'block';
       var fileSize = file.size/1024/1024;
       if(objOdata.validateFileName(objOdata.fileName, fileSize)){
           setTimeout(function(){uEventSnapshot.uploadFile(file);},200);
           //objOdata.getAsBinaryString(file);
       }
   }
   document.getElementById('fileID').value = '';
   uFileDownload.disableDownloadArea();
};

/**
 * The purpose of this method is to perform upload file operation
 */
snapshot.prototype.uploadFile = function (fileData) {
    var response = "";
    if (objOdata.fileName.indexOf("fakepath") != -1) {
        objOdata.fileName = objOdata.fileName.substring(objOdata.fileName.lastIndexOf("fakepath") + 9);
    }	
    objOdata.contentType = fileData.type;
    if (objOdata.contentType.length == 0) {
        objOdata.contentType = objOdata.setContentType();
    }
    var baseUrl = getClientStore().baseURL;
    if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
    }
    var cellName = sessionStorage.selectedcell;
    var path = uEventSnapshot.getSnapshotPath();
   // path += collectionPath;
    var accessor = objCommon.initializeAccessor(baseUrl, cellName);
    try {
		var objJDavCollection = new _pc.DavCollection(accessor, path);
		response = objJDavCollection.put(objOdata.fileName, objOdata.contentType, fileData, "*");
		if (response.getBody() != undefined) {
			response = response.getBody();
		} 
    	if (response.httpClient.status == 201 || response.httpClient.status == 204) {
    		uEventSnapshot.refreshEventSnapshotTable();
    		objCollectionOdata.displaySuccessMessage(getUiProps().MSG0260, 188);
    	} 
   	}catch(exception){
   		objCollectionOdata.displayErrorMessage(getUiProps().MSG0261, 178);
	}
   	$("#webDavDetailBody").show();
	$("#webDavDetailMessageBody").hide();
	document.getElementById("dvGreyOut").style.display = 'none';
    objOdata.spinner.stop();
};

$(window).resize(function(){
	uEventSnapshot.setDynamicWidth();
});

snapshot.prototype.setDynamicWidth = function(){
	var height = $(window).height();
	$("#webDavDetails").css('min-height', "425px");
	if (height>=650) {
		$("#webDavDetails").css('min-height', height - 225);
	}
};

/**
 * The purpose of this function is to open pop up window for delete of
 * snapshots.
 * 
 * @param idDialogBox
 * @param idModalWindow
 */
snapshot.prototype.openPopUpWindow = function (idDialogBox, idModalWindow) {
    var response = objCommon.getMultipleSelections('snapshotTable','input','boxDetailCase');
    sessionStorage.SnapshotNames = response;

    $(idModalWindow).fadeIn(0);
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    $(idDialogBox).css('top', windowHeight / 2 - $(idDialogBox).height() / 2);
    $(idDialogBox).css('left', windowWidth / 2 - $(idDialogBox).width() / 2);
    $('#btnCancelSnapshotDelete').focus();
};

/**
 * The purpose of this function is to delete multiple snapshots.
 */
snapshot.prototype.deleteMultipleSnapshots = function() {
	// showSpinner("modalSpinnerBoxOdata");
	var snapshotNames = sessionStorage.SnapshotNames;
	var arrSnapshotNames = snapshotNames.split(',');
	for ( var count = 0; count < arrSnapshotNames.length; count++) {
		uEventSnapshot.deleteFiles(arrSnapshotNames[count]);
	}
	uEventSnapshot.displayAllMessages();

	// removeSpinner("modalSpinnerBoxOdata");
};

/**
 * The purpose of this function is to delete snapshots on the basis of ID.
 * 
 * @param id
 */
snapshot.prototype.deleteFiles = function(id) {
	var statusCode = uEventSnapshot.retrieveResponse(id);
	if (statusCode == 204) {
		sbSuccessful += id + ",";
	} else if (statusCode == -100 || statusCode >= 400) {
		sbConflict += id + ",";
	}
};

/**
 * The purpose of this function is to retrieve API response.
 * 
 * @param id
 * @returns
 */
snapshot.prototype.retrieveResponse = function(id) {
	var path = uEventSnapshot.getSnapshotPath();
	var baseUrl = getClientStore().baseURL;
	var cellName = sessionStorage.selectedcell.toString();
	var accessor = objCommon.initializeAccessor(baseUrl, cellName);
	var objDav = new _pc.DavCollection(accessor, path);
	/** Specify recursive deletion */
	var response = objDav.del(id);
	var statusCode = objCommon.getStatusCode(response);
	return statusCode;
};

/**
 * The purpose of this function is to display success and conflict messages, in
 * multiple delete scenario.
 */
snapshot.prototype.displayAllMessages = function() {
	objCommon.disableDeleteIcon("#btnDeleteCollection");
	sbSuccessful = sbSuccessful.substring(0, sbSuccessful.length - 1);
	sbConflict = sbConflict.substring(0, sbConflict.length - 1);
	$('#snapshotFileDeleteModalWindow, .window').hide();
	if (sbSuccessful.length > 0 && sbConflict.length < 1) {
		objCollectionOdata.displaySuccessMessage(entityCount(sbSuccessful)
					+ " " + getUiProps().MSG0416, 0);
	} else if (sbSuccessful.length < 1 && sbConflict.length > 0) {
		objCollectionOdata.displayErrorMessage(entityCount(sbConflict)
					+ " " + getUiProps().MSG0417, 0);
	} else if (sbSuccessful.length > 0 && sbConflict.length > 0) {
		objCollectionOdata.displayErrorMessage(entityCount(sbSuccessful)
					+ " " + getUiProps().MSG0323 + " "
					+ (entityCount(sbConflict) + entityCount(sbSuccessful))
					+ " " + getUiProps().MSG0416, 0);
	}

	uEventSnapshot.refreshEventSnapshotTable();
	sbSuccessful = "";
	sbConflict = "";
};

/* The purpose of this function is to open the import/export cell pop up.
 */
snapshot.prototype.openAdminModalWindow = function(type) {
	var id = '#snapshotDialog';
	document.getElementById("popupErrorMsgSnapshotText").innerHTML = null;
	document.getElementById("popupErrorMsgCapchaText").innerHTML = null;

	jquery1_9_0("#btnExecute").off("click");
	$("#textSnapshot").val('');
	$("#textCapcha").val('');
	switch(type) {
		case "import":
			$(id).css("height", "420px");
			$("#lblHeadingAccessToken").text("Import Cell");
			$("#snapshotTextFiled").css("display", "none");
			$("#capchaField").css("display", "block");
			$("#deleteCellWarningText").css("display", "none");
			$("#importCellWarningText").css("display", "block");
			jquery1_9_0("#btnExecute").on("click", uEventSnapshot.importCell).val("Import");
			break;
		case "export":
			$(id).css("height", "300px");
			$("#lblHeadingAccessToken").text("Export Cell");
			$("#snapshotTextFiled").css("display", "block");
			$("#capchaField").css("display", "none");
			jquery1_9_0("#btnExecute").on("click", uEventSnapshot.exportCell).val("Export");;
			break;
	}
	$('#adminModal').fadeIn("fast");	
	var winH = $(window).height();
	var winW = $(window).width();
	$('#labelCapcha').val(generateCapchaText());
	$(id).css('top', winH / 2 - $(id).height() / 2);
	$(id).css('left', winW / 2 - $(id).width() / 2);
}

/* The purpose of this function is to close the import/ezport cell pop up.
 */
snapshot.prototype.closeAdminModalWindow = function() {
	$('#adminModal, .window').hide("fast");
}

/* The purpose of this function is to validate the snapshot file text entered by User.
 * @param importFlg true:import false:export
 */
snapshot.prototype.validateSnapshotFileText = function() {
	var enterText = $("#textSnapshot").val();
	if (enterText==="" || enterText===null || enterText===undefined ) {
		document.getElementById("popupErrorMsgSnapshotText").innerHTML = getUiProps().MSG0411;
		return false;
	}

	var baseUrl  = getClientStore().baseURL; 
	var cellname = sessionStorage.selectedcell;
	var accessor = objCommon.initializeAccessor(baseUrl, cellname,"","");
	var objCellManager = new _pc.CellManager(accessor);	
	var response = objCellManager.getSnapshotFile(cellName, enterText);

	if(response.httpClient.status === 200) {
		document.getElementById("popupErrorMsgSnapshotText").innerHTML = getUiProps().MSG0410;
		return false;
	}

	return true;
}

/* The purpose of this function is to import the selected cell.
 */
snapshot.prototype.importCell = function() {
	document.getElementById("popupErrorMsgSnapshotText").innerHTML = null;
	document.getElementById("popupErrorMsgCapchaText").innerHTML = null;

	if (validateCapchaText()) {
		//showSpinner("modalSpinnerCellProfile");
		$("#btnExecute").css('pointer-events','none');
		var objCommon = new common();
		var baseUrl  = getClientStore().baseURL; 
		var cellname = sessionStorage.selectedcell;
		var accessor = objCommon.initializeAccessor(baseUrl, cellname,"","");
		var objCellManager = new _pc.CellManager(accessor);
		var body = {};
		body.Name = uEventSnapshot.getSelectedSnapshotName().split("\.")[0];
		var response = objCellManager.cellImport(cellname, body);
		if(response.httpClient.status === 202) {
			logoutManager();
		} else {
			objCollectionOdata.displayErrorMessage(getUiProps().MSG0414, 0);
		}
	}
}
/* The purpose of this function is to export the selected cell.
 */
snapshot.prototype.exportCell = function() {
	if (uEventSnapshot.validateSnapshotFileText()) {
		//showSpinner("modalSpinnerCellProfile");
		$("#btnExecute").css('pointer-events','none');
		var objCommon = new common();
		var baseUrl  = getClientStore().baseURL; 
		var cellname = sessionStorage.selectedcell;
		var accessor = objCommon.initializeAccessor(baseUrl, cellname,"","");
		var objCellManager = new _pc.CellManager(accessor);	
		var body = {};
		body.Name = $("#textSnapshot").val();
		var response = objCellManager.cellExport(cellname, body);
		if(response.httpClient.status === 202) {
			objCollectionOdata.displaySuccessMessage(getUiProps().MSG0413, 0);
		} else {
			objCollectionOdata.displayErrorMessage(getUiProps().MSG0412, 0);
		}
		$("#btnExecute").css("pointer-events","all");
		uEventSnapshot.refreshEventSnapshotTable();
		uEventSnapshot.closeAdminModalWindow();
	}
}