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
function login() {
}

var uLogin = new login();

login.prototype.renderLoginFields = function(calledFromCell) {
    $("#cpassdid").removeAttr("disabled");
    $("#useridtext").removeAttr("disabled");
    $("#useridtext").blur(function () {
        var uname = $(this).val();
        var validUserName = userid_validation(uname);
        if (validUserName) {
            if (uname.length > 0) {
                $("#userspanid").html("");
                //$("#userspanid").html("Checking availability...");
                $.ajax
                ({
                    type: "POST",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                        xhr.setRequestHeader("Pragma", "no-cache");
                        xhr.setRequestHeader("Expires", -1);
                    },
                    url: "check",
                    data: "useridtext=" + escape(uname),
                    cache: false,
                    success: function (response) {
                        var msg = "";
                        if (response['userIdMsg'] == "inUse") {
                            msg = uname + " is already in use";
                            $("#userspanid").removeClass('alertSuccessMsg');
                            $("#userspanid").addClass('alertmsg');
                            $("#ProceedButton").attr("disabled", "disabled");
                        } else if (response['userIdMsg'] == "available") {
                            msg = uname + " is available";
                            $("#userspanid").removeClass('alertmsg');
                            $("#userspanid").addClass('alertSuccessMsg');
                            $("#ProceedButton").removeAttr("disabled");
                        }
                        $("#userspanid").html(msg);
                    }
                });
            } else {
                $("#userspanid").html("");
            }
        }
    });

    var errorFlag = null;
    var showMessage = '';
    if (errorFlag == 'null' && showMessage == 'null') {
        document.getElementById("logoutDiv").style.visibility = "hidden";
    } else {
        document.getElementById("logoutDiv").style.visibility = "visible";
        $("#logoutDiv").addClass("loginErrorMessage");
        $("#logoutMsg").text(showMessage);
    }

    var user = localStorage ? localStorage.user : null;
    if (user) {
        document.getElementById("logoutDiv").style.visibility = "visible";
        $("#logoutDiv").addClass("logoutSuccess");
        //var username = sessionStorage.logoutShorterUName;
        $("#logoutMsg").text("You have logged out successfully.");
        $('#logoutMsg').attr('title', user);
        localStorage.user = '';
    }
    var browserLanguage = navigator.language;
    if (browserLanguage != undefined && browserLanguage.toLowerCase() == 'ja') {
        $("#ddLanguageSelector").val('Japanese(jp)');
    }

    if (calledFromCell) {
        // When called from Unit Admin Cell and login as Unit Admin, Unit Manager will be displayed.
        uLogin.initCellManager();
    }

    // If there is token in the parameter, log in automatically
    let hash = location.hash.substring(1);
    let params = hash.split("&");
    let arrParam = {};
    for (var i in params) {
        var param = params[i].split("=");
        arrParam[param[0]] = param[1]; 
    }
    if (arrParam.ref) {
        // Update the received token and try login
        var unitCellUrl = $("#unitUrl").val() + $("#unitCellName").val() + "/";
        let refreshTokenCredential = {
            grant_type: "refresh_token",
            refresh_token: arrParam.ref
        };
        login.refreshToken(unitCellUrl, refreshTokenCredential).done(function(jsonData){
            login.getCellInfo(jsonData);
        });
    } else if (arrParam.id && arrParam.password) {
        // Try login with id, pass
        var unitCellUrl = $("#unitUrl").val() + $("#unitCellName").val() + "/";
        $("#userId").val(arrParam.id);
        $("#passwd").val(arrParam.password);
        login.determineManagerType(unitCellUrl);
    } else {
        // Manual Login
        $('body > div.mySpinner').hide();
        $('body > div.myHiddenDiv').show();
    }

    // Clear fragments
    location.hash = "";
}
login.prototype.initCellManager = function() {
    // If it is not a local file, hide unitURL and unitCellName and extract from location.
    var cellUrlSplit = _.first(location.href.split("#")).split("/");
    if (!_.contains(cellUrlSplit, "file:") && !_.contains(cellUrlSplit, "localhost")) {
        // Hide unitURL and unitCellName
        $(".dtUnitUrl").toggle(false);
        $(".dtUnitCellName").toggle(false);
        $("#loginForm").addClass("localCellManager");

        // Extract rootURL and cell name from location
        var cellInfo = uLogin.getCellInfo(cellUrlSplit);

        $("#unitUrl").val(cellInfo.rootURL);
        $("#unitCellName").val(cellInfo.cellName);
    }
}

login.prototype.getEnvDetail = function() {
    document.getElementById("logoutDiv").style.visibility = "hidden";

    if (validateForm()) {
        $('body > div.mySpinner').show();
        $('body > div.myHiddenDiv').hide();
        var unitCellUrl = $("#unitUrl").val() + $("#unitCellName").val() + "/";
        $.ajax({
            type: "GET",
            url: unitCellUrl,
            headers:{
                'Accept':'application/xml'
            },
            success : function(res) {
                login.determineManagerType(unitCellUrl);
            },
            error : function(res) {
                document.getElementById("logoutDiv").style.visibility = "visible";
                $("#logoutDiv").addClass("loginErrorMessage");
                $("#logoutMsg").text("The target unitcell does not exist.");
            }
        });
    }
    return false;
}

/*
 * Get cell Info
 * Parameter:
 *     Information obtained by dividing URL by "/"
 *     {
 *       "https:",
 *       "",
 *       "demo.personium.io",
 *       "debug-user1",
 *       "test",
 *       "login.html"
 *     }
 * Return:
 *     {
 *       rootURL: "https://demo.personium.io/",
 *       cellURL: "https://demo.personium.io/debug-user1/",
 *       cellName: "debug-user1"
 *     }
 */
login.prototype.getCellInfo = function (cellUrlSplit) {
    let rootURL = _.first(cellUrlSplit, 3).join("/") + "/";
    let cellURL = _.first(cellUrlSplit, 4).join("/") + "/";
    let cellName = this.getName(cellURL);

    return {
        rootURL: rootURL,
        cellURL: cellURL,
        cellName: cellName
    };
}

/*
 * Retrieve cell name from cell URL
 * Parameter:
 *     1. ended with "/", "https://demo.personium.io/debug-user1/"
 *     2. ended without "/", "https://demo.personium.io/debug-user1"
 * Return:
 *     debug-user1
 */
login.prototype.getName = function (path) {
    if ((typeof path === "undefined") || path == null || path == "") {
        return "";
    };

    let name;
    if (_.contains(path, "\\")) {
        name = _.last(_.compact(path.split("\\")));
    } else {
        name = _.last(_.compact(path.split("/")));
    }

    return name;
};

login.determineManagerType = function(unitCellUrl) {
    let cellTokenCredential = {
        grant_type: "password",
        username: $("#userId").val(),
        password: $("#passwd").val()
    };
    let unitTokenCredential = $.extend(
        true,
        _.clone(cellTokenCredential),
        {
            p_target : $("#unitUrl").val()
        }
    );

    $.when(
        login.getToken(unitCellUrl, unitTokenCredential),
        login.getToken(unitCellUrl, cellTokenCredential)).done(function(json1, json2){
            login.isUnitCell(json1[0], json2[0]);
    });
}

login.getToken = function(unitCellUrl, loginInfo) {
    return  $.ajax({
        dataType : 'json',
        url : unitCellUrl + '__token' ,//+ tokenUrl,
        data : loginInfo,
        type : 'POST',
        async : false,
        cache : false,
        error : function(jsonData) {
            document.getElementById("logoutDiv").style.visibility = "visible";
            $("#logoutDiv").addClass("loginErrorMessage");
            $("#logoutMsg").text("Invalid username or password");
            $('body > div.mySpinner').hide();
            $('body > div.myHiddenDiv').show();
        }
    });
}

login.refreshToken = function(cellUrl, refreshInfo) {
    return $.ajax({
        dataType: 'json',
        url : cellUrl + '__token', //+ tokenUrl
        data : refreshInfo,
        type : 'POST',
        async : false,
        cache : false,
        error : function(jsonData) {
            document.getElementById("logoutDiv").style.visibility = "visible";
            $("#logoutDiv").addClass("loginErrorMessage");
            $("#logoutMsg").text("Invalid token");
            $('body > div.mySpinner').hide();
            $('body > div.myHiddenDiv').show();
        }
    })
}

login.isUnitCell = function(jsonData1, jsonData2) {
    $.ajax({
        type: "GET",
        url: $("#unitUrl").val() + '__ctl/Cell',
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + jsonData1.access_token
        },
        async : false,
        cache : false,
        success: function(res) {
            console.log("Unit Manager");
            let managerInfo = {
                isCellManager: false,
                loginURL: location.protocol + "//" + location.hostname + location.pathname,// Hold the URL of the login screen
                token: jsonData1.access_token,
                refreshToken: jsonData1.refresh_token
            };
            login.setupInfo(managerInfo);
            login.openManagerWindow();
        },
        error: function(res) {
            if (res.status === 403) {
                console.log("Cell Manager");
                login.getCellInfo(jsonData2);
            } else {
                console.log(res.status);
            }
        }
    });
}

/*
 * For user that can manage a cell, need to use PROPFIND to retrieve information about the cell. 
 * "Depth" must be set to zero to get only the information about the box.
 */
login.getCellInfo = function(jsonData) {
    $.ajax({
        type: "PROPFIND",
        url: $("#unitUrl").val() + $("#unitCellName").val() + "/__",
        headers: {
            'Accept':'application/xml',
            'Depth': '0',
            'Authorization':'Bearer ' + jsonData.access_token
        },
        async : false,
        cache : false,
        success: function(res, textStatus, xhr) {
            let lastModified = $(res).find('getlastmodified').first().text();
            let epoch = new Date(lastModified).getTime();
            let managerInfo = {
                isCellManager: true,
                __published: "/Date(" + epoch + ")/",//need to change to epoch time
                loginURL: location.protocol + "//" + location.hostname + location.pathname,// Hold the URL of the login screen
                token: jsonData.access_token,
                refreshToken: jsonData.refresh_token
            };
            login.setupInfo(managerInfo);
            login.openManagerWindow();
        },
        error: function(res) {
            console.log(res.status);
        }
    });
}

login.setupInfo = function(managerInfo) {
    localStorage.setItem("clickedEnvironmentUnitUrl", $("#unitUrl").val());
    localStorage.setItem("clickedEnvironmentUnitCellName", $("#unitCellName").val());
    localStorage.setItem("ManagerInfo", JSON.stringify(managerInfo));
    localStorage.setItem("selectedLanguage", $("#ddLanguageSelector").val());
}

login.openManagerWindow = function() {
    localStorage.setItem("contextRoot", "https://demo.personium.io/app-uc-unit-manager/__/unitmgr-light");

    location.href = 'https://demo.personium.io/app-uc-unit-manager/__/unitmgr-light/htmls/'+localStorage.selectedLanguage+'/environment.html';
}

//Closing account registration popup
function closeAcctReg() {
    clearData();
    $('#modalAcctReg, .window').hide();
}
        
function clearData() {
    $('#confirm').find('input:text').val('');
    $('#confirm').find('input:password').val('');
    $("#confirm").find('input:text').css("background-color", "white");
    $("#confirm").find('input:password').css("background-color", "white");
    $('#userspanid').html('');
    $('#passspanid').html('');
    $('#repassspanid').html('');
    $('#firstnameid').html('');
    $('#familynameid').html('');
    $('#orgspanid').html('');
    $('#emailspanid').html('');
}        

//Closing the success registration popup
function closeSuccessMsg() {
    $('#successMsgBlock, .window').hide();
}

//Cancel functionality on view screen
function back() {
    if (document.getElementById("register").style.display == "block") {
        document.getElementById("register").style.display = "none";
        document.getElementById("confirm").style.display = "block";
    }
}

//Opening account registration popup
function openAcctReg() {
    //$("#serverErrorMsg").hide();
    document.getElementById("logoutDiv").style.visibility = "hidden";
        $('#unitUrl').val('');
    $('#userId').val('');
    $('#passwd').val('');
        $('#unitspan').html('');
    $('#userspan').html('');
    $('#paswdspan').html('');
    var id = '#dialogAcctReg';
    // transition effect
    $('#modalAcctReg').fadeIn(1000);
    // Get the window height and width
    var winH = $(window).height();
    var winW = $(window).width();
    // Set the popup window to center
    $(id).css('top', winH / 2 - $(id).height() / 2);
    $(id).css('left', winW / 2 - $(id).width() / 2);
}