console.log("Giaoculator is Running");

// TODO: I dont think we need to do that :D ——Peter
// TODO: 悬浮窗更新

diyHomepage();

// ================== 悬浮窗 ===================
// 这个是添加悬浮窗代码的入口，负责给网页添加悬浮窗的HTML和CSS代码。
// 如果不需要只需要在这里不添加即可，但是可能下面的dom操作会报错（就是document.xxx的那些）
POP_addPopComponent(); 

// totalUpdate是很重要的，他负责了进度条的总更新次数
// 比如有4个学期，这里就填写4。每一次使用进度条的地方都需要设置这个值和清零currentUpdate
let totalUpdates = 1;
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
const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
const maxOffset = circumference;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = maxOffset;

// 更新进度的函数，每次调用会+1，可以写到后端发消息的地方或者啥的。
function upgradeProgress() {    
    if (currentUpdate < totalUpdates) {
        currentUpdate++;

        let newOffset = maxOffset - (currentUpdate / totalUpdates) * circumference;

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
function resetRing(isFinal){
    // 获取旧的图标元素和环形进度条
    var logo = document.getElementById('xfc-logo');
    var circle = document.querySelector('.progress-ring__circle');

    // 修改图标图片并添加渐变动画
    logo.style.transition = isFinal? 'opacity 0.4s ease-out':'opacity 0.3s ease-out';
    logo.style.opacity = '0';
    setTimeout(function() {
        logo.src = chrome.runtime.getURL("res/green-tick.png");
        logo.style.opacity = '1';
        setTimeout(function() {
            logo.style.transition = isFinal? 'opacity 0.5s ease-in':'opacity 0.2s ease-in';
            logo.style.opacity = '0';
            if(isFinal){
                try {
                    document.getElementById("progress-text").style.transition = 'opacity 0.4s ease-out';
                    document.getElementById("progress-text").style.opacity = '0';
                    document.getElementById("progress-text-shadow").style.transition = 'opacity 0.4s ease-out';
                    document.getElementById("progress-text-shadow").style.opacity = '0';
                    setTimeout(() => {
                        document.getElementById("progress-text").remove();
                        document.getElementById("progress-text-shadow").remove();
                        return;
                    }, 500);
                } catch (e) {}
                
            }

        }, 900+isFinal*300);
    }, 350); // 等待旧图标淡出后再显示新图标

    
    setTimeout(function() {
        logo.src = chrome.runtime.getURL("icon.png");
        logo.style.opacity = '1';
        setTimeout(() => {
            logo.style.transition = '';
        }, 600);
    }, 1600+isFinal*400); 

    // 环形进度条动画调整
    circle.style.transition = 'stroke-dashoffset 0.5s ease-out, stroke-width 0.5s ease-out';
    //circle.style.strokeDashoffset = circle.getAttribute('r') * Math.PI * 2; // 重置进度条到完整状态
    circle.style.strokeWidth = '0'; // 使圆环向外圈变细并消失
    // 重置圆环的边框宽度以便下一次使用
    setTimeout(function() {
        currentUpdate=0;
        circle.style.strokeDashoffset = circle.getAttribute('r') * Math.PI * 2;
        setTimeout(function() {
            circle.style.strokeWidth = '6'; // 将strokeWidth重置为原始宽度
        }, 500);
    }, 500);
    

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

// 点击叉叉关闭信息框
closeBtn.addEventListener('click', () => {
    hideInfoBox();
});

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
floatingBall.addEventListener('click', () => {
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
    }, 210);
    

    return;//先暂时关闭信息框功能，改为隐藏悬浮球
    if (processingBox) return;
    if (isInfoBoxOpen) {
        hideInfoBox();
    } else {
        showInfoBox();
        hideDot();

    }
});

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

    // 尝试结合两个版本的功能：使用chrome.storage.local来检查enable_state，并保留disable_autologin逻辑。
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
            } else if (type == "bp-logpageState"){
                //换位置
            } else if (type == "calcErrorStop"){
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
            } else if (type == "show_process"){
                addCalcState(data,0);
                console.log("REC:Showproges")
                // MB_insertEditedDiv();
            } else if (type == "show_smsCalc_progress"){
                addSmsCalcState(data);
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

function updateContent() {
    console.log("RUNNING updateContent")

    try {
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
    } catch (error) {}
    setTimeout(() => {
        const targetElement = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI');
        if (targetElement) { 
            for (cnt=0;cnt<targetElement.length;cnt++){
                target = targetElement[cnt];
                // BUG: 如果使用了搜索功能，重新回来这个不会生效
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
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 190%;" />';
            scoreInfoElement.remove();
        }else{
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="position: relative; left: -13px;width: 70%;" />';//初中部样式
        }
     }
    }
  }
}

function hideAssignments(settingData) {
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


function updateContent_DetailPage() {
    console.log("RUNNING updateDP")

    const targetElement = document.getElementsByClassName('fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei');
    if (targetElement) { 
        for (cnt=0;cnt<targetElement.length;cnt++){
            target = targetElement[cnt];
            if(target.innerText=="首次公布时间：1970-01-01 08:00"){
                target.innerText="由Giaoculator计算"
            }
            if(target.innerText=="First Publish Time：1970-01-01 08:00"){
                target.innerText="By Giaoculator"
            }
        }
    } 
    engPage_opti(0);
    setTimeout(engPage_opti(0), 30);
}

function engPage_opti(redotimes){
    if(redotimes>30){
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
            setTimeout(engPage_opti(redotimes+1), 100);
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
            setTimeout(engPage_opti(redotimes+1), 100);
            return false;
        }
    }, 120);
}



document.onkeydown = function(e) {
    const target = e.target;
    const tagName = target.tagName.toUpperCase();
    const isEditable = target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA';

    if(e.key === 'Enter' ){
        simulateClickLogin();
    } 

    if (isEditable) {
        console.log("Typing..")
        Ntw_SimclickDisclamer();
        
        return;
    }
    var currentWindow = window.location.href;

    if(e.key === 'Backspace' ){
        hidestudentInfo();
        
    } 
    if(e.key === 'Escape'){
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
                    hideAssignments(data.cont);
                }
            });//该实现方式有待优化，可考虑在检测为false时continue
        }, i * 2);
    }
    for (let i = 0; i <= times; i++) {
        setTimeout(() => {  
            chrome.storage.local.get('enable_state', function(result) {
                if(result.enable_state){
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
}function diyHomepage(){
    chrome.storage.local.get('user_preference', function(result) {
        showStateAtLoginPage();
        var sourcedata = result.user_preference;
        if(result.user_preference.advLogPage){
            setTimeout(() => {
                beautyLoginPage(sourcedata,0);
            }, 1);
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
    setTimeout(() => {
        var element = document.getElementsByClassName("ng-binding ng-scope fe-components-stu-app-realtime-list-__gpaContentScore--1OjJB7QN_hSoa3zcyHgfmN")[0];
        if (element) {
            element.addEventListener('click', function(event) {
                sendInfotip(tlang("计算的GPA仅供参考，可能存在误差<br><br>详见：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>GPA计算说明</a>","The calculated GPA is for reference only and may contain errors.<br><br>For details, see：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>Description</a>"))
            });
        }
    }, 100);
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
    

    try {
        if(loginPageSrc.includes("<local/jpg-1>")){
            loginPageSrc = chrome.runtime.getURL("usr/1.jpg"); 
        }
        if(loginPageSrc.includes("<local/png-1>")){
            loginPageSrc = chrome.runtime.getURL("usr/1.png"); 
        }
        if(loginPageSrc.includes("<local/mp4-1>")){
            loginPageSrc = chrome.runtime.getURL("usr/1.mp4"); 
        }
        if(loginPageSrc.includes("<local/mov-1>")){
            loginPageSrc = chrome.runtime.getURL("usr/1.mov"); 
        }
        if(loginPageSrc.includes("<local/jpg-2>")){
            loginPageSrc = chrome.runtime.getURL("usr/2.jpg"); 
        }
        if(loginPageSrc.includes("<local/png-2>")){
            loginPageSrc = chrome.runtime.getURL("usr/2.png"); 
        }
        if(loginPageSrc.includes("<local/mp4-2>")){
            loginPageSrc = chrome.runtime.getURL("usr/2.mp4"); 
        }
        if(loginPageSrc.includes("<local/mov-2>")){
            loginPageSrc = chrome.runtime.getURL("usr/2.mov"); 
        }
    }catch (error) {}

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
        if(loginPageSrc.length<2 || loginPageSrc =="<default>"){
            loginPageSrc = "https://wallpapercave.com/wp/wp4469554.jpg";
        }
        var enterBoxs = document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ ");
        document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundSize = "cover";
        document.getElementsByClassName("fe-components-stu-business-login-enter-box-__schoolBackground--2S3KJugj_l_m7T5hRdY_cv")[0].remove();
        enterBoxs[0].style.borderRadius='10px'
        enterBoxs[0].style.backdropFilter="blur(10px)"
        enterBoxs[0].style.background=colormode? "rgba(255, 255, 255, .01)" : "rgba(088, 080, 082, .065)"
        enterBoxs[1].style.borderRadius='10px'
        enterBoxs[1].style.backdropFilter="blur(10px)"
        enterBoxs[1].style.background=colormode? "rgba(255, 255, 255, .01)" : "rgba(088, 080, 082, .065)"
        document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__signBtn--2VrsqhNGgcjYTh7LuAGzve")[0].style.borderRadius='10px'
        //document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__signBtn--2VrsqhNGgcjYTh7LuAGzve")[0].style.background='rgba(91,138,249,0.5)'
        document.getElementsByClassName('ng-scope fe-components-stu-business-login-enter-box-__headMain--7bzuRu-Sq5O2sOCFgPNQH')[0].children[0].style.maxHeight="95px"
        document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop = "40px"
        document.getElementsByClassName("fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_")[0].style.paddingTop = "52px"
        document.querySelector(".fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_").style.backdropFilter="blur(10px)"
        document.querySelector(".fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_").style.background=colormode? "rgba(255, 255, 255, .7)" : "rgba(038, 040, 042, .065)"
        if(loginPageSrc.includes(".jpg")||loginPageSrc.includes(".heic")||loginPageSrc.includes("image")||loginPageSrc.includes(".jpeg")||loginPageSrc.includes(".png")||loginPageSrc.includes(".webp")||loginPageSrc.includes(".svg")||loginPageSrc.includes("tiff")||loginPageSrc.includes("bmp")||loginPageSrc.includes("gif")){
            document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundImage = "url("+loginPageSrc+")";
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
            }, redotimes<6 ? 1 : redotimes);
        }
    }
    try {
        if(!colormode){
            document.getElementsByClassName("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
            document.getElementsByClassName("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
        }
    } catch (error) {
        
    }
    
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
            addBtnforshowDisScoresBox(data.smsId,data.subjectId,className,GBModel);
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
    console.log(redotimes);
    try {
        // 颜色设置
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
        let avgS=data.avgS;
        let iconModel = "<img src="+chrome.runtime.getURL("res/icon.png")+" id='gcalc2ScoresIcon' alt='Ico' style='vertical-align: middle; margin-right: 5px; height: 24px;'>"
        let maxScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+tlang("班级最高成绩:","Class Highest:")+maxS+"</p>"
        let avgScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+tlang("班级平均成绩:","Class Average:")+avgS+"</p>"
        let tempDiv = document.createElement('div'); // 创建一个临时的div元素

        tempDiv.innerHTML = iconModel;
        elementToAppend = tempDiv.firstChild; 
        targetElement.appendChild(elementToAppend);

        tempDiv.innerHTML = avgScoreModel;
        elementToAppend = tempDiv.firstChild; 
        targetElement.appendChild(elementToAppend);
        
        tempDiv.innerHTML = maxScoreModel;
        elementToAppend = tempDiv.firstChild; 
        targetElement.appendChild(elementToAppend);
        setTimeout(() => {
            if(!document.getElementById("gcalc2ScoresIcon")){
                appendAvgMaxScoresInPage(data,redotimes+1)
            }   
        }, 200);
        
        
    } catch (error) {
        setTimeout(() => {
            if(redotimes<10){
                appendAvgMaxScoresInPage(data,redotimes+1)
            }
            
        }, redotimes*20);
    }
    
}
function addBtnforshowDisScoresBox(smsid,subjectid,subjectname,model){
    let tmpBtn = `<p id="gcalc_clicktoshowDiyBox" style="font-size: 13px; display: inline-block; padding: 0px 11px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">任务自定义</p>`;
    document.getElementById("gcalc_gpacntstate").children[0].children[0].children[0].style = "font-size:13px;position: relative;top: 1px;";
    document.getElementById("gcalc_diyboxbtn").insertAdjacentHTML('beforeend', tmpBtn);

    document.getElementById("gcalc_clicktoshowDiyBox").addEventListener('click', function() {
        getUsrAssignmentInfoBeforeshowDiyBox(smsid,subjectid,subjectname,model);
    });
}

function getUsrAssignmentInfoBeforeshowDiyBox(smsid, subjectid,subjectName,model){
    let data={
        smsId:smsid,
        subjectId:subjectid,
        subjectName:subjectName,
        model:model
    }
    console.log("SendMSG:",data);
    send_comp_msg("gb_getSavedData",data,0);
}


function showDiyScoresBox(smsId,subjectId,subjectName,model,existList){
    console.log(existList,"sdad");
    let tmp_target = document.getElementsByClassName("ng-scope fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5")[0];
    if(!tmp_target){
        console.log("[ShowDiyScoresBox]Target Not Found");
        return;
    }
    selectionList = `
    <option value="Comprehensive Assessments">${tlang("综合性评估","Comprehensive Assessments")}</option>
    <option value="Continuous Assessments">${tlang("连续性评估","Continuous Assessments")}</option>
    <option value="Progressive Assessments">${tlang("渐进式评估","Progressive Assessments")}</option>
    <option value="Final exam">${tlang("期末考试","Final Exam")}</option>
    `
    if(model == 1){
        selectionList = `<option value="Comprehensive Assessments">${tlang("综合性评估","Comprehensive Assessments")}</option>`
    }
    mainHtml = `<div ng-class="styles.xbDialogModal" ng-if="$ctrl.showDialog" class="ng-scope fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5">
	<div ng-class="styles.xbDialogModalBox" style="width:990px"class="fe-components-stu-app-realtime-list-__xbDialogModalBox--1hItMXot7XJyswrPjZ2WjQ">
		<div ng-class="[styles.header, commonStyles.clearFix]" class="fe-components-stu-app-realtime-list-__header--2llDMOt0zjGNFxFvoV5VBp fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB">
			<span ng-class="styles.modelTitle" class="ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i">导入任务</span>
			<span ng-class="styles.closeIcon" ng-click="closeModal()" class="fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv"></span>
		</div>
		<div id="gb-body" ng-class="styles.body" class="fe-components-stu-app-realtime-list-__body--KTwHV_4KFA0kqa0udu2GW">
            <br><br>
            <div style="margin-bottom: 20px;">
            	<p style="font-size: 14px; margin-right: 8px;">学期ID：${smsId}&nbsp&nbsp&nbsp&nbsp科目：${subjectName} </p>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="font-size: 14px; margin-right: 4px;">任务名称:</label>
                <input id="gb_aName" type="text" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; margin-right: 24px;">
                <label style="font-size: 14px; margin-right: 4px;">得分:</label>
                <input id="gb_aScore" type="number" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; width: 60px;margin-right: 24px;">
                <label style="font-size: 14px; margin-right: 4px;">分类:</label>
                <select id="gb_cataSelect" style="padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px;margin-right: 20px;">
                    ${selectionList}
                </select>
                <p id="gb_propDis" style="font-size: 14px; margin-right: 4px;display: inline-block;">占比: -%</p>
                <button id="gb_appendBtn" style="font-size: 12px;background-color: #4CAF50; color: white; padding: 6px 9px; border: none; border-radius: 4px; margin-left: 62px; cursor: pointer;">添加到列表</button>
            </div>
            <div style="margin-bottom: 20px;">
            	<div style="border: 0.2px solid #ccc; border-radius: 4px;width: 100%; margin: 0 auto; overflow-x: hidden; overflow-y: auto;">
                <div style="width: 100%; height: 370px; border: 1px solid #ccc; overflow-y: auto;">
                  <ul id="gb_listbox">
                    
                  </ul>
                </div>
              </div>
            </div>
            <button id="gb_nextStepBtn" style="font-size: 14px;background-color: #4CAF50; color: white; padding: 7px 10px; border: none; border-radius: 4px; position:absolute; bottom:10; right:31px; cursor: pointer;">下一步</button>
		</div>
	</div>
    </div>
    `; //Main Html of the box
    let oriScore = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__score--1e6GrTtGfRHkKF-12OE_J3")[0].innerText;
    tmp_target.innerHTML = mainHtml;
    var listitem_Html = 'H';
    document.getElementsByClassName("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].addEventListener("click", function() {
        closeGcalcBox();
    });
    
    
    const selectElement = document.getElementById("gb_cataSelect");
    const pElement = document.getElementById("gb_propDis");

    
    if(model == 0){
        switch (selectElement.value) {
            case "Comprehensive Assessments":
                pElement.textContent = "占比: 20%";
                break;
            case "Continuous Assessments":
            case "Progressive Assessments":
                pElement.textContent = "占比: 30%";
                break;
            case "Final exam":
                pElement.textContent = "占比: 20%";
                break;
            default:
                pElement.textContent = "占比: 30%";
        }
    }else{
        pElement.textContent = "占比: 100%";
    }

    // 监听 select 元素的 change 事件
    selectElement.addEventListener("change", function() {
        // 根据选中的值设置 p 元素的内容
        if(model == 0){
            switch (selectElement.value) {
                case "Comprehensive Assessments":
                    pElement.textContent = "占比: 20%";
                    break;
                case "Continuous Assessments":
                case "Progressive Assessments":
                    pElement.textContent = "占比: 30%";
                    break;
                case "Final exam":
                    pElement.textContent = "占比: 20%";
                    break;
                default:
                    pElement.textContent = "占比: 30%";
            }
        }else{
            pElement.textContent = "占比: 100%";
        }
        
    });
    var pendingAssignmentList = [];    

    console.log("exl:",existList,existList.length);
    for(let i=0;i<existList.length;i++){
        const paddedAssignmentName = padSpaces(existList[i].name.replace("[G]", ""), 30);
        const paddedAssignmentScore = padSpaces(existList[i].score, 4)+'%';
        const paddedAssignmentCata = padSpaces(existList[i].cataName, 15);
        const paddedAssignmentProp = padSpaces('('+existList[i].proportion, 4)+'%)';
        const itemStr = "&nbsp;" + paddedAssignmentName + "&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;[&ensp;&ensp;" + paddedAssignmentScore + "&emsp;-&emsp;" + paddedAssignmentCata + "&ensp;" + paddedAssignmentProp+"&ensp;&ensp;]";
        listitem_Html = `<div class="added_assignment_showBox" style="display: flex; align-items: center; text-align: center; justify-content: space-between; padding: 10px; background-color: rgba(255,255,255, 0.85); margin-bottom: 3px;margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); cursor: pointer;"><span>${itemStr}</span></div>`;
        document.getElementById("gb_listbox").insertAdjacentHTML('beforeend', listitem_Html);
    }

    document.getElementById("gb_appendBtn").addEventListener("click", function() {
        const assignmentName = document.getElementById("gb_aName").value;
        const assignmentScore = document.getElementById("gb_aScore").value;
        const assignmentCata = document.getElementById("gb_cataSelect").value;
        let assignmentProp=0;
        switch (assignmentCata) {
            case "Comprehensive Assessments":
                assignmentProp = 20;
                break;
            case "Continuous Assessments":
            case "Progressive Assessments":
                assignmentProp = 30;
                break;
            case "Final exam":
                assignmentProp = 20;
                break;
            default:
                assignmentProp = 30;
        }
                               
        let inputInfo = {
            smsId: smsId,
            subjectId: subjectId,
            name: assignmentName,
            percentageScore: assignmentScore,
            cataname: assignmentCata,
            proportion: assignmentProp
        }
        pendingAssignmentList.push(inputInfo);                     
        const paddedAssignmentName = padSpaces(assignmentName, 30);
        const paddedAssignmentScore = padSpaces(assignmentScore, 4)+'%';
        const paddedAssignmentCata = padSpaces(assignmentCata, 15);
        const paddedAssignmentProp = padSpaces('('+assignmentProp, 4)+'%)';
        const itemStr = "&nbsp;" + paddedAssignmentName + "&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;[&ensp;&ensp;" + paddedAssignmentScore + "&emsp;-&emsp;" + paddedAssignmentCata + "&ensp;" + paddedAssignmentProp+"&ensp;&ensp;]";
        listitem_Html = `<div class="added_assignment_showBox" style="display: flex; align-items: center; text-align: center; justify-content: space-between; padding: 10px; background-color: rgba(255,255,255, 0.85); margin-bottom: 3px;margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); cursor: pointer;"><span>${itemStr}</span></div>`;
        document.getElementById("gb_listbox").insertAdjacentHTML('beforeend', listitem_Html);
        console.log(pendingAssignmentList);
    });
    document.getElementById("gb_nextStepBtn").addEventListener("click", function() {
            if(pendingAssignmentList.length==0){
                alert("请添加至少一个作业");
            }else{
                send_comp_msg("gb_addtoUsrList",pendingAssignmentList,oriScore);
                showState2DiyScoresBox(smsId,subjectId,subjectName,oriScore);
            }
    });

}
function padSpaces(str, targetLength) {
    //return str.padEnd(6)
    const paddingLength = Math.max(0, targetLength - str.length);
    return str + "&ensp;".repeat(paddingLength);
}

//addNewUsrAssignment(smsid,subjectid,name, percentageScore,proportion,cataName)

function send_comp_msg(msgtype, data, addData) {
    chrome.runtime.sendMessage({
        type: msgtype,
        data: data,
        additionalData: addData
    });

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
    document.getElementById("gb-body").remove();
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
    totalUpdates = oval;
    if(cur > currentUpdate){
        upgradeProgress();
        currentUpdate = cur;
    }

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
        totalUpdates = oval;
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
            }, 500);
            document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
            return;
        }
        if(cur == oval && cur>=1){
            // targ.innerText = tlang(`计算已完成`,`All Done`)
             if(oval>1) document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
             setTimeout(() => {
               //  targ.remove();
                 resetRing(1);
             }, oval==1? 500:700);
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


const asciiArt = `
   _____ _                        _       _             
  / ____(_)                      | |     | |            
 | |  __ _  __ _  ___   ___ _   _| | __ _| |_ ___  _ __ 
 | | |_ | |/ _\` |/ _ \\ / __| | | | |/ _\` | __/ _ \\| '__|
 | |__| | | (_| | (_) | (__| |_| | | (_| | || (_) | |   
  \\_____|_|\\__,_|\\___/ \\___|\\__,_|_|\\__,_|\\__\\___/|_|   
                                                        
==============================================================
Welcome!
Feel free to report an issue or submit a suggestion:
https://jinshuju.net/f/D5NtDf

Github Homepage: https://github.com/Haoxuan1016/Giaoculator
==============================================================
                                                        `;

// 彩色输出函数
function colorfulConsoleMessage() {
  console.log(asciiArt);
}

// 调用函数显示彩色信息和字符画
setTimeout(() => {
    colorfulConsoleMessage();    
}, 1000);