let processingUrls = {};    
let categoryCache = {};
var gpaExistenceMap = {};
var his_range = 1;
var isFetchingGPA = false;
var usr_setting = {};
var enable_state = true;
var did_autocalcall = false;
var working_sms = 24699;
var working_sms_sequenceId = 1;
var faceErrorWhileCalc = false;
var isFetchOriginal = false;
var sequenceDic = {24700:0, 24699:1, 21208:2, 21207:3}; 
var smsCalcStat = new Array();

var zeroAmounts = 0;
var fullScoreAmounts = 0;
var zeroAssignmentList = [];

var smsDateList = [];
if(getFromLocalStorage("Info-SmsDateList")){
    smsDateList = getFromLocalStorage("Info-SmsDateList");
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.create({url: "https://tsinglanstudent.schoolis.cn"});
  });
  


var usrAssignmentsInfo = {};
var usrAssignmentsBriefInfo = [];

const gpaRules = [
    {"displayName":"A+","minValue":97.00,"maxValue":9999.90,"sort":0,"gpa":4.30},
    {"displayName":"A","minValue":93.00,"maxValue":96.9999,"sort":1,"gpa":4.00},
    {"displayName":"A-","minValue":90.00,"maxValue":92.9999,"sort":2,"gpa":3.70},
    {"displayName":"B+","minValue":87.00,"maxValue":89.9999,"sort":3,"gpa":3.30},
    {"displayName":"B","minValue":83.00,"maxValue":86.9999,"sort":4,"gpa":3.00},
    {"displayName":"B-","minValue":80.00,"maxValue":82.9999,"sort":5,"gpa":2.70},
    {"displayName":"C+","minValue":77.00,"maxValue":79.9999,"sort":6,"gpa":2.30},
    {"displayName":"C","minValue":73.00,"maxValue":76.9999,"sort":7,"gpa":2.00},
    {"displayName":"C-","minValue":70.00,"maxValue":72.9999,"sort":8,"gpa":1.70},
    {"displayName":"D+","minValue":67.00,"maxValue":69.9999,"sort":9,"gpa":1.30},
    {"displayName":"D","minValue":63.00,"maxValue":66.9999,"sort":10,"gpa":1.00},
    {"displayName":"D-","minValue":60.00,"maxValue":62.999,"sort":11,"gpa":0.70},
    {"displayName":"F","minValue":0.00,"maxValue":59.999,"sort":12,"gpa":0.00}
];


// ========================================================
// 主函数入口
// ========================================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 定义监听的地址
    const LoginPattern = "https://tsinglanstudent.schoolis.cn/";
    const LoginPattern2 = "https://tsinglanstudent.schoolis.cn/#!/";
    const HomepagePattern = "https://tsinglanstudent.schoolis.cn/Home#!/task/list";


    if(tab.url==undefined){
        return;
    }
    // 当URL变化时，重新注入内容脚本（上古时期的代码了，反正能跑）
    if (changeInfo.url && tab.url.includes("https://tsinglanstudent.schoolis.cn/Home#!/task/stat")) {
        // 清除先前的content.js实例
        chrome.tabs.executeScript(tabId, {
            code: `
                if (window.checkInterval) {
                    clearInterval(window.checkInterval);
                    window.checkInterval = null;
                }
            `
        }, () => {
            // 重新注入新的content.js实例
            if (!window.contentScriptInjected) {
            chrome.tabs.executeScript(tabId, {file: "content.js"});
            window.contentScriptInjected = true;

        }
        });


    } else if (changeInfo.url && tab.url.includes("https://tsinglanstudent.schoolis.cn/Home#!/realtime/list")) {
        setTimeout(() => {
            send_short_msg("replace_context",0); // 等待200ms后向content.js发送消息
            
        }, 200);
        
    } else if (tab.url === LoginPattern || tab.url.includes(LoginPattern2)) {
        //当用户打开登录界面（代表着用户退出了登录，即重置所有设置）
        did_autocalcall = false;
        smsCalcStat = [];
        localStorage.clear();
        usrAssignmentsInfo = {};
        usrAssignmentsBriefInfo = [];
        send_short_msg("bp-logpageState",0);
        setTimeout(() => {
            send_short_msg("bp-logpageState",0);
        }, 1000);
        setTimeout(() => {
            send_short_msg("bp-logpageState",0);
        }, 2000);
        console.log("LocalStorageCleared");
        chrome.storage.local.get('user_preference', function(data) {
            if (data.user_preference) {
                console.log('Loaded preferences:', data.user_preference);
                usr_setting = data.user_preference;
            } else {
                // 如果用户第一次安装插件
                console.log('No preferences found.');
                var langSet = navigator.language || navigator.userLanguage; 
                if(langSet.includes('CN')){
                    defaultwelcomeMsg = "https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN"
                }else{
                    defaultwelcomeMsg = "https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN"
                }
                var user_preference = {
                    calcRange: parseInt(1, 10),
                    homeSrc: defaultwelcomeMsg,
                    autoHide: true,
                    advLogPage: true, 
                    advScoreShadow: false,
                    autologNtw: 0,
                    homeSrcDark: " ",
                    homeDarkMode: 1,
                    autoHide_Condition: parseInt(60, 10)
                };
                chrome.storage.local.set({user_preference: user_preference});
                usr_setting = user_preference;
                setTimeout(() => {
                    send_str_msg("tip_info_long",tlang("Giaoculator安装成功！<br>点击右下角悬浮球即可进入设置界面！","Welcome to Giaoculator, <br>Click the floating ball at the bottom right corner to enter the settings!"),0)
                }, 150);
            }
        });
        chrome.storage.local.get('enable_state', function(data) {
            if (data.enable_state != undefined) {
                console.log('Loaded EState:', data.enable_state);
                enable_state = data.enable_state;
            } else {
                // 如果用户第一次安装插件
                console.log('No Estate found, set to true.');
                chrome.storage.local.set({enable_state: true});
                enable_state = true;
            }
        });
    } else if (tab.url === HomepagePattern) {
        send_short_msg("bp-showRefresh",0);
        if(localStorage.length < 2 && enable_state === true){
            if(!did_autocalcall){
                did_autocalcall = true;
                console.log("Do autocalc");
                console.log("[HPPattern] Do autocalc");
                AutoCalcAll();
            }
        }else{
            var updateDate = getFromLocalStorage("lastUpdate");
            console.log(Date.parse(new Date()),updateDate,Date.parse(new Date()) - updateDate );
            if(Date.parse(new Date()) - updateDate> 36000000){//
                send_str_msg("tip_info",(navigator.language || navigator.userLanguage).includes('CN')?`数据已过期，自动重新计算`:`Data Expired, Calculating...`,0);
                localStorage.clear();
                
                did_autocalcall = false;
                AutoCalcAll();
            }else{
                //send_str_msg("tip_info",Date.parse(new Date()) - updateDate,0)
            }
        }
        
    }
});

function TeamsToSchoolisTimeDate(isoString) {
    const date = new Date(isoString);
    const timestamp = date.getTime();
    const timezoneOffset = -date.getTimezoneOffset();
    const hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
    const minutesOffset = Math.abs(timezoneOffset) % 60;
    const timezoneString = (timezoneOffset >= 0 ? '+' : '-') + 
                            String(hoursOffset).padStart(2, '0') + 
                            String(minutesOffset).padStart(2, '0');

    return `/Date(${timestamp}${timezoneString})/`;
}

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const detailsUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=";
        const GPAUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetGpa?semesterId=";
        const GiaoculatorClassUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=gcalc";
        const InfoPagePattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId";
        const PresentAssignmentPattern = "https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?";
        if (details.url.startsWith(InfoPagePattern)&&(!details.url.includes("gcalc_bg"))) {
            setTimeout(() => {
                const urlParams = new URLSearchParams(new URL(details.url).search);
                let req_subjectId = urlParams.get('subjectId');
                let req_semesterId = urlParams.get('semesterId');
                let data = {
                    smsId: req_semesterId,
                    subjectId: req_subjectId
                }
                send_comp_msg("rc_infopage",data,0);
            }, 10);
        }


        if (details.url.startsWith(PresentAssignmentPattern)&&usr_setting.autoHide&&(!details.url.includes("&gcalc"))) {
            setTimeout(() => {
                send_str_msg("rc_hideasm",usr_setting,0);
                setTimeout(() => {
                    send_str_msg("rc_hideasm",usr_setting,0);
                }, 50);
            }, 10);
            //If DisplayTeams
            let tasklist=[];
            const teamsList=getFromLocalStorage("MSTasks");
            for(const item of teamsList){
                let newItem = {
                    "id": "gcalc_teamsWeblink="+item.webUrl,
                    "name": item.typeName,
                    "subjectName": item.subjectName,
                    "subjectEName": item.subjectName,
                    "subjectCode": "teamsSync",
                    "typeName": "Teams 任务",
                    "typeEName": "Teams Task",
                    "totalScore": 0,
                    "beginTime": TeamsToSchoolisTimeDate(item.beginTime),
                    "endTime": TeamsToSchoolisTimeDate(item.endTime),
                    "syncTime": TeamsToSchoolisTimeDate(item.beginTime),
                    "score": null,
                    "disciplineState": 3,
                    "finishState": 1,
                    "knowledgePointMasterLevel": null,
                    "knowledgePointCount": 0,
                    "isSynchroToMobiled": 1,
                    "learningTaskState": 4,
                    "scoreType": 2,
                    "levelString": "",
                    "mode": 1,
                    "isExempt": false
                }
                tasklist.unshift(newItem);
            }
            return {
                redirectUrl: "data:application/json," + encodeURIComponent(JSON.stringify({
                    data: {
                        "totalCount": 12,
                        "currentIndex": 1,
                        "itemCount": 0,
                        "list": tasklist
                    },
                    msgCN: null,
                    msgEN: null,
                    state: 0,
                    msg: null
                }))
            };
        }

        if (details.url.startsWith(detailsUrlPattern)&&usr_setting.advScoreShadow) {
            setTimeout(() => {
                send_str_msg("up_shadow", usr_setting,0)
                setTimeout(() => {
                    send_str_msg("up_shadow", usr_setting,0)
                }, 50);
            }, 10);
        }

        if (details.url.startsWith(detailsUrlPattern)) {
            if(usr_setting.autoHide){
                send_str_msg("rc_hidescore",usr_setting.autoHide_Condition,0);
            }
            targsms = details.url.split('?semesterId=')[1];
            working_sms = targsms;
            if(isFetchOriginal == true || enable_state == false){
                return null;
            }else{
                setTimeout(() => {
                    send_short_msg("replace_context",0);
                    setTimeout(() => {
                        send_short_msg("replace_context",0);
                        setTimeout(() => {
                            send_short_msg("replace_context",0);
                        }, 50);
                    }, 15);
                }, 15);
            }
            
            if(smsCalcStat[targsms] == -1){
                send_str_msg("tip_alert","请稍后，该学期的数据仍在计算中",0);
                return null;
            }

            let totalCourse = [];
            let template = {"grade":null,"classType":2,"classId":"gcalc","className":"GPA Calculator","classEName":"GPA Calculator","subjectId":100628,"subjectName":"Giaoculator","subjectEName":"Giaoculator","isInGrade":true,"subjectScore":100,"scoreMappingId":4517,"updateDate":"\/Date(0000000000000+0800)\/","subjectTotalScore":100.0,"scoreType":1,"levelString":"A+"};
            
            // 获取所有的course
            let courseInfoList = getAllCourseInfo(targsms);
            if(usr_setting.autoHide){
                send_str_msg("rc_hidescore",usr_setting.autoHide_Condition,0);
            }
            if (courseInfoList.length < 1) {
                console.log("PartA:courseInfoList.length < 1,do nothing");
                return null;
            }else{
                console.log("courseInfoList is not empty",courseInfoList);
            }
            //Pushing and Form the new ScoreLists
            let add_count = 0;
            for (let courseInfo of courseInfoList) {
                let course = JSON.parse(JSON.stringify(template));
                //console.log("courseInfo:",courseInfo);
                if(courseInfo.source == "original"){
                    course.className = courseInfo.className;
                    course.classEName = courseInfo.classEName;
                    course.classId = courseInfo.classId;
                    course.scoreMappingId = courseInfo.scoreMappingId;
                    course.subjectId = courseInfo.subjectId;
                    course.subjectName = courseInfo.subjectName;
                    course.subjectEName = courseInfo.subjectEName;
                    course.subjectScore = courseInfo.subjectScore;
                    course.updateDate = courseInfo.updateDate;
                    course.isInGrade = courseInfo.isInGrade;
                    course.classType = 2;
                    course.updateDate = courseInfo.updateDate;
                    if(courseInfo.classType == 1){
                        course.className = "行政班";
                        course.classEName = "Homeroom";
                    }
                    totalCourse.push(course);
                    //console.log("Pushed!TypeORIGINALdata:",course.subjectEName);
                    add_count+=1;
                }
            }
            for (let courseInfo of courseInfoList) {
                let course = JSON.parse(JSON.stringify(template));
                if(courseInfo.source == "calc" && courseInfo.gpa >= 0){
                    let changedClassname = courseInfo.ename;
                    if (changedClassname.includes("[Edited] ")) {
                        changedClassname = changedClassname.replace("[Edited] ", "");
                        
                    }
                    course.className = changedClassname;
                    course.classEName = changedClassname;
                    course.subjectName = courseInfo.ename;
                    course.subjectEName = courseInfo.ename;
                    course.scoreMappingId = (courseInfo.ename.includes("AP")||courseInfo.ename.includes("AS")||courseInfo.ename.includes("A2")||courseInfo.ename.includes("A Level"))? 6799:4517;
                    course.subjectId = courseInfo.subjectId;
                    course.subjectScore = courseInfo.gpa;
                    totalCourse.push(course);
                    //console.log("Pushed!TypeCALCdata:",courseInfo.ename);
                    add_count+=1;
                }
                
            }

           
            

            if (add_count < 1){
                let course = JSON.parse(JSON.stringify(template));
                course.className = "该学期暂无任何信息";
                course.classEName = "Empty Smester";
                course.subjectName = "未获取到信息";
                course.subjectEName = "Info Not Found";
                course.subjectScore = "0";
                totalCourse.push(course);
            }
            setTimeout(() => {
                send_short_msg("replace_context",0);
            }, 200);
            

            courseInfoList += {"grade":null,"classType":2,"classId":277851,"className":"GPA Calculator","classEName":"GPA Calculator","subjectId":100628,"subjectName":"Giaoculator","subjectEName":"Giaoculator","isInGrade":true,"subjectScore":100,"scoreMappingId":4517,"updateDate":"\/Date(0000000000000+0800)\/","subjectTotalScore":100.0,"scoreType":1,"levelString":"A+"}

            if (courseInfoList.length > 1) {
                return {
                    redirectUrl: "data:application/json," + encodeURIComponent(JSON.stringify({
                        data: {
                            studentSemesterDynamicScoreBasicDtos: totalCourse,
                            "scoreMappingList": [
                                {"scoresMappingId":6799,"isUseGpa":true,"scoreMappingConfigs":[{"displayName":"A+","minValue":97.00,"maxValue":9999.90,"isContainMin":true,"isContainMax":true,"sort":0,"gpa":4.80},{"displayName":"A","minValue":93.00,"maxValue":96.90,"isContainMin":true,"isContainMax":true,"sort":1,"gpa":4.50},{"displayName":"A-","minValue":90.00,"maxValue":92.90,"isContainMin":true,"isContainMax":true,"sort":2,"gpa":4.20},{"displayName":"B+","minValue":87.00,"maxValue":89.90,"isContainMin":true,"isContainMax":true,"sort":3,"gpa":3.80},{"displayName":"B","minValue":83.00,"maxValue":86.90,"isContainMin":true,"isContainMax":true,"sort":4,"gpa":3.50},{"displayName":"B-","minValue":80.00,"maxValue":82.90,"isContainMin":true,"isContainMax":true,"sort":5,"gpa":3.20},{"displayName":"C+","minValue":77.00,"maxValue":79.90,"isContainMin":true,"isContainMax":true,"sort":6,"gpa":2.80},{"displayName":"C","minValue":73.00,"maxValue":76.90,"isContainMin":true,"isContainMax":true,"sort":7,"gpa":2.50},{"displayName":"C-","minValue":70.00,"maxValue":72.90,"isContainMin":true,"isContainMax":true,"sort":8,"gpa":2.20},{"displayName":"D+","minValue":67.00,"maxValue":69.90,"isContainMin":true,"isContainMax":true,"sort":9,"gpa":1.80},{"displayName":"D","minValue":63.00,"maxValue":66.90,"isContainMin":true,"isContainMax":true,"sort":10,"gpa":1.50},{"displayName":"D-","minValue":60.00,"maxValue":62.90,"isContainMin":true,"isContainMax":true,"sort":11,"gpa":1.20},{"displayName":"F","minValue":0.00,"maxValue":59.90,"isContainMin":true,"isContainMax":true,"sort":12,"gpa":0.00}]},
                                {"scoresMappingId":4517,"isUseGpa":true,"scoreMappingConfigs":[{"displayName":"A+","minValue":97.00,"maxValue":9999.90,"isContainMin":true,"isContainMax":true,"sort":0,"gpa":4.30},{"displayName":"A","minValue":93.00,"maxValue":96.90,"isContainMin":true,"isContainMax":true,"sort":1,"gpa":4.00},{"displayName":"A-","minValue":90.00,"maxValue":92.90,"isContainMin":true,"isContainMax":true,"sort":2,"gpa":3.70},{"displayName":"B+","minValue":87.00,"maxValue":89.90,"isContainMin":true,"isContainMax":true,"sort":3,"gpa":3.30},{"displayName":"B","minValue":83.00,"maxValue":86.90,"isContainMin":true,"isContainMax":true,"sort":4,"gpa":3.00},{"displayName":"B-","minValue":80.00,"maxValue":82.90,"isContainMin":true,"isContainMax":true,"sort":5,"gpa":2.70},{"displayName":"C+","minValue":77.00,"maxValue":79.90,"isContainMin":true,"isContainMax":true,"sort":6,"gpa":2.30},{"displayName":"C","minValue":73.00,"maxValue":76.90,"isContainMin":true,"isContainMax":true,"sort":7,"gpa":2.00},{"displayName":"C-","minValue":70.00,"maxValue":72.90,"isContainMin":true,"isContainMax":true,"sort":8,"gpa":1.70},{"displayName":"D+","minValue":67.00,"maxValue":69.90,"isContainMin":true,"isContainMax":true,"sort":9,"gpa":1.30},{"displayName":"D","minValue":63.00,"maxValue":66.90,"isContainMin":true,"isContainMax":true,"sort":10,"gpa":1.00},{"displayName":"D-","minValue":60.00,"maxValue":62.90,"isContainMin":true,"isContainMax":true,"sort":11,"gpa":0.70},{"displayName":"F","minValue":0.00,"maxValue":59.90,"isContainMin":true,"isContainMax":true,"sort":12,"gpa":0.00}]}
                            ],
                        },
                        msgCN: null,
                        msgEN: null,
                        state: 0,
                        msg: null
                    }))
                };
            }else{
                return null;
            }
            
        }else if (details.url.startsWith(GPAUrlPattern)) {
            var invalidCount = 0;
            if(isFetchingGPA){
                isFetchingGPA = false;
                return
            }
            var tmptargsms = details.url.split('?semesterId=')[1];
            if(smsCalcStat[tmptargsms]!=1 || gpaExistenceMap[tmptargsms]){
                console.log("Not FinishedCalc or Already HaveINFO:",tmptargsms);
                send_short_msg("bp-GPANotcalced",0);
                return;
                
            }
            let totalGPA = 0;
            /*let gpas = getAllGPAValues(tmptargsms);
            // 根据gpaRules将scores转换为gpa，然后加入gpas列表
            

            // 计算平均GPA
            for (let gpa of gpas) {
                totalGPA += gpa;
                if(gpa<=0){
                    invalidCount = invalidCount + 1;
                }
            }
            let avgGPA = totalGPA / (gpas.length-invalidCount);*/
            //return;//关闭计算GPA功能 2025.1.9
            let avgGPA = getAllGPAValues(tmptargsms)+0.0000001;
            send_short_msg("bp-GPAcalced",0);
            console.log(avgGPA);
            return {
                redirectUrl: "data:application/json," + encodeURIComponent(JSON.stringify({
                    // "data": avgGPA, 两位小数
                    "data": avgGPA.toFixed(2),
                    "msgCN": null,
                    "msgEN": null,
                    "state": 0,
                    "msg": null
                }))
            }
        }else if (details.url.startsWith(GiaoculatorClassUrlPattern)) {
            const urlParams = new URLSearchParams(new URL(details.url).search);
            let req_subjectId = urlParams.get('subjectId');
            let req_semesterId = urlParams.get('semesterId');
            const v2data = getFromLocalStorage(req_semesterId + "|S" + req_subjectId);
            let havePropath = false;
            if(v2data){
                havePropath = true;
            }
            
            const data = getFromLocalStorage(req_semesterId + "|I" + req_subjectId);
            
            console.log("***",data);
            let evaluationProjectList = [];

            // 定义一个基础模板
            const baseTemplate = {
                scoreLevel: "",
                evaluationProjectList: [],
                parentProId: 0,
                evaluationProjectRemark: null,
                code: "73",
                evaluationProjectId: 30469, 
                proPath: "30469"
            };
            let propath_template = {
                evaluationProjectName: "Name",
                evaluationProjectEName: "Name",
                proportion: 100,
                score: 93,
                scoreLevel: "Pass",
                gpa: 0, 
                scoreIsNull: false,
                evaluationProjectList: [],
                levelString: "",
                code: "78",
                evaluationProjectId: 30649,
                proPath: "30468,30649,",
                parentProId: 30468,
                evaluationProjectRemark: null
            }
            let parentPath = getRandomInt(1,20000);
            let childPath = getRandomInt(21000,40000);
            //随机数1~9999
            for (const [key, value] of Object.entries(data)) {
                parentPath+= 1;
                let itemTemplate = baseTemplate; // 获取对应的模板或默认模板
                let proPathslist = [];
                if(havePropath){
                
                    for (const [pKey, pValue] of Object.entries(v2data[key]["categories"])) {
                        childPath+=1;
                        let tmp = propath_template; // 获取对应的模板或默认模板
                        let newItem = {
                            ...tmp, // 展开模板中的属性
                            evaluationProjectName: pKey,
                            evaluationProjectEName: pKey,
                            evaluationProjectId: childPath,
                            proPath: parentPath+","+childPath+",",
                            proportion: pValue.proportion,
                            score: pValue.overallPercentage.toFixed(1), 
                            scoreLevel: calculateGPA(pValue.overallPercentage).displayName,
                            gpa: calculateGPA(pValue.overallPercentage).gpa,
                        };
        
                        proPathslist.push(newItem);
                    }
                }
                let newItem = {
                    ...itemTemplate, // 展开模板中的属性
                    evaluationProjectName: key,
                    evaluationProjectEName: key,
                    evaluationProjectId: parentPath,
                    proPath: parentPath+",",
                    proportion: value.proportion,
                    score: (value.totalScore/value.taskCount).toFixed(1), 
                    scoreLevel: calculateGPA(value.totalScore/value.taskCount).displayName,
                    gpa: calculateGPA(value.totalScore/value.taskCount).gpa,
                    evaluationProjectList: proPathslist
                };

                evaluationProjectList.push(newItem);
            }
            return {
                redirectUrl: "data:application/json," + encodeURIComponent(JSON.stringify({
                    data: {
                        evaluationProjectList: evaluationProjectList
                      },
                      msgCN: null,
                      msgEN: null,
                      state: 0,
                      msg: null
                }))
            }
        }else if (details.url.startsWith("NOURLITISJUSTATEMP")) {

            return {
                redirectUrl: "data:application/json," + encodeURIComponent(JSON.stringify({
                    data: {
                        evaluationProjectList: [
                            {evaluationProjectName: "综合性评估",evaluationProjectEName: "Comprehensive Assessments",proportion: 20,score: 0,scoreLevel: "",gpa: 0,scoreIsNull: true,evaluationProjectList: [],levelString: "",code: "73",evaluationProjectId: 30468,proPath: "30468,",parentProId: 0,evaluationProjectRemark: null},
                            {evaluationProjectName: "连续性评估",evaluationProjectEName: "Continuous Assessments",proportion: 30,score: 0,scoreLevel: "",gpa: 0,scoreIsNull: true,evaluationProjectList: [],levelString: "",code: "74",evaluationProjectId: 30469,proPath: "30469,",parentProId: 0,evaluationProjectRemark: null},
                            {evaluationProjectName: "渐进式评估",evaluationProjectEName: "Progressive Assessments",proportion: 30,score: 0,scoreLevel: "",gpa: 0,scoreIsNull: true,evaluationProjectList: [],levelString: "",code: "75",evaluationProjectId: 30470,proPath: "30470,",parentProId: 0,evaluationProjectRemark: null},
                            {evaluationProjectName: "期末考试",evaluationProjectEName: "Final exam",proportion: 20,score: 0,scoreLevel: "",gpa: 0,scoreIsNull: true,evaluationProjectList: [],levelString: "",code: "003",evaluationProjectId: 1220,proPath: "1220,",parentProId: 0,evaluationProjectRemark: null}
                        ]
                      },
                      msgCN: null,
                      msgEN: null,
                      state: 0,
                      msg: null
                }))
            }

        } 
    },
    

    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["blocking"]
);


// 监听请求并根据特定URL模式修改响应
chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
      // 这里假设 `assignmentInfoPattern` 是一个字符串或正则表达式，用于匹配相关URL
      const assignmentInfoPattern = "https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=";
      if (details.url.startsWith(assignmentInfoPattern)&&(!details.url.includes("&gcalcSysFetch")||details.url.includes("galc_teams"))) {
        // 为避免无限循环，检查请求是否已经被修改过
        if (details.url.includes("noRedirect") || details.url.includes("gcalc")) {
          return; // 如果URL包含标记，则不进行处理，直接放行
        }
        if (details.url.includes("gcalc_teams")){
            console.log("[FoundTeamsLInk]",details.url)
            const url = new URL(details.url);
            const learningTaskId = url.searchParams.get("learningTaskId");
            const newUrl = learningTaskId.replace("gcalc_teamsWeblink=", "");
            console.log("[FoundTeamsLInk],goto",newUrl)
            setTimeout(() => {
                chrome.tabs.create({ url: newUrl });
            }, 500);
            return { cancel: true };
        }
  
        try {
            // Fetch原始数据
            const response = await fetch(details.url+"&gcalc=noRedirect");
            
            let data = await response.json();
            data = data.data;
            await delay(10);
            if(data.finishState === null){
                send_str_msg("showSubmitLinkAnsBtn",data.id,0);
                console.log("SEND  addSubmitLinkBtn");
                return;
            }else if (data.classAvgScore === null||data.classMaxScore === null) {
                return;
            }
            if(data.finishState === 1 && data.comment === "" && data.score=== 0){
                //fetch for score
                hiddenScore = await getScoreForAssignment(data.id,data.classId,data.subjectId,data.schoolSemesterId);
                if(hiddenScore === null){
                    hiddenScore = -1;
                }
                send_str_msg("appendHiddenScore",hiddenScore,0);
            }
            let tmpdata={
                "avgS":data.classAvgScore,
                "maxS":data.classMaxScore,
                "totalS":data.totalScore,
                "usrS":data.score,
            }
            if(tmpdata.avgS > 0){
                send_comp_msg("append2Scores",tmpdata,0);
            }

        } catch (error) {console.log(error)}
      }
    },
    { urls: ["<all_urls>"] }, // 根据需要调整监听的URL模式
    ["blocking", "requestBody"]
  );


async function getScoreForAssignment(learningTaskId, classId, subjectId, semesterId) {
    const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;

    console.log(url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        // 遍历 evaluationProjectList 的 learningTaskAndExamList
        for (const evaluationProject of data.data.evaluationProjectList) {
            for (const task of evaluationProject.learningTaskAndExamList) {
                console.log(task);
                if (task.id === learningTaskId) {
                    console.log("Found task:", task.score);
                    return task.score; // 匹配成功，返回 ID
                }
            }
        }
        return null;
    } catch (error) {
        return null; 
    }
};


chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        const subjectsStatisticsPattern = "https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStatistics?schoolSemesterId=";
        // 检查请求的URL是否匹配
        if (details.url.startsWith(subjectsStatisticsPattern)) {
            let url = new URL(details.url);
            let semesterId = url.searchParams.get("schoolSemesterId");
            let subjectId = url.searchParams.get("subjectId");

        }
    },
    

    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["blocking"]
);

function getLocalTeamsAssignment(beginDate, endDate) {
    // 从本地存储中获取MSTasks
    let storedAssignments = getFromLocalStorage("MSTasks");

    // 如果本地没有存储的作业，返回空数组
    if (!storedAssignments || storedAssignments.length === 0) {
        console.log("No stored assignments found.");
        return [];
    }

    // 将传入的日期转换为时间戳，以便进行比较
    const beginTime = new Date(beginDate).getTime();
    const endTime = new Date(endDate).getTime();

    // 检查传入的日期是否有效
    if (isNaN(beginTime) || isNaN(endTime)) {
        console.log("Invalid date provided.");
        return [];
    }

    // 过滤MSTasks，筛选出符合时间段的任务
    let filteredAssignments = storedAssignments.filter(msTask => {
        const assignedTime = new Date(msTask.beginTime).getTime();
        const dueTime = new Date(msTask.endTime).getTime();

        // 检查作业的assignedDateTime和dueDateTime是否在时间段内
        return assignedTime >= beginTime && dueTime <= endTime;
    });

    // 返回符合条件的任务列表
    return filteredAssignments;
}



chrome.webRequest.onCompleted.addListener(
    async function(details) {
        if (details.url.includes("GetStatistics?") && !processingUrls[details.url]) {
            return;
            //关闭2024/4/11
            let url = new URL(details.url);
            let semesterId = url.searchParams.get("schoolSemesterId");
            let subjectId = url.searchParams.get("subjectId");

            // Fetch the subject eName
            let subjectInfo = await fetchSubjectEName(semesterId, subjectId);
            
            // Mark URL as being processed to avoid infinite loop
            processingUrls[details.url] = true;
            
            // Use XMLHttpRequest to fetch the response data
            var xhr = new XMLHttpRequest();
            xhr.open("GET", details.url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    // Parse the response data as JSON
                    var response = JSON.parse(xhr.responseText);
                    
                    // Extract the necessary information
                    var extracted_data = [];
                    var pendingRequests = 0;
                    for (var item of response.data.list) {
                        let dataItem = {
                            "id": item.id,
                            "taskName": item.learningTaskName,
                            "learningTaskTypeEName": item.learningTaskTypeEName,
                            "score": item.score,
                            "totalScore": item.totalScore
                        };
                        
                        pendingRequests++;
                        fetchCategoryAndProportion(item.id, dataItem, function(updatedItem) {
                            extracted_data.push(updatedItem);
                            pendingRequests--;
                            if  (pendingRequests === 0){
                                let gpa = calculateOverallScore(extracted_data);
                                saveCategorySummary(subjectId,extracted_data,semesterId);  // If you also want to print the summary
                                console.log("SUBJECT", subjectInfo)
                                saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa, semesterId)

                            }
                        });
                    }
                    
                    if (pendingRequests === 0) {
                        
                        console.log(extracted_data);
                        let gpa = calculateOverallScore(extracted_data);

                        saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa, semesterId)

                        saveCategorySummary(subjectId,extracted_data,semesterId);  // 新增这一行来调用新函数
                    }
                    
                    // Once processed, remove the URL from the processing list
                    setTimeout(() => { delete processingUrls[details.url]; }, 5000);
                }
            }
            xhr.send();
        }
    },
    { urls: ["https://tsinglanstudent.schoolis.cn/*"] }
);


// =========================================================
// 函数定义
// =========================================================

// 获取最新版本号并进行比较
async function checkVersion(){
    return;//暂未完成的功能，暂时关闭

    await delay(20000); //登录20秒后再显示，不影响用户使用
    var back = await fetch("https://lanbinshijie.github.io/giaoculator.json")
    var data = await back.json()
    console.log(data)

    var versions = data.version
    var force = data.force
    var newest = true
    // versions是一个数组，包含了最新版本的版本号，使用for循环比较新旧
    setTimeout(() => {
        for (var i = 0; i < versions.length; i++) {
            if (versions[i] > EXTENSION_VERSION[i]) {
                // 如果有新版本，发送消息给content.js
                if (!force){
                    console.log("New version found: " + versions[i]);
                    text = "<h3>Giaoculator有新版本！</h3><br><div>"+data.updateLog[0]+"<ul>"
                    flag = false
                    // console.log("JSHDJS",data);
                    // for (texta in data.updateLog) {
                    //     if (flag) {
                    //         text += "<li> · " + data.updateLog[texta] + "</li>"
                    //     }
                    //     flag = true
                    //     // text += "<li>" + text + "</li>"
                    // }
                    text += "</ul>前往“设置”页面去更新！或点击<a href='"+data.url+"' style='color:#fff; text-decoration: underline'>这里体验新版本！</a></div>"
                    send_str_msg("tip_info_long",text,0);
                    newest = false
                    break;
                } else {
                    console.log("New version found: " + versions[i]);
                    text = "<h3>Giaoculator有重大更新！</h3><br><div><b>"+data.updateLog[0]+"</b><ul>"
                    flag = false
                    // console.log("JSHDJS",data);
                    // for (texta in data.updateLog) {
                    //     if (flag) {
                    //         text += "<li> · " + data.updateLog[texta] + "</li>"
                    //     }
                    //     flag = true
                    //     // text += "<li>" + text + "</li>"
                    // }
                    text += "</ul>前往“设置”页面去更新！或点击<a href='"+data.url+"' style='color:#fff; text-decoration: underline'>这里体验新版本！</a></div>"
                    send_str_msg("tip_alert_long",text,0);
                    newest = false
                    break;
                }
            }
        }
        // if (newest) {
        //     console.log("Giaoculator已是最新版本！");
        //     send_str_msg("tip_info","Giaoculator已是最新版本！",0);
        // }
    }, 3000);
    
    console.log(data)
}

// 函数作用写在这里
function fetchCategoryAndProportion(taskId, dataItem, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${taskId}`+'&gcalcSysFetch', true);
    resetUI();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            let response = JSON.parse(xhr.responseText);
            var category = "Not For GPA / 不计入";
            var proportion = 0;
            try{
                dataItem["child_proportion"] = -1;
                dataItem["isChild"] = response.data.evaProjects.length>1;
                if(response.data.evaProjects.length>1){
                    dataItem["haveSubCategory"] = true;
                    if(response.data.evaProjects[0].proPath.includes(response.data.evaProjects[1].id)){//代表[0]是子项目。[1]是父项目
                        dataItem["child_category"] = response.data.evaProjects[0].eName;
                        dataItem["child_proportion"] = response.data.evaProjects[0].proportion;
                        proportion = response.data.evaProjects[1].proportion;
                        category = response.data.evaProjects[1].eName;
                    }else{                                                                             //代表[1]是子项目。[0]是父项目
                        dataItem["child_category"] = response.data.evaProjects[1].eName;
                        dataItem["child_proportion"] = response.data.evaProjects[1].proportion;
                        proportion = response.data.evaProjects[0].proportion;
                        category = response.data.evaProjects[0].eName;
                    }
                }else{
                    dataItem["haveSubCategory"] = false;
                    category = response.data.evaProjects[0].eName;
                    proportion = response.data.evaProjects[0].proportion;
                }
            }
            catch(e){
                proportion = 0;
                category = "Not For GPA / 不计入";
            }
            dataItem["category"] = category;
            dataItem["proportion"] = proportion;
            callback(dataItem);
        }
    }
    xhr.send();
}

async function fetchUsrInfo() {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", `https://tsinglanstudent.schoolis.cn/api/MemberShip/GetCurrentStudentInfo`, true);
      xhr.onreadystatechange = function() {        if (xhr.readyState === 4) { // 请求已完成
          if (xhr.status === 200) { // 请求成功
            try {
              var response = JSON.parse(xhr.responseText); // 解析返回的JSON数据
              if (response && response.data) { // 确保response和response.data存在
                var usrName = response.data.cName; // 获取用户中文名字
                if (usrName) { // 如果用户名存在且不为空
                  resolve(usrName); // 返回用户名
                } else {
                  resolve(false); // 用户名为空，返回false
                }
              } else {
                reject("No user data found");
              }
            } catch (e) {
              reject(e.message); // 如果解析失败，返回错误信息
            }
          } else {
            reject(`Request failed with status: ${xhr.status}`);
          }
        }
      };
      xhr.send(); // 发送请求
    });
}

function saveCategorySummary(subId,data,semesterId) {
    let categorySummary = {};
    var haveSubCategory = false;
    console.log('=============================================')
    for(let item of data){
        if(item["haveSubCategory"]){
            haveSubCategory = true;
        }
    }
    if(haveSubCategory){
        let propaths = {};
        for (let item of data) {
            let father_category = item.category;
            let child_category = item.child_category;
            let child_proportion = item.child_proportion;
            let father_proportion = item.proportion;
            if (!propaths[father_category]) {
                propaths[father_category] = {
                    categories: {},
                    proportion: father_proportion,
                    overallPercentage: 0 // 初始化，稍后计算
                };
            }
        
            if (!propaths[father_category].categories[child_category]) {
                // 如果child_category不存在，创建新的child_category
                propaths[father_category].categories[child_category] = {
                    proportion: child_proportion,
                    totalScore: (item.score/item.totalScore)*100,
                    taskCount: 1,
                    overallPercentage: item.score // 初始的overallPercentage等于score
                };
            } else {
                // 如果child_category已存在，更新其信息
                let child = propaths[father_category].categories[child_category];
                child.totalScore += (item.score/item.totalScore)*100;
                child.taskCount += 1;
                child.proportion = child_proportion;
                child.overallPercentage = child.totalScore / child.taskCount;
            }
        }
        

        //计算每个大catefory:
        for (let father_category in propaths) {
            let totalProportion = 0;
            let weightedOverallPercentageSum = 0;
            
            for (let child_category in propaths[father_category].categories) {
                let child = propaths[father_category].categories[child_category];
                totalProportion += child.proportion; // 累加所有child_category的proportion
                weightedOverallPercentageSum += child.overallPercentage * child.proportion; // 加权的overallPercentage总和
            }
        
            if (totalProportion > 0) { // 防止除以零
                propaths[father_category].overallPercentage = weightedOverallPercentageSum / totalProportion;
            } else {
                propaths[father_category].overallPercentage = 0; // 如果没有child_category，设为0
            }
            //放入categorysummary向下兼容
            categorySummary[father_category] = {
                proportion: propaths[father_category].proportion,
                totalScore: propaths[father_category].overallPercentage,
                taskCount: 1
            };
        }
        saveToLocalStorage(semesterId+'|S'+subId,propaths);


        
        
        console.log("Ini:",data);
        console.log("PP:",propaths);
    }else{
        for (let item of data) {
            let category = item.category;
            let proportion = item.proportion;
            let percentageScore = (item.score / item.totalScore) * 100;
    
            if (!categorySummary[category]) {
                categorySummary[category] = {
                    proportion: proportion,
                    totalScore: 0,
                    taskCount: 0
                };
            }
            categorySummary[category].totalScore += percentageScore;
            categorySummary[category].taskCount++;
        }
    }
    // 1. Group tasks by category
    


    // 2. Calculate avg and print summary for each category
    for (let category in categorySummary) {
        let avgScore = categorySummary[category].totalScore / categorySummary[category].taskCount;
        console.log(`Category: ${category}`);
        console.log(`Proportion: ${categorySummary[category].proportion}%`);
        console.log(`Number of Tasks: ${categorySummary[category].taskCount}`);
        console.log(`Avg: ${avgScore.toFixed(2)}%`);
        console.log('-------------------');
    }
    saveToLocalStorage(semesterId+'|I'+subId,categorySummary)
    overallScore = calculateOverallScore(data);
    var gpaInfo = calculateGPA(overallScore);
    //console.log(`*** GPA: ${gpaInfo.gpa.toFixed(2)} / ${gpaInfo.displayName} ***`);
    // 3. 分割线
    console.log('=============================================')
}




function calculateOverallScore(data) {
    let categorySummary = {};
    let totalProportion = 0;


    // 1. Group tasks by category and calculate the avg
    for (let item of data) {
        let category = item.category;
        let proportion = item.proportion;
        let percentageScore = (item.score / item.totalScore) * 100;

        if (!categorySummary[category]) {
            categorySummary[category] = {
                proportion: proportion,
                totalScore: 0,
                taskCount: 0
            };
            totalProportion += proportion;
            //console.log(`D.ProportionAddedBy ${proportion}`);
        }
        categorySummary[category].totalScore += percentageScore;
        categorySummary[category].taskCount++;
    }

    //console.log(`D.TotalProportion:${totalProportion}`);

    // 2. Calculate the overall score
    let overallScore = 0;
    for (let category in categorySummary) {
        let avgScore = categorySummary[category].totalScore / categorySummary[category].taskCount;
        let adjustedProportion = (categorySummary[category].proportion / totalProportion) * 100;
        overallScore += avgScore * (adjustedProportion / 100);
        //console.log(`D.OverallScore+=${avgScore}*${adjustedProportion / 100}`)
    }

    console.log(`*** Overall Score: ${overallScore.toFixed(2)}% ***`);

    let gpaInfo = calculateGPA(overallScore);
    /*
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let message = {
            type: "m1",
            data: {
                overallScore: overallScore,
                gpaDisplayName: gpaInfo.displayName,
                gpaValue: gpaInfo.gpa.toFixed(2)
            }
        };
        chrome.tabs.sendMessage(tabs[0].id, message);
    });*/

    return overallScore.toFixed(2)
}


function calculateGPA(overallScore) {
    for (const rule of gpaRules) {
        if (overallScore >= rule.minValue && overallScore <= rule.maxValue) {
            return { displayName: rule.displayName, gpa: rule.gpa };
        }
    }
    return { displayName: "N/A", gpa: 0 };  // Default if no rule matches
}


function resetUI(){
    /*
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let message = {
            type: "m1",
            data: {
                overallScore: "-",
                gpaDisplayName: "-",
                gpaValue: "-"
            }
        };
        try{
            chrome.tabs.sendMessage(tabs[0].id, message);
        }catch(e){
            console.log(`Failed to send message,${e}`)
            console.log(message);
        }
        
    });*/
}

async function fetchSubjectEName(semesterId, subjectId) {
    // 如果没有提供 semesterId 或 subjectId，可以直接返回 null 或抛出错误
    if (!semesterId || !subjectId) {
        return null;
    }
    try {
        const response = await fetch(`https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForStatisticsSelect?semesterId=${semesterId}`);
        const data = await response.json();

        let subjectData = data.data.find(subject => subject.id == subjectId);
        
        if (subjectData) {
            return {
                ename: subjectData.eName,
                subjectCode: subjectData.subjectCode,
                semesterId: semesterId,
                subjectId: subjectId
            };
        }
        return null;
    }catch (error) {
        if(semesterId == null) semesterId = "null";
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        faceErrorWhileCalc = true;
        send_short_msg("calcErrorStop",0);
        return "error";
    }

}


function saveSubjectInfo(subjectId, dataCollect, dataInfo, gpa, semesterId,sname){
    let data = {
        gpaInfo: dataInfo,
        gpa: gpa,
        subjectId: subjectId,
        smsId: semesterId,
        tasksInfo: dataCollect,
        isOriginal: false,
        source: "calc"
    }
    saveToLocalStorage(semesterId+'|'+subjectId, data);
    if(sname.includes("[Edited]")){
        send_str_msg("gb-finishedCalc",gpa,0);
    }
}

// 将对象保存到localStorage的函数
function saveToLocalStorage(keyName, obj) {
    try {
        const jsonString = JSON.stringify(obj);
        localStorage.setItem(keyName, jsonString);
        console.log("已存入"+keyName+"的data!");
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        send_short_msg("calcErrorStop",0);
        send_str_msg("tip_err",error,0);
        faceErrorWhileCalc = true;
    }
}



// 从localStorage读取并解析对象的函数
function getFromLocalStorage(keyName) {
    try {
        const jsonString = localStorage.getItem(keyName);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error reading from localStorage or parsing:', error);
        send_short_msg("calcErrorStop",0);
        faceErrorWhileCalc = true;
        send_str_msg("tip_err",error,0);
        return null;
    }
}

function getAllGPAValues(targsms) {
    let gpaList = [];
    var avg_lowWeight = 0;
    var avg_moderateWeight = 0;
    var cnt_lowWeight = 0;
    var cnt_moderateWeight = 0;
    var chineseGPA = -1;
    // 遍历所有localStorage的键
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if(!key.startsWith(targsms) || key.includes("I")){
            //console.log("忽略"+key+"的data!");
            continue;
        }
        // 使用之前的函数来获取每个键的值
        const data = getFromLocalStorage(key);
        var score;
        var subjectGPA;
        var subjectName = "Houseee";
        var subjectCode = "Houseeeeee";
        var weighted_value = 0;
        console.log("GPACALC:",data)
        subjectName = data.isOriginal? data.classEName:data.gpaInfo.ename;
        subjectCode = data.isOriginal? data.subjectInfo.subjectCode:data.gpaInfo.subjectCode;
        if(1==1){
            if(data.isOriginal==true){
                score = parseFloat(data.subjectScore);
                if(data.scoreMappingId=="6799"){
                    weighted_value = 0.5;
                }else{}
                //console.log(data.classEName,data.scoreMappingId,weighted_value);
            }else{
                subjectName = data.gpaInfo.ename;
                subjectCode = data.gpaInfo.subjectCode;
                score = parseFloat(data.gpa);
                if(data.gpaInfo.ename.includes("AP")||data.gpaInfo.ename.includes("AS")||data.gpaInfo.ename.includes("A2")||data.gpaInfo.ename.includes("A Level")){
                    weighted_value = 0.5;
                }
                //console.log(data.gpaInfo.ename,weighted_value);
            }
        }
        
        if(score<=0){
            continue;
        }
        for (let rule of gpaRules) {
            if (score >= rule.minValue && score <= rule.maxValue) {
                var tmp = rule.gpa;
                tmp = tmp + weighted_value;
                subjectGPA=tmp;
                break;
            }
        }
        var subjectInfos = subjectCode + subjectName;
        console.log(subjectName,subjectCode,score,subjectGPA);
        let excludeList_LowWeight = ["Fine Art","IT","Ele","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"];
        let excludeList_NotCNT = ["TSSA","IELTS","TOFEL","Student","Clubs","Homeroom"];
        if(excludeList_LowWeight.some(excludeItem => subjectInfos.includes(excludeItem))){
            avg_lowWeight += subjectGPA;
            cnt_lowWeight += 1;
        }else if(excludeList_NotCNT.some(excludeItem => subjectInfos.includes(excludeItem))){
            continue;
        }else if(subjectInfos.includes("C-Humanities")){
            if(chineseGPA === -1){
                chineseGPA = subjectGPA;
            }else{
                chineseGPA = chineseGPA * 0.66666 + subjectGPA * 0.33333;
            }
            console.log(`[GetCHu]${subjectInfos},${chineseGPA}`);
        }else if(subjectInfos.includes("Chinese")){
            if(chineseGPA === -1){
                chineseGPA = subjectGPA;
            }else{
                chineseGPA = chineseGPA * 0.33333 + subjectGPA * 0.66666;
            }
            console.log(`[GetChinese]${subjectInfos},${chineseGPA}`);
        }else{
            avg_moderateWeight += subjectGPA;
            cnt_moderateWeight += 1;
            console.log(`[ChangeMDNo${cnt_moderateWeight}]${subjectInfos},into ${avg_moderateWeight}`)
        }
        console.log("GPACLAC",subjectGPA,score,subjectName);
        
    }
    if(chineseGPA > -1){
        avg_moderateWeight += chineseGPA;
        console.log(`[ChangeMDNo${cnt_moderateWeight}]Chinese+Chu,into ${avg_moderateWeight}`);
        cnt_moderateWeight += 1;
    }
    var finalGPA = 0;
    console.log("Total 1权重:",avg_moderateWeight,"Total 0.5权重:",avg_lowWeight,"Cnt 1权重:",cnt_moderateWeight,"Cnt0.5权重:",cnt_lowWeight);
    finalGPA = (avg_moderateWeight * 1 + avg_lowWeight * 0.5)/(cnt_moderateWeight * 1 + cnt_lowWeight * 0.5);
    return finalGPA;
}

function getAllCourseInfo(targsms) {
    // 返回内容包括ename, subjectId, gpa(浮点数)    
    let courseInfoList = [];
    
    // 遍历所有localStorage的键
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // 使用之前的函数来获取每个键的值
        
        if(key.startsWith(targsms)){
            const data = getFromLocalStorage(key);
            if (data.isOriginal == true){ //如果数据是来自校宝系统的
                let courseInfo = data;
                courseInfoList.push({
                    className : courseInfo.className,
                    classEName : courseInfo.classEName,
                    classId : courseInfo.classId,
                    scoreMappingId : courseInfo.scoreMappingId,
                    subjectName : courseInfo.subjectName,
                    subjectEName : courseInfo.subjectEName,
                    subjectScore : courseInfo.subjectScore,
                    updateDate : courseInfo.updateDate,
                    isInGrade : courseInfo.isInGrade,
                    classType : courseInfo.classType,
                    subjectId : courseInfo.subjectId,
                    updateDate : courseInfo.updateDate,
                    source : "original"
                });
            }else{
                // 检查对象中是否有gpa属性
                if (data && typeof data.gpa !== 'undefined') {
                    // 将gpa值转换为浮点数并加入列表中
                    courseInfoList.push({
                        ename: data.gpaInfo.ename,
                        subjectCode: data.gpaInfo.subjectCode,
                        subjectId: data.gpaInfo.subjectId,
                        gpa: parseFloat(data.gpa),
                        isOriginal: false,
                        source : "calc"
                    });
                }
            }
        }
        

    }

    return courseInfoList;
}


async function CalcBySmsId(semesterId,bgn_info,end_info,semesterType,year) {
    console.log("f(CalcBySmsId):",semesterId,bgn_info,end_info,semesterType);
    

    send_comp_msg("show_smsCalc_process",{cur: 1,oval: 6},0);   
    const bgn_parsed = parseDateInfo(bgn_info);
    const end_parsed = parseDateInfo(end_info);
    if(!bgn_parsed || !end_parsed){
        send_str_msg("tip_err","计算时出现问题：SmsId不存在或未定义",0);
        faceErrorWhileCalc = true;
        send_short_msg("calcErrorStop",0);
        console.log("SmsIdError,Smsid:",semesterId)
        return false;
    }
    // 新建变量并赋值
    let bgn_year = bgn_parsed.year;
    let bgn_mon = bgn_parsed.mon;
    let bgn_date = bgn_parsed.date;

    let end_year = end_parsed.year;
    let end_mon = end_parsed.mon;
    let end_date = end_parsed.date;
    
    working_sms = semesterId;
    
    let url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForStatisticsSelect?semesterId=${semesterId}`;

    try {
        // 使用 fetch API 发送请求并获取响应
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            let pos = 0;
            // 遍历所有科目
            let subjectIdList = {};
            for (const subject of data.data) {
                subjectIdList[subject.name==="HS History" ? "Chinese History" : subject.name] = {//24-25学年特判
                    subjectName: subject.name==="HS History" ? "Chinese History" : subject.name,
                    className: "noData",
                    subjectId: subject.id,
                    classId: -1,
                    subjectCode: subject.subjectCode
                };
                

                
                if(localStorage.getItem(semesterId+'|'+subject.id) === null){
                    let subjectRequestUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStatistics?schoolSemesterId=${semesterId}&subjectId=${subject.id}&learningTaskTypeId=null&beginDate=${bgn_year}-${bgn_mon}-${bgn_date}&endDate=${end_year}-${end_mon}-${end_date}&page.pageIndex=1&page.pageSize=500`;
                    // 假设 RequestSubjectAvg 也是异步函数
                    //await RequestSubjectAvg(subjectRequestUrl,0);//旧版计算




                }else{
                    console.log("[CalcBySmsId]学科数据已存在，无需重复计算。" + subject.id);
                }
                // 对每个科目ID构造请求并调用 RequestSubjectAvg      
               
            }
            let tmpdata={
                cur: 2,
                oval: 6
            }
            send_comp_msg("show_smsCalc_progress",tmpdata,0);
            console.log("[CalcBySmsId]开始Fill",smsId,subjectIdList)
            subjectIdList = await fillInClassId(subjectIdList, semesterType, year);
            tmpdata={
                cur: 3,
                oval: 6
            }
            send_comp_msg("show_smsCalc_progress",tmpdata,0);
            console.log("[CalcBySmsId]学科数据已填充完毕,",smsId,subjectIdList)
            await init_V2Calc(subjectIdList,semesterId,bgn_info,end_info,semesterType,year);
            tmpdata={
                cur: 4,
                oval: 6
            }
            send_comp_msg("show_smsCalc_progress",tmpdata,0);
            await fetchOriginalRequest(semesterId);
            tmpdata={
                cur: 5,
                oval: 6
            }
            send_comp_msg("show_smsCalc_progress",tmpdata,0);
            tmpdata={
                cur: 6,
                oval: 6
            }
            send_comp_msg("show_smsCalc_progress",tmpdata,0);
        }
        return true;
    } catch (error) {
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        faceErrorWhileCalc = true;
        send_short_msg("calcErrorStop",0);
        return false;
    } finally {
         
    }

    // 函数无需显式返回值，除非有特定的返回需求
}
async function fillInClassId(subjectIdList, semesterType, year) {
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';

    const data = {
        beginTime: semesterType == "1" ? (year + "-12-01") : ((year + 1) + "-04-01"),
        endTime: semesterType == "1" ? (year + "-12-30") : ((year + 1) + "-05-01")
    };

    try {
        const response = await fetch(url, {
            method: 'POST', // 指定请求方法
            headers: {
                'Content-Type': 'application/json', // 指定内容类型
            },
            body: JSON.stringify(data) // 将请求体转换为JSON字符串
        });

        if (response.ok) {
            const data = await response.json(); // 解析响应体为JSON
            console.log(data);
            const classList = data.data; // 假设你的API返回的数据在 `data.data` 中
            
            for (const classInfo of classList) {
                const subjectEntry = subjectIdList[classInfo.name];
                
                if (subjectEntry != null) {
                    if (subjectEntry.classId === -1) {
                        console.log("[fillInClassId] Success: " + classInfo.name + ", With: " + classInfo.classInfo.id);
                        subjectEntry.classId = classInfo.classInfo.id; // 填充 classId
                        subjectEntry.className = classInfo.classInfo.className;
                    } 
                }else {
                        // 遍历 subjectIdList 中的所有名称进行比较
                        let matched = false;
                        for (const subjectKey in subjectIdList) {
                            if (subjectIdList.hasOwnProperty(subjectKey)) {
                                const currentSubject = subjectIdList[subjectKey];
                                const maxCommonLen = getMaxCommonConsecutiveLength(classInfo.name, currentSubject.subjectName);
                                
                                if (maxCommonLen > 12) { // 如果最长连续公共子串长度超过8个字符
                                    console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                    currentSubject.classId = classInfo.classInfo.id;
                                    currentSubject.className = classInfo.classInfo.className;
                                    matched = true;
                                    break; // 找到匹配后可以跳出循环，视需求而定
                                }
                            }
                        }
                        
                        if (!matched) {
                            console.warn(`[fillInClassId] No sufficient consecutive match found for: ${classInfo.name}`);
                        }else {
                            console.warn(`[fillInClassId] No entry found in subjectIdList for: ${classInfo.name}`);
                        }
                } 
            }



            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function showLoad(showStatus){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let message = {
            type: "load",
            data: {
               show: showStatus
            }
        };
        try{
            console.log(tabs)
            chrome.tabs.sendMessage(tabs[0].id, message);
        }catch(e){
            console.log(`Failed to send message,${e}`)
            console.log(message);
        }
        
    });

}

function refresh_page(redotimes){
    if(redotimes<5){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: "bp-refresh",
                data: {
                }
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                console.log("[refreshpage]:sucess send")
            }catch(e){
                //console.log(`[refeshpage]:failed to send,${redotimes}`)
                console.log(message);
                setTimeout(() => { 
                    refresh_page(redotimes+1)
                 }, redotimes*1000+500);
                
            }
            
        });
    }

}

function refresh_realtime(redotimes){
    if(redotimes<5){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: "bp-refresh-click",
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                console.log("[refreshByClick]:sucess send")
            }catch(e){
                //console.log(`[refreshByClick]:failed to send,${redotimes}`)
                console.log(message);
                setTimeout(() => { 
                    refresh_realtime(redotimes+1)
                 }, redotimes*1000+500);
                
            }
            
        });
    }

}

function send_short_msg(msgtype,redotimes){
    if(redotimes<5){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: msgtype,
                data: {
                }
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                //console.log(`[${msgtype}]:failed to send,${redotimes}`)
            }catch(e){
                //console.log(`[${msgtype}]:failed to send,${redotimes}`)
                console.log(message);
                setTimeout(() => { 
                    send_short_msg(msgtype,redotimes+1);
                 }, redotimes*1000+500);
                
            }
            
        });
    }

}

function send_str_msg(msgtype,cont,redotimes){
    if(redotimes<5){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: msgtype,
                data: {
                    cont: cont
                }
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                console.log("SuccessSendSTRmsg")
                //console.log(`[${msgtype}]:failed to send,${redotimes}`)
            }catch(e){
                //console.log(`[${msgtype}]:failed to send,${redotimes}`)
                setTimeout(() => { 
                    send_str_msg(msgtype,cont,redotimes+1);
                    console.log(`[${msgtype}]:XXsend,${(redotimes>0) ? (redotimes*100+50):1000}`)
                 }, (redotimes>0) ? (redotimes*100+50):1000);
                
            }
            
        });
    }

}


function send_comp_msg(msgtype,data,redotimes){
   // console.log(`[${msgtype}]:XXsend,${(redotimes>0) ? (redotimes*100+50):1000}`)
    if(redotimes<8){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            console.log(msgtype,data);
            let message = {
                type: msgtype,
                data: data
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                //console.log(`[${msgtype}]:failed to send,${redotimes}`)
            }catch(e){
                
                console.log(message);
                console.log(e)
                setTimeout(() => { 
                    send_str_msg(msgtype,data,redotimes+1);
                 }, (redotimes>0) ? (redotimes*100+50):1000);
                
            }
            
        });
    }

}
async function init_V2Calc(idList, semesterId, bgn_info, end_info, semesterType, year) {
    const subjectData = []; // 存储每个科目的数据

    // 遍历每个科目
    for (const subject of Object.values(idList)) {
        const classId = subject.classId;  // 从subject中获取classId
        const subjectId = subject.subjectId;  // 从subject中获取subjectId
        const subjectName = subject.subjectName;
        const className = subject.className;
        const subjectCode = subject.subjectCode;
        if(classId==-1){//2024-2025学年特判
            calcSubjectAvg(semesterId,subjectId,2);//使用v1方法计算
            continue;
        }
        // 拼接请求的URL
        const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;

        try {
            // 发起 GET 请求
            const response = await fetch(url, {
                method: 'GET', // 指定请求方法
                headers: {
                    'Content-Type': 'application/json', // 指定内容类型
                }
            });

            if (response.ok) {
                const data = await response.json(); // 解析响应体为JSON
                console.log(`[init_V2Calc] Fetched data for subjectId: ${subjectId}`, data);
                var subjectScore=0;
                var subjectTotalProp=0;
                for(const section of data.data.evaluationProjectList){
                    if (!(section.learningTaskAndExamList.length === 0 || 
                        (section.learningTaskAndExamList.length === 1 && section.learningTaskAndExamList[0].score === null))) {
                            subjectScore+=(section.score*section.proportion);
                            subjectTotalProp+=section.proportion;
                    }
                }
                subjectScore = (subjectScore/subjectTotalProp).toFixed(1);
                let subjectInfo={
                    ename: subjectName,
                    subjectCode: subjectCode,
                    semesterId: semesterId,
                    subjectId: subjectId
                }
                
                let course = {
                    className : className,
                    subjectId : subjectId,
                    scoreMappingId : (className.includes("AP")||className.includes("AS")||className.includes("A2")||className.includes("A Level"))? 6799:4517,
                    classEName : className,
                    smsId : semesterId,
                    subjectInfo : subjectInfo,
                    classId : classId,
                    subjectName : subjectName,
                    subjectEName : subjectName,
                    subjectScore : subjectScore,
                    updateDate : "/Date(1224086400000+0800)/",
                    isInGrade : true,
                    classType : 2,
                    isOriginal : true,
                    source : "original"
                }
                localStorage.removeItem(smsId+'|'+subjectId);
                saveToLocalStorage(semesterId+'|[V2]'+subjectId,course);




                // 将获取到的数据放入 subjectData
                subjectData.push({
                    subjectId: subjectId,
                    classId: classId,
                    data: data // 可以根据需要进一步处理 data
                });
            } else {
                console.error(`[init_V2Calc] Network response was not ok for subjectId: ${subjectId}`);
            }
        } catch (error) {
            console.error('[init_V2Calc] There has been a problem with your fetch operation:', error);
        }
    }

    // 返回最终的 subjectData
    return subjectData;
}


async function RequestSubjectAvg(url,mode) {
    


    console.log("Suc_Request_NewFunc")
    let urlObj = new URL(url);
    let semesterId = urlObj.searchParams.get("schoolSemesterId");
    let subjectId = urlObj.searchParams.get("subjectId");

    // Fetch the subject eName
    let subjectInfo = await fetchSubjectEName(semesterId, subjectId);
    if(mode==1&&!(subjectInfo.ename.includes("[Edited]"))){
        subjectInfo.ename = "[Edited] " + subjectInfo.ename;
        localStorage.removeItem(smsId+'|[O]'+subjectId);
        localStorage.removeItem(smsId+'|[V2]'+subjectId);
    }
    // Mark URL as being processed to avoid infinite loop
    processingUrls[url] = true;
    
    // Use XMLHttpRequest to fetch the response data
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = async function() {
        if (xhr.readyState == 4) {
            // Parse the response data as JSON
            var response = JSON.parse(xhr.responseText);
            // Extract the necessary information
            var extracted_data = [];
            var pendingRequests = 0;
            console.log("rdl",response.data.list);
            for(var item of usrAssignmentsBriefInfo){
                if(item.smsid==semesterId&&item.subjectid==subjectId){
                    response.data.list.push(item);
                }
            }
            for (var item of response.data.list) {
                if(item.score<=0){
                    zeroAmounts = zeroAmounts + 1;
                    zeroAssignmentList.push(item.learningTaskName);
                }
                if(item.score==item.totalScore){
                    fullScoreAmounts = fullScoreAmounts + 1;
                }
                let dataItem = {
                    "id": item.id,
                    "taskName": item.learningTaskName,
                    "learningTaskTypeEName": item.learningTaskTypeEName,
                    "score": item.score,
                    "totalScore": item.totalScore
                };
                
                pendingRequests++;
                //如果是用户自定义的任务
                if(item.id[0]=="g"){
                    extracted_data.push(usrAssignmentsInfo[item.id].info);
    
                    console.log("etcd",extracted_data);
                    pendingRequests--;
                    if  (pendingRequests === 0){
                        let gpa = calculateOverallScore(extracted_data);
                        saveCategorySummary(subjectId,extracted_data,semesterId); 
                        console.log("SUBJECT", subjectInfo)
                        saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa, semesterId,subjectInfo.ename);
                    }
                    continue;
                }

                await fetchCategoryAndProportion(item.id, dataItem, function(updatedItem) {
                    extracted_data.push(updatedItem);
                    pendingRequests--;
                    if  (pendingRequests === 0){
                        let gpa = calculateOverallScore(extracted_data);
                        saveCategorySummary(subjectId,extracted_data,semesterId); 
                        console.log("SUBJECT", subjectInfo)
                        saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa, semesterId,subjectInfo.ename);

                    }
                });
            }
            
            if (pendingRequests === 0) {
                console.log(extracted_data);
                let gpa = calculateOverallScore(extracted_data);
                saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa,semesterId,subjectInfo.ename);

                saveCategorySummary(subjectId,extracted_data,semesterId);  
            }
            
            // Once processed, remove the URL from the processing list
            setTimeout(() => { delete processingUrls[url]; }, 5000);
        }
    }
    xhr.send();
}

async function  fetchOriginalRequest(smsId) {
    isFetchOriginal = true;
    // 如果没有提供 semesterId 或 subjectId，可以直接返回 null 或抛出错误
    if (!smsId) {
        return;
    }
    urlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId="+smsId;

    try{
        const response = await fetch(urlPattern);
        const data = await response.json();
        console.log("OriginalData:",data.data.studentSemesterDynamicScoreBasicDtos);
        isFetchOriginal = false;
    
        //let subjectData = data.data.find(subject => subject.id == subjectId);
        /*
        if (subjectData) {
            return {
                ename: subjectData.eName,
                semesterId: semesterId,
                subjectId: subjectId
            };
        }
        */
        // 如果没有找到对应的科目，返回 null
        let originalCourseInfoList = data.data.studentSemesterDynamicScoreBasicDtos;
        for (var i=0;i<originalCourseInfoList.length;i++) {
            courseInfo = originalCourseInfoList[i];
            let subjectInfo = await fetchSubjectEName(smsId, courseInfo.subjectId);
            // Localstorage移除courseInfo.classId的字段
            localStorage.removeItem(smsId+'|[V2]'+courseInfo.subjectId);
            let course = {
                className : courseInfo.className,
                subjectId : courseInfo.subjectId,
                scoreMappingId : courseInfo.scoreMappingId,
                classEName : courseInfo.classEName,
                smsId : working_sms,
                subjectInfo : subjectInfo,
                classId : courseInfo.classId,
                subjectName : courseInfo.subjectName,
                subjectEName : courseInfo.subjectEName,
                subjectScore : courseInfo.subjectScore,
                updateDate : courseInfo.updateDate,
                isInGrade : courseInfo.isInGrade,
                classType : courseInfo.classType,
                updateDate : courseInfo.updateDate,
                isOriginal : true,
                source : "original"
            }
            
            saveToLocalStorage(smsId+'|[O]'+courseInfo.subjectId, course);
        }
    }catch (error) {
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        faceErrorWhileCalc = true;
        send_short_msg("calcErrorStop",0);
        return false;
    }
    
    return;
    //return data.data.studentSemesterDynamicScoreBasicDtos;
}

async function sendLoginMessage() {
    return;//暂时关闭
    rand_num = Math.floor(Math.random() * 3) + 1;
    var msg;
    if(rand_num == 1 || usr_setting.welcomeMsg.includes("Giaoculator")){
        msg = usr_setting.welcomeMsg;
    }else if(rand_num == 2){
        const tips = ["按下Esc可快速关闭当前页面或退出登录！", "使用数字键1~4以快速在“我的任务”“我的考试”“日程”和“动态成绩”之间切换！", "在登录界面可以按下Enter快速登录！", "Giaoculator的数据均为自行计算！", "Giaoculator暂无法获取期末考试的成绩"];
        const index = Math.floor(Math.random() * tips.length);
        msg = "你知道吗：" + tips[index];
    }else{
        try {
            const usrName = await fetchUsrInfo(); // 等待fetchUsrInfo()解析完成
            const hours = new Date().getHours(); // 获取当前小时数
            let greeting = "你好！"; 
            if (hours >= 5 && hours <= 10) {
              greeting = "上午好！";
            } else if (hours >= 11 && hours <= 12) {
              greeting = "中午好!";
            } else if (hours >= 13 && hours <= 17) {
              greeting = "下午好!";
            } else if (hours >= 18 && hours <= 23) {
              greeting = "晚上好!";
            } else {
              greeting = "凌晨了，睡个好觉！";
            }
        
            // 构建消息字符串
            msg = `${usrName ? usrName : '同学'}，${greeting}`;
          } catch (error) {
            console.error("Error sending message:", error);
          }
    }
    send_str_msg("tip_info", msg, 0);
    checkVersion(); // 更新检查

    
  }
  

  
  

async function AutoCalcAll() {
    faceErrorWhileCalc = false;
    did_autocalcall = true;
    const usrName = await fetchUsrInfo();
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        sendLoginMessage();
        his_range = usr_setting.calcRange;
        if (usr_setting.calcRange !== undefined && usr_setting.calcRange > 1) {
            his_range = usr_setting.calcRange;
        }
        console.log("[AutoCalc]Hisrange:",his_range);
        saveToLocalStorage("lastUpdate",Date.parse(new Date()));
        var data = await response.json();

        var startPos = 0;
        while(data.data[startPos].isNow==false){
            startPos++;
        }
        console.log("[AutoCalcNew]StartPos:",startPos);

        var year = data.data.slice(startPos, startPos+his_range).map(item => item.year);
        var semester = data.data.slice(startPos, startPos+his_range).map(item => item.semester);
        var ids = data.data.slice(startPos, startPos+his_range).map(item => item.id);
        var bgnDates = data.data.slice(startPos, startPos+his_range).map(item => item.startDate);
        var endDates = data.data.slice(startPos, startPos+his_range).map(item => item.endDate);
        let tmpdata={
            cur: 0,
            oval: his_range
        }
        send_comp_msg("show_process",tmpdata,-99999);
        for (var i=0;i<his_range;i++){
            if(ids[i] == null){
                semester = data.data.slice(startPos, startPos+his_range).map(item => item.semester);
                ids = data.data.slice(0, his_range).map(item => item.id);
                bgnDates = data.data.slice(0, his_range).map(item => item.startDate);
                endDates = data.data.slice(0, his_range).map(item => item.endDate);
                console.log("[AutoCalc]HisrangeChange:Redo_IDS_get");
            }
            working_sms = ids[i];
            smsId = ids[i];
            
            console.log("[AutoCalc]Start Calc",smsId);
            smsCalcStat[smsId] = -1;
            smsDateList[smsId] ={
                bgnDate:bgnDates[i],
                endDate:endDates[i]
            };
            if(i==0){ 
                zeroAmounts = 0;
                fullScoreAmounts = 0;
                zeroAssignmentList = [];
            }
            
            if(await CalcBySmsId(smsId,bgnDates[i],endDates[i],semester[i],year[i])){
                await isExistGPA(smsId);
                await fetchSchedule(bgnDates[i]);
                if(faceErrorWhileCalc){
                    await delay(2000);
                    send_str_msg("tip_err",`自动计算被异常打断，请重新登录平台`,0);
                    localStorage.clear();
                    did_autocalcall = false;
                    console.log("[Autocalc]Error stoped!")
                    return;
                }
                console.log("[AutoCalc]Finished Calc",smsId);
                smsCalcStat[smsId] = 1;
                let data={
                    cur: i+1,
                    oval: his_range
                }
                send_comp_msg("show_process",data,-999999);
                if((i+1) == his_range){
                    //if(his_range>1) send_str_msg("tip_suc",(navigator.language || navigator.userLanguage).includes('CN')? `已完成第${i+1}/${his_range}个学期计算，所有计算已完成！`:`All Calculation is Finished! ${i+1}/${his_range}`,0);
                    //else send_str_msg("tip_suc",(navigator.language || navigator.userLanguage).includes('CN')? `所有计算已完成！${i+1}/${his_range}`:`All Calculation is Finished! ${i+1}/${his_range}`,0);
                }else{
                    //send_str_msg("tip_suc",(navigator.language || navigator.userLanguage).includes('CN')?`已完成第${i+1}/${his_range}个学期的计算`:`Scheduled Calc Process:${i+1}/${his_range}`,0);
                }
                if(i==0&&zeroAmounts>0){ 
                    let zeroStr = "";
                    for(let i=0;i<zeroAssignmentList.length;i++){
                        zeroStr = zeroStr + "<br>" + zeroAssignmentList[i];
                    }
                    //popup_send_force(`<p>发现 ${zeroAmounts} 个零分任务，请及时补交：${zeroStr}</p>`)
                    // send_str_msg("send_pop", `<p>发现 ${zeroAmounts} 个零分任务，请及时补交：${zeroStr}</p>`, 0);
                    send_str_msg("tip_alert_long",tlang(`发现 ${zeroAmounts} 个零分任务，请及时补交：${zeroStr}`,`${zeroAmounts} Assignment(s) are Scored Zero: ${zeroStr}`),0);
                }
                console.log(`TEST ${fullScoreAmounts} 个满分任务`);
                popup_send_longterm(`<p>这是一段总结性质的文字，叫做长期文字，主要用来汇总</p>`)
                
                if(i==0){ 
                    chrome.storage.local.get(`[FullScoreCount]${usrName}`, function(data) {
                        let count = data ? data[`[FullScoreCount]${usrName}`] : 0;
                        if(count === undefined){
                            count = -1;
                        }
                        console.log("FullScore:",count,fullScoreAmounts);
                        if (fullScoreAmounts > count) {
                            if(count != -1){
                                send_str_msg("rib_fwk",3,0);
                                send_str_msg("tip_congrat",tlang(`恭喜！新增了 ${fullScoreAmounts-count} 个满分任务`,`Congrats！You got ${fullScoreAmounts-count} more Full Mark(s).`),0);
                            }else{
                                count = fullScoreAmounts;
                            }
                            let objToStore = {};
                            objToStore[`[FullScoreCount]${usrName}`] = fullScoreAmounts;
                            
                            chrome.storage.local.set(objToStore, function() {
                                console.log("[fullscore]New score has been stored.",objToStore);
                            });
                        } else if((count - 3) > fullScoreAmounts){//如果储存的数量比实际满分数量多出3个，说明出现了问题，重置计数器
                            let objToStore = {};
                            objToStore[`[FullScoreCount]${usrName}`] = fullScoreAmounts;
                            
                            chrome.storage.local.set(objToStore, function() {
                                console.log("[fullscore]>3,fix bug");
                            });
                            
                        }
                    });
                }
                await delay(500);
            }else{
                await delay(2000);
                send_str_msg("tip_err",`自动计算被异常打断，请重新登录平台`,0);
                localStorage.clear();
                did_autocalcall = false;
                console.log("[Autocalc]Error stoped!")
                return;
            }
            
            await delay(1000);
        }
        saveToLocalStorage("Info-SmsDateList",smsDateList);
        console.log("[AutoCalc]Finished All!");
        saveToLocalStorage("lastUpdate",Date.parse(new Date()));
        tmpdata={cur: his_range,oval: his_range}
        send_comp_msg("show_process",tmpdata,-99999);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDateInfo(dateInfo) {
    try {
        const timestamp = parseInt(dateInfo.match(/\d+/)[0]);
        // 创建Date对象
        const date = new Date(timestamp);

        // 提取年、月、日
        return {
            year: date.getFullYear(),
            mon: date.getMonth() + 1, // getMonth() 返回0-11，表示1-12月
            date: date.getDate()
        };
    } catch (error) {
        return false;
    }

    // 提取时间戳
    
}

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        if (message.type === "enable_change") {
            send_short_msg("bp-logpageState",0);
            chrome.storage.local.get('enable_state', async function(result) {
                var usrName = await fetchUsrInfo();
                enable_state = result.enable_state;
                console.log(enable_state)
                setTimeout(() => {
                    refresh_realtime(0);
                    if(did_autocalcall == false && enable_state == true && usrName != false){
                        AutoCalcAll();
                    }else{
                        var updateDate = getFromLocalStorage("lastUpdate");
                        Date.parse(new Date());
                        if(Date.parse(new Date()) - updateDate > 36000000){
                            send_str_msg("tip_info",(navigator.language || navigator.userLanguage).includes('CN')?`数据已过期，自动重新计算`:`Data is expired`,0);
                            AutoCalcAll();
                            localStorage.clear();
                            did_autocalcall = false;
                            
                        }
                    }
                }, 20);
            });
            
        }else if(message.type==="bp-ntwlogin"){
            ntwAutoLog();
            
        }else if(message.type==="bp-openSettings"){
            chrome.runtime.openOptionsPage();
        }else if(message.type==="gb_addtoUsrList"){
            let tmplist = message.data;
            for(var i=0;i<tmplist.length;i++){
                addNewUsrAssignment(tmplist[i].smsId,tmplist[i].subjectId,tmplist[i].name,tmplist[i].percentageScore,tmplist[i].proportion,tmplist[i].cataname);
                console.log(tmplist[i].smsId,tmplist[i].subjectId,tmplist[i].name,tmplist[i].percentageScore,tmplist[i].proportion,tmplist[i].cataname);
                console.log(message.additionalData);
            }
            gpaExistenceMap[tmplist[0].smsId] = false;
            calcSubjectAvg(tmplist[0].smsId,tmplist[0].subjectId,1);
        }else if(message.type==="gb_getSavedData"){
            let smsId = message.data.smsId;
            let subjectId = message.data.subjectId;
            let data = [];
            for(let i=0;i<usrAssignmentsBriefInfo.length;i++){
                if(usrAssignmentsBriefInfo[i].smsid == smsId && usrAssignmentsBriefInfo[i].subjectid == subjectId){
                    let assignmentInfo = usrAssignmentsInfo[usrAssignmentsBriefInfo[i].id];
                    console.log("ASSIGNMENTINFO:",assignmentInfo)
                    let assignment = {
                        cataName: assignmentInfo.info.category,
                        proportion: assignmentInfo.info.proportion,
                        score: assignmentInfo.info.score,
                        smsId: smsId,
                        subjectId: subjectId,
                        name: assignmentInfo.info.taskName
                    }
                    data.push(assignment);
                }
            }
            let msg={
                smsId: smsId,
                subjectId: subjectId,
                subjectName:message.data.subjectName,
                model:message.data.model,
                list: data
            }
            console.log("MSG:",msg);
            send_comp_msg("gb-savedData",msg,0);
        }else if(message.type==="submitLinkAssign"){
            let data = message.data;
            let linkName = "网页链接";
            if(data.link.includes("canva")){ linkName = "Canva 链接"}
            else if(data.link.includes("docs.go")){ linkName = "GoogleDocs 链接"}
            else if(data.link.includes("youtu")){ linkName = "Youtube 链接"}
            submitAssignment(data.id,data.link,linkName,message.cont);
        }
    }
);




async function calcSubjectAvg(smsId,subjectId,mode){
    const bgn_parsed = parseDateInfo(smsDateList[smsId].bgnDate);
    const end_parsed = parseDateInfo(smsDateList[smsId].endDate);
    if(!bgn_parsed || !end_parsed){
        send_str_msg("tip_err","计算时出现问题：SmsId不存在或未定义",0);
        send_short_msg("calcErrorStop",0);
        faceErrorWhileCalc = true;
        console.log("SmsIdError,Smsid:",semesterId)
        return false;
    }
    // 新建变量并赋值
    let bgn_year = bgn_parsed.year;
    let bgn_mon = bgn_parsed.mon;
    let bgn_date = bgn_parsed.date;

    let end_year = end_parsed.year;
    let end_mon = end_parsed.mon;
    let end_date = end_parsed.date;

    let subjectRequestUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStatistics?schoolSemesterId=${smsId}&subjectId=${subjectId}&learningTaskTypeId=null&beginDate=${bgn_year}-${bgn_mon}-${bgn_date}&endDate=${end_year}-${end_mon}-${end_date}&page.pageIndex=1&page.pageSize=500`;
    await RequestSubjectAvg(subjectRequestUrl,mode);
}



async function isExistGPA(smsId) {
    const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetGpa?semesterId=${smsId}`;
    try {
        isFetchingGPA = true;
        let response = await fetch(url);
        let data = await response.json();
        console.log("do a fetch");

        // 检查是否已存在有效的GPA数据
        if (data && data.data && typeof data.data === 'number' && data.data > 0) {
            console.log("GPA data already exists for smsId:", smsId);
            gpaExistenceMap[smsId] = true;
        } else {
            console.log("No valid GPA data found for smsId:", smsId);
            gpaExistenceMap[smsId] = false;
        }
    } catch (error) {
        console.error("Error fetching GPA data for smsId:", smsId, error);
        gpaExistenceMap[smsId] = false;
    }
    isFetchingGPA = false;
}


async function ntwAutoLog(startDate) {
    chrome.storage.local.get(['savedPostData'], function(result) {
        console.log(JSON.stringify(result.savedPostData.formData))
        if (result.savedPostData) {
        } else {
          console.log('No postData found.');
        }
        const url = 'http://4.3.2.1/ac_portal/login.php';
        const data  = result.savedPostData.formData;
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
            params.append(key, data[key]);
        });
    
        if (!data) {
            return;
        }
    
        // 使用fetch发送POST请求
        fetch(url, {
        method: 'POST', // 指定请求方法
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', // 正确设置Content-Type
        },
        body: params // 使用URLSearchParams格式化数据
        })
        .then(response => {
        if (response.ok) {
            return response.json(); // 如果响应状态码为200，解析响应体为JSON
        }
        throw new Error('Network response was not ok.');
        })
        .then(data => console.log(data)) // 处理返回的数据
        .catch(error => console.error('There has been a problem with your fetch operation:', error));
    
        send_short_msg("bp-OpenPageAfterLoginNtw", 0);
      });
    
}
  

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.method === "POST" && details.url === "http://4.3.2.1/ac_portal/login.php") {
            chrome.storage.local.get('user_preference', function(data) {
                if(data.user_preference.autologNtw){
                    var postData = details.requestBody;
                    console.log("Captured POST request to the target URL: ", postData);
        
                    // 检查本地存储中是否已有postData
                    chrome.storage.local.get(['savedPostData'], function(result) {
                        if (result.savedPostData) {
                            console.log('PostData already exists.');
                        } else {
                            // 如果本地没有postData，保存新的postData
                            if(JSON.stringify(postData).includes("rememberPwd")){
                                chrome.storage.local.set({'savedPostData': postData}, function() {
                                    console.log('New POST request payload is saved.');
                                });
                            }else{
                                console.log("Not Match!")
                            }
                            
                        }
                    });
                }else{
                    console.log("功能未开启")
                }
            });
            // 获取POST请求的载荷
            
        }
    },
    {urls: ["http://4.3.2.1/ac_portal/login.php"]},
    ["requestBody"]
);


async function submitAssignment(learningTaskId,fileUrl,fileName,cont) {
    
    const url = 'https://tsinglanstudent.schoolis.cn/api/LearningTask/Save';
    if(cont == "del"){
        var data = {
            learningTaskId: learningTaskId,
            learningTaskStudentDocuments:[],
            remark: ``
        };
    }else{
        var data = {
            learningTaskId: learningTaskId,
            learningTaskStudentDocuments:[
                {
                    id : getRandomInt(300000,700000),
                    name : fileName,
                    size : 10,
                    pdfUrl: fileUrl,
                    sort : 1,
                    type : ".pdf",
                    url : fileUrl
                }
            ],
            remark: cont
        };
    }
    

    
    
    fetch(url, {
      method: 'POST', // 指定请求方法
      headers: {
        'Content-Type': 'application/json', // 指定内容类型
        // 这里添加任何其他必要的请求头
      },
      body: JSON.stringify(data) // 将请求体转换为JSON字符串
    })
    .then(response => {
      if (response.ok) {
        return response.json(); // 如果响应状态码为200，解析响应体为JSON
      }
      throw new Error('Network response was not ok.');
    })
    .then(data => console.log(data)) // 处理返回的数据
    .catch(error => console.error('There has been a problem with your fetch operation:', error));
  }




async function fetchSchedule(startDate) {
    return;//暂时关闭，未完成
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';
    const bgn_parsed = parseDateInfo(startDate);
    let bgn_year = bgn_parsed.year;
    let bgn_mon = bgn_parsed.mon;
    let bgn_date = bgn_parsed.date;
    let end_date = bgn_date;
    let end_mon = bgn_mon;
    if(bgn_date>13){
        end_mon += 1;
    }else{
        end_date += 15;
    }
    // 使用指定的请求载荷格式
    const data = {
      beginTime: "2024-03-21",
      endTime: "2024-03-21"
    };
    
    fetch(url, {
      method: 'POST', // 指定请求方法
      headers: {
        'Content-Type': 'application/json', // 指定内容类型
        // 这里添加任何其他必要的请求头
      },
      body: JSON.stringify(data) // 将请求体转换为JSON字符串
    })
    .then(response => {
      if (response.ok) {
        return response.json(); // 如果响应状态码为200，解析响应体为JSON
      }
      throw new Error('Network response was not ok.');
    })
    .then(data => console.log(data)) // 处理返回的数据
    .catch(error => console.error('There has been a problem with your fetch operation:', error));
  }
async function ntwAutoLog(startDate) {
    chrome.storage.local.get(['savedPostData'], function(result) {
        console.log(JSON.stringify(result.savedPostData.formData))
        if (result.savedPostData) {
        } else {
          console.log('No postData found.');
        }
        const url = 'http://4.3.2.1/ac_portal/login.php';
        const data  = result.savedPostData.formData;
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
            params.append(key, data[key]);
        });
    
        if (!data) {
            return;
        }
    
        // 使用fetch发送POST请求
        fetch(url, {
        method: 'POST', // 指定请求方法
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', // 正确设置Content-Type
        },
        body: params // 使用URLSearchParams格式化数据
        })
        .then(response => {
        if (response.ok) {
            return response.json(); // 如果响应状态码为200，解析响应体为JSON
        }
        throw new Error('Network response was not ok.');
        })
        .then(data => console.log(data)) // 处理返回的数据
        .catch(error => console.error('There has been a problem with your fetch operation:', error));
    
        send_short_msg("bp-OpenPageAfterLoginNtw", 0);
      });
    
}
  

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.method === "POST" && details.url === "http://4.3.2.1/ac_portal/login.php") {
            chrome.storage.local.get('user_preference', function(data) {
                if(data.user_preference.autologNtw){
                    var postData = details.requestBody;
                    console.log("Captured POST request to the target URL: ", postData);
        
                    // 检查本地存储中是否已有postData
                    chrome.storage.local.get(['savedPostData'], function(result) {
                        if (result.savedPostData) {
                            console.log('PostData already exists.');
                        } else {
                            // 如果本地没有postData，保存新的postData
                            if(JSON.stringify(postData).includes("rememberPwd")){
                                chrome.storage.local.set({'savedPostData': postData}, function() {
                                    console.log('New POST request payload is saved.');
                                });
                            }else{
                                console.log("Not Match!")
                            }
                            
                        }
                    });
                }else{
                    console.log("功能未开启")
                }
            });
            // 获取POST请求的载荷
            
        }
    },
    {urls: ["http://4.3.2.1/ac_portal/login.php"]},
    ["requestBody"]
);





function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}

function getRandomInt(min,max) {
    return min+Math.floor(Math.random() * (max-min));
}

function addNewUsrAssignment(smsid,subjectid,name, percentageScore,proportion,cataName) {
    let tmplength = Object.keys(usrAssignmentsInfo).length
    let usrAssignmentInfo = {
        smsId: smsid,
        subjectId: subjectid,
        info: {
            id: "g" + (tmplength + 1016),
            learningTaskName: "[G]" + name,
            totalScore: 100,
            score: percentageScore,
            studentName: "用户自定义任务",
            studentEName: "Created by User",
            taskName:"[G]" + name,
            typeName: "用户自定义任务",
            typeEName: "Created by User",
            isChild: false,
            category: cataName,
            proportion: proportion,
            child_proportion: -1,
            finishState: 1,
            evaProjects: [
                {
                  isDisplayProportion: true,
                  proportion: proportion,
                  proPath: "30468,",
                  parentProId: 0,
                  id: 30468,
                  name: cataName,
                  eName: cataName
                }
            ]
        },
        
    };
    let usrAssignmentStatisticsInfo = {
        smsid: smsid,
        subjectid: subjectid,
        id: "g" + (tmplength + 1016),
        learningTaskName: name,
        learningTaskTypeName: "用户自定义任务",
        learningTaskTypeEName: "Created by User",
        score: percentageScore,
        totalScore: 100,
        scoringAverage: percentageScore,
        endDate: "/Date(1000000000000+0800)/"
    }
    usrAssignmentsInfo["g" + (tmplength + 1016)]=usrAssignmentInfo;
    usrAssignmentsBriefInfo.push(usrAssignmentStatisticsInfo);

}

function popup_send_dot(message){
    let data = {
        type: "dot",
        message: message
    }
    console.log("send_dot",data)
    send_comp_msg("send_pop", data, -999)
}

function popup_send_force(message){
    let data = {
        type: "force",
        message: message
    }
    console.log("send_force",data)
    send_comp_msg("send_pop", data, -999)
}

function popup_send_longterm(message) {
    let data = {
        type: "longterm",
        message: message
    }
    console.log("send_longterm",data)
    send_comp_msg("send_pop_longterm", data, -999)
}

function testAuthFlow() {
    console.log("Starting authorization...");
    getAuthToken();  // 发起授权流程
}

function getAuthToken() {
    console.log("IsEqual?:", chrome.runtime.id == "ppjkphidfjbldjnaoohngidmihckhnff");

    const clientId = '13f429db-81e8-4b32-8f48-e68f0adb25e1';
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
    const responseType = 'token';
    const responseMode = 'fragment';
    const state = '12345';

    // 定义 Scope 数组
    const scopes = [
        'openid',                   // 基础范围，必需
        'email',                    // 获取用户的电子邮件
        'profile',
        'User.Read',                // 获取用户的个人信息/测试用
        'EduAssignments.Read',
        'EduRoster.ReadBasic'
        // 'EduAssignments.ReadWrite.All'  // 教育作业相关权限
    ];

    // 使用 Array.join 拼接 Scope 字符串
    const scopeString = scopes.join('%20');

    // 构建授权请求 URL
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&response_mode=${responseMode}&scope=${scopeString}&state=${state}`;

    chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        function (redirectUrl) {
            console.log('Redirect URL:', redirectUrl); // 输出完整的重定向URL以进行调试
            if (chrome.runtime.lastError || redirectUrl.includes('error=access_denied')) {
                console.error('Authorization failed:', chrome.runtime.lastError);
            } else {
                // 解析URL中的hash部分来获取token
                const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1)); // 使用hash解析
                const accessToken = urlParams.get('access_token');
                console.log("Access Token received:", accessToken); // 检查是否正确获取了访问令牌
                if (accessToken) {
                    // 将访问令牌保存到chrome.storage.local
                    chrome.storage.local.set({ accessToken }, function() {
                        console.log("Access Token stored successfully.");
                    });
                } else {
                    console.error('Failed to receive access token.');
                }
            }
        }
    );
}

function fetchTeamsUserProfile() {
    // 从chrome.storage.local获取保存的访问令牌
    chrome.storage.local.get(['accessToken'], function(result) {
        const accessToken = result.accessToken;
        if (!accessToken) {
            console.error('No access token found.');
            return;
        }

        // 使用获取到的访问令牌调用Microsoft Graph API来获取用户的基本信息和电子邮件
        fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            return response.json();
        })
        .then(data => {
            // 输出用户的电子邮件和个人资料信息
            console.log('User Profile:', data);
            console.log('User Email:', data.mail || data.userPrincipalName); // 输出电子邮件
            console.log('User Display Name:', data.displayName); // 输出显示名称
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
    });
}
// 从chrome.storage.local获取保存的访问令牌，获取用户的课程信息并输出所有作业
function fetchTeamsUserClassesAndAssignments() {
    chrome.storage.local.get(['accessToken'], function(result) {
        const accessToken = result.accessToken;
        if (!accessToken) {
            console.error('No access token found.');
            return;
        }

        fetch('https://graph.microsoft.com/v1.0/education/me/classes', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user classes');
            }
            return response.json();
        })
        .then(classesData => {
            const classes = classesData.value; // 获取课程列表
            if (!classes || classes.length === 0) {
                console.log('No classes found.');
                return;
            }

            let allAssignments = []; // 存储所有课程的作业

            // 遍历每个课程
            classes.forEach(classInfo => {
                const classId = classInfo.id;
                const className = classInfo.displayName;

                fetch(`https://graph.microsoft.com/v1.0/education/classes/${classId}/assignments`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch assignments for class ${className}`);
                    }
                    return response.json();
                })
                .then(assignmentsData => {
                    const assignments = assignmentsData.value;
                    var MSTaskID = 1016;
                    if (assignments && assignments.length > 0) {
                        console.log(`Assignments for class: ${className}`);

                        // 遍历每个 assignment 并创建 assignment 对象
                        assignments.forEach(assignment => {
                            const assignmentObj = {
                                subjectName: className,
                                typeName: assignment.displayName,
                                beginTime: assignment.assignedDateTime,
                                endTime: assignment.dueDateTime,
                                id: 'ms'+MSTaskID,
                                msId: assignment.id,
                                webUrl: assignment.webUrl
                            };
                            MSTaskID += 1;
                            allAssignments.push(assignmentObj);
                        });
                    } else {
                        console.log(`No assignments found for class: ${className}`);
                    }
                })  
                .catch(error => {
                    console.error(`Error fetching assignments for class ${className}:`, error);
                });
            });

            // 使用 setTimeout 确保所有异步操作都完成
            setTimeout(() => {
                // 当前日期
                const currentDate = new Date();
                // 14天前的日期
                const fourteenDaysAgo = new Date();
                fourteenDaysAgo.setDate(currentDate.getDate() - 14);
            
                // 过滤和排序作业
                const filteredAssignments = allAssignments
                    .filter(assignment => new Date(assignment.beginTime) >= fourteenDaysAgo && new Date(assignment.beginTime) <= currentDate) // 筛选出14天内的任务
                    .sort((a, b) => new Date(a.beginTime) - new Date(b.beginTime)); // 按开始时间排序
            
                // 将作业列表存入 local storage
                saveToLocalStorage("MSTasks", filteredAssignments);
                console.log("[FinalTeamsTasks]", filteredAssignments);
            }, 2000); // 延迟 2 秒等待所有请求完成
            
        })
        .catch(error => {
            console.error('Error fetching user classes:', error);
        });
    });
}
    

function getMaxCommonConsecutiveLength(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const m = str1.length;
    const n = str2.length;
    let maxLen = 0;
    let prev = Array(n + 1).fill(0);
    let current = Array(n + 1).fill(0);
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                current[j] = prev[j - 1] + 1;
                if (current[j] > maxLen) {
                    maxLen = current[j];
                }
            } else {
                current[j] = 0;
            }
        }
        // 交换 prev 和 current
        [prev, current] = [current, prev];
    }
    
    return maxLen;
}
