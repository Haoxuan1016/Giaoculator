let EXTENSION_VERSION = [4,5,3]

let processingUrls = {};    
let categoryCache = {};
var his_range = 1;
var usr_setting = {};
var enable_state = true;
var did_autocalcall = false;
var working_sms = 24699;
var working_sms_sequenceId = 1;
var isFetchOriginal = false;
var sequenceDic = {24700:0, 24699:1, 21208:2, 21207:3}; 
var smsCalcStat = new Array();

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



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const LoginPattern = "https://tsinglanstudent.schoolis.cn/";
    const HomepagePattern = "https://tsinglanstudent.schoolis.cn/Home#!/task/list";
    // 当URL变化时，重新注入内容脚本
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
            send_short_msg("replace_context",0);
        }, 200);
        
    } else if (tab.url === LoginPattern) {
        did_autocalcall = false;
        smsCalcStat = [];
        localStorage.clear();
        console.log("localStorageCLeared");
        chrome.storage.local.get('user_preference', function(data) {
            if (data.user_preference) {
                console.log('Loaded preferences:', data.user_preference);
                usr_setting = data.user_preference;
            } else {
                console.log('No preferences found.');
                var langSet = navigator.language || navigator.userLanguage; 
                if(langSet.includes('CN')){
                    defaultwelcomeMsg = "欢迎使用Giaoculator！<br>请前往设置以定义Giaoculator的更多功能！"
                }else{
                    defaultwelcomeMsg = "Welcome!<br>Go to settings to costumize your Giaoculator!"
                }
                var user_preference = {
                    calcRange: parseInt(1, 10),
                    welcomeMsg: defaultwelcomeMsg,
                    autoHide: true,
                    autoHide_Condition: parseInt(60, 10)
                };
                chrome.storage.local.set({user_preference: user_preference});
                usr_setting = user_preference;
            }
        });
        
    } else if (tab.url === HomepagePattern) {
        if(localStorage.length < 2){
            if(!did_autocalcall){
                did_autocalcall = true;
                console.log("Do autocalc");
                console.log("[HPPattern] Do autocalc");
                chrome.storage.local.get('enable_state', function(result) {
                    if (result.enable_state === true) {
                        AutoCalcAll();
                    }
                });
            }
        }else{
            console.log("[HPPattern] LS>2, not autocalc");
            //send_str_msg("tip_suc",`已读取到本地记录，无须再次计算！`,0);
        }
        
    }
});


chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const detailsUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=";
        const GPAUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetGpa?semesterId=";
        const GiaoculatorClassUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=gcalc";
        const InfoPagePattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId";
        const PresentAssignmentPattern = "https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?"

        if (details.url.startsWith(InfoPagePattern)) {
            setTimeout(() => {
                send_short_msg("rc_infopage",0);
            }, 10);
            
            
        }

        if (details.url.startsWith(PresentAssignmentPattern)&&usr_setting.autoHide) {
            setTimeout(() => {
                send_str_msg("rc_hideasm",usr_setting.autoHide_Condition,0);
                setTimeout(() => {
                    send_str_msg("rc_hideasm",usr_setting.autoHide_Condition,0);
                }, 10);
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
                console.log("courseInfo:",courseInfo);
                if(courseInfo.source == "original"){
                    course.className = courseInfo.className;
                    course.classEName = courseInfo.classEName;
                    course.classId = courseInfo.classId;
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
                    console.log("Pushed!TypeORIGINALdata:",course.subjectEName);
                    add_count+=1;
                }
            }
            for (let courseInfo of courseInfoList) {
                let course = JSON.parse(JSON.stringify(template));
                if(courseInfo.source == "calc" && courseInfo.gpa >= 0){
                    course.className = courseInfo.ename;
                    course.classEName = courseInfo.ename;
                    course.subjectName = courseInfo.ename;
                    course.subjectEName = courseInfo.ename;
                    course.subjectId = courseInfo.subjectId;
                    course.subjectScore = courseInfo.gpa;
                    totalCourse.push(course);
                    console.log("Pushed!TypeCALCdata:",courseInfo.ename);
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
            
        }/* else if (details.url.startsWith(GPAUrlPattern)) {
            // gpa = getFromLocalStorage(0).gpa => number;
            let totalGPA = 0;
            let scores = getAllGPAValues();
            let gpas = [];
            // 根据gpaRules将scores转换为gpa，然后加入gpas列表
            for (let score of scores) {
                for (let rule of gpaRules) {
                    if (score >= rule.minValue && score <= rule.maxValue) {
                        gpas.push(rule.gpa);
                        break;
                    }
                }
            }

            // 计算平均GPA
            for (let gpa of gpas) {
                totalGPA += gpa;
            }
            let avgGPA = totalGPA / gpas.length;

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
            
        }*/else if (details.url.startsWith(GiaoculatorClassUrlPattern)) {
            const urlParams = new URLSearchParams(new URL(details.url).search);
            let req_subjectId = urlParams.get('subjectId');
            let req_semesterId = urlParams.get('semesterId');
            const data = getFromLocalStorage(req_semesterId + "|I" + req_subjectId);
            console.log(data);
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

            for (const [key, value] of Object.entries(data)) {
                let itemTemplate = baseTemplate; // 获取对应的模板或默认模板
                let newItem = {
                    ...itemTemplate, // 展开模板中的属性
                    evaluationProjectName: key,
                    evaluationProjectEName: key,
                    proportion: value.proportion,
                    score: (value.totalScore/value.taskCount).toFixed(1), 
                    scoreLevel: calculateGPA(value.totalScore/value.taskCount).displayName,
                    gpa: calculateGPA(value.totalScore/value.taskCount).gpa
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



chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        const detailsUrlPattern = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=";
        
        // 检查请求的URL是否匹配
        if (details.url.startsWith(detailsUrlPattern+working_sms)) {
            return; // 先暂时关闭
            if(isFetchOriginal == true){
                console.log("PartB:IsFetchingOriginal=True, do nothing!");
                return null;
            }else{
                console.log("PartB:IsFetchingOriginal=false");
               
            }
            let totalCourse = [];
            let template = {"grade":null,"classType":2,"classId":277851,"className":"GPA Calculator","classEName":"GPA Calculator","subjectId":100628,"subjectName":"Giaoculator","subjectEName":"Giaoculator","isInGrade":true,"subjectScore":100,"scoreMappingId":4517,"updateDate":"\/Date(0000000000000+0800)\/","subjectTotalScore":100.0,"scoreType":1,"levelString":"A+"};

            // 获取所有的course
            let courseInfoList = getAllCourseInfo();
            
            if (courseInfoList.length < 1) {
                isAutoCalculating = true;
                console.log("PartB:courseInfoList.length is empty,START CALC");
                await CalcBySmsId(working_sms);
                setTimeout(() => { 
                    //fetchOriginalRequest(working_sms);
                    setTimeout(() => { 
                        //alert("Giaoculator已计算完成，点击确定刷新页面");
                        refresh_realtime(0);
                        setTimeout(() => { 
                            //alert("Giaoculator已计算完成，点击确定刷新页面");
                            refresh_realtime(0);
                        }, 400);
                    }, 200);
                 }, 100);
                courseInfoList = getAllCourseInfo();
                
            }else{
                setTimeout(() => {
                    send_short_msg("replace_context",0);
                }, 25);
                console.log("PartB:List>1,donothing");
            }
        }
    },
    

    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["blocking"]
);

chrome.webRequest.onCompleted.addListener(
    async function(details) {
        if (details.url.includes("GetStatistics?") && !processingUrls[details.url]) {

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
                                console.log(extracted_data);
                                let gpa = calculateOverallScore(extracted_data);
                                printCategorySummary(subjectId,extracted_data);  // If you also want to print the summary
                                console.log("SUBJECT", subjectInfo)
                                saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa)

                            }
                        });
                    }
                    
                    if (pendingRequests === 0) {
                        console.log(extracted_data);
                        let gpa = calculateOverallScore(extracted_data);

                        saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa)

                        printCategorySummary(subjectId,extracted_data);  // 新增这一行来调用新函数
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

function fetchCategoryAndProportion(taskId, dataItem, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${taskId}`, true);
    resetUI();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            let response = JSON.parse(xhr.responseText);
            let category = "Not For GPA / 不计入";
            let proportion = 0;
            try{
                category = response.data.evaProjects[0].eName;
                proportion = response.data.evaProjects[0].proportion;
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
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) { // 请求已完成
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

function printCategorySummary(subId,data) {
    let categorySummary = {};
    // 0. 分割线
    console.log('=============================================')


    // 1. Group tasks by category
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

    // 2. Calculate avg and print summary for each category
    for (let category in categorySummary) {
        let avgScore = categorySummary[category].totalScore / categorySummary[category].taskCount;
        /*
        console.log(`Category: ${category}`);
        console.log(`Proportion: ${categorySummary[category].proportion}%`);
        console.log(`Number of Tasks: ${categorySummary[category].taskCount}`);
        console.log(`Avg: ${avgScore.toFixed(2)}%`);
        console.log('-------------------');
        */
    }
    saveToLocalStorage('I'+subId,categorySummary)
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
                semesterId: semesterId,
                subjectId: subjectId
            };
        }
        return null;
    }catch (error) {
        if(semesterId == null) semesterId = "null";
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        return "error";
    }

}


function saveSubjectInfo(subjectId, dataCollect, dataInfo, gpa){
    let data = {
        gpaInfo: dataInfo,
        gpa: gpa,
        subjectId: subjectId,
        smsId: working_sms,
        tasksInfo: dataCollect,
        isOriginal: false,
        source: "calc"
    }
    saveToLocalStorage(subjectId, data);
}

// 将对象保存到localStorage的函数
function saveToLocalStorage(keyName, obj) {
    try {
        const jsonString = JSON.stringify(obj);
        localStorage.setItem(working_sms+'|'+keyName, jsonString);
        console.log("已存入"+keyName+"的data!");
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        send_str_msg("tip_err",error,0);
    }
}



// 从localStorage读取并解析对象的函数
function getFromLocalStorage(keyName) {
    try {
        const jsonString = localStorage.getItem(keyName);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error reading from localStorage or parsing:', error);
        send_str_msg("tip_err",error,0);
        return null;
    }
}

function getAllGPAValues(targsms) {
    let gpaList = [];

    // 遍历所有localStorage的键
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // 使用之前的函数来获取每个键的值
        const data = getFromLocalStorage(targsms+'|'+key);
        
        // 检查对象中是否有gpa属性
        if (data && typeof data.gpa !== 'undefined') {
            // 将gpa值转换为浮点数并加入列表中
            gpaList.push(parseFloat(data.gpa));
        }
    }
    
    return gpaList;
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


async function CalcBySmsId(semesterId,bgn_info,end_info) {
    const bgn_parsed = parseDateInfo(bgn_info);
    const end_parsed = parseDateInfo(end_info);
    if(!bgn_parsed || !end_parsed){
        send_str_msg("tip_err","计算时出现问题：SmsId不存在或未定义",0);
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
        await fetchOriginalRequest(semesterId);
        if (data && data.data && data.data.length > 0) {
            // 遍历所有科目
            for (const subject of data.data) {
                if(localStorage.getItem(semesterId+'|'+subject.id) === null){
                    let subjectRequestUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStatistics?schoolSemesterId=${semesterId}&subjectId=${subject.id}&learningTaskTypeId=null&beginDate=${bgn_year}-${bgn_mon}-${bgn_date}&endDate=${end_year}-${end_mon}-${end_date}&page.pageIndex=1&page.pageSize=500`;
                    // 假设 RequestSubjectAvg 也是异步函数
                    await RequestSubjectAvg(subjectRequestUrl);
                }else{
                    console.log("[CalcBySmsId]学科数据已存在，无需重复计算。" + subject.id);
                }
                // 对每个科目ID构造请求并调用 RequestSubjectAvg      
                    
            }
        }
        return true;
    } catch (error) {
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        return false;
    } finally {
         
    }

    // 函数无需显式返回值，除非有特定的返回需求
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
                type: "refresh",
                data: {
                }
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                console.log("[refreshpage]:sucess send")
            }catch(e){
                console.log(`[refeshpage]:failed to send,${redotimes}`)
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
                type: "refresh-click",
                data: {
                    sequence: working_sms_sequenceId
                }
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
                console.log("[refreshByClick]:sucess send")
            }catch(e){
                console.log(`[refreshByClick]:failed to send,${redotimes}`)
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
                console.log(`[${msgtype}]:failed to send,${redotimes}`)
            }catch(e){
                console.log(`[${msgtype}]:failed to send,${redotimes}`)
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
                console.log(`[${msgtype}]:failed to send,${redotimes}`)
            }catch(e){
                console.log(`[${msgtype}]:failed to send,${redotimes}`)
                console.log(message);
                setTimeout(() => { 
                    send_str_msg(msgtype,cont,redotimes+1);
                 }, redotimes*1000+500);
                
            }
            
        });
    }

}


async function RequestSubjectAvg(url) {
    console.log("Suc_Request_NewFunc")
    let urlObj = new URL(url);
    let semesterId = urlObj.searchParams.get("schoolSemesterId");
    let subjectId = urlObj.searchParams.get("subjectId");

    // Fetch the subject eName
    let subjectInfo = await fetchSubjectEName(semesterId, subjectId);
    
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
            for (var item of response.data.list) {
                 
                let dataItem = {
                    "id": item.id,
                    "taskName": item.learningTaskName,
                    "learningTaskTypeEName": item.learningTaskTypeEName,
                    "score": item.score,
                    "totalScore": item.totalScore
                };
                
                pendingRequests++;
                await fetchCategoryAndProportion(item.id, dataItem, function(updatedItem) {
                    extracted_data.push(updatedItem);
                    pendingRequests--;
                    if  (pendingRequests === 0){
                        console.log(extracted_data);
                        let gpa = calculateOverallScore(extracted_data);
                        printCategorySummary(subjectId,extracted_data);  // If you also want to print the summary
                        console.log("SUBJECT", subjectInfo)
                        saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa)

                    }
                });
            }
            
            if (pendingRequests === 0) {
                console.log(extracted_data);
                let gpa = calculateOverallScore(extracted_data);

                saveSubjectInfo(subjectId, extracted_data, subjectInfo, gpa)

                printCategorySummary(subjectId,extracted_data);  // 新增这一行来调用新函数
            }
            
            // Once processed, remove the URL from the processing list
            setTimeout(() => { delete processingUrls[url]; }, 5000);
        }
    }
    xhr.send();
}

async function fetchOriginalRequest(smsId) {
    isFetchOriginal = true;
    // 如果没有提供 semesterId 或 subjectId，可以直接返回 null 或抛出错误
    if (!smsId) {
        smsId = 24699;
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
            // Localstorage移除courseInfo.classId的字段
            localStorage.removeItem(smsId+'|'+courseInfo.subjectId);
            let course = {
                className : courseInfo.className,
                subjectId : courseInfo.subjectId,
                classEName : courseInfo.classEName,
                smsId : working_sms,
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
            saveToLocalStorage(courseInfo.subjectId, course);
        }
    }catch (error) {
        console.error('Error fetching subject data:', error);
        send_str_msg("tip_err","计算 "+semesterId+" 学期时出现问题:" + error,0);
        return false;
    }
    
    return;
    //return data.data.studentSemesterDynamicScoreBasicDtos;
}

async function sendLoginMessage() {
    rand_num = Math.floor(Math.random() * 3) + 1;
    var msg;
    if(rand_num == 1 || usr_setting.welcomeMsg.includes("Giaoculator")){
        msg = usr_setting.welcomeMsg;
    }
    else if(rand_num == 2){
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
    
  }
  

  
  

async function AutoCalcAll() {
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        sendLoginMessage();
        if (usr_setting.calcRange !== undefined && usr_setting.calcRange > 1) {
            his_range = usr_setting.calcRange;
        }
        console.log("[AutoCalc]Hisrange:",his_range);

        var data = await response.json();
        var ids = data.data.slice(0, his_range).map(item => item.id);
        var bgnDates = data.data.slice(0, his_range).map(item => item.startDate);
        var endDates = data.data.slice(0, his_range).map(item => item.endDate);
        for (var i=0;i<his_range;i++){
            if(ids[i] == null){
                ids = data.data.slice(0, his_range).map(item => item.id);
                bgnDates = data.data.slice(0, his_range).map(item => item.startDate);
                endDates = data.data.slice(0, his_range).map(item => item.endDate);
                console.log("[AutoCalc]HisrangeChange:Redo_IDS_get");
            }
            working_sms = ids[i];
            smsId = ids[i];
            
            console.log("[AutoCalc]Start Calc",smsId);
            smsCalcStat[smsId] = -1;
            if(await CalcBySmsId(smsId,bgnDates[i],endDates[i])){
                console.log("[AutoCalc]Finished Calc",smsId);
                smsCalcStat[smsId] = 1;
                if((i+1) == his_range){
                    if(his_range>1) send_str_msg("tip_suc",`已完成 ${smsId} 学期的计算, 所有计算均已完成`,0);
                    else send_str_msg("tip_suc",`计算已完成`,0);
                }else{
                    send_str_msg("tip_suc",`已完成 ${smsId} 学期的计算, 总进度 ${i+1}/${his_range}`,0);
                }
                await delay(1000);
            }else{
                await delay(2000);
                send_str_msg("tip_err",`自动计算被异常打断，请重新登录平台`,0);
                console.log("[Autocalc]Error stoped!")
                return;
            }
            
            await delay(1000);
        }
        console.log("[AutoCalc]Finished All!",smsId);
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