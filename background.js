chrome.webRequest.onCompleted.addListener(
    (details) => {
        const { url } = details;
        // URL 定义
        const LoginUrl = "https://tsinglanstudent.schoolis.cn/api/StudyAbroad/GetStudentPromotionIdByStudentId";
        const DynamicScoreDetailUrl = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail";

        // 判断 URL 并执行对应逻辑
        if (url === LoginUrl) {
            console.log("{logged in}", details);
            InitGCalc(); // 用户登录逻辑
            setTimeout(() => {
                M_send_comp_msg("bp-loggedin", null, 0);
            }, 100);

        } else if (url.startsWith(DynamicScoreDetailUrl)&&(!url.includes("gcalc"))) {
            setTimeout(() => {
                //console.log("[Listener] Got:", url);
                try {
                    // 解析 URL 参数
                    const urlParams = new URLSearchParams(new URL(url).search);
                    const req_subjectId = urlParams.get("subjectId");
                    const req_semesterId = urlParams.get("semesterId");

                    // 构建数据对象
                    const data = {
                        smsId: req_semesterId,
                        subjectId: req_subjectId
                    };


                    M_send_comp_msg("rc_infopage", data, 0);
                } catch (error) {
                    console.error("[Listener Error] Failed to process URL parameters:", error);
                }
            }, 10); // 延迟 10ms 执行
        } else if (url.startsWith(DynamicScoreDetailUrl)) {
            setTimeout(() => {
                M_send_comp_msg("bp-observeDynamicScore",null, 0);

            }, 10);
        }
    },
    {
        urls: ["<all_urls>"], // 监听所有 URL
        types: ["xmlhttprequest"] // 包括 fetch 和 xmlhttprequest 请求
    }
);

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({enable_state: true});
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  });

async function saveToChromeStorage(keyName, obj) {
    try {
        const data = {};
        data[keyName] = obj; // 创建存储对象
        await chrome.storage.local.set(data); // 异步存储
        console.log("已存入 " + keyName + " 的数据!");
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);
        M_send_comp_msg("calcErrorStop", null, 0);
        M_send_comp_msg("tip_err", error, 0);
        //err
    }
}
async function getFromChromeStorage(keyName) {
    try {
        const result = await chrome.storage.local.get(keyName); // 异步获取
        if (result[keyName] !== undefined) {
            return result[keyName]; // 返回存储的值
        } else {
            console.warn('Key not found in chrome.storage:', keyName);
            return null;
        }
    } catch (error) {
        console.error('Error reading from chrome.storage or parsing:', error);
        M_send_str_msg("calcErrorStop", "1", 0);
        M_send_str_msg("tip_err", error, 0);
        //err
        return null;
    }
}

async function M_GetSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get('user_preference', function(data) {
            if (data.user_preference) {
                resolve(data.user_preference);
            } else {
                const homeSrc = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
                const user_preference = {
                    calcRange: 1,
                    homeSrc: homeSrc,
                    autoHide: true,
                    advLogPage: true,
                    advScoreShadow: false,
                    autologNtw: 0,
                    homeSrcDark: "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN",
                    homeDarkMode: 1,
                    autoHide_Condition: 70
                };
                chrome.storage.local.set({ user_preference: user_preference });
                resolve(user_preference);
            }
        });
    });
}

async function InitGCalc() {
    M_clearCalcedData();
    M_clearRedirectRules();
    M_initDeclaritiveRules();
    let M_UserSettings = await M_GetSettings();
    C_CalcAll(M_UserSettings);
}

async function C_CalcAll(M_UserSettings){
    
    const calcRange = M_UserSettings.calcRange;
    if(calcRange===0){
        return;
    }
    M_send_comp_msg("show_process",{cur: 0,oval: calcRange},-99999);
    const { year, semester, ids, bgnDates, endDates } = await C_GetSemesters(calcRange);
    
    console.log("crange",calcRange);
    for (let i = 0; i < calcRange; i++) {
        if (ids[i] !== null) {
            M_send_comp_msg("show_smsCalc_progress",null,0);
            console.log(`[AutoCalc] Start Calc for Semester ID: ${ids[i]}`);
            await C_CalcSms(ids[i], bgnDates[i], endDates[i], semester[i], year[i]);
            M_send_comp_msg("show_smsCalc_progress",null,0);
            await C_BuildDynamicScoreRule(ids[i]);
            M_send_comp_msg("show_smsCalc_progress",null,0);
            M_send_comp_msg("show_process",{cur: i+1,oval: calcRange},-99999);
        } else {
            console.log("[AutoCalc] Invalid Semester ID, skipping...");
        }
    }

    //finished Calcall

    saveToChromeStorage("lastUpdate", new Date().getTime());

}

function M_checkOutdatedScore(){
    getFromChromeStorage("lastUpdate").then(lastUpdate => {
        if (lastUpdate === null) {
            return;
        }
        const now = new Date().getTime();
        const diff = now - lastUpdate;
        const diffDays = diff / (1000 * 60 * 60 * 24);
        console.log("[checkOutdatedScore] Days since last update:", diffDays,lastUpdate,now);
        if (diffDays > 1) {
            M_send_str_msg("tip_alert_rt", "数据已过期，正在重新计算\nData Expired, Recalculating!" , 0);
            InitGCalc();
        }
    });
}


async function C_GetSemesters(calcRange) {
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let startPos = data.data.findIndex(item => item.isNow === true);

    const semesters = data.data.slice(startPos, startPos + calcRange);
    const year = semesters.map(item => item.year);
    const semester = semesters.map(item => item.semester);
    const ids = semesters.map(item => item.id);
    const bgnDates = semesters.map(item => item.startDate);
    const endDates = semesters.map(item => item.endDate);

    return { year, semester, ids, bgnDates, endDates };
}


async function C_CalcSms(semesterId,bgn_info,end_info,semesterType,year) {
    setTimeout(() => {
        M_send_comp_msg("show_smsCalc_progress",null,0);
    }, 1000);
    
    console.log("f(CalcBySmsId):", semesterId, bgn_info, end_info, semesterType);

    // 构建请求 URL
    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForSelect?semesterId=${semesterId}`;

    try {
        // 发送请求并解析响应
        const response = await fetch(url);
        const data = await response.json();

        // 如果数据存在且有效，处理科目信息
        if (data?.data?.length > 0) {
            let subjectIdList = {};

            // 遍历科目列表，提取并映射数据
            for (const subject of data.data) {
                const subjectName = subject.name === "HS History" ? "Chinese History" : subject.name; // 24-25学年特判
                subjectIdList[subjectName] = {
                    subjectName,
                    className: "noData",
                    subjectId: subject.id,
                    classId: -1,
                    subjectCode: subject.subjectCode,
                    maxCom: -1
                };
            }
            console.log("[CalcBySmsId] 开始填充学科数据:", semesterId, subjectIdList);
                //更新环
            // 填充学科数据
            
            subjectIdList = await C_fillInClassId(subjectIdList, semesterType, year, "fixed");
            subjectIdList = await C_fillInClassId(subjectIdList, semesterType, year, "recent");
            M_send_comp_msg("show_smsCalc_progress",null,0);
            subjectIdList = await C_fillInClassId_StartMethod2(subjectIdList, semesterType, year, bgn_info, end_info,semesterId);
                //更新环
            console.log("[CalcBySmsId] 学科数据已填充完毕:", semesterId, subjectIdList);
            // 初始化 V2 计算
            await C_init_V2Calc(subjectIdList, semesterId, bgn_info, end_info, semesterType, year);

            
            // 执行原始请求逻辑
            await C_fetchOriginalRequest(semesterId);
                //更新环
            
        }

        return true; // 成功处理
    } catch (error) {
        console.error("[CalcBySmsId] Error:", error);
        return false; // 处理失败
    }
}

function dateConvert(csharpDateString) {
    const regex = /\/Date\((\d+)([-+]\d+)\)\//;
    const match = csharpDateString.match(regex);
  
    if (match) {
      const timestamp = parseInt(match[1], 10);
  
      const date = new Date(timestamp);
  
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); 
      const day = String(date.getDate()).padStart(2, '0');
  
      return `${year}-${month}-${day}`;
    } else {
      return "2000-01-01";
    }
  }

function C_ShortenDataBeforeFill(data) {
    const uniqueData = [];
    const seen = new Set(); // 用于跟踪已见过的 classInfo

    for (const item of data) {
        const classInfoKey = JSON.stringify(item.classInfo); // 将 classInfo 转换为字符串

        if (!seen.has(classInfoKey)) { // 如果 classInfo 是新的
            uniqueData.push(item); // 添加到 uniqueData 数组
            seen.add(classInfoKey); // 标记为已见过
        }
    }
    console.log("Shorten", data,uniqueData);
    return uniqueData;
}

async function C_fillInClassId_StartMethod2(subjectIdList, semesterType, year, bgndate, enddate, smsId) {
    // 日期转换辅助函数
    function jsDateToCSharpString(date) {
        const timestamp = date.getTime();
        const timezoneOffset = date.getTimezoneOffset();
        const absoluteOffset = Math.abs(timezoneOffset);
        const hours = Math.floor(absoluteOffset / 60).toString().padStart(2, '0');
        const minutes = (absoluteOffset % 60).toString().padStart(2, '0');
        const sign = timezoneOffset <= 0 ? '+' : '-';
        return `\/Date(${timestamp}${sign}${hours}${minutes})\/`;
    }

    // 生成日期范围数组
    function generateDateRanges(startDate, endDate) {
        const ranges = [];
        let currentStart = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentStart < end) {
            const currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, currentStart.getDate());
            const adjustedEnd = currentEnd > end ? end : currentEnd;
            
            ranges.push({
                start: new Date(currentStart),
                end: new Date(adjustedEnd)
            });
            
            currentStart = adjustedEnd;
        }
        return ranges;
    }

    // 主逻辑
    const startDate = new Date(dateConvert(bgndate));
    const endDate = new Date(dateConvert(enddate));
    const dateRanges = generateDateRanges(startDate, endDate);

    // 并行请求
    const requests = dateRanges.map(range => {
        const newBgndate = jsDateToCSharpString(range.start);
        const newEnddate = jsDateToCSharpString(range.end);
        // 深拷贝避免数据污染
        const copiedList = JSON.parse(JSON.stringify(subjectIdList));
        return C_fillInClassId_Method2(copiedList, semesterType, year, newBgndate, newEnddate, smsId);
    });

    const results = await Promise.all(requests);

    return mergeObjects(results);
}

function mergeObjects(result) {
    const mergedobject = {};
    for (const fetchResult of result) {
      for (const subjectName in fetchResult) {
        mergedobject[subjectName] = fetchResult[subjectName];
      }
    }
    return mergedobject;
}
async function C_fillInClassId_Method2(subjectIdList, semesterType, year, bgndate, enddate, smsId) {
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';

    // 构建请求数据
    const data = {
        beginTime: dateConvert(bgndate),
        endTime: dateConvert(enddate)
    };

    try {
        // 发起 POST 请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            let classList = result?.data || []; // 确保 classList 为有效数组

            classList = C_ShortenDataBeforeFill(classList);

            for (const classInfo of classList) {
                const subjectEntry = subjectIdList[classInfo.name];

                if (subjectEntry) {
                    if (1) {
              //          console.log(`[fillInClassId] Success: ${classInfo.name}, With: ${classInfo.classInfo.id}`);
                        subjectEntry.classId = classInfo.classInfo.id; // 更新 classId
                        subjectEntry.className = classInfo.classInfo.className;
                        subjectEntry.maxCom = 9999;
                        //console.log("[!SubjectEntryFill]Updated:", subjectEntry.subjectName, subjectEntry.classId, subjectEntry.maxCom);
                    }
                } else {
                    // 遍历 subjectIdList 进行模糊匹配
                    let matched = false;
                    for (const subjectKey in subjectIdList) {
                        if (subjectIdList.hasOwnProperty(subjectKey)) {
                            const currentSubject = subjectIdList[subjectKey];
                            const maxCommonLen = Logic_getMaxCommonConsecutiveLength(classInfo.name, currentSubject.subjectName);   

                            if (maxCommonLen > 18 || maxCommonLen >= (currentSubject.subjectName.length-1)) { // 完全匹配
                               // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                currentSubject.classId = classInfo.classInfo.id;
                                currentSubject.className = classInfo.classInfo.className;
                                matched = true;
                                break;
                            } else if (maxCommonLen > 12) { // 普通匹配
                                if(currentSubject.maxCom < maxCommonLen){
                                    // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                    console.log("[FillId]Original:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                    currentSubject.classId = classInfo.classInfo.id;
                                    currentSubject.className = classInfo.classInfo.className;
                                    currentSubject.maxCom = maxCommonLen;
                                    console.log("[FillId]Updated:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                }
                             }
                        }
                    }

                    if (!matched) {
                       // console.warn(`[fillInClassId] No sufficient match found for: ${classInfo.name}`);
                    }
                }
            }
            console.log("[fillInClassId] 填充完毕:", subjectIdList);
            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            return subjectIdList; // 即使失败，返回原始数据
        }
    } catch (error) {
    
        return subjectIdList; // 异常情况，返回原始数据
    }
}



async function C_fillInClassId(subjectIdList, semesterType, year, mode) {
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';

    let data;   
    // 构建请求数据
    if (mode === "fixed") {
        data = {
          beginTime: semesterType === "1" ? `${year}-12-01` : `${year + 1}-04-01`,
          endTime: semesterType === "1" ? `${year}-12-30` : `${year + 1}-05-01`
        };
      } else {
        const today = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const fifteenDaysLater = new Date();
        fifteenDaysLater.setDate(today.getDate() + 15);
      
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
      
        data = {
          beginTime: formatDate(fifteenDaysAgo),
          endTime: formatDate(fifteenDaysLater)
        };
      }
    

    try {
        // 发起 POST 请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        let nofoundList ="";

        if (response.ok) {
            const result = await response.json();
            let classList = result?.data || []; // 确保 classList 为有效数组

            classList = C_ShortenDataBeforeFill(classList);

            for (const classInfo of classList) {
                const subjectEntry = subjectIdList[classInfo.name];

                if (subjectEntry) {
                    if (1) {
              //          console.log(`[fillInClassId] Success: ${classInfo.name}, With: ${classInfo.classInfo.id}`);
                        subjectEntry.classId = classInfo.classInfo.id; // 更新 classId
                        subjectEntry.className = classInfo.classInfo.className;
                        subjectEntry.maxCom = 9999;
                       // console.log("[!SubjectEntryFill]Updated:", subjectEntry.subjectName, subjectEntry.classId, subjectEntry.maxCom);
                    }
                } else {
                    // 遍历 subjectIdList 进行模糊匹配
                    let matched = false;
                    for (const subjectKey in subjectIdList) {
                        if (subjectIdList.hasOwnProperty(subjectKey)) {
                            const currentSubject = subjectIdList[subjectKey];
                            const maxCommonLen = Logic_getMaxCommonConsecutiveLength(classInfo.name, currentSubject.subjectName);   

                            if (maxCommonLen > 18 || maxCommonLen >= (currentSubject.subjectName.length-1)) { // 完全匹配
                               // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                currentSubject.classId = classInfo.classInfo.id;
                                currentSubject.className = classInfo.classInfo.className;
                                matched = true;
                                break;
                            } else if (maxCommonLen > 12) { // 普通匹配
                                if(currentSubject.maxCom < maxCommonLen){
                                    // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                    console.log("[FillId]Original:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                    currentSubject.classId = classInfo.classInfo.id;
                                    currentSubject.className = classInfo.classInfo.className;
                                    currentSubject.maxCom = maxCommonLen;
                                    console.log("[FillId]Updated:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                }
                             }
                        }
                    }

                    if (!matched) {
                       // console.warn(`[fillInClassId] No sufficient match found for: ${classInfo.name}`);
                    }
                }
            }
            console.log("[fillInClassId] 填充完毕:", subjectIdList);
            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            return subjectIdList; // 即使失败，返回原始数据
        }
    } catch (error) {
    
        return subjectIdList; // 异常情况，返回原始数据
    }
}

function Logic_getMaxCommonConsecutiveLength(str1, str2) {
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
        [prev, current] = [current, prev];
    }
    
    return maxLen;
}

function formatNumber(number, decimalPlaces) {
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}

async function C_init_V2Calc(idList, semesterId, bgn_info, end_info, semesterType, year) {
    const subjectData = []; // 存储每个科目的数据

    // 遍历每个科目
    for (const subject of Object.values(idList)) {
        const { classId, subjectId, subjectName, className, subjectCode } = subject;
        if(classId === -1){
            continue;
        }
        // 拼接请求 URL
        const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;

        try {
            // 发起 GET 请求
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`[init_V2Calc] Fetched data for subjectId: ${subjectId}`, data);

                let subjectScore = 0;
                let subjectTotalProp = 0;

                let flag_AllNull = true;
                // 计算成绩加权平均分
                for (const section of data.data.evaluationProjectList) {
                    if (!(section.learningTaskAndExamList.length === 0 || 
                        (section.learningTaskAndExamList.length === 1 && section.learningTaskAndExamList[0].score === null))) {
                            if(section.score <= 0 ){
                                for(const item of section.learningTaskAndExamList){
                                    if(item.score != null){
                                        flag_AllNull = false;
                                        subjectScore += (section.score * section.proportion);
                                        subjectTotalProp += section.proportion;
                                        break;
                                    }
                                }
                            }else{
                                flag_AllNull = false;
                                subjectScore += (section.score * section.proportion);
                                subjectTotalProp += section.proportion;
                            }
                            
                    }
                }

                if(flag_AllNull){
                    continue;
                    //All null, skip
                }
                subjectScore = (subjectScore / subjectTotalProp);



                subjectScore = formatNumber(subjectScore,1);

                // 构建课程信息对象
                const subjectInfo = {
                    ename: subjectName,
                    subjectCode: subjectCode,
                    semesterId: semesterId,
                    subjectId: subjectId
                };

                const course = {
                    className: className,
                    subjectId: subjectId,
                    scoreMappingId: (className.includes("AP") || className.includes("AS") || 
                                    className.includes("A2") || className.includes("A Level")) ? 801016  : 601016,
                    classEName: className,
                    smsId: semesterId,
                    subjectInfo: subjectInfo,
                    classId: classId,
                    subjectName: subjectName,
                    subjectEName: subjectName,
                    subjectScore: subjectScore,
                    updateDate: "/Date(1224086400000+0800)/",
                    isInGrade: true,
                    classType: 2,
                    isOriginal: true,
                    source: "v2calc"
                };

                // 异步保存数据到 chrome.storage.local
                await chrome.storage.local.remove(`${semesterId}|${subjectId}`);
                await saveToChromeStorage(`${semesterId}|${subjectId}`, course);

                // 将获取到的数据放入 subjectData
                subjectData.push({
                    subjectId: subjectId,
                    classId: classId,
                    data: data
                });
            } else {
                console.warn(`[init_V2Calc]BadResponce, Skipping: ${subjectId}, status: ${response}, url: ${url}`);
                continue;
                //console.error(`[init_V2Calc] Network response was not ok for subjectId: ${subjectId}, status: ${response}, url: ${url}`);
                //M_send_str_msg("tip_err",error, 0);
                //faceErrorWhileCalc = true;
                //M_send_comp_msg("calcErrorStop", null, 0);
            }
        } catch (error) {
            console.warn(`[init_V2Calc]BadResponce, Skipping: ${subjectId}, status: ${response}, url: ${url}`);
            continue;
            console.error('[init_V2Calc] There has been a problem with your fetch operation:', error);
            M_send_str_msg("tip_err",error, 0);
            faceErrorWhileCalc = true;
            M_send_comp_msg("calcErrorStop", null, 0);
        }
    }

    // 返回最终的 subjectData
    return subjectData;
}

async function C_fetchOriginalRequest(smsId) {
    isFetchOriginal = true;

    // 如果 smsId 无效，直接返回
    if (!smsId) {
        console.warn("[fetchOriginalRequest] Invalid semester ID.");
        return;
    }

    const urlPattern = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=${smsId}`;

    try {
        // 发起请求并解析响应
        const response = await fetch(urlPattern);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const originalCourseInfoList = data?.data?.studentSemesterDynamicScoreBasicDtos || [];
        console.log("OriginalData:", originalCourseInfoList);

        isFetchOriginal = false;

        for (const courseInfo of originalCourseInfoList) {
            const subjectInfo = await C_fetchSubjectEName(smsId, courseInfo.subjectId);

            // 从存储中移除旧字段
            await chrome.storage.local.remove(`${smsId}|${courseInfo.subjectId}`);

            const course = {
                className: courseInfo.className,
                subjectId: courseInfo.subjectId,
                scoreMappingId: courseInfo.scoreMappingId,
                classEName: courseInfo.classEName,
                smsId: smsId,
                subjectInfo: subjectInfo,
                classId: courseInfo.classId,
                subjectName: courseInfo.subjectName,
                subjectEName: courseInfo.subjectEName,
                subjectScore: courseInfo.subjectScore,
                updateDate: courseInfo.updateDate,
                isInGrade: courseInfo.isInGrade,
                classType: courseInfo.classType,
                isOriginal: true,
                source: "original"
            };

            // 保存数据到 Chrome 存储
            await saveToChromeStorage(`${smsId}|${courseInfo.subjectId}`, course);
        }
    } catch (error) {
        console.error('[fetchOriginalRequest] Error fetching subject data:', error);
        M_send_str_msg("tip_err",`计算 ${smsId} 学期时出现问题: ${error}`, 0);
        faceErrorWhileCalc = true;
        M_send_comp_msg("calcErrorStop", null, 0);
        return false;
    }

    return true;
}

function M_send_str_msg(msgtype, dataa,non){
    M_send_comp_msg(msgtype, {cont:dataa}, 0);
}

async function C_fetchSubjectEName(semesterId, subjectId) {
    if (!semesterId || !subjectId) {
        console.warn("[fetchSubjectEName] Invalid semesterId or subjectId.");
        return null;
    }

    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForStatisticsSelect?semesterId=${semesterId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const subjectData = data?.data?.find(subject => subject.id === subjectId);

        if (subjectData) {
            return {
                ename: subjectData.eName,
                subjectCode: subjectData.subjectCode,
                semesterId,
                subjectId
            };
        } else {
            console.warn(`[fetchSubjectEName] Subject with ID ${subjectId} not found.`);
        }

        return null;
    } catch (error) {
        console.error('[fetchSubjectEName] Error fetching subject eName:', error);
        return null;
    }
}



async function ShowChromeStorage() {
    const items = await new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
            resolve(result);
        });
    });

    console.log("Current chrome.storage.local content:");
    for (const [key, value] of Object.entries(items)) {
        console.log(`[Key]: ${key}, [Value]:`, value);
    }
}


async function C_BuildDynamicScoreRule(semesterId) {
    //This function also Calculates the GPA
    let gpalist =  [];

    if (!semesterId) {
        console.error("[C_BuildDynamicScoreRule] Invalid semester ID.");
        return;
    }
     
    const mappingRules = await C_FetchMappingRules(semesterId);
    // 初始化 JSON 数据模板
    const jsonResponse = {
        data: {
            studentSemesterDynamicScoreBasicDtos: [],
            scoreMappingList: []
        },
        msgCN: null,
        msgEN: null,
        state: 0,
        msg: null
    };

    if (Array.isArray(mappingRules)) {
        jsonResponse.data.scoreMappingList = [...mappingRules]; 
    } else {
        console.warn("[C_BuildDynamicScoreRule] mappingRules is Empty");
        jsonResponse.data.scoreMappingList = []; 
    }

    const gcalcMapping_apWeight={ "scoresMappingId": 801016, "isUseGpa": true, "scoreMappingConfigs": [ { "displayName": "A+", "minValue": 97, "maxValue": 9999.9, "isContainMin": true, "isContainMax": true, "sort": 0, "gpa": 4.8 }, { "displayName": "A", "minValue": 93, "maxValue": 96.9, "isContainMin": true, "isContainMax": true, "sort": 1, "gpa": 4.5 }, { "displayName": "A-", "minValue": 90, "maxValue": 92.9, "isContainMin": true, "isContainMax": true, "sort": 2, "gpa": 4.2 }, { "displayName": "B+", "minValue": 87, "maxValue": 89.9, "isContainMin": true, "isContainMax": true, "sort": 3, "gpa": 3.8 }, { "displayName": "B", "minValue": 83, "maxValue": 86.9, "isContainMin": true, "isContainMax": true, "sort": 4, "gpa": 3.5 }, { "displayName": "B-", "minValue": 80, "maxValue": 82.9, "isContainMin": true, "isContainMax": true, "sort": 5, "gpa": 3.2 }, { "displayName": "C+", "minValue": 77, "maxValue": 79.9, "isContainMin": true, "isContainMax": true, "sort": 6, "gpa": 2.8 }, { "displayName": "C", "minValue": 73, "maxValue": 76.9, "isContainMin": true, "isContainMax": true, "sort": 7, "gpa": 2.5 }, { "displayName": "C-", "minValue": 70, "maxValue": 72.9, "isContainMin": true, "isContainMax": true, "sort": 8, "gpa": 2.2 }, { "displayName": "D+", "minValue": 67, "maxValue": 69.9, "isContainMin": true, "isContainMax": true, "sort": 9, "gpa": 1.8 }, { "displayName": "D", "minValue": 63, "maxValue": 66.9, "isContainMin": true, "isContainMax": true, "sort": 10, "gpa": 1.5 }, { "displayName": "D-", "minValue": 60, "maxValue": 62.9, "isContainMin": true, "isContainMax": true, "sort": 11, "gpa": 1.2 }, { "displayName": "F", "minValue": 0, "maxValue": 59.9, "isContainMin": true, "isContainMax": true, "sort": 12, "gpa": 0 } ] };
    const gcalcMapping_noWeight={ "scoresMappingId": 601016, "isUseGpa": true, "scoreMappingConfigs": [ { "displayName": "A+", "minValue": 97, "maxValue": 9999.9, "isContainMin": true, "isContainMax": true, "sort": 0, "gpa": 4.3 }, { "displayName": "A", "minValue": 93, "maxValue": 96.9, "isContainMin": true, "isContainMax": true, "sort": 1, "gpa": 4 }, { "displayName": "A-", "minValue": 90, "maxValue": 92.9, "isContainMin": true, "isContainMax": true, "sort": 2, "gpa": 3.7 }, { "displayName": "B+", "minValue": 87, "maxValue": 89.9, "isContainMin": true, "isContainMax": true, "sort": 3, "gpa": 3.3 }, { "displayName": "B", "minValue": 83, "maxValue": 86.9, "isContainMin": true, "isContainMax": true, "sort": 4, "gpa": 3 }, { "displayName": "B-", "minValue": 80, "maxValue": 82.9, "isContainMin": true, "isContainMax": true, "sort": 5, "gpa": 2.7 }, { "displayName": "C+", "minValue": 77, "maxValue": 79.9, "isContainMin": true, "isContainMax": true, "sort": 6, "gpa": 2.3 }, { "displayName": "C", "minValue": 73, "maxValue": 76.9, "isContainMin": true, "isContainMax": true, "sort": 7, "gpa": 2 }, { "displayName": "C-", "minValue": 70, "maxValue": 72.9, "isContainMin": true, "isContainMax": true, "sort": 8, "gpa": 1.7 }, { "displayName": "D+", "minValue": 67, "maxValue": 69.9, "isContainMin": true, "isContainMax": true, "sort": 9, "gpa": 1.3 }, { "displayName": "D", "minValue": 63, "maxValue": 66.9, "isContainMin": true, "isContainMax": true, "sort": 10, "gpa": 1 }, { "displayName": "D-", "minValue": 60, "maxValue": 62.9, "isContainMin": true, "isContainMax": true, "sort": 11, "gpa": 0.7 }, { "displayName": "F", "minValue": 0, "maxValue": 59.9, "isContainMin": true, "isContainMax": true, "sort": 12, "gpa": 0 } ] };
    
    jsonResponse.data.scoreMappingList.push(gcalcMapping_apWeight);
    jsonResponse.data.scoreMappingList.push(gcalcMapping_noWeight);

    try {
        // 遍历 chrome.storage.local 获取所有数据
        const allStorageData = await new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => resolve(items));
        });

        // 筛选和映射数据到 JSON
        Object.keys(allStorageData).forEach((key) => {
            const [storedSemesterId, subjectIdPart] = key.split('|');
            if (storedSemesterId === String(semesterId) ) {
                const courseData = allStorageData[key];
                gpalist.push({subjectName: courseData.subjectEName, subjectScore: courseData.subjectScore});
                // 构建 studentSemesterDynamicScoreBasicDtos 项目
                const dto = {
                    grade: null, // 占位
                    classType: courseData.classType, // 示例映射
                    classId: courseData.classId, // 示例映射
                    className: courseData.className.length > 30 ? courseData.className.substring(0, 28) + '..' : courseData.className, // 示例映射
                    classEName: courseData.classEName.length > 30 ? courseData.classEName.substring(0, 28) + '..' : courseData.classEName, // 示例映射
                    subjectId: courseData.subjectId, // 示例映射
                    subjectName: courseData.subjectName.length > 26 ? courseData.subjectName.substring(0, 24) + '..' : courseData.subjectName, // 示例映射
                    subjectEName: courseData.subjectEName.length > 26 ? courseData.subjectEName.substring(0, 24) + '..' : courseData.subjectEName, // 示例映射
                    isInGrade: courseData.isInGrade, // 示例映射
                    subjectScore: courseData.subjectScore, // 示例映射
                    scoreMappingId: courseData.scoreMappingId, // 示例映射
                    updateDate: courseData.updateDate, // 示例映射
                    subjectTotalScore: 100, // 固定值
                    scoreType: 1, // 固定值
                    levelString: "" // 固定值
                };
                
                // 添加到 JSON 的 studentSemesterDynamicScoreBasicDtos 数组
                jsonResponse.data.studentSemesterDynamicScoreBasicDtos.push(dto);
            }
        });
        await C_CalcGPAForSemester(semesterId,gpalist);
        // 转换 JSON 数据为 data URL
        const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(jsonResponse))}`;

        console.log("[C_BuildDynamicScoreRule] JSON data URL:", jsonDataUrl);
        // 创建规则
        chrome.declarativeNetRequest.updateDynamicRules(
            {
                addRules: [
                    {
                        id: semesterId, 
                        priority: 1,
                        action: {
                            type: "redirect",
                            redirect: {
                                url: jsonDataUrl
                            }
                        },
                        condition: {
                            regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetStuSemesterDynamicScore\\?semesterId=${semesterId}`,
                            resourceTypes: ["xmlhttprequest"]
                        }
                    }
                ],
                removeRuleIds: [semesterId] // 移除已有的规则
            },
            () => {
                console.log("[C_BuildDynamicScoreRule] Rule created successfully.");
            }
        );
    } catch (error) {
        console.error("[C_BuildDynamicScoreRule] Error:", error);
    }
}

async function C_FetchMappingRules(semesterId) {
    if (!semesterId) {
        console.error("[C_FetchMappingRules] Invalid semester ID.");
        return null;
    }

    const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=${semesterId}&gcalc=noRedirect`;

    try {
        // 发起请求获取数据
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        // 提取并返回 scoreMappingList
        return jsonData?.data?.scoreMappingList || [];
    } catch (error) {
        console.error("[C_FetchMappingRules] Error fetching mapping rules:", error);
        return [];
    }
}


function M_initDeclaritiveRules() {
    const noRedirectRule = {
        id: 1000, 
        priority: 1016, 
        action: {
            type: "allow" // 允许请求，不受后续规则影响
        },
        condition: {
            regexFilter: ".*&gcalc=noRedirect.*", // 匹配包含 "&gcalc=noRedirect" 的请求
            resourceTypes: ["xmlhttprequest", "sub_frame", "main_frame"] // 适用的资源类型
        }
    };

    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [noRedirectRule], // 添加规则
            removeRuleIds: [1000] // 确保先移除同 ID 的旧规则
        },
        () => {
        //    console.log("[M_initDeclaritiveRules] High-priority noRedirect rule created.");
        }
    );
}


function M_send_comp_msg(msgtype,data,redotimes){
    if(redotimes<8){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: msgtype,
                data: data
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
            }catch(e){
                setTimeout(() => { 
                    M_send_comp_msg(msgtype,data,redotimes+1);
                }, (redotimes>0) ? (redotimes*100+50):1000);
            }
            
        });
    }
 
 }

 function M_clearCalcedData() {
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => {
            return key.includes('|') || key.toLowerCase().includes('gpa') || key.toLowerCase().includes('lastUpdate');
        });

        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log(`[clearCalcedData] Removed ${keysToRemove.length} items:`, keysToRemove);
            });
        } else {
            console.log("[clearCalcedData] No matching items found.");
        }
    });
}
function M_clearRedirectRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleIds = rules.map(rule => rule.id);

        if (ruleIds.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules(
                {
                    removeRuleIds: ruleIds
                },
                () => {
                    console.log(`[clearRedirectRules] Removed ${ruleIds.length} rules:`, ruleIds);
                }
            );
        } else {
            console.log("[clearRedirectRules] No dynamic rules to remove.");
        }
    });
}

chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        const assignmentInfoPattern = "https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=";

        // 判断是否是需要处理的请求
        if (
            details.url.startsWith(assignmentInfoPattern) &&
            (!details.url.includes("&gcalcSysFetch") || details.url.includes("galc_teams"))
        ) {
            if (details.url.includes("noRedirect") || details.url.includes("gcalc")) {
                return; // URL 已标记，直接放行
            }

            try {
                // Fetch 原始数据，避免循环修改
                const fetchUrl = `${details.url}&gcalc=noRedirect`;
                const response = await fetch(fetchUrl);
                const result = await response.json();

                const data = result?.data;
                if (!data) return;

                await delay(10);

                // 根据数据状态发送消息
                if (data.finishState === null) {
                    M_send_str_msg("showSubmitLinkAnsBtn", data.id, 0);
                    console.log("SEND addSubmitLinkBtn");
                    return;
                }

                if (data.classAvgScore === null || data.classMaxScore === null) {
                    return;
                }

                if (data.finishState === 1 && data.comment === "" && data.score === 0) {
                    // Fetch hidden score
                    let hiddenScore = await C_getScoreForAssignment(
                        data.id,
                        data.classId,
                        data.subjectId,
                        data.schoolSemesterId
                    );

                    hiddenScore = hiddenScore ?? -1; // 默认分数为 -1
                    M_send_str_msg("appendHiddenScore", hiddenScore, 0);
                }

                // 构建分数数据并发送消息
                const tmpdata = {
                    avgS: data.classAvgScore,
                    maxS: data.classMaxScore,
                    totalS: data.totalScore,
                    usrS: data.score,
                };

                if (tmpdata.avgS > 0) {
                    M_send_comp_msg("append2Scores", tmpdata, 0);
                }
            } catch (error) {
                console.error("[Assignment Info] Error:", error);
            }
        }
    },
    { urls: ["https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail*"] } // 精确匹配目标 URL
);


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function C_getScoreForAssignment(learningTaskId, classId, subjectId, semesterId) {
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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type) return;

    console.log(`[Service Worker] Received message:`, message);

    switch (message.type) {
        case "show_process":
            handleShowProcess(message.data, message.additionalData);
            break;
        case "bp-openSettings":
            chrome.runtime.openOptionsPage();
        case "bp-checkOutdatedScore":
            M_checkOutdatedScore();
    }

    sendResponse({ status: "received" }); // 确保响应，不然可能报错
});

function NameInList(name, list) {
    const lowerCaseName = name.toLowerCase();
    for (let i = 0; i < list.length; i++) {
        if (list[i].length < 5) {
            if (name.includes(list[i])) {
                return true;
            }
        } else {
            if (lowerCaseName.includes(list[i].toLowerCase())) {
                return true;
            }
        }
    }
    return false;
}
async function C_CalcGPAForSemester(semesterId,gpalist) {
    let weightedGPA = 0;
    let nonweightedGPA = 0;
    let totalWeight = 0;
    let LowWeight = ["Fine Art","IT ","Electi","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"];
    let NoWeight = ["TSSA","IELTS","TOFEL","Student","Clubs","Homeroom"];
    let HighWeight = ["AP","AS","A2","A Level","ALevel"];

    let ChineseGPA = 0;
    let ChineseWeight = 0; 

    gpalist.forEach((subject,index) => {
        
        if(subject.subjectName.includes("Chinese")&&(!subject.subjectName.includes("second langua"))){
            if(subject.subjectName.includes("History")||subject.subjectName.includes("Humani")||subject.subjectName.includes("geogra")){
                ChineseGPA += (subject.subjectScore*(1/3));
                ChineseWeight += (1/3);
            }else{
                ChineseGPA += (subject.subjectScore*(2/3));
                ChineseWeight += (2/3);
            }
            gpalist[index].gpa=-1;
        }else{
            gpalist[index].gpa = ScoreToGPA(subject.subjectScore);
            gpalist[index].isWeighted = false;
            if(subject.subjectName.includes("IGCSE")){
                gpalist[index].weight = 1;
            }else if(NameInList(subject.subjectName,HighWeight)){
                gpalist[index].weight = 1;
                gpalist[index].gpa = gpalist[index].gpa>0? gpalist[index].gpa+0.5:gpalist[index].gpa;
                gpalist[index].isWeighted = true;
            }else if(NameInList(subject.subjectName,NoWeight)){
                gpalist[index].weight = 0;
            }else if(NameInList(subject.subjectName,LowWeight)){
                gpalist[index].weight = 0.5;
            }else{
                gpalist[index].weight = 1;
            }
            weightedGPA += subject.gpa * gpalist[index].weight;
            totalWeight += gpalist[index].weight; 
            nonweightedGPA += (subject.gpa>0?(subject.isWeighted?(subject.gpa-0.5):subject.gpa):(subject.gpa)) * gpalist[index].weight;
        }
    });

    gpalist = gpalist.filter(item => item.gpa !== -1);
    if(ChineseWeight>0){
        gpalist.push({
            subjectName: "Chinese Culture",
            subjectScore: ChineseGPA/ChineseWeight,
            gpa: ScoreToGPA(ChineseGPA/ChineseWeight),
            weight: 1,
            isWeighted: false,
        });
        nonweightedGPA += ScoreToGPA(ChineseGPA/ChineseWeight);
        weightedGPA += ScoreToGPA(ChineseGPA/ChineseWeight);
        totalWeight +=1;
        console.log("ChineseGPAPushed!",gpalist[gpalist.length]);
    }
    
    console.log(totalWeight,weightedGPA,nonweightedGPA);
    weightedGPA /= totalWeight;
    nonweightedGPA /= totalWeight;
    
    saveToChromeStorage(`gpaList${semesterId}`, gpalist);
    let schoolisGPA = null;

    console.log(gpalist,weightedGPA,nonweightedGPA)
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetGpa?semesterId="+semesterId);
    if (!response.ok) {throw new Error(`CalcGPAHTTPError:${response.status}`);}
    const data = await response.json();
    
    schoolisGPA = data.data;
    console.log("save",semesterId,{gpa:weightedGPA,noweight_gpa:nonweightedGPA,schoolisGPA:schoolisGPA});
    saveToChromeStorage(`gpa${semesterId}`, {gpa:weightedGPA,noweight_gpa:nonweightedGPA,schoolisGPA:schoolisGPA});


    if(data.data===null){
        const jsonResponse = {
            "data": formatNumber(weightedGPA,2),
            "msgCN": null,
            "msgEN": null,
            "state": 0,
            "msg": null
        };

        const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(jsonResponse))}`;

        // 创建规则
        chrome.declarativeNetRequest.updateDynamicRules(
        {
            removeRuleIds: [Number("6"+semesterId)], // 移除之前的规则，如果存在的话，规则ID 可以根据实际情况修改，这里假设为1
            addRules: [
            {
                id: Number("6"+semesterId), // 规则ID，需要唯一，可以根据实际情况修改，这里假设为1
                priority: 1,
                action: {
                type: "redirect",
                redirect: {
                    url: jsonDataUrl
                }
                },
                condition: {
                regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetGpa\\?semesterId=${semesterId}`,
                resourceTypes: ["xmlhttprequest"]
                }
            }
            ],
        },
        () => {
            //console.log("CALCGPA:Declarative Net Request rule updated successfully.");
        }
        );
    }
}

function ScoreToGPA(score) {;
    const scoreMappingConfigs = [
      { "minValue": 97, "maxValue": 9999.9, "gpa": 4.3 },
      { "minValue": 93, "maxValue": 96.9999, "gpa": 4 },
      { "minValue": 90, "maxValue": 92.9999, "gpa": 3.7 },
      { "minValue": 87, "maxValue": 89.9999, "gpa": 3.3 },
      { "minValue": 83, "maxValue": 86.9999, "gpa": 3 },
      { "minValue": 80, "maxValue": 82.9999, "gpa": 2.7 },
      { "minValue": 77, "maxValue": 79.9999, "gpa": 2.3 },
      { "minValue": 73, "maxValue": 76.9999, "gpa": 2 },
      { "minValue": 70, "maxValue": 72.9999, "gpa": 1.7 },
      { "minValue": 67, "maxValue": 69.9999, "gpa": 1.3 },
      { "minValue": 63, "maxValue": 66.9999, "gpa": 1 },
      { "minValue": 60, "maxValue": 62.9999, "gpa": 0.7 },
      { "minValue": 0, "maxValue": 59.9999, "gpa": 0 }
    ];

    for (const config of scoreMappingConfigs) {
      if (score >= config.minValue && score <= config.maxValue) {
        return config.gpa;
      }
    }
    return 0; 
}

function formatNumber(number, decimalPlaces) {
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}