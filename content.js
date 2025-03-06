function runWhenElementReady(selector, callback, interval, maxAttempts) {
    let attempts = 0;

    function check() {
        if (document.querySelector(selector)) {
            callback();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, interval);
        }
    }

    check();
}

// 使用示例：每隔 500ms 检查一次目标元素，最多检查 10 次
runWhenElementReady('link', diyHomepage, 10, 5);
runWhenElementReady('link', diyHomepage, 100, 3);

function waitForElement() {
    let targetElement;
    try {
        targetElement = document.getElementsByClassName("fe-components-stu-business-topbar-__profileItemBox--2Zu-vui7zBJ7o6w5lP-ugN")[0].childNodes[8];
    } catch (error) {}
    if (targetElement) {
        setTimeout(function() {
            updateContent();
        }, 100);
        targetElement.addEventListener('click', function() {
            startobserveDynamicScoreTarget();
        });
    } else {
        // If the element is not found yet, try again after a short delay
        setTimeout(waitForElement, 100); // Check every 200 milliseconds
    }
}

if(window.location.href.includes("https://tsinglanstudent.schoolis.cn")){
    waitForElement(); // Start polling immediately
    setTimeout(function() {
        if(!document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR")[0]){
            send_comp_msg("bp-checkOutdatedScore","1",0);
        }

        
    }, 100);
    
    
}

setInterval(function() {
    if (!document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR")[0]) {
      send_comp_msg("bp-checkOutdatedScore", "1", 0);
    }
  }, 300000);



observeUrlChange({
    "https://tsinglanstudent.schoolis.cn/Home#!/realtime/list": startobserveDynamicScoreTarget
});
observeUrlChange({
    "https://tsinglanstudent.schoolis.cn/Home#!/task/list": startobserveScoreHides
});




function startobserveDynamicScoreTarget(){
    observeTarget(
        "fe-components-stu-app-realtime-list-__listItemBox--1RuNIoOoFIYPl4lXa4x2kS",
        updateContent
    );
    
}
function startobserveScoreHides(){
    chrome.storage.local.get('user_preference', function(settings) {
        console.log(settings);
        if(settings.user_preference.autoHide){
            observeTarget(
                "fe-components-stu-app-task-list-__listItemBox--3elHWcZSeppt-hG2vNGaZz",
                hideAssignments
            );
        }
    });
    
}



function observeTarget(targetClass, callback, redotimes = 0, observedClasses = new Set()) {
    // 如果已经存在触发器，则直接返回
    if (observedClasses.has(targetClass)) {
        //console.log(`[observeTarget] Already observing: ${targetClass}`);
        return;
    }

    // 查找目标节点，仅获取第一个匹配元素
    const targetNode = document.getElementsByClassName(targetClass)[0];

    if (targetNode) {
        // 创建 MutationObserver
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.target === targetNode) {
                   // console.log(`[observeTarget] Change detected in: ${targetClass}`);
                    callback(); // 执行回调函数
                    break;
                }
            }
        });

        // 开始观察目标节点
        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        // 记录为已观察
        observedClasses.add(targetClass);
        //console.log(`[observeTarget] Now observing: ${targetClass}`);
    } else {
        // 如果未找到目标，重试机制
        if (redotimes < 5) {
            const retryDelay = Math.min(5000, 2 ** redotimes * 130 + 50);

            setTimeout(() => {
                observeTarget(targetClass, callback, redotimes + 1, observedClasses);
            }, retryDelay);
        } else {
            //console.error(`[observeTarget] Max retries reached for: ${targetClass}.`);
        }
    }
}



console.log("Giaoculator is Running");

// ================== 悬浮窗 ===================
// 这个是添加悬浮窗代码的入口，负责给网页添加悬浮窗的HTML和CSS代码。
// 如果不需要只需要在这里不添加即可，但是可能下面的dom操作会报错（就是document.xxx的那些）
POP_addPopComponent(); 

// totalUpdate是很重要的，他负责了进度条的总更新次数
// 比如有4个学期，这里就填写4。每一次使用进度条的地方都需要设置这个值和清零currentUpdate
let currentUpdate = 0;

// 监测当前注入是否收到了信息
let revieveMessage = false;

let longtermMessage = '';

// 如果登录后3秒内没有收到消息，就会自动展示长期消息
// setTimeout(() => {
//     setInterval(() => {
//         if (!revieveMessage)
//             processLongtermMsg();
//     }, 1000);
// }, 3000);

// TODO: 长期设置代码

// 设置SVG圆环的初始状态

if(document.querySelector('.progress-ring__circle')!=null){
    globalThis.circle = document.querySelector('.progress-ring__circle');
    globalThis.radius = circle.r.baseVal.value;
    globalThis.circumference = 2 * Math.PI * radius;
    globalThis.maxOffset = circumference;
    console.log(maxOffset);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = maxOffset;
}

// 更新进度的函数，每次调用会+1，可以写到后端发消息的地方或者啥的。
function upgradeProgress() {    
    if (currentUpdate < 3) {
        currentUpdate++;

        let newOffset = maxOffset - (currentUpdate / 3) * circumference;

        circle.style.transition = 'stroke-dashoffset 0.5s ease-out';

        circle.style.strokeDashoffset = newOffset;
    }
}



// 重置环，比如在计算完成后调用这个函数
function resetRing_Old(){
    currentUpdate = 0;
    circle.style.transition = 'stroke-dashoffset 0.5s ease-out';
    circle.style.strokeDashoffset = maxOffset;
}


function RingShowCalcError(){
    var logo = document.getElementById('xfc-logo');
    var circle = document.querySelector('.progress-ring__circle');

    // 修改图标图片并添加渐变动画
    circle.style.transition = 'stroke 1s ease-out,stroke-dashoffset 0.5s ease-out, stroke-width 0.5s ease-out';
    circle.style.stroke = '#da0000';
    circle.style.strokeDashoffset = 0;
    setTimeout(() => {
        circle.style.transition = 'stroke-dashoffset 0.5s ease-out, stroke-width 0.5s ease-out';
        circle.style.strokeWidth = '0'; // 使圆环向外圈变细并消失
        setTimeout(() => {
            circle.style.stroke="rgb(86,194,90)";
            circle.style.stroke.width=6;
        }, 510);
    }, 10000);

}

var logo = document.getElementById('xfc-logo');

var iconSrc = chrome.runtime.getURL("icon.png");
var settingsSrc = chrome.runtime.getURL("res/ball_settings.png");
logo.src = iconSrc;
logo.style.transition = "opacity 0.1s ease-in-out";

logo.addEventListener('mouseenter', function () {
    logo.style.transition = "opacity 0.1s ease-in-out";
    logo.style.opacity = 0; // 开始淡出
    setTimeout(() => {
        logo.src = settingsSrc; // 更换图片
        logo.style.opacity = 1; // 渐入
    }, 100); // 等待过渡结束后切换
});

// 添加鼠标移出事件监听
logo.addEventListener('mouseleave', function () {
    logo.style.transition = "opacity 0.1s ease-in-out"; 
    logo.style.opacity = 0; // 开始淡出
    setTimeout(() => {
        logo.src = iconSrc; // 更换图片
        logo.style.opacity = 1; // 渐入
    }, 100); // 等待过渡结束后切换
});

function resetRing(isFinal) {
    // 获取旧的图标元素和环形进度条
    var logo = document.getElementById('xfc-logo');
    var circle = document.querySelector('.progress-ring__circle');

    // 动画速度控制（基础速度单位为秒）
    const baseSpeed = 0.3; // 动画基础时间
    const timeFactor = baseSpeed * 1000; // 转换为毫秒

    // 修改图标图片并添加渐变动画
    logo.style.opacity = '0';
    setTimeout(() => {
        logo.src = chrome.runtime.getURL("res/green-tick.png");
        logo.style.opacity = '1';
        setTimeout(() => {
            logo.style.transition = `opacity ${baseSpeed}s ease-in`;
            logo.style.opacity = '0';

            if (isFinal) {
                try {
                    const progressText = document.getElementById("progress-text");
                    const progressShadow = document.getElementById("progress-text-shadow");

                    if (progressText && progressShadow) {
                        progressText.style.transition = `opacity ${baseSpeed}s ease-out`;
                        progressShadow.style.transition = `opacity ${baseSpeed}s ease-out`;

                        progressText.style.opacity = '0';
                        progressShadow.style.opacity = '0';

                        setTimeout(() => {
                            progressText.remove();
                            progressShadow.remove();
                        }, timeFactor); // 动态时间控制
                    }
                } catch (e) {
                    console.error("[resetRing] Error removing progress text elements:", e);
                }
            }
        }, timeFactor * 3); // 动态延迟控制
    }, timeFactor); // 等待旧图标淡出后再显示新图标

    setTimeout(() => {
        logo.src = chrome.runtime.getURL("icon.png");
        logo.style.opacity = '1';
        setTimeout(() => {
            logo.style.transition = '';
        }, timeFactor); // 动态时间控制
    }, timeFactor * 5); // 动态延迟控制

    // 环形进度条动画调整
    circle.style.transition = `stroke-dashoffset ${baseSpeed}s ease-out, stroke-width ${baseSpeed}s ease-out`;
    circle.style.strokeWidth = '0'; // 使圆环向外圈变细并消失

    setTimeout(() => {
        currentUpdate = 0;
        circle.style.strokeDashoffset = circle.getAttribute('r') * Math.PI * 2;
        setTimeout(() => {
            circle.style.strokeWidth = '6'; // 将strokeWidth重置为原始宽度
        }, timeFactor); // 动态时间控制
    }, timeFactor); // 动态时间控制
}



const floatingBall = document.querySelector('.floating-ball');
const infoBox = document.querySelector('.info-box');
const closeBtn = document.querySelector('.close-btn');
const infoContent = document.querySelector('.info-content');

// let unreadMessageCount = 0;
let isInfoBoxOpen = false;
let processingBox = false;

let messageList = [];
let messageReadState = [];

// 信息框里的东西，支持html代码，每次要展示的时候首先更新这个变量
// 当然建议用下方的封装函数实现显示消息红点的效果
let htmlContent = '<p>No message avaliable.</p>';

// 展示信息框，一般不手动调用
function showInfoBox() {
    processingBox = true
    infoContent.innerHTML = htmlContent;
    infoBox.style.display = 'block';
    setTimeout(() => { infoBox.style.opacity = 1; }, 10); 
    isInfoBoxOpen = true;
    processingBox = false;
}


// 隐藏信息框，一般不手动调用
function hideInfoBox() {
    console.log("我被关闭了！")
    console.trace()
    processingBox = true
    infoBox.style.opacity = 0;
    setTimeout(() => { infoBox.style.display = 'none'; }, 300);
    isInfoBoxOpen = false;
    processingBox = false;
    // setTimeout(() => { processLongtermMsg(); }, 1000);
}

function processLongtermMsg(){
    if(longtermMessage){
        sendFloatingMessage(longtermMessage, 'dot');
        longtermMessage = '';
        revieveMessage = true;
    }
}

if(closeBtn!=null){
    // 点击叉叉关闭信息框
    closeBtn.addEventListener('click', () => {
        hideInfoBox();
    });
}


function hideFloatingBall(){
    try {
        document.getElementsByClassName("floating-ball")[0].remove();
        document.getElementById("progress-text").remove();
        document.getElementById("progress-text-shadow").remove();
    } catch (e) {
        setTimeout(() => {
            document.getElementsByClassName("floating-ball")[0].remove();
            document.getElementById("progress-text").remove();
            document.getElementById("progress-text-shadow").remove();
        }, 100);
    }
}
// 点击悬浮窗展示信息框
if(floatingBall != null){
    floatingBall.addEventListener('click', () => {
        setTimeout(() => {
            send_comp_msg("bp-openSettings","1",0);
        }, 300);/*
        document.getElementsByClassName("floating-ball")[0].style.transition='opacity 0.2s ease-out';
        document.getElementsByClassName("floating-ball")[0].style.opacity=0;
        document.getElementById("progress-text").style.transition = 'opacity 0.2s ease-out';
        document.getElementById("progress-text").style.opacity = '0';
        document.getElementById("progress-text-shadow").style.transition = 'opacity 0.2s ease-out';
        document.getElementById("progress-text-shadow").style.opacity = '0';
        setTimeout(() => {
            document.getElementById("progress-text").remove();
            document.getElementsByClassName("floating-ball")[0].remove();
            document.getElementById("progress-text-shadow").remove();
            
            return;
        }, 210);*/
        
    
        return;//先暂时关闭信息框功能，改为隐藏悬浮球
        if (processingBox) return;
        if (isInfoBoxOpen) {
            hideInfoBox();
        } else {
            showInfoBox();
            hideDot();
    
        }
    });
}


// 展示红点
function showDot(){
    document.querySelector('.alert-dot').style.display = 'block';
    // 设置opacity
    setTimeout(() => { document.querySelector('.alert-dot').style.opacity = 1; }, 10);
}

// 隐藏红点
function hideDot(){
    document.querySelector('.alert-dot').style.display = 'none';
    // 设置opacity
    document.querySelector('.alert-dot').style.opacity = 0;
}

// 展示像微信那样未读消息数字，但是目前还没想好怎么调用
function showNumber(number){
    document.querySelector('.number-span').innerText = number;
    document.querySelector('.alert-number').style.display = 'block';
    // 设置opacity
    setTimeout(() => { document.querySelector('.alert-number').style.opacity = 1; }, 10);
}

function hideNumber(){
    document.querySelector('.alert-number').style.display = 'none';
    // 设置opacity
    document.querySelector('.alert-number').style.opacity = 0;
}

// 发送悬浮窗消息，这个是让外部调用的接口
// 第一个message参数是要展示的消息，第二个type是展示的类型，目前支持dot和force两种
// dot就是显示一个红点，提示用户要打开，force就是直接弹出窗口
// 注意调用这个函数的时候，先前打开的窗口会被关闭
function sendFloatingMessage(message, type){
    console.log("发送了信息！",message,type)
    hideInfoBox()
    setTimeout(() => {
        if(type=="dot"){
            showDot();
            htmlContent = message;
        }
        else if (type=="force"){
            htmlContent = message;
            showInfoBox();
        }
    }, 500);

}   

// =============================== 悬浮窗代码结束

if(!LoginPattern&&!LoginPattern){
    var LoginPattern = "https://tsinglanstudent.schoolis.cn/";
    var LoginPattern2 = "https://tsinglanstudent.schoolis.cn/#!/";
}
if(window.location.href===LoginPattern || window.location.href.includes(LoginPattern2)){
    console.log("HP");
}else if(document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR").length>0){
    window.location.href = LoginPattern;
}

SHOW_REFRESH = false;
var tmp_stopHide = false;
var clicked_disclamer = false;

if(window.location.href==="http://4.3.2.1/homepage/login.html"){
    window.location.href="http://4.3.2.1";
}else if(window.location.href.includes("view.officeapps.live.com")){
    directDownloadFile_AddBtn();
}



chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('enable_state', function(result) {
        let type = message.type;
        let data = message.data;
        if (result.enable_state === true || !result.hasOwnProperty('enable_state') || type.startsWith("bp")) { // 如果enable_state为true或未设置，则继续。
            var disable_autologin = false;
            if (type == "load") {
                console.log("Rec_Do_Load");
                if (data.show == true){
                    const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
                    if (targetElement) {
                        targetElement.style.display = "table";
                    }
                } else {
                    const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
                    if (targetElement) {
                        targetElement.style.display = "none";
                    }
                }
            } else if (type == "bp-refresh"){
                location.reload();
            }else if (type == "bp-firstInstall"){
                sendInfotipLong(tlang("Giaoculator已安装成功！<br>即可点击右下角悬浮窗进入设置界面!<br>&nbsp;———— Haoxuan","Giaoculator has been installed successfully!<br>Click the floating ball in the lower right corner to enter the settings page!<br>&nbsp;———— Haoxuan"))
            } else if (type == "bp-observeDynamicScore"){
                observeTarget(
                    "fe-components-stu-app-realtime-list-__listItemBox--1RuNIoOoFIYPl4lXa4x2kS",
                    updateContent
                );
                
            } else if (type == "bp-logpageState"){
                //换位置
            } else if (type == "bp-loggedin"){
                console.log("loggedin")
                startobserveScoreHides();
            }else if (type == "calcErrorStop"){
                RingShowCalcError();
            }else if (type == "bp-showRefresh"){
                showHideButtonAtHome();//NEW
                // MB_insertEditedDiv()
            } else if (type == "bp-refresh-click"){
                simulateClickRefresh(0);
            } else if (type == "replace_context"){
                updateContent();
                setTimeout(() => {
                    updateContent();
                }, 100);
            } else if (type == "sim_login"){
                if(disable_autologin == false){
                    simulateClickLogin();
                    setTimeout(() => {
                        simulateClickLogin();
                    }, 1000);
                    sendSeccesstip("自动登录成功");
                    disable_autologin = true;
                }
            } else if (type == "tip_suc"){
                sendSeccesstip(data.cont);
            } else if (type == "appendHiddenScore"){
                showFetchedAssignmentData_toPage(data.cont);
            } else if (type == "show_process"){
                addCalcState(data,0);
                console.log("REC:Showproges")
                // MB_insertEditedDiv();
            } else if (type == "show_smsCalc_progress"){
                upgradeProgress();
                //addSmsCalcState(data);
            }else if (type == "tip_congrat"){
                sendCongrat(data.cont);
            } else if (type == "tip_err"){
                sendErrortip(data.cont);
            } else if (type == "tip_info"){ // 合并tip_info和tip_info_long的处理
                sendInfotip(data.cont);
            } else if (type == "tip_info_long"){ // 合并tip_info和tip_info_long的处理
                sendInfotipLong(data.cont);
            } else if (type == "tip_alert"){
                sendAlerttip(data.cont);
            } else if (type == "tip_alert_rt"){
                sendAlertrttip(data.cont);
            } else if (type == "tip_alert_long"){
                sendAlerttipLong(data.cont);
            } else if (type == "rc_infopage"){
                updateContent_DetailPage();
                showGPAcount(0,data);
            } else if (type == "rib_fwk"){
                ribbon_Fireworks(parseFloat(data.cont));
            } else if (type == "rc_hidescore"){
                hideScoresRepeatedly(data,10,1500);
                tmp_stopHide = false;
            } else if (type == "rc_hideasm"){
                hideAssignments(data.cont);
                hideAseRepeatedly(data,10,1500);
                hideAseRepeatedly(data,100,3000);
            } else if (type == "bp-GPAcalced"){
                gpaClaced();
            } else if (type == "append2Scores"){
                appendAvgMaxScoresInPage(data,0);
                console.log("2score",data);
            } else if (type == "bp-GPANotcalced"){
                gpaNotClaced();
            } else if (type == "bp-OpenPageAfterLoginNtw"){
                setTimeout(() => {
                    window.location.href="http://4.3.2.1";
                }, 20);
                setTimeout(() => {
                    window.location.href="http://4.3.2.1";
                }, 60);
            } else if (type == "stat-RenderText") {
                replaceTaskStat(data.cont)
            } else if (type == "gb-finishedCalc"){
                console.log(data)
                document.getElementById("gb_newnum").innerText = parseFloat(data.cont).toFixed(1);
            } else if (type == "gb-savedData"){
                console.log("gb-savedData:",data);
                showDiyScoresBox(data.smsId, data.subjectId, data.subjectName,data.model,data.list);
            } else if(type=="showSubmitLinkAnsBtn"){
                addSubmitLinkBtn(data.cont,0);
            } else if(type == "send_pop") {
                revieveMessage = true;
                sendFloatingMessage(data.message, data.type);
            } else if(type == "send_pop_longterm") {
                longtermMessage = data.message;
            }   
        }
    });
});

function Ntw_SimclickDisclamer(){
    console.log("RUNNING ntwDis")

    if(!clicked_disclamer){
        var targ = document.getElementById("password_disclaimer");//用于快速点击disclamer选项
        if(targ){
            if(!targ.checked){
                targ.click();
                clicked_disclamer=true;
            }
        }
    }
}
function editPageText(){
    console.log("RUNNING oedit")

    changeBarname(0, " (1)")
    changeBarname(1, " (2)")
    changeBarname(2, " (3)")
    changeBarname(3, " (4)")
}

async function showGPATip(){
    gpaNotClaced();
    let smsId;
    try {
        smsId = await getIdBySemester(document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    } catch (e) {
        smsId = -1;
    }
    
    if (smsId === -1) {
        return;
    }
    try {
        chrome.storage.local.get(`gpa${smsId}`, function(idData) {
            if (idData[`gpa${smsId}`] === undefined) {
                gpaNotClaced();
                return;
            }

            if(idData[`gpa${smsId}`] === undefined || idData[`gpa${smsId}`].schoolisGPA==null){
                gpaClaced();
            }else{
                gpaNotClaced();
            }
        });
    } catch (error) {
        gpaNotClaced();
    }
    
}

async function beforeshowGPAbox(){
    console.log("RUNNING beforeshowGPAbox");
    let smsId;
    smsId = await getIdBySemester(document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    if (smsId === -1) {
        return; // Handle error case if getIdBySemester fails, if needed
    }

    const storageData = await new Promise((resolve) => {
        chrome.storage.local.get(`gpa${smsId}`, function(data) {
            resolve(data);
        });
    });

    if(storageData[`gpa${smsId}`] !== undefined){
        document.getElementsByClassName("ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz")[0].click();
        showGPABox();
        sendInfotip(tlang("计算的GPA仅供参考，可能存在误差<br><br>详见：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>GPA计算说明</a>","The calculated GPA is for reference only and may contain errors.<br><br>For details, see：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>Description</a>"));
    }else{
        sendAlertrttip(tlang("该学期不在计算范围内","This semester is not in the calculation range"));
    }
}

function updateContent() {
    showGPATip();

    setTimeout(() => {
        var element = document.getElementsByClassName("ng-scope fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz fe-components-stu-app-realtime-list-__border--28HM0G_CwJuVpXrawp7ETW")[0];
        if (element) {
            element.addEventListener('click', function(event) {
                if (!element.disabled) { // 检查按钮是否处于禁用状态，如果不是才执行
                    element.disabled = true; // 立即禁用按钮
            
                    if(!document.getElementById("gcalc_gpaSubtitle")){
                        beforeshowGPAbox();
                    }
                    
                    
            
                    setTimeout(function() {
                        element.disabled = false; // 3秒后重新启用按钮
                    }, 3000);
                }
            });
        }
    }, 100);

    console.log("RUNNING updateContent")

    try {
        const targetElement = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI');
        if (targetElement) { 
            for (cnt=0;cnt<targetElement.length;cnt++){
                target = targetElement[cnt];
                if(target.innerText=="首次公布时间：1970-01-01 08:00"){
                    target.innerText="由Giaoculator计算"
                }
                if(target.innerText=="首次公布时间：2008-10-16 00:00"){
                    target.innerText="由Giaoculator获取"
                }
                if(target.innerText=="First Publish Time：1970-01-01 08:00"){
                    target.innerText="Calc by Giaoculator"
                }
                if(target.innerText=="First Publish Time：2008-10-16 00:00"){
                    target.innerText="Calc by Giaoculator"
                }
            }
        }
    } catch (error) {}
    setTimeout(() => {
        const targetElement = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI');
        if (targetElement) { 
            for (cnt=0;cnt<targetElement.length;cnt++){
                target = targetElement[cnt];
                if(target.innerText=="首次公布时间：1970-01-01 08:00"){
                    target.innerText="由Giaoculator计算"
                }
                if(target.innerText=="First Publish Time：1970-01-01 08:00"){
                    target.innerText="Calc by Giaoculator"
                }
            }
        }
    }, 100);
}

function hideScores(scorelim) {

  const elements = document.getElementsByClassName('fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU');
  for (let element of elements) {
    const scoreNumElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1');
    if (scoreNumElement) {
      const score = parseFloat(scoreNumElement.innerText);
      if (score < scorelim) {
        // TODO 加入小眼睛临时显示分数..?
        const scoreInfoElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt');
        console.log(scoreNumElement,scoreInfoElement);
        if (scoreInfoElement!=null) {
            console.log(scoreInfoElement,"is not NULL");
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 200px;position: absolute;top: 94px;left: 16px;">';
            scoreInfoElement.remove();
        }else{
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 200px;position: absolute;top: 94px;left: 16px;">';//初中部样式
        }
     }
    }
  }
}

async function saveToChromeStorage(keyName, obj) {
    try {
        const data = {};
        data[keyName] = obj; // 创建存储对象
        await chrome.storage.local.set(data); // 异步存储
        console.log("已存入 " + keyName + " 的数据!");
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);

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
        //err
        return null;
    }
}

async function hideAssignments() {
    let settingData=await getFromChromeStorage("user_preference");
   // insertTeamsLogoLink();
    console.log("RUNNING assign")

    if(tmp_stopHide==true){
        return;
    }
    var scorelim = settingData.autoHide_Condition;
    const elements = document.getElementsByClassName('ng-scope fe-components-stu-app-task-list-__listItem--2LlZEXXtXjZzVCV4Ai9B6y');
    for (let element of elements) {
        try {
            var scoreNumElement = element.querySelector('.fe-components-stu-business-task-list-item-__taskScore--13ruwhA6IFpxEaXteLRQco');
            var totalScoreNum = (element.querySelector('span.ng-binding.ng-scope').textContent.match(/\d+/)[0]) * 1.0;
            if (scoreNumElement) {
                //var score = parseFloat(scoreNumElement.innerText) +"|" +totalScoreNum;
                var score = (parseFloat(scoreNumElement.innerText)/totalScoreNum)*100;
                if (score < scorelim && settingData.autoHide) {
                    // 这个判断多余，可以考虑删除后面的代码
                    scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disable.png") + '" alt="Disabled" style="width: 70%;padding-top:20px;" />';
            
                    const scoreInfoElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt');
                    if (scoreInfoElement) {
                        scoreInfoElement.remove();
                    }
                }
            }
        } catch (error) {
        }
        
    }
}
async function getIdBySemester(smsName) {
    let data = localStorage.getItem("schoolsemesters");
    if (data) {
        data = JSON.parse(data);
    } else {
        const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        if (!response.ok) {
            return -1;
        }
        data = await response.json();
        localStorage.setItem("schoolsemesters", JSON.stringify(data));
    }
    console.log(smsName)

    if(smsName.includes("Semester")){
        smsName = englishToChiSemester(smsName);
    }
    let smsId = data.data[data.data.findIndex(item => item.name === smsName)].id;
    return smsId;
}

function englishToChiSemester(englishSemester) {
    const parts = englishSemester.split(', ');
    const semesterPart = parts[0]; // "Semester 2"
    const yearPart = parts[1];     // "2024-2025"
  
    const semesterNumber = semesterPart.split(' ')[1]; // "2"
    const chineseSemester = `第${semesterNumber}学期`;
    const chineseYear = `${yearPart}学年`;
  
    return `${chineseYear} ${chineseSemester}`;
}

function updateContent_DetailPage() {
    console.log("RUNNING updateDP")
    const target = document.getElementsByClassName('fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei')[1];
    if(target.children[1].innerText=="1970-01-01 08:00"||target.children[1].innerText=="2008-10-16 00:00"){
        target.children[0].innerText=tlang("Giaoculator获取的数据","Giaoculator fetched data");
        
        target.children[1].innerText="";
    }

    engPage_opti(0);
    setTimeout(engPage_opti(0), 30);
}

function engPage_opti(redotimes){
    if(redotimes>25){
        return;
    }
    setTimeout(() => {
        console.log("RUNNING englishOpi")
        const targetElement2 = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i');    
        if (targetElement2[0]) { 
            target = targetElement2[0];
            if(target.innerText=="Grade Details"){
                target.innerText="Details"
            }
            return true;
        } else {
            return false;
        }
    }, 10);
    setTimeout(() => {
        console.log("RUNNING englishOpi")
        const targetElement2 = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i');    
        if (targetElement2[0]) { 
            target = targetElement2[0];
            if(target.innerText=="Grade Details"){
                target.innerText="Details"
            }
            return true;
        } else {
            setTimeout(engPage_opti(redotimes+1), redotimes*10);
            return false;
        }
    }, 120);
}


function beauty_dymCode(){
    return;
}

document.onkeydown = function(e) {
    const target = e.target;
    const currentWindow = window.location.href;
    const tagName = target.tagName.toUpperCase();
    const isEditable = target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA';
    const isFocused = document.activeElement === target;

    if(e.key === 'Enter' ){
        simulateClickLogin();
    } 
    if (isEditable&&(currentWindow.includes("4.3.2.1"))) {
        
        Ntw_SimclickDisclamer();
        
        return;
    }
    if(currentWindow.includes("https://tsinglanstudent.schoolis.cn/")){
        beauty_dymCode()
    }
    

    if(e.key === 'Backspace' ){
        hidestudentInfo();
        
    } 

    if (isEditable && isFocused) {
        return;
    }//以下如果在输入中则不会触发




    if(e.key === 'Escape' ){
        simulateClickLogout();
        
    } else if(e.key >= '1' && e.key <= '4'){
        simulateClickBar(e.key.charCodeAt(0) - 49);
    } else if(e.key == 'ArrowLeft' && (currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/task/list" || currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/schedule")){
        try{document.getElementsByClassName("fc-prev-button fc-button fc-state-default fc-corner-left fc-corner-right")[0].click();}catch{}
        try{document.getElementsByClassName("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__leftIcon--1xTQmlKB0ldX-7LWrTevD4")[0].click();}catch{}
    } else if(e.key == 'ArrowRight' && (currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/task/list" || currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/schedule")){
        try{document.getElementsByClassName("fc-next-button")[0].click();}catch{console.log("Notfound")}  
        try{document.getElementsByClassName("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__rightIcon--ZSZeXHkbdqtWaqpsNXVn-")[0].click();}catch{}
    } else if(e.key == 'ArrowDown' && currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/realtime/list"){
        simulateClickRefresh(1);
    } else if(e.key == 'ArrowUp' && currentWindow === "https://tsinglanstudent.schoolis.cn/Home#!/realtime/list"){
        simulateClickRefresh(-1);
    }
};


function simulateClickLogin() {
    try{
        document.getElementsByClassName("fe-components-stu-business-login-enter-box-__signBtn--2VrsqhNGgcjYTh7LuAGzve")[0].click();
    }catch{

    }
}

function simulateClickBar(keyNum) {
    if(true){
        try{
            document.getElementsByClassName("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].click();
        }catch{
    
        }
    }
}

function changeBarname(keyNum, prefix) {
    if(true){
        try{
            var name = document.getElementsByClassName("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].innerText;
            document.getElementsByClassName("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].innerText = name + prefix;
        }catch{
    
        }
    }
}

function simulateClickLogout() {
    if(window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list/detail"){
        document.getElementsByClassName("ng-binding ng-scope fe-components-xb-location-__router--nsd2ZgXX2cpKLO-r5y7lv")[0].click();
    }
    
    else{
        try{
            document.getElementsByClassName("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].click();
        }catch{
            try {
                document.getElementsByClassName("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[1].click();
            } catch (error) {
                try{
                    document.getElementsByClassName("ng-binding fe-components-stu-business-topbar-profile-__liBtn--2o4Tw8hObEQPDm7WM_T2us")[1].click();
                }catch{
                    try {
                        document.getElementsByClassName("logout hide")[0].click();
                    } catch{
                        
                    }
                }
            }
            
        }
    }
}
function simulateClickRefresh(posChange) {
    var targtext = document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value
    try{
        targlists = document.getElementsByClassName("ng-isolate-scope fe-components-xb-pull-btn-__t_overflow--3OZPYj_1Z20EZZbQur_fl9");
        for(targ in targlists){
            if(targlists[targ].getAttribute('xb-title') == targtext){
                targlists[targ*1.0 +posChange].click();
                continue;
            }
        } 
        setTimeout(() => { 
            updateContent();
            setTimeout(() => { 
                updateContent();
            }, 60);
        }, 25);
        updateContent();
    }catch(e){
    }
}


function sendtopSeccesstip(cont){
    const notyf = new Notyf
    notyf.success({
        duration: 1500,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}


function sendSeccesstip(cont){
    const notyf = new Notyf
    notyf.success({
        duration: 1500,
        position: {
          x: 'right',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendCongrat(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'congrat',
            background: "#52c41a",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'congrat',
        duration: 3300,
        position: {
          x: 'center',
          y: 'top',
        },
        dismissible: false,
        message : cont
    })
}

function sendErrortip(cont){
    const notyf = new Notyf
    notyf.error({
        duration: 1500,
        position: {
          x: 'center',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendTopErrortip(cont){
    const notyf = new Notyf
    notyf.error({
        duration: 1500,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}


function sendInfotip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: "#2884E8",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'info',
        duration: 2500,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendInfotipLong(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: "#2884E8",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'info',
        duration: 6000,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendAlerttipLong(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: "orange",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 20000,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendAlerttip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: 'orange',
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 1500,
        position: {
          x: 'center',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendAlertrttip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: 'orange',
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 1500,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}


function hideScoresRepeatedly(data, interval, duration) {
    // 计算需要调用的次数
    const times = Math.floor(duration / interval);

    for (let i = 0; i <= times; i++) {
        setTimeout(() => {
            chrome.storage.local.get('enable_state', function(result) {
                if(result.enable_state){
                    hideScores(data.cont);
                }
            });//该实现方式有待优化，可考虑在检测为false时continue
        }, i * interval);
    }
}

function hideAseRepeatedly(data, interval, duration) {
    if(tmp_stopHide==true){
        return;
    }
    const times = Math.floor(duration / interval);
    for (let i = 0; i <= 100; i++) {
        setTimeout(() => {  
            chrome.storage.local.get('enable_state', function(result) {
                if(result.enable_state){
                    insertTeamsLogoLink();
                    hideAssignments(data.cont);
                }
            });//该实现方式有待优化，可考虑在检测为false时continue
        }, i * 2);
    }
    for (let i = 0; i <= times; i++) {
        setTimeout(() => {  
            chrome.storage.local.get('enable_state', function(result) {
                if(result.enable_state){
                    insertTeamsLogoLink();
                    hideAssignments(data.cont);
                }
            });//该实现方式有待优化，可考虑在检测为false时continue
        }, i * interval);
    }
}   



function showStateAtLoginPage(){
    console.log("SHOWSTATE");
    
    chrome.storage.local.get('enable_state', function(estate) {
        chrome.storage.local.get('user_preference', function(tmp) {
            showStateAtLoginPageMain(tmp,estate.enable_state);
        });
    });

}

function showHideButtonAtHome(){
    showHideButton(tmp_stopHide);
    return;
    chrome.storage.local.get('enable_state', function() {
        chrome.storage.local.get('user_preference', function(tmp) {
            showHideButton(tmp);
        });
    });
}

// 
function changeHideState(){
    console.log(tmp_stopHide);
    tmp_stopHide = !tmp_stopHide;
    showHideButtonAtHome();
    document.getElementsByClassName("fe-components-xb-pagination-__active--38NmY6BWhbJQuJwfItXtYi")[0].click();
    return;
    // 设置显示状态为相反
    chrome.storage.local.get('user_preference', function(tmp) {
        var data = tmp.user_preference;
        data.autoHide = !data.autoHide;
        chrome.storage.local.set({user_preference: data});
    })
    // showHideButtonAtHome();
}

function showHideButton(tmp){
    // if (SHOW_REFRESH) {
    //     return;
    // }
    // SHOW_REFRESH = true;

    // var span = document.createElement('span');
    // span.className = 'ng-scope fe-components-stu-app-task-list-__marR10--3--xJSPS__rgN4cQ4G6FjE';
    // span.style.marginRight = '0';

    // var xb_rest_btn = document.createElement('xb-rest-btn');
    // xb_rest_btn.className = 'ng-isolate-scope';

    // var button = document.createElement('button');
    // button.className = 'ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB';
    // button.style.height = '30px';
    //data = tmp.user_preference;
    hidestate = tmp

    // var div = document.querySelector('.fe-components-stu-common-stu-select-bar-__selectDiv--1TuYczJu6_9rrSCwO58S-d');
    // 获取ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB的button元素，并将里面的内容替换为img
    button = document.querySelector('.fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB');
    url = chrome.runtime.getURL(hidestate==true ? "res/visOn.svg" : "res/visOff.svg"); // 你的SVG文件路径
    // button.innerHTML = '<img src="' + url + '" alt="*" style="height: 20px; width: 25px; margin-top:5px; fill: #ccc" />';
    if (hidestate==true){
        button.innerHTML = '<span><svg style="height: 20px; width: 25px; margin-top:5px; fill: #222" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg></span>'
    }else{
        button.innerHTML = '<span><svg style="height: 20px; width: 25px; margin-top:5px; fill: #222" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg></span>'
    }
    // 给Button加上点击事件
    button.onclick = function() {
        changeHideState();
    }



}

function showStateAtLoginPageMain(tmp,estate) {
    var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';
    var content;
    var div = document.querySelector('.fe-components-stu-business-login-enter-box-__signBtnWrap--1hC-pSiXWu5_WJuSPKGEzQ');
    if (!div) {
        console.log('指定的div未找到');
        return;
    }

    data = tmp.user_preference;
    if(data.autoHide==true && estate){
        if(langSet == 'cn'){
            if(data.autoHide_Condition > 100){
                content = '自动隐藏所有数据';
            }else{
                content = '自动隐藏分数低于'+data.autoHide_Condition+'%的数据';
            }
        }else{
            if(data.autoHide_Condition > 100){
                content = 'Auto-Hide Score Limit: Hide All';
            }else{
                content = 'Auto-Hide Score Limit: '+data.autoHide_Condition+'%';
            }
        }
    }else if(estate==false){
        if(langSet == 'cn'){
            content = 'Giaoculator已关闭';
        }else{
            content = 'Giaoculator is Disabled';
        }
    }else{
        if(langSet == 'cn'){
            content = '自动隐藏未开启';
        }else{
            content = 'Auto-Hide Scores Disabled';
        }
    }
    var containerG = document.getElementById('autoHideState');
    if(containerG){
        containerG.remove();
    }
    var container = document.createElement('div');
    container.id = 'autoHideState';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'flex-start';
    container.style.paddingBottom = '10px'; // 假设按钮的下内边距是10px

    // 创建图标img元素
    var iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL(data.autoHide&&estate ? "res/hideOn.svg" : "res/hideOff.svg"); // 你的SVG文件路径
    iconImg.alt = '*';
    iconImg.style.height = '20px'; // 根据需要调整大小
    iconImg.style.width = '25px'; // 根据需要调整大小
    container.appendChild(iconImg);

    // 创建文本
    var textSpan = document.createElement('span');
    textSpan.textContent = content;
    textSpan.style.marginTop = '-1px';
    textSpan.style.fontSize = '12px';
    textSpan.style.paddingLeft = '2px'; // 图标和文本之间的间距
    container.appendChild(textSpan);

    // 最后，将新创建的元素插入到div的第一个子元素（即button）之前
    var button = div.querySelector('button');
    if (button) {
        var myTarget = document.getElementById('autoHideState');
        div.insertBefore(container, button);
        
    } 
}


function diyHomepage(){
    chrome.storage.local.get('user_preference', function(result) {
        
        showStateAtLoginPage();
        var sourcedata = result.user_preference;
        if(result.user_preference.advLogPage){
            setTimeout(() => {
                beautyLoginPage(sourcedata,0);
            }, 1);
            setTimeout(() => {
                beauty_dymCode()
            }, 100);
            return;
        }
        try {
            var targ = document.getElementsByClassName("fe-components-stu-business-login-enter-box-__schoolBackground--2S3KJugj_l_m7T5hRdY_cv")[0];
            if(source.includes(".mp4"))  {
                targ.children[0].innerHTML = "<div id='video-wrapper' style='width: 100%; height: 100%; position: relative; overflow: hidden;'><video style='width: 100%; height: 100%; object-fit: cover;' autoplay loop muted><source src='"+source+"' type='video/mp4'>Your browser does not support the video tag.</video></div>";
            // } else if(source.includes(".jpg")||source.includes("image")||source.includes(".jpeg")||source.includes(".png")||source.includes(".webp")||source.includes(".svg")||source.includes("tiff")||source.includes("bmp")||source.includes("gif")){
            } else {
                var img = new Image();
                img.onload = function() {
                    // Get the dimensions of the image and the container
                    var imgWidth = img.width;
                    var imgHeight = img.height;
                    var containerWidth = targ.children[0].offsetWidth;
                    var containerHeight = targ.children[0].offsetHeight;

                    // Decide which background size to use based on the dimensions
                    if (imgWidth > containerWidth || imgHeight > containerHeight) {
                        targ.children[0].style.backgroundSize = "cover";
                    } else {
                        targ.children[0].style.backgroundSize = "contain";
                    }

                    // Center the background image and prevent repetition
                    targ.children[0].style.backgroundPosition = "center center";
                    targ.children[0].style.backgroundRepeat = "no-repeat";
                    targ.children[0].style.backgroundImage = "url("+source+")";
                };
                img.src = source;
            } 
        }
        catch (error) {
            // Consider logging the error or handling it as required
        }
    });
}


function gpaClaced(){
    try {
        var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';
        if(langSet == 'cn'){
            setTimeout(() => {
                document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "学期GPA (计算)";
            }, 20);
            document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "学期GPA (计算)";
        }else{
            setTimeout(() => {
                document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "Semester GPA (Calced)";
            }, 20);
            document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "Semester GPA (Calced)";
        }
        
        
    } catch{}
    
} 

function gpaNotClaced(){
    try {
    var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';
    if(langSet != 'cn'){
        document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "Semester GPA";
    }else{
        document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0].innerText = "学期GPA";
    }}catch{}
}

function ntwLoginMain(){
    window.location.href = "http://4.3.2.1/ac_portal/20210314173759/pc.html?template=20210314173759&tabs=qrcode-pwd-dingtalk&vlanid=0&_ID_=0&switch_url=&url=";
    dticon = document.getElementsByClassName("auth-way-item-icon dingtalk")[0];
    dticon.src = chrome.runtime.getURL("res/disablev2.png")
}


function beautyLoginPage(srcData,redotimes){
    let colormode = srcData.homeDarkMode*1;
    var loginPageSrc = srcData.homeSrc;
    if(colormode >= 2){
        const hours = new Date().getHours();
        if (hours >= 6 && hours <= 18) {
            colormode = 1;
        } else {
            if(colormode == 3){
                loginPageSrc = srcData.homeSrcDark;
            }
            colormode = 0;
        }
    }
    
    //diyHomepage_LocalImg(loginPageSrc);



    try {
        document.getElementsByClassName('ng-scope fe-components-stu-business-login-enter-box-__headMain--7bzuRu-Sq5O2sOCFgPNQH')[0].children[0].src = chrome.runtime.getURL(colormode?"res/tsLogo_D.png":"res/tsLogo_W.png");
        if(!colormode){
            document.getElementById("autoHideState").children[1].style.color="#E4E4E4"
            const images = document.querySelectorAll('img');
            images.forEach(function(img) {
                if (img.src.includes('hideOn.svg')) {
                    img.src = img.src.replace('hideOn.svg', 'hideOn_Dark.svg');
                }else if (img.src.includes('hideOff.svg')) {
                    img.src = img.src.replace('hideOff.svg', 'hideOff_Dark.svg');
                }
            });
            const textlinks = document.querySelectorAll('a');
            textlinks.forEach(function(textlink) {
                textlink.style.color="#E4E4E4";
            });
            const inputs = document.querySelectorAll('input');
            inputs.forEach(function(tmp) {
                tmp.style.color="#E4E4E4";
            });
        }

        setTimeout(() => {
            try {//验证码适配
                let codeInput=document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ fe-components-stu-business-login-enter-box-__loginAccount--V6OxcxzYg1Kv38n9KjsDg fe-components-stu-business-login-enter-box-__codeAccount--1v5pY_k1CJAvtvhBeacNLV")[0];
                codeInput.children[0].outerHTML="<span>";
            } catch (e) {}
        }, 300);

        try {//验证码适配
            let codeInput=document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ fe-components-stu-business-login-enter-box-__loginAccount--V6OxcxzYg1Kv38n9KjsDg fe-components-stu-business-login-enter-box-__codeAccount--1v5pY_k1CJAvtvhBeacNLV")[0];
            codeInput.children[0].outerHTML="<span>";
            document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
        } catch (e) {
            
        }
        try {
            if(document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__another--2h0L224JEWaxwWm501-8Vi")[0].innerText.length>1){
                document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
            }
        } catch (e) {}



        if(loginPageSrc.length<2 || loginPageSrc =="<default>"){
            loginPageSrc = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        }
        


        if(loginPageSrc.includes("gcalc_localImg")||loginPageSrc.includes(".jpg")||loginPageSrc.includes(".heic")||loginPageSrc.includes("image")||loginPageSrc.includes(".jpeg")||loginPageSrc.includes(".png")||loginPageSrc.includes(".webp")||loginPageSrc.includes(".svg")||loginPageSrc.includes("tiff")||loginPageSrc.includes("bmp")||loginPageSrc.includes("gif")){
            // 图片：others
            console.log("others",loginPageSrc);
            if(loginPageSrc.includes("gcalc_localImg")){
                //已由上面完成
                return;
            }
            if(!loginPageSrc.includes("bing.biturl.top/?res")){
                document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundImage = "url("+loginPageSrc+")";
                return;
            }
            // 图片：BING
            const style = document.createElement("style");
            style.textContent = `
                /* 让容器支持绝对定位覆盖层 */
                .ng-scope.fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0 {
                    position: relative;
                }
                /* 新图覆盖层，用于淡入动画 */
                .new-bg-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center center;
                    background-repeat: no-repeat;
                    z-index: 9;
                    opacity: 0;
                    transition: opacity 0.6s ease-in-out;
                }
            `;
            document.head.appendChild(style);

            /**
             * 工具函数：获取指定 URL 的图片并转换为 Base64
             * @param {string} url
             * @returns {Promise<string>} Base64 字符串（dataURL）
             */
            async function fetchImageAsBase64(url) {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            /**
             * 工具函数：计算 Base64 图片的 SHA-256 哈希（返回 hex 字符串）
             * @param {string} base64 - dataURL 形式的 Base64
             * @returns {Promise<string>} 形如 "abc123..." 的 hex 哈希
             */
            async function computeSHA256(base64) {
                // 去掉前缀 "data:xxx;base64,"
                const base64Data = base64.split(",")[1] || "";
                // 将 base64 解码为二进制
                const raw = atob(base64Data);
                const uint8Array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                    uint8Array[i] = raw.charCodeAt(i);
                }
                // 使用 Web Crypto API 做 SHA-256 摘要
                const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
                // 转成 16 进制字符串
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                return hashHex;
            }

            // 2. 获取本地缓存的 “上一次的Base64图”
            chrome.storage.local.get(["lastImg"], async (res) => {
                const oldBase64 = res.lastImg;
                const bgElem = document.querySelector(".ng-scope.fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0");

                if (!bgElem) return; // 没找到目标元素，直接退出

                // 2.1 如果有旧图，先行显示它
                if (oldBase64) {
                    bgElem.style.backgroundImage = `url(${oldBase64})`;
                }

                // 3. 若本次加载的图片地址满足条件，比如后缀包含 .jpg
                if (1) {
                    try {
                        // 3.1 获取新图的 Base64
                        const newBase64 = await fetchImageAsBase64(loginPageSrc);

                        // 3.2 分别计算旧图、新图的哈希
                        const oldHash = oldBase64 ? await computeSHA256(oldBase64) : null;
                        const newHash = await computeSHA256(newBase64);

                        // 如果“旧图哈希”和“新图哈希”相同，说明图片内容并无变化 => 不执行淡入动画
                        if (oldHash && oldHash === newHash) {
                            console.log("Images are identical, skip fade in");
                            // 直接把背景更新为最新的（其实是一样的图）
                            bgElem.style.backgroundImage = `url(${newBase64})`;
                            // 也写回缓存（防止 dataURL 存在额外元数据差异，这里可要可不要）
                            chrome.storage.local.set({ lastImg: newBase64 });
                        } else {
                            // 4. 动画淡入
                            const overlay = document.createElement("div");
                            overlay.className = "new-bg-overlay";
                            overlay.style.backgroundImage = `url(${newBase64})`;

                            bgElem.appendChild(overlay);

                            // 触发 CSS transition：让 overlay 的 opacity 从 0 -> 1
                            requestAnimationFrame(() => {
                                overlay.style.opacity = "1";
                            });

                            // 过渡结束后，替换掉父容器的背景并移除 overlay
                            const handleTransitionEnd = () => {
                                bgElem.style.backgroundImage = `url(${newBase64})`;
                                bgElem.removeChild(overlay);
                                overlay.removeEventListener("transitionend", handleTransitionEnd);
                            };
                            overlay.addEventListener("transitionend", handleTransitionEnd);

                            // 5. 更新缓存为新图
                            chrome.storage.local.set({ lastImg: newBase64 });
                        }
                    } catch (err) {
                        console.error("Error fetching/converting image:", err);
                    }
                }
            });

    //END
        } else {
            // 假设 targ 是目标元素，source 是视频源URL
            var targ = document.querySelector('div[ng-controller="login"]'); // 或者用来定位背景元素的其它选择器
            var source = loginPageSrc; // 替换为实际视频URL

            // 创建一个空的div作为视频容器
            var videoContainer = document.createElement('div');
            videoContainer.style.position = 'absolute';
            videoContainer.style.top = '0';
            videoContainer.style.left = '0';
            videoContainer.style.width = '100%';
            videoContainer.style.height = '100%';
            videoContainer.style.overflow = 'hidden';
            videoContainer.style.zIndex = '-1'; // 确保视频在其他内容之下

            // 设置视频HTML字符串
            videoContainer.innerHTML = "<video style='width: 100%; height: 100%; object-fit: cover;' autoplay loop muted><source src='" + source + "' type='video/mp4'>Your browser does not support the video tag.</video>";

            // 将视频容器追加到目标元素
            if (targ) {
                targ.style.background = 'none'; // 移除原背景
                targ.appendChild(videoContainer); // 添加视频容器
            }

    
        }
    } catch (error) {
        if(redotimes<50){
            setTimeout(() => {
                beautyLoginPage(srcData,redotimes+1);
            }, redotimes<6 ? 100 : redotimes*100);
        }
    }
    try {
        if(!colormode){
            document.getElementsByClassName("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
            document.getElementsByClassName("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
        }
    } catch (error) {
        
    }
    setTimeout(() => {
        try {
            if(document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__another--2h0L224JEWaxwWm501-8Vi")[0].innerText.length>1){
                document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
            }
        } catch (e) {}
    }, 1000);
    
}

// 替换任务统计处的文字
function replaceTaskStat(text) {
    // ng-binding fe-components-stu-app-task-stat-__containerBody--37aNor2CicrLBH0qmwwofX
    document.getElementsByClassName("ng-binding fe-components-stu-app-task-stat-__containerBody--37aNor2CicrLBH0qmwwofX")[0].innerText = text;
}

function directDownloadFile() {
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl);
    const params = new URLSearchParams(urlObj.search);
    const src = params.get('src');
    
    if (src) {
        window.location.href = src;
    } else {
        console.error('src参数不存在');
    }
}

function directDownloadFile_AddBtn() {
    // 创建按钮
    const btn = document.createElement('button');
    let text =(navigator.language || navigator.userLanguage).startsWith('zh') ? '下载' : 'Download';
    btn.innerHTML = '<img src='+chrome.runtime.getURL("res/download.svg")+' alt="下载" style="height: 20px; vertical-align: middle;"> '+text;
    btn.style.position = 'fixed';
    btn.style.right = '10px';
    btn.id = 'gcalcDownloadBtn';
    btn.style.bottom = '30px';
    btn.style.zIndex = '10000'; // 确保按钮在最顶层
    btn.style.padding = '5px 10px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '5px';
    // '#007bff'
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
    btn.style.fontSize = '10px';
    btn.style.fontWeight = 'bold';
    btn.onclick = function() {
        directDownloadFile();
    };
    document.body.appendChild(btn);
    hideFloatingBall();
    if(document.getElementsByClassName("ms-Button root-163").length>4){
        document.getElementById('gcalcDownloadBtn').remove()
    }
}

function showGPAcount(redotimes,data){
    try {
        let showGB = true;
        let GBModel = 0;
        if(document.getElementById("gcalc_gpacntstate")){
            return;
        }
        var tiptext;
        let className = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].innerText;
        let subjectName = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__basicInfoItemValue--3Zx2X_CcFbD3XBxLp_NeFt")[0].innerText;
        let totalInfo = className + subjectName;
        let excludeList_LowWeight = ["Fine Art","IT","Ele","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"];
        let excludeList_NotCNT = ["TSSA","IELTS","TOFEL","Student","Clubs","Homeroom"];
        let categoryLists = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel--IDO2v_3UsPFqDDV9iQ2ml");
        if(totalInfo.includes("Drama")){
            showGB = false;
        }
        if(totalInfo.includes("Physical Education")){
            GBModel = 1;
        }
        if(excludeList_LowWeight.some(excludeItem => totalInfo.includes(excludeItem))){
            tiptext=tlang("该科目的GPA计算权重为0.5倍","This Subject Weights 0.5 in GPA Calculation")
        }else if(excludeList_NotCNT.some(excludeItem => totalInfo.includes(excludeItem))){
            tiptext=tlang("该科目不计入GPA计算","This Subject will be ignore in GPA Calculation")
        }else if(totalInfo.includes("C-Hum")){
            tiptext=tlang("该科目与中文计为一科计算","This Subject counts together with Chinese Culture")
        }else if(totalInfo.includes("Chinese")&&!totalInfo.includes("Second")){
            tiptext=tlang("该科目与中文人文计为一科计算","This Subject counts together with C-Humanities")
        }else if(totalInfo.includes("AP")&&!totalInfo.includes("Second")){
            tiptext=tlang("该科目为AP科目，正常计入GPA计算","This Subject Weights 1 in GPA Calculation")
        }else{
            tiptext=tlang("该科目正常计入GPA计算","This Subject Weights 1 in GPA Calculation")
        }

        if(document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText.includes("GPA")){
            tiptext=tlang("以上为计算所包含科目","Subjects included in calculation")
        }

        updateContent_DetailPage();
        for(let i=0;i<categoryLists.length;i++){
            var tmp = categoryLists[i].innerText
            if(tmp.includes("Q1")||tmp.includes("Q2")||tmp.includes("Q3")||tmp.includes("Q4")){
                tiptext=tlang("该科目为初中部科目","This Subject is a MS Subject");
                showGB = false;
            }
        }
        let newHtml="<ul id='gcalc_gpacntstate' ng-class='[styles.scoreListItem,commonStyles.clearFix]' class='fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB'> <!-- ngRepeat: items in $ctrl.evaluationProjectList --><!-- end ngRepeat: items in $ctrl.evaluationProjectList --><li ng-repeat='items in $ctrl.evaluationProjectList' class='ng-scope'> <ul ng-class='commonStyles.clearFix' ng-click='toggleChildItem($index)' class='fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB'> <li ng-class='[styles.scoreListItemLabel, styles.scoreListItemScoreWeight]' class='ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel--IDO2v_3UsPFqDDV9iQ2ml' style='font-size:"+tlang(13,11)+"px'>"+tiptext+"</li> <li ng-class='[styles.scoreListItemWeight, styles.scoreListItemScoreWeight]' class='ng-binding fe-components-stu-app-realtime-list-__scoreListItemWeight--285HojRL7boCDLSqVG3jB-'></li> <li ng-class='[styles.scoreListItemScore, styles.scoreListItemScoreWeight]' id='gcalc_diyboxbtn' class='fe-components-stu-app-realtime-list-__scoreListItemScore--1SnqOFUX5PHAR3L-RwXhkl'> <span class='ng-binding'></span> <!-- ngIf: items.evaluationProjectList.length>0 && items.showChild --> <!-- ngIf: items.evaluationProjectList.length>0 && !items.showChild --> </li> </ul> </li></ul>"
        let targetDiv = document.querySelector('.fe-components-stu-app-realtime-list-__scoreList--3yQylVqARJbNb5r06eJd3c');
        if (targetDiv) {
            targetDiv.insertAdjacentHTML('beforeend', newHtml);
            
        } else {
            console.log('目标元素未找到。');
        }
        if(showGB){
            addBtnforshowDisScoresBox(data.smsId,data.subjectId,className,GBModel,0);
        }
    } catch (error) {
        setTimeout(() => {
            if(redotimes<30){
                showGPAcount(redotimes+1,data);
            }
        }, 50);
    }
    
}

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}

function hidestudentInfo(){
    try {
        document.getElementsByClassName("fe-components-stu-business-head-img-__faceRadius--1KnMrEFLUQRin87ps3YG_k")[0].src=chrome.runtime.getURL("res/settings.svg");
        document.getElementsByClassName("fe-components-stu-business-topbar-profile-__User--2nAN-ZibOa7TaBGcERbXX0")[0].remove();
        document.getElementsByClassName("fe-components-stu-business-topbar-profile-__navUserBox--XXkgBpUL2yMAg1-Bz8tLq")[0].style="height:10px";
    } catch (error) {}
    try {document.getElementsByClassName("fe-components-stu-business-topbar-profile-edit-__StatisticsTabItem--CudXhV9FC828VnLP4xeqJ")[1].remove()} catch (error) {}
    try {document.getElementsByClassName("fe-components-stu-app-task-detail-__topInfoLi---LQyncvlBCIHhDzj4LFAn fe-components-stu-app-task-detail-__topInfo--2dj7QXyKxrcGchkM3UQrFK fe-components-stu-app-task-detail-__studentInfo--3pYOqsjP22Jx0AnmEkK9HR")[0].remove()} catch (error) {}
}

function appendAvgMaxScoresInPage(data,redotimes){
    chrome.storage.local.get('exp_showFullavg', function(state) {
        let ShowFull_state = 1;
        console.log(redotimes);
        try {
            
            if((data.usrS/data.totalS)*100>=(data.avgS/data.totalS)*100+10||((data.usrS/data.totalS)*100)>=97||data.usrS>=data.maxS){
                document.getElementsByClassName("ng-binding fe-components-stu-app-task-detail-__itemScore--1nuolF1pAilxxSB6o8b2Rx")[0].style="text-shadow: 0 0 10px #bbffbb";
            }else if((data.usrS/data.totalS)*100+10<(data.avgS/data.totalS)*100||data.usrS==0){
                document.getElementsByClassName("ng-binding fe-components-stu-app-task-detail-__itemScore--1nuolF1pAilxxSB6o8b2Rx")[0].style="text-shadow: 0 0 10px #ff9999";
            }

            
            let elementToAppend;
            let targetElement = document.getElementsByClassName("fe-components-stu-app-task-detail-__itemClassInfo--2Ist05O25K5lXA-9nAmiDO")[0]; // 找到目标元素
            if(document.getElementsByClassName("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP").length==2){
                return;
            }else if(document.getElementsByClassName("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP").length==1){
                document.getElementsByClassName("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP")[0].remove();
            }
            let maxS=data.maxS;
            let usrS=data.usrS;
            let avgS=data.avgS;
            let PercentageAvgS = (avgS/data.totalS)*100;
            let PercentageUsrS = (usrS/data.totalS)*100;
            let PercentageMaxS = (maxS/data.totalS)*100;
            let maxScoreModel;
            let avgScoreModel;
            let hintText = "";
            let iconModel = "<img src="+chrome.runtime.getURL("res/icon.png")+" id='gcalc2ScoresIcon' alt='Ico' style='vertical-align: middle; margin-right: 5px; height: 24px;'>"
                
            if(ShowFull_state){
                maxScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+tlang("班级最高成绩:","Class Highest:")+maxS+"</p>"
                avgScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+tlang("班级平均成绩:","Class Average:")+avgS+"</p>"
            }else{
                maxScoreModel = ""
                if (PercentageUsrS === PercentageMaxS) {
                    hintText = tlang("班级最高！", "Class Highest!");
                } else if (PercentageUsrS >= PercentageAvgS + 8) {
                    hintText = tlang("表现优秀！", "Outstanding Performance!");
                } else if (PercentageUsrS >= PercentageAvgS){
                    hintText = tlang("表现良好", "Good Performance!");
                } else if (Math.abs(PercentageUsrS - PercentageAvgS) <= 6) {
                    hintText = tlang("接近平均水平", "Around Class Average");
                } else if (PercentageUsrS < PercentageAvgS) {
                    hintText = tlang("有进步空间", "Room for Improvement");
                }
                console.log(PercentageAvgS,PercentageUsrS,PercentageMaxS);

                avgScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' style='margin-right: 7px' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+"&nbsp;&nbsp;"+hintText+"</p>"
                console.log(hintText);
            }
            
            let tempDiv = document.createElement('div'); 

            tempDiv.innerHTML = iconModel;
            if (tempDiv.firstChild) {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            tempDiv.innerHTML = avgScoreModel;
            if (tempDiv.firstChild) {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            tempDiv.innerHTML = maxScoreModel;
            if (maxScoreModel!="") {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            setTimeout(() => {
                if(!document.getElementById("gcalc2ScoresIcon")){
                    appendAvgMaxScoresInPage(data,redotimes+1)
                }   
            }, 200);
            
            
        } catch (error) {
            console.log(error);
            setTimeout(() => {
                if(redotimes<10){
                    appendAvgMaxScoresInPage(data,redotimes+1)
                }
                
            }, redotimes*20);
        }
    });
    
    
}
function addBtnforshowDisScoresBox(smsid,subjectid,subjectname,model,redotimes){
    let btntext = tlang("进入任务预测","Enter Edit Mode")
    if(document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText.includes("GPA")){
        btntext=tlang("反馈权重异常","Report Bugs")
    }
    let tmpBtn = `<p id="gcalc_clicktoshowDiyBox" style="font-size: 13px; display: inline-block; padding: 0px 11px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">${btntext}</p>`;
    
    
    document.getElementById("gcalc_gpacntstate").children[0].children[0].children[0].style = "font-size:13px;position: relative;top: 1px;";
    document.getElementById("gcalc_diyboxbtn").insertAdjacentHTML('beforeend', tmpBtn);
    if(document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText.includes("GPA")){
        document.getElementById("gcalc_clicktoshowDiyBox").addEventListener('click', function() {
            window.open('https://jsj.top/f/D5NtDf', '_blank'); // 在新窗口中打开
        });
    }else{
        document.getElementById("gcalc_clicktoshowDiyBox").addEventListener('click', function() {
        
            getUsrAssignmentInfoBeforeshowDiyBox(smsid,subjectid,subjectname,model);
            
        });
    }

    
}

function sys_showload(state){
    if (state == true){
        const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
        if (targetElement) {
            targetElement.style.display = "table";
        }
    } else {
        const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
        if (targetElement) {
            targetElement.style.display = "none";
        }
    }
}


function getUsrAssignmentInfoBeforeshowDiyBox(smsid, subjectid,subjectName,model){
    sys_showload(true);
    let data={
        smsId:smsid,
        subjectId:subjectid,
        subjectName:subjectName,
        model:model
    }
    const storagekey = smsid+"|"+subjectid;
    console.log(storagekey);
    chrome.storage.local.get(storagekey).then(async (result) => {
        console.log(result[storagekey]);
        let classId = null;
        try {
            classId = result[storagekey].classId;
        } catch (error) {

        }
        
        if (!classId){
            const apiUrl = new URL(("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId="+smsid+"&gcalc=gcalc_bg"));
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            data.data.studentSemesterDynamicScoreBasicDtos.forEach(element => {
                if(element.subjectId == subjectid){
                    classId = element.classId;
                    console.log("method2Found:",classId);
                }
            });
        }
        if(!classId){
            sys_showload(false);
            sendAlerttip(tlang("无法进入自定义模式:未找到班级ID","Failed to init:Class ID Not Found"));
            return;
        }
        const apiUrl = new URL("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail");
        apiUrl.searchParams.append("classId", classId);
        apiUrl.searchParams.append("subjectId", subjectid);  
        apiUrl.searchParams.append("semesterId", smsid);  

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log("API Response Data:", data); 
            showDiyScoresBox(smsid,subjectid,subjectName,data.data.evaluationProjectList);
        } catch (error) {
            console.error("Fetch failed:", error);
        }
    });

    return;//old method
    console.log("SendMSG:",data);
    send_comp_msg("gb_getSavedData",data,0);
}


function showDiyScoresBox(smsId,subjectId,subjectName,assignmentList){
    console.log(assignmentList);
    let tmp_target = document.getElementsByClassName("ng-scope fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5")[0];
    if(!tmp_target){
        console.log("[ShowDiyScoresBox]Target Not Found");
        return;
    }
    let selectionList = `<option value="none" disabled selected>${tlang("任务类别","Select Category")}</option>`;
    assignmentList.forEach(assignment => {
        selectionList += `
            <option value="${assignment.evaluationProjectEName}">
            ${tlang(assignment.evaluationProjectName, assignment.evaluationProjectEName)}
            </option>
        `;
    });
    mainHtml = `<div ng-class="styles.xbDialogModal" ng-if="$ctrl.showDialog" class="ng-scope fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5">
	<div ng-class="styles.xbDialogModalBox" style="width:990px; max-height:680px"class="fe-components-stu-app-realtime-list-__xbDialogModalBox--1hItMXot7XJyswrPjZ2WjQ">
		<div ng-class="[styles.header, commonStyles.clearFix]" class="fe-components-stu-app-realtime-list-__header--2llDMOt0zjGNFxFvoV5VBp fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB">
			<span ng-class="styles.modelTitle" class="ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i">${tlang("预测成绩变化","Predict Score Changing")}</span>
			<span ng-class="styles.closeIcon" ng-click="closeModal()" class="fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv"></span>
		</div>
		<div id="gb-body" ng-class="styles.body" class="fe-components-stu-app-realtime-list-__body--KTwHV_4KFA0kqa0udu2GW">
            <br><br>
            <div style="margin-bottom: 20px;">
            	<p style="font-size: 14px; margin-right: 8px;">${tlang("学期ID","SemesterId")}：${smsId}&nbsp&nbsp&nbsp${tlang("&nbsp科目：","Subject:")}${subjectName} </p>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="font-size: 14px; margin-right: 4px;">${tlang("任务名称","TaskName")}:</label>
                <input placeholder="${tlang("自定义名称","AnyName")}"  id="gb_aName" type="text" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; margin-right: 24px;">
                <label style="font-size: 14px; margin-right: 4px;">${tlang("得分(%)","Score(%)")}:</label>
                <input placeholder="分数" id="gb_aScore" type="number" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; width: 60px;margin-right: 24px;">
                <label style="font-size: 14px; margin-right: 4px;">${tlang("类别","Category")}:</label>
                <select id="gb_cataSelect" style="padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px;margin-right: 20px;">
                    ${selectionList}
                </select>
                <p id="gb_propDis" style="font-size: 14px; margin-right: 4px;display: inline-block;">占比: -%</p>
                <button id="gb_appendBtn" style="font-size: 12px;background-color: #4CAF50; color: white; padding: 6px 9px; border: none; border-radius: 4px; margin-left: 62px; cursor: pointer;">${tlang("添加到列表","Add to List")}</button>
            </div>
            <div style="margin-bottom: 20px;">
            	<div style="border: 0.2px solid #ccc; border-radius: 4px;width: 100%; margin: 0 auto; overflow-x: hidden; overflow-y: auto;">
                <div style="width: 100%; height: 370px; border: 1px solid #ccc; overflow-y: auto;">
                  <ul id="gb_listbox">
                    
                  </ul>
                </div>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
            	<div id="SubjectTotal_div" style="font-size: 15px; display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 246, 203, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px; cursor: pointer; transition: background-color 0.5s ease-in-out;">
                <span style="flex: 2; text-align: left;">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#8B1A10" style="margin-bottom: -3px;"><path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z"></path></svg>
                    &nbsp;${tlang("学科总成绩","Subject Score")}
                </span>
                <span style="flex: 1; text-align: center;">
                </span>
                <span id="SubjectTotal_score" style="flex: 1 1 0%; text-align: center; transition: transform 0.3s ease-in-out; transform: scale(1);">-% / -</span>
                </div>
            </div>
		</div>
	</div>
    </div>
    `; //Main Html of the box
    let oriScore = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__score--1e6GrTtGfRHkKF-12OE_J3")[0].innerText;
    tmp_target.innerHTML = mainHtml;
    document.getElementsByClassName("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].addEventListener("click", function() {
        closeGcalcBox();
    });
    
    
    const selectElement = document.getElementById("gb_cataSelect");
    const pElement = document.getElementById("gb_propDis");

    pElement.textContent = "";

    selectElement.addEventListener("change", function() {
        const selectedItem = assignmentList.find(
            item => item.evaluationProjectEName === selectElement.value
        );
        const proportion = selectedItem?.proportion ?? 30;//default
        pElement.textContent = `${tlang("占比","Prop")}: ${proportion}%`;
        pElement.gcValue = proportion;
    });
    var pendingAssignmentList = [];  
    sys_showload(false);  
    assignmentList.forEach(item => {
        const categoryHtml = `
            <div id="${item.evaluationProjectEName}_div" style="font-size:13px; display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 246, 203, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
            <span style="flex: 2; text-align: left;">
                ${tlang(item.evaluationProjectName, item.evaluationProjectEName)}(${item.proportion}%)
            </span>
            <span style="flex: 1; text-align: center;">
            </span>
            <span scoreValue="${item.scoreIsNull?null:item.score}" gc_prop=${item.proportion} id="${item.evaluationProjectEName}_score" style="flex: 1; text-align: center;">
                ${item.scoreIsNull?"-":item.score}% / ${item.scoreIsNull?"-":item.scoreLevel}
            </span>
            </div>
        `;
        document.getElementById("gb_listbox").insertAdjacentHTML('beforeend', categoryHtml);

        let calcedAvg = 0;
        let calcedAvgCnt = 0;
       
        item.learningTaskAndExamList.forEach(taskitem => {
            const listItemHtml = `
                <div class="${item.evaluationProjectEName}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 255, 255, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
                <span title="${taskitem.name}" style="flex: 2; text-align: left;">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <img src="https://cdn.schoolis.cn/sis/favicon/sis.ico" style="width:16px; height:16px; vertical-align: middle; margin-right: 6px;" />
                    &nbsp;&nbsp;${limitBytes(taskitem.name, 70)}
                </span>
                <span style="flex: 1; text-align: center;">
                    
                </span>
                <span  title="${tlang("详细","Details")}: ${taskitem.score}/${taskitem.totalScore}"  style="flex: 1; text-align: center;">
                    ${taskitem.score===null?"-&nbsp;":(taskitem.score/taskitem.totalScore*100).toFixed(1)}% 
                </span>
                </div>
            `;
            if(taskitem.score!==null){
                calcedAvg += taskitem.score/taskitem.totalScore*100;
                calcedAvgCnt++;
                document.getElementById("gb_listbox").insertAdjacentHTML('beforeend', listItemHtml);
                let newTarget = document.getElementById("gb_listbox").getElementsByClassName(item.evaluationProjectEName)[(document.getElementById("gb_listbox").getElementsByClassName(item.evaluationProjectEName)).length-1];
                newTarget.addEventListener("click", function() {
                    let assignmentScore = taskitem.score/taskitem.totalScore*100;
                    let assignmentCata = item.evaluationProjectEName;
                    let insertTarget=document.getElementById("gb_listbox").getElementsByClassName(assignmentCata);
                    sendtopSeccesstip(tlang("原生项目已移除","Original Assignment Removed"));
    
                    let cateScore = document.getElementById(assignmentCata + "_score").getAttribute("scoreValue") ? parseFloat(document.getElementById(assignmentCata + "_score").getAttribute("scoreValue")) : null;
                
                    // 修复：如果原来 cateScore 是空，就直接置0。其余情况正常计算
                    if(insertTarget.length<=1){
                        document.getElementById(assignmentCata + "_score").textContent = "-% / -";
                        document.getElementById(assignmentCata + "_score").setAttribute("scoreValue", null);
                    }else{
                        let newCateScore = cateScore
                        ? (cateScore * insertTarget.length - parseFloat(assignmentScore)) / (insertTarget.length - 1)
                        : -1;
                        document.getElementById(assignmentCata + "_score").textContent = `${newCateScore.toFixed(1)}% / ${scoreToLevel(newCateScore)}`;
                        document.getElementById(assignmentCata + "_score").setAttribute("scoreValue", newCateScore);
                        console.log(newCateScore," is calc:",cateScore,"*",insertTarget.length,"-",parseFloat(assignmentScore),"/",insertTarget.length-1);
                    }         
    
                    if(document.getElementById(assignmentCata + "_score").textContent=="Infinity% / "||document.getElementById(assignmentCata + "_score").textContent=="NaN% / "||document.getElementById(assignmentCata + "_score").textContent.includes("-1")){
                        document.getElementById(assignmentCata + "_score").textContent = "-% / -";
                        document.getElementById(assignmentCata + "_score").setAttribute("scoreValue", null);
                    }
                    setTimeout(() => {
                        const newOverall = gb_calcTotalScore();
                        document.getElementById("SubjectTotal_score").textContent = `${newOverall}% / ${scoreToLevel(newOverall)}`;
                        document.getElementById("SubjectTotal_score").setAttribute("scoreValue", newOverall);
                    }, 80);
                
                    this.remove();
                });
            }
            
        });
        if(calcedAvgCnt>0) document.getElementById(`${item.evaluationProjectEName}_score`).setAttribute("scorevalue", calcedAvg/calcedAvgCnt);
    });
    //init overallScore 
    document.getElementById("SubjectTotal_score").textContent = `${gb_calcTotalScore()}% / ${scoreToLevel(gb_calcTotalScore())}`;

    document.getElementById("gb_appendBtn").addEventListener("click", function() {
        if(!document.getElementById("gb_aScore").value){
            sendTopErrortip(tlang("请先填写自定义分数","Please enter the custom score first"));
            return;
        }
        if(document.getElementById("gb_cataSelect").value=="none"){
            sendTopErrortip(tlang("请先选择任务类别","Please select a category first"));
            return;
        }

        const assignmentName = document.getElementById("gb_aName").value==""?`${tlang("用户自定义任务","Custom Assignment")}${(Math.random()*10000).toFixed(0)}`:document.getElementById("gb_aName").value;
        const assignmentScore = document.getElementById("gb_aScore").value;
        const assignmentCata = document.getElementById("gb_cataSelect").value;
        const assignmentProp = document.getElementById("gb_propDis").gcValue;   
                        
        if(assignmentScore<0||assignmentScore>100){
            sendTopErrortip(tlang("分数必须在0~100之间","Score must be between 0~100"));
            return;
        }
        let inputInfo = {
            smsId: smsId,
            subjectId: subjectId,
            name: assignmentName,
            percentageScore: assignmentScore,
            cataname: assignmentCata,
            proportion: assignmentProp
        }
        const listItemHtml = `
                <div class="${assignmentCata}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 255, 255, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
                <span title="${assignmentName}" style="flex: 2; text-align: left;">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <img src="${chrome.runtime.getURL("icon.png")}" style="width:15.5px; height:15.5px; vertical-align: middle; margin-top:-2px; margin-right: 6px;" />
                    &nbsp;&nbsp;${limitBytes(assignmentName, 70)}
                </span>
                <span style="flex: 1; text-align: center;">
                    
                </span>
                <span title="${tlang("自定义项目","Entered Score")}"  style="flex: 1; text-align: center;">
                    ${Number(assignmentScore).toFixed(1)}% 
                </span>
                </div>
            `;
            let insertTarget=document.getElementById("gb_listbox").getElementsByClassName(assignmentCata);

            if(insertTarget.length==0){
                console.log("no target");
                insertTarget=[document.getElementById(assignmentCata+"_div")]
                console.log(insertTarget);
            }
            insertTarget[insertTarget.length-1]?.insertAdjacentHTML('afterend', listItemHtml);

            let newTarget = document.getElementById("gb_listbox").getElementsByClassName(assignmentCata)[(document.getElementById("gb_listbox").getElementsByClassName(assignmentCata)).length-1];
            console.log(newTarget)

            newTarget.addEventListener("click", function() {
                let insertTarget=document.getElementById("gb_listbox").getElementsByClassName(assignmentCata);
                sendtopSeccesstip(tlang("自定义项目已移除","Cunstom Assignment Removed"));

                let cateScore = document.getElementById(assignmentCata + "_score").getAttribute("scoreValue") ? parseFloat(document.getElementById(assignmentCata + "_score").getAttribute("scoreValue")) : null;
            
                // 修复：如果原来 cateScore 是空，就直接置0。其余情况正常计算
                let newCateScore = cateScore
                    ? (cateScore * insertTarget.length - parseFloat(assignmentScore)) / (insertTarget.length - 1)
                    : -1;
                console.log(newCateScore," is calc:",cateScore,"*",insertTarget.length,"-",parseFloat(assignmentScore),"/",insertTarget.length-1);
            
                document.getElementById(assignmentCata + "_score").textContent = `${newCateScore.toFixed(1)}% / ${scoreToLevel(newCateScore)}`;
                document.getElementById(assignmentCata + "_score").setAttribute("scoreValue", newCateScore);

                if(document.getElementById(assignmentCata + "_score").textContent=="NaN% / "||document.getElementById(assignmentCata + "_score").textContent.includes("-1")){
                    document.getElementById(assignmentCata + "_score").textContent = "-% / -";
                    document.getElementById(assignmentCata + "_score").setAttribute("scoreValue", null);
                }
                setTimeout(() => {
                    const newOverall = gb_calcTotalScore();
                    document.getElementById("SubjectTotal_score").textContent = `${newOverall}% / ${scoreToLevel(newOverall)}`;
                    document.getElementById("SubjectTotal_score").setAttribute("scoreValue", newOverall);
                }, 80);
            
                this.remove();
            });
            

            let cateScoreDiv = document.getElementById(assignmentCata + "_score").getAttribute("scoreValue");
            let cateScore = cateScoreDiv ? parseFloat(cateScoreDiv) : null;


            
            let newCateScore = cateScore ? (cateScore*(insertTarget.length-1) + parseFloat(assignmentScore))/(insertTarget.length) : parseFloat(assignmentScore);
            //Update Score
            
            document.getElementById(assignmentCata+"_score").textContent = `${newCateScore.toFixed(1)}% / ${scoreToLevel(newCateScore)}`;
            document.getElementById(assignmentCata+"_score").setAttribute("scoreValue",newCateScore);

            //ANIMATION
            let scoreElement = document.getElementById(assignmentCata + "_score");
            let divElement = document.getElementById(assignmentCata + "_div");

            scoreElement.style.transition = "transform 0.3s ease-in-out";
            scoreElement.style.transform = "scale(1.5)";
            setTimeout(() => {
                scoreElement.style.transform = "scale(1)";
            }, 300);
            
            divElement.style.transition = "background-color 0.5s ease-in-out";
            divElement.style.backgroundColor = newCateScore>=(cateScore?cateScore:0)?"rgb(30, 244, 137)":"rgba(235, 144, 144, 0.85)"; 
            setTimeout(() => {
                divElement.style.backgroundColor = "rgba(255, 246, 203, 0.85)"; 
            }, 500);

            //Animation:OverallScore
            let tscateScoreDiv = document.getElementById("SubjectTotal_score").textContent.trim();
            let tsmatch = tscateScoreDiv.match(/^([\d.]+)% /);
            tsmatch = tsmatch ? parseFloat(tsmatch[1]) : 0;




            setTimeout(() => {
                const newOverall = gb_calcTotalScore();
                document.getElementById("SubjectTotal_score").textContent = `${newOverall}% / ${scoreToLevel(newOverall)}`;
                document.getElementById("SubjectTotal_score").setAttribute("scoreValue", newOverall);
                let TscoreElement = document.getElementById("SubjectTotal_score");
                let TdivElement = document.getElementById("SubjectTotal_div");

                TscoreElement.style.transition = "transform 0.3s ease-in-out";
                TscoreElement.style.transform = "scale(1.5)";
                setTimeout(() => {
                    TscoreElement.style.transform = "scale(1)";
                }, 300);
                
                TdivElement.style.transition = "background-color 0.5s ease-in-out";
                TdivElement.style.backgroundColor = newCateScore>=(tsmatch)?"rgb(30, 244, 137)":"rgba(235, 144, 144, 0.85)"; 
                setTimeout(() => {
                    TdivElement.style.backgroundColor = "rgba(255, 246, 203, 0.85)"; 
                }, 500);
            }, 60);
            
            
            


    });
    document.getElementById("gb_nextStepBtn").addEventListener("click", function() {
        showState2DiyScoresBox(smsId,subjectId,subjectName,oriScore);
    });

}
    
function gb_calcTotalScore(){
    const select=document.getElementById("gb_cataSelect");
    let totalScore = 0;
    let totalWeight = 0;
    Array.from(select.options)
    .filter(option => option.value !== "none") // 排除"任务类别"提示
    .forEach(option => {
        let titleDiv = document.getElementById(option.value + "_score")
        let match = document.getElementById(option.value + "_score").getAttribute("scoreValue")
        if (match!==null&&match!==undefined&&match>=0&&match!="null") {
            let cateScore = match ? parseFloat(match) : null;
            totalScore += cateScore*parseInt(titleDiv.getAttribute("gc_prop"));
            totalWeight += parseInt(titleDiv.getAttribute("gc_prop"));
            
        }

    });
    //console.log(totalScore,totalWeight,totalScore/totalWeight);
    return (totalScore/totalWeight).toFixed(1);
}



function limitBytes(str, maxBytes) {
    let bytes = 0;
    let result = "";
    
    for (let char of str) {
        let charBytes = encodeURIComponent(char).length > 2 ? 2 : 1; 
        if (bytes + charBytes > maxBytes) break; 
        result += char;
        bytes += charBytes;
    }
    
    return bytes < maxBytes ? result : result + ".."; 
}

function padSpaces(str, targetLength) {
    //return str.padEnd(6)
    const paddingLength = Math.max(0, targetLength - str.length);
    return str + "&ensp;".repeat(paddingLength);
}

//addNewUsrAssignment(smsid,subjectid,name, percentageScore,proportion,cataName)

function send_comp_msg(msgtype, data = null, addData = null) {
    if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({ type: msgtype, data, additionalData: addData });
    }
}

function showState2DiyScoresBox(smsId,subjectId,subjectName,oriScore){
    if (subjectName.includes("[Edited] ")) {
        subjectName = subjectName.replace("[Edited] ", "");
    }
    mainHtml = `<div id="gb-s2-body" ng-class="styles.body" class="fe-components-stu-app-realtime-list-__body--KTwHV_4KFA0kqa0udu2GW" style="display: flex; flex-direction: column;">
    <br><br>
    <div style="font-size: 28px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ;padding: 20px; display: flex; flex-direction: row;">
  <div ng-if="$ctrl.listInfo.length!=0" ng-class="[styles.item, styles.listItem]" ng-repeat="item in $ctrl.listInfo" ng-click="actionRealtime(item)" class="ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz">
			<p ng-class="styles.title" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__title--2-qR61O6OMCyK_cqZXD1EC"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.grade" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__grade--2wJch67b4uOYNPgwNpRCm8"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p>
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
<div ng-class="styles.content" ng-if="item.scoreType==1" class="ng-scope fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU">
				<div ng-class="[styles.scoreNum,(item.subjectScore=='--')?styles.noneScore:'',(item.gpa!= null || item.level)?'':styles.scoreCenter]" class="ng-binding fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1 fe-components-stu-app-realtime-list-__scoreCenter--qsS5Rck5H9C3EHLPt3XUF">
					${oriScore}</div>
				<div style="clear:both;"></div>
			</div>
			<div ng-class="styles.updateTime" class="ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI">原始成绩</div>
		</div>
        
<div ng-if="$ctrl.listInfo.length!=0" ng-class="[styles.item, styles.listItem]" ng-repeat="item in $ctrl.listInfo" ng-click="actionRealtime(item)" class="ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz">
			<p ng-class="styles.title" xb-title="[Edited] ${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__title--2-qR61O6OMCyK_cqZXD1EC"><ng-transclude>[Edited] ${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">[Edited] ${subjectName}</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.grade" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__grade--2wJch67b4uOYNPgwNpRCm8"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p>
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
<div ng-class="styles.content" ng-if="item.scoreType==1" class="ng-scope fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU">
				<div id="gb_newnum" ng-class="[styles.scoreNum,(item.subjectScore=='--')?styles.noneScore:'',(item.gpa!= null || item.level)?'':styles.scoreCenter]" class="ng-binding fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1 fe-components-stu-app-realtime-list-__scoreCenter--qsS5Rck5H9C3EHLPt3XUF">
					-</div>
				<div style="clear:both;"></div>
			</div>
			<div ng-class="styles.updateTime" class="ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI">修改后成绩</div>
		</div>
</div>
    <button id="gb_finishBtn" style="font-size: 14px;background-color: #4CAF50; color: white; padding: 7px 10px; border: none; border-radius: 4px; position:absolute; bottom:25px; right:31px; cursor: pointer;">确认</button>
</div>
    `; 
    document.getElementById("gb-body").style.display = "none";
    document.getElementsByClassName("fe-components-stu-app-realtime-list-__xbDialogModalBox--1hItMXot7XJyswrPjZ2WjQ")[0].insertAdjacentHTML('beforeend', mainHtml);
    document.getElementsByClassName("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].addEventListener("click", function() {
        closeGcalcBox();
    });
    document.getElementById("gb_finishBtn").addEventListener("click", function() {
        closeGcalcBox();
    });

}


function closeGcalcBox(){
    document.getElementsByClassName("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[3].click();
}

function ribbon_Fireworks(duration_Seconds){
    var duration = duration_Seconds * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    var particleCount = 200 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}



function addSmsCalcState(data){
    let cur = data.cur;
    let oval = data.oval;
    // 悬浮窗更新代码
    if(cur > currentUpdate){
        upgradeProgress();
        currentUpdate = cur;
    };

    if(cur == oval){
        //
    }
}
function addCalcState(data,redotimes){
    try {
        let cur = data.cur;
        let oval = data.oval;

        // 悬浮窗更新代码
        /*
        7 = oval;
        if(cur > currentUpdate){
            upgradeProgress();
            currentUpdate = cur;
        }*/
/*
        let targ = document.getElementById("gcalc_proc");
        if(!targ){
            let mainHtml = `<span id="gcalc_proc" ng-class="$ctrl.styles.gotoText" ng-show="showCourse" ng-click="" class="ng-binding fe-components-stu-business-topbar-__gotoText--abWs2AncUsOC7EPXLLEaK" style="
        display: flex;
        justify-content: center;
        margin-top: -30px;
        margin-left: -15px;
        ">计算中 (NaN)</span>`
            document.getElementsByClassName("fe-components-stu-business-topbar-__navBar--2Au2lL_QIAwQu9fN70vAd4")[0].insertAdjacentHTML('beforeend', mainHtml);
        }*/
        //targ = document.getElementById("gcalc_proc");
        if(cur == 0 && oval>1){
            document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
        }
        if(cur>0 && cur<oval && oval>1){
            setTimeout(() => {
                resetRing(0); // 重置环
            }, 50);
            document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
            return;
        }
        if(cur == oval && cur>=1){
            // targ.innerText = tlang(`计算已完成`,`All Done`)
             if(oval>1) document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
             setTimeout(() => {
               //  targ.remove();
                 resetRing(1);
             }, oval==1? 50:70);
        }
        
        //targ.innerText = tlang(`计算中 (${cur}/${oval})`,`Processing (${cur} / ${oval})`)
    } catch (error) {
        console.log("WaitForAgain",error);
        setTimeout(() => {
            addCalcState(data,redotimes+1)
        }, 100*redotimes);
    }
}





function MB_insertEditedDiv() {
  // 查找第一个具有 'ng-isolate-scope' 类的元素
  var target = document.querySelector('.fe-components-stu-app-task-list-__listItemBox--3elHWcZSeppt-hG2vNGaZz');
  var already = document.querySelector('#my_status_bar');
  // 确保找到了目标元素
  if (target && !already) {
    // 创建一个新的div元素，并设置其内容和样式
    var newDiv = `
    <div id="my_status_bar" style="border: 1px solid #e5e5e5; border-radius: 3px; background-color: #fff; margin-top: 8px; padding: 15px; font-family: Arial, sans-serif; font-size: 14px; display: flex; justify-content: space-between; height: auto;">
      <div style="width: 50%; margin-right: 10px;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li>这是一条消息</li>
        </ul>
      </div>
      <div style="width: 50%;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li>这是一条消息</li>
        </ul>
      </div>
    </div>`;
    
  
    // 在找到的元素后面插入新的div
    target.insertAdjacentHTML('beforebegin', newDiv);
    console.log("done")
  } else {
    console.log('No element with class "ng-isolate-scope" found.');
  }
  
}

function POP_addPopComponent(){
    if (!window.location.href.includes('schoolis.cn')) {
        return;
    }
    let mainHtml = `
        <div>
            <div class="floating-ball">
                <div class="alert-dot"></div>
                <div class="alert-number">
                    <span class="number-span">1</span>
                </div>
                <svg class="progress-ring" width="70" height="70">
                    <circle class="progress-ring__circle" stroke="rgb(86,194,90)" stroke-width="6" fill="transparent" r="30.75" cx="35" cy="35"/>
                </svg>
                <div class="content-container">
                    <img src="`+chrome.runtime.getURL("icon.png")+`" alt="Logo" id="xfc-logo">
                </div>
            </div>
            <div class="info-box">
                <div class="close-btn">×</div>
                <div class="info-content"></div>
            </div>
            <div id="progress-text-shadow" ></div>
            <div id="progress-text" > </div>
            
            </div>
    `
    var styleElement = document.createElement('style');
    let manCss = `
    #progress-text-shadow {
        box-shadow: 10px 10px 30px 8px rgba(0, 0, 0, 0.75);
        position: fixed; /* Changed from absolute to fixed */
        transform: translate(-50%, 0);
        right: 88px;
        bottom: 55px;
        opacity: 1;
        z-index: 9998;
        font-size: 16px;
        color: black;
    }
    
    #progress-text {
        position: fixed; /* Changed from absolute to fixed */
        transform: translate(-50%, 0);
        right: 41px;
        bottom: 37px;
        opacity: 1;
        z-index: 9999;
        font-size: 16px;
        color: black;
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
    }
    
    .floating-ball {
        position: fixed;
        z-index: 999;
        right: 40px;
        bottom: 40px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        /* 不可复制，不可拖动图片 */
        user-select: none;
        /* overflow: hidden; */
    }

    .content-container {
        position: relative;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .progress-ring {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .info-content {
        margin-right: 13px;
    }

    .progress-ring__circle {
        transition: stroke-dashoffset 4s linear;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
    }

    @keyframes fillProgress {
        from {
            stroke-dashoffset: 193.20794819577225; /* Full circumference */
        }
        to {
            stroke-dashoffset: 0;
        }
    }

    #xfc-logo {
        position: relative;
        top: 1px;
        width: 35px;
        height: 35px;
        /* border-radius: 50%; */
    }

    .info-box {
        position: fixed;
        right: 75px;
        bottom: 80px;
        width: 260px;
        /* height: 250px; */
        border-radius: 10px;
        box-shadow: 0 0px 15px rgba(0, 0, 0, 0.08);
        background-color: #fff;
        padding: 20px;
        display: none;
        opacity: 0; /* 初始透明度 */
        transition: opacity 0.09s ease-in-out; /* 渐变效果 */
        font-size: 15px;
        z-index: 998;
    }


    .close-btn {
        position: absolute;
        top: 10px;
        right: 14px;
        cursor: pointer;
        font-size: 20px;
        user-select: none;
        color: #333;
    }

    .alert-dot {
        position: absolute;
        z-index: 1000;
        top: 5px;
        right: 56px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: rgb(240, 0, 0);
        display: none;
        opacity: 0;
    }

    .alert-number {
        position: absolute;
        z-index: 1000;
        top: 5px;
        right: 56px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: rgb(240, 0, 0);
        color: #fff;
        font-size: 11px;
        display: none;
        opacity: 0;
    }
    .number-span {
        position: relative;
        top: 1px;
        left: 4px;
    }
    `
    styleElement.type = 'text/css';

    if (styleElement.styleSheet){
      styleElement.styleSheet.cssText = manCss;
    } else {
      styleElement.appendChild(document.createTextNode(manCss));
    }
    
    // 将<style>元素添加到<head>标签中
    document.head.appendChild(styleElement);

    var pop_component = document.createElement('div');
    pop_component.innerHTML = mainHtml;
    document.body.appendChild(pop_component);
    
}


function addSubmitLinkBtn(assignmentId,redotimes){
    return;//关闭25.2.12
    try{
        let mHtml = `<button sync-click="$ctrl.clickFun()" ng-disabled="$ctrl.isDisabled" ng-class="[$ctrl.styles.cancel,$ctrl.styles[$ctrl.isDisabled?'disabled':'']]" style="height:30px;margin-left: 10px;" title="加入链接" class="ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB" id="gcalc_addLink">
        <img ng-if="$ctrl.src" ng-class="$ctrl.styles.img" ng-src="//cdn.schoolis.cn/sis/release/student/fe_stu/fe_build/images/iconUpload.e12a6658cac5bd82cf3279f0edd086da.png" class="ng-scope fe-components-xb-rest-btn-__img--lETa8z2YkhgS2-Jzh69Al" 
        src="${chrome.runtime.getURL("icon.png")}"style="width: 19px;"> 加入链接
        </button>`
    
        document.querySelector("xb-rest-btn.ng-scope.ng-isolate-scope button img.ng-scope.fe-components-xb-rest-btn-__img--lETa8z2YkhgS2-Jzh69Al").parentElement.parentElement.insertAdjacentHTML('beforeend', mHtml);
        document.getElementById("gcalc_addLink").onclick = function() {
            let link = prompt("【提交后将覆盖原有内容】\n老师端点击后将直接跳转\n请输入一个链接 (如：Canva共享链接):");
            if(!link.includes("http")) link = "http://" + link;
            if(link.length>3){
                let cont = prompt("输入补充说明(对应平台[内容]一栏)(可留空):");
                sendSeccesstip("任务已提交！");
                let sdata={link:link,id:assignmentId,cont:cont};
                send_comp_msg("submitLinkAssign",sdata,"1");
                if(window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list/detail"){
                    document.getElementsByClassName("ng-binding ng-scope fe-components-xb-location-__router--nsd2ZgXX2cpKLO-r5y7lv")[0].click();
                }
            }else{
                sendAlerttip("[操作已取消] 链接过短");
            }
            
        }
    }catch(e){
        if(redotimes<10){
            setTimeout(() => {
                addSubmitLinkBtn(assignmentId,redotimes+1);
            }, 10+redotimes*5);
        }else{
            return;
        }
    }
}




function addTeamsAssignmentsBigBtn() {
    const parent = document.getElementsByClassName("fe-components-stu-app-task-list-__listItemBox--3elHWcZSeppt-hG2vNGaZz")[0];
    const bigBtn = document.createElement('span');
    bigBtn.innerHTML = `
        <div ng-class="styles.listItem" ng-repeat="item in $ctrl.fancyList" class="ng-scope fe-components-stu-app-task-list-__listItem--2LlZEXXtXjZzVCV4Ai9B6y">
			<task-list-item item-data="item" ng-click="$ctrl.action({urlRoute:'task.list.detail',taskID:item.taskId})" class="ng-isolate-scope"><div ng-class="[styles.item,isCN?'':styles.ENWord,itemData.itemID%4==0?styles.lastRight:'']" class="fe-components-stu-business-task-list-item-__item--M9uMyMIr3DamhKqgJxoqB fe-components-stu-business-task-list-item-__ENWord--3GngC7Z1JiIxFPkUjdb5qC">
	<div ng-class="styles.itemInner" class="fe-components-stu-business-task-list-item-__itemInner--3rHeqUplcuFbdElt1R0e_D">
		<div ng-class="styles.itemBox" class="fe-components-stu-business-task-list-item-__itemBox--3RO3Z0Qh77tpGykURW0nbs">
			<p ng-class="styles.title" xb-title="C3-exercises on data representation" class="ng-isolate-scope fe-components-stu-business-task-list-item-__title--2SiMfuAKOLyjFeTLGHhWkv"><ng-transclude>Teams Assignments</ng-transclude>
<!-- 多行文本可以用</br>进行换行 -->
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">C3-exercises on data representation</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.subject" xb-title="A Level Math | Classwork or Homework" class="ng-isolate-scope fe-components-stu-business-task-list-item-__subject--3Ilm4uS0OvpOX4YfAp0RyP"><ng-transclude><!-- ngIf: itemData.scoreType==1 --><span ng-if="itemData.scoreType==1" class="ng-binding ng-scope">Account: peter.li_27@tsinglan.org</span><!-- end ngIf: itemData.scoreType==1 -->
			</ng-transclude>
<!-- 多行文本可以用</br>进行换行 -->
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">A Level Math | Classwork or Homework</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.lineTime" class="ng-binding fe-components-stu-business-task-list-item-__lineTime--24Dzb2sTLB_PtFbti-_-0M">Unread Assignmets:</p>
		</div>
		<!-- ngIf: itemData.mode==0 --><div ng-if="itemData.mode==0" ng-class="styles.itemBottomBox" class="ng-scope fe-components-stu-business-task-list-item-__itemBottomBox--3KkNAr3IemPu4sYmM_w9uB">
			<!-- ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.UnSubmitted) && !itemData.isSynchroToMobiled --><div ng-if="!itemData.isCanContinueAnswer &amp;&amp; !itemData.isExempt &amp;&amp; (itemData.learningTaskState === StuTaskStates.UnSubmitted) &amp;&amp; !itemData.isSynchroToMobiled" ng-class="[styles.button,styles.startBtn]" class="ng-binding ng-scope fe-components-stu-business-task-list-item-__button--2LXhzjSSbQ4M7G3SvxBx7Y fe-components-stu-business-task-list-item-__startBtn--3ajgZgE1tFqsNNtfncmyd3">
				Read
			</div><!-- end ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.UnSubmitted) && !itemData.isSynchroToMobiled -->
			<!-- ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.Submitted) && !itemData.isSynchroToMobiled -->
			<!-- 新增可继续作答-->
			<!-- ngIf: itemData.isCanContinueAnswer && !itemData.isExempt -->
			<!-- ngIf: (itemData.learningTaskState === StuTaskStates.Corrected) || itemData.isSynchroToMobiled -->
		</div><!-- end ngIf: itemData.mode==0 -->
		<!-- ngIf: !itemData.isExempt && itemData.mode==1 -->
		<!-- ngIf: !itemData.isExempt --><div ng-if="!itemData.isExempt" ng-class="[styles.cornerMark, color]" class="ng-scope fe-components-stu-business-task-list-item-__cornerMark--1fyBZpOtSoxGFA1AKaUlT7 fe-components-stu-business-task-list-item-__cornerMarkGreay--3LLSEs43g4PG2VwGgsXUSp">
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==0 --><span ng-if="itemData.learningTaskState === StuTaskStates.UnSubmitted&amp;&amp;itemData.mode==0" ng-class="isCN?'':styles.unSubmitted" class="ng-binding ng-scope fe-components-stu-business-task-list-item-__unSubmitted--141PEr1y5131N0Sod_pXB3">Unsubmitted</span><!-- end ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==0 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==1 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Submitted&&itemData.mode==0 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Submitted&&itemData.mode==1 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Corrected -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Correcting -->
		</div><!-- end ngIf: !itemData.isExempt -->
		<!-- <div ng-if="itemData.isExempt" ng-class="[styles.cornerMark, color]">
			<span ng-class="isCN?'':styles.corrected">{{$ctrl.exemptText}}</span>
		</div> -->
	</div>
</div>
</task-list-item>
		</div>
    `;
    bigBtn.style.display = 'inline-block';

    if (parent.children.length > 0) {
        parent.insertBefore(bigBtn, parent.children[0]);
    } else {
        parent.appendChild(bigBtn);
    }
}

function insertTeamsLogoLink() {
    if(document.getElementById("gcalcTeamsPageBtn")!=null){
        return;
    }

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', 'javascript:void(0)');
    linkElement.setAttribute('ng-click', '$ctrl.goThisPage($ctrl.totalPages)');
    linkElement.setAttribute('ng-class', '{true:$ctrl.styles.active,false:$ctrl.styles.item}[$ctrl.currentPage == $ctrl.totalPages]');
    linkElement.setAttribute('ng-if', '$ctrl.totalPages == 1 ? false : true');
    linkElement.className = 'ng-binding ng-scope fe-components-xb-pagination-__item--2TJMqEWoq3wUhD7RGTCUPA';
    linkElement.id = 'gcalcTeamsPageBtn'

    // 创建 <img> 元素
    const imgElement = document.createElement('img');
    imgElement.setAttribute('src', 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/Icon-Teams-28x281?resMode=sharp2&op_usm=1.5,0.65,15,0&qlt=100');
    imgElement.setAttribute('alt', 'Teams Logo');
    imgElement.style.marginTop = '5px';
    imgElement.style.width = '20px';
    imgElement.style.height = '20px';

    // 创建 <span> 元素
    const spanElement = document.createElement('span');
    spanElement.style.marginLeft = '5px';
    spanElement.style.position = 'relative';
    spanElement.style.top = '-3.8px';
    spanElement.style.paddingRight = '1px';
    spanElement.textContent = 'Teams任务'; // 设置文本内容

    // 将 <img> 和 <span> 添加到 <a> 中
    linkElement.appendChild(imgElement);
    linkElement.appendChild(spanElement);

    const parentElement = document.querySelector('.fe-components-xb-pagination-__pageBox--3F71ymrSYtbCMwqmq90a4P');
    if (parentElement && parentElement.firstChild) {
        parentElement.insertBefore(linkElement, parentElement.firstChild); // 插入到第一个 child 前
        document.getElementById("gcalcTeamsPageBtn").addEventListener('click', function() {
            showDiyScoresBox("1", "11", "11","1",null);
        });
    }

    
}

function showTeamsAssignmentsBox(){

}



function showFetchedAssignmentData_toPage(score,redotimes){
    //console.log("AppendHidden",score)
    try {
            boxHtml = `<div ng-if="taskDetailInfo.mode==0" class="ng-scope">
        <!-- 成绩信息 -->
        <div id="middleItem" style="opacity: 1;" ng-class="styles.scoreInfo" ng-show="taskDetailInfo.isSynchroToMobiled" class="fe-components-stu-app-task-detail-__scoreInfo--34-hc2syVrNGe_yeBKsnL0">
            <div ng-class="[styles.middleItem,styles.allItem]" class="fe-components-stu-app-task-detail-__middleItem--1DW5FAgpA9y2Sgz8UxIRt8 fe-components-stu-app-task-detail-__allItem--a5TghcQ70cF8KuTHc_wWG">
                <p ng-class="styles.itemTitle" class="ng-binding fe-components-stu-app-task-detail-__itemTitle--3aPG2yQzSZqW_YgP0JC9bO">任务成绩</p>
                
                <!-- ngIf: taskDetailInfo.scoreType==1 --><div style="text-align: center" ng-if="taskDetailInfo.scoreType==1" class="ng-scope">
                    <div ng-class="[styles.itemScore,taskDetailInfo.score!==null?'':styles.itemScoreNone]" class="ng-binding fe-components-stu-app-task-detail-__itemScore--1nuolF1pAilxxSB6o8b2Rx" style="text-shadow: rgb(187, 255, 187) 0px 0px 10px;">
                        ${score>-1?score:""}
                    </div>
                    <div ng-class="styles.itemClassInfo" class="fe-components-stu-app-task-detail-__itemClassInfo--2Ist05O25K5lXA-9nAmiDO">
                        <!-- ngIf: taskDetailInfo.displayClassAvgScore -->
                        <!-- ngIf: taskDetailInfo.displayClassMaxScore -->
                    <img src="${chrome.runtime.getURL("res/icon.png")}" id="gcalc2ScoresIcon" alt="Ico" style="vertical-align: middle; margin-right: 5px; height: 24px;"><p ng-class="styles.itemClassInfoShow" ng-if="taskDetailInfo.displayClassAvgScore" class="ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP">${score>-1?tlang("&nbsp;&nbsp;Giaoculator 已获取分数","&nbsp;&nbsp;Score Fetched from Server"):tlang("&nbsp;&nbsp;校宝系统暂无该项目数据","&nbsp;&nbsp;No Aviliable Data")}</p></div>
                </div><!-- end ngIf: taskDetailInfo.scoreType==1 -->
                <!-- 手动等级 -->
                <!-- ngIf: taskDetailInfo.scoreType==2 -->
            </div>
        </div>
        <!-- 教师点评 -->
        <!-- ngIf: taskDetailInfo.comment||(teacherCommentDocuments1.length !=0||teacherCommentDocuments2.length != 0) -->
    </div>`;
    document.getElementsByClassName("fe-components-stu-app-task-detail-__scoreInfo--34-hc2syVrNGe_yeBKsnL0")[0].parentElement.innerHTML = boxHtml;
    } catch (error) {
        setTimeout(() => {
            if(redotimes<10){
                showFetchedAssignmentData_toPage(score,redotimes+1);
            }
            
        }, redotimes*20);
    }
   }

function observeUrlChange(callbacks) {
    let currentUrl = window.location.href;
    const checkUrl = () => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            Object.entries(callbacks).forEach(([url, func]) => {
                if (newUrl.includes(url)) func();
            });
        }
    };
    const observer = new MutationObserver(checkUrl);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", checkUrl);
    ["pushState", "replaceState"].forEach(type => {
        const original = history[type];
        history[type] = function (...args) {
            original.apply(this, args);
            checkUrl();
        };
    });
    checkUrl();
}

function scoreToLevel(score) {
    const scoreMappingConfigs = [
        { displayName: "A+", minValue: 97, maxValue: 9999.9, isContainMin: true, isContainMax: true },
        { displayName: "A", minValue: 93, maxValue: 96.9999, isContainMin: true, isContainMax: true },
        { displayName: "A-", minValue: 90, maxValue: 92.9999, isContainMin: true, isContainMax: true },
        { displayName: "B+", minValue: 87, maxValue: 89.9999, isContainMin: true, isContainMax: true },
        { displayName: "B", minValue: 83, maxValue: 86.9999, isContainMin: true, isContainMax: true },
        { displayName: "B-", minValue: 80, maxValue: 82.9999, isContainMin: true, isContainMax: true },
        { displayName: "C+", minValue: 77, maxValue: 79.9999, isContainMin: true, isContainMax: true },
        { displayName: "C", minValue: 73, maxValue: 76.9999, isContainMin: true, isContainMax: true },
        { displayName: "C-", minValue: 70, maxValue: 72.9999, isContainMin: true, isContainMax: true },
        { displayName: "D+", minValue: 67, maxValue: 69.9999, isContainMin: true, isContainMax: true },
        { displayName: "D", minValue: 63, maxValue: 66.9999, isContainMin: true, isContainMax: true },
        { displayName: "D-", minValue: 60, maxValue: 62.9999, isContainMin: true, isContainMax: true },
        { displayName: "F", minValue: 0, maxValue: 59.9999, isContainMin: true, isContainMax: true }
    ];

    const numericScore = Number(score);
    
    for (const config of scoreMappingConfigs) {
        const { minValue, maxValue, isContainMin, isContainMax, displayName } = config;
        const lowerBound = isContainMin ? (numericScore >= minValue) : (numericScore > minValue);
        const upperBound = isContainMax ? (numericScore <= maxValue) : (numericScore < maxValue);
        
        if (lowerBound && upperBound) {
            return displayName;
        }
    }
    
    return ""; //Nan
}

function showGPABox_BuildItem(subjectName,subjectWeight,gpa,noweight_gpa,btn){
    let mainHtml = `<li ng-repeat="items in $ctrl.evaluationProjectList" class="ng-scope">
						<ul ng-class="commonStyles.clearFix" ng-click="toggleChildItem($index)" class="fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB">
							<li ng-class="[styles.scoreListItemLabel, styles.scoreListItemScoreWeight]" class="ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel--IDO2v_3UsPFqDDV9iQ2ml">
								${subjectName}
							</li>
							<li ng-class="[styles.scoreListItemWeight, styles.scoreListItemScoreWeight]" class="ng-binding fe-components-stu-app-realtime-list-__scoreListItemWeight--285HojRL7boCDLSqVG3jB-">
								${subjectWeight}
							</li>
							<li ng-class="[styles.scoreListItemScore, styles.scoreListItemScoreWeight]" class="fe-components-stu-app-realtime-list-__scoreListItemScore--1SnqOFUX5PHAR3L-RwXhkl">
								<span class="ng-binding">${gpa} / ${noweight_gpa}</span>
								<!-- ngIf: items.evaluationProjectList.length>0 && items.showChild -->
								<!-- ngIf: items.evaluationProjectList.length>0 && !items.showChild -->
								<!-- ngIf: items.evaluationProjectList.length==0&&items.learningTaskAndExamList.length --><a ng-click="$ctrl.checkProjectDetail(items)" ng-if="items.evaluationProjectList.length==0&amp;&amp;items.learningTaskAndExamList.length" ng-class="styles.projectDetail" class="ng-binding ng-scope fe-components-stu-app-realtime-list-__projectDetail--2eGVWnK9x_7T4bfK5HFNf2">${btn}</a><!-- end ngIf: items.evaluationProjectList.length==0&&items.learningTaskAndExamList.length -->
							</li>
						</ul>
						<!-- ngRepeat: ele in items.evaluationProjectList -->
					</li>`
    return mainHtml;
}

async function checktitleElementExistence() {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            resolve(false); // 5秒超时，仍然放行，但返回 false 表示超时
        }, 5000); // 5秒超时

        const intervalId = setInterval(() => {
            let element = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0];
            if (element && element.innerText) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                resolve(true); // 找到了元素，立即放行并返回 true
            }
        }, 10); // 每 100 毫秒检查一次
    });
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function showGPABox(){
    await checktitleElementExistence();
        
    const smsId = await getIdBySemester(document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    chrome.storage.local.get("gpaList"+smsId,function(tmp){
        let gpaList = tmp["gpaList"+smsId];
        console.log(gpaList);
        chrome.storage.local.get("gpa"+smsId,function(data){
            console.log(data);
            let gpa = formatNumber(data["gpa"+smsId].gpa,2);
            let noweight_gpa = formatNumber(data["gpa"+smsId].noweight_gpa,2);
            let schoolis_gpa = data["gpa"+smsId].schoolisGPA;
            
            

            document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText=tlang("GPA计算详细","GPA Calculation Details");
            document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].innerText=document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value;
            document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].style.paddingBottom="30px";


            document.getElementsByClassName("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[0].children[0].innerText=tlang("学科","Subject");
            document.getElementsByClassName("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[0].children[2].innerText=tlang("GPA / 未加权GPA","GPA / Unweighted GPA");
            let sublineA = document.getElementsByClassName("fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei")[0];
            let sublineB = document.getElementsByClassName("fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei")[1];
            let bigScore = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__score--1e6GrTtGfRHkKF-12OE_J3")[0];

            bigScore.innerText=schoolis_gpa?schoolis_gpa:gpa;
            bigScore.style.marginTop="-12px";

            let bigScoreSubtitle = `<p ng-class="styles.basicInfoItem" class="fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei">
						<span class="ng-binding"> </span><span ng-class="styles.basicInfoItemValue" id="gcalc_gpaSubtitle" class="ng-binding fe-components-stu-app-realtime-list-__basicInfoItemValue--3Zx2X_CcFbD3XBxLp_NeFt" style="display: block; text-align: center;">${schoolis_gpa?tlang("加权后GPA（校宝）","WeightedGPA"):tlang("加权后GPA（计算）","WeightedGPA(Calced)")}</span>
					</p>`;

            bigScore.insertAdjacentHTML('afterend', bigScoreSubtitle);

            if(schoolis_gpa){
                sublineA.children[0].innerText=" ";
                sublineB.children[0].innerText=" ";
                sublineA.children[1].innerText=tlang("加权后GPA（计算）：","Calced GPA：")+gpa;
                sublineB.children[1].innerText=tlang("未加权GPA（计算）：","Calced Unweighted GPA：")+noweight_gpa;
            }else{
                sublineA.children[0].innerText=" ";
                sublineB.children[1].innerText=" ";
                sublineA.children[1].innerText=tlang("未加权GPA（计算）：","Calced Unweighted GPA：")+noweight_gpa;
                sublineB.children[0].innerText=tlang("加权后GPA（校宝系统）：无数据","SchoolisGPA：No Data");
            }


            const originalItem = document.getElementsByClassName("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[1];
            if (originalItem) {
                while (originalItem.firstChild) {
                    originalItem.removeChild(originalItem.firstChild);
                }
            }

            gpaList.sort((a, b) => {
                if (a.weight !== b.weight) {
                    return a.weight - b.weight;
                }
                if (b.gpa !== a.gpa) {
                    return b.gpa - a.gpa;
                }
                return a.subjectName.localeCompare(b.subjectName); 
            });
            
            
            gpaList.forEach((item) => {
                if(item.gpa!=-1){
                    originalItem.insertAdjacentHTML('beforeend', showGPABox_BuildItem(
                        item.subjectName,
                        formatNumber(item.weight, 1),
                        formatNumber(item.gpa, 2),
                        formatNumber((item.gpa > 0 ? (item.gpa - (item.isWeighted ? 0.5 : 0)) : (item.gpa)), 2),
                        tlang("", "")
                    ));
                }
                
            });
        
        
        
            //e.g: subline.children[0].innertext  (0:Grey,1:Black)
        });
    });
   

}

function readAndCombineLongStringFromChromeStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => { // 获取所有存储的数据
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
  
        let longString = "";
        for (let i = 0; ; i++) {
          const chunkKey = `${key}_${i}`;
          const chunk = items[chunkKey];
          if (chunk === undefined) {
            break; // 所有分段都已读取完毕
          }
          longString += chunk;
        }
  
        resolve(longString);
      });
    });
  }

function formatNumber(number, decimalPlaces) {
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}