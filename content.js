console.log("Giaoculator is Running");

console.log("Giaoculator is Running");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // 尝试结合两个版本的功能：使用chrome.storage.local来检查enable_state，并保留disable_autologin逻辑。
    chrome.storage.local.get('enable_state', function(result) {
        if (result.enable_state === true || !result.hasOwnProperty('enable_state')) { // 如果enable_state为true或未设置，则继续。
            var disable_autologin = false;
            let type = message.type
            let data = message.data
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
            } else if (type == "refresh"){
                location.reload();
            } else if (type == "refresh-click"){
                simulateClickRefresh();
            } else if (type == "replace_context"){
                updateContent();
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
            } else if (type == "tip_err"){
                sendErrortip(data.cont);
            } else if (type == "tip_info"){ // 合并tip_info和tip_info_long的处理
                sendInfotip(data.cont);
            } else if (type == "tip_info_long"){ // 合并tip_info和tip_info_long的处理
                sendInfotipLong(data.cont);
            } else if (type == "tip_alert"){
                sendAlerttip(data.cont);
            } else if (type == "rc_infopage"){
                updateContent_DetailPage();
            } else if (type == "rc_hidescore"){
                hideScoresRepeatedly(data,10,1500);
            } else if (type == "rc_hideasm"){
                hideAssignments(data.cont);
                hideAseRepeatedly(data,10,1500);
            }
        }
    });
});


function editPageText(){
    changeBarname(0, " (1)")
    changeBarname(1, " (2)")
    changeBarname(2, " (3)")
    changeBarname(3, " (4)")
}

function updateContent() {
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
}

function hideScores(scorelim) {
  const elements = document.getElementsByClassName('fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU');
  for (let element of elements) {
    const scoreNumElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1');
    if (scoreNumElement) {
      const score = parseFloat(scoreNumElement.innerText);
      if (score < scorelim) {
        scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 190%;" />';

        const scoreInfoElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt');
        if (scoreInfoElement) {
          scoreInfoElement.remove();
        }
      }
    }
  }
}

function hideAssignments(scorelim) {
    const elements = document.getElementsByClassName('ng-scope fe-components-stu-app-task-list-__listItem--2LlZEXXtXjZzVCV4Ai9B6y');
    for (let element of elements) {
        var scoreNumElement = element.querySelector('.fe-components-stu-business-task-list-item-__taskScore--13ruwhA6IFpxEaXteLRQco');
        if (scoreNumElement) {
            var score = parseFloat(scoreNumElement.innerText);
            if(score<=10){
                score=score*10;
            }
            if (score < scorelim) {
                scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disable.png") + '" alt="Disabled" style="width: 70%;padding-top:20px;" />';
        
                const scoreInfoElement = element.querySelector('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt');
                if (scoreInfoElement) {
                    scoreInfoElement.remove();
                }
            }
        }
    }
  }


function updateContent_DetailPage() {
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
    engPage_opti();
}

function engPage_opti(){
    const targetElement2 = document.getElementsByClassName('ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i');    
    if (targetElement2[0]) { 
        target = targetElement2[0];
        if(target.innerText=="Grade Details"){
            target.innerText="Details"
        }
        return true;
    } else {
        setTimeout(engPage_opti, 100);
        return false;
    }
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
        return;
    }

    if(e.key === 'Escape'){
        simulateClickLogout();
    } else if(e.key >= '1' && e.key <= '4'){
        simulateClickBar(e.key.charCodeAt(0) - 49);
    } else if(e.key == 'ArrowLeft' && window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list"){
        try{document.getElementsByClassName("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__leftIcon--1xTQmlKB0ldX-7LWrTevD4")[0].click();}catch{}
    } else if(e.key == 'ArrowRight' && window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list"){
        try{document.getElementsByClassName("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__rightIcon--ZSZeXHkbdqtWaqpsNXVn-")[0].click();}catch{}
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
            try{
                document.getElementsByClassName("ng-binding fe-components-stu-business-topbar-profile-__liBtn--2o4Tw8hObEQPDm7WM_T2us")[1].click();
            }catch{
                
            }
        }
    }
}
function simulateClickRefresh() {
    var targtext = document.getElementsByClassName("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value
    try{
        targlists = document.getElementsByClassName("ng-isolate-scope fe-components-xb-pull-btn-__t_overflow--3OZPYj_1Z20EZZbQur_fl9");
        for(targ in targlists){
            if(targlists[targ].getAttribute('xb-title') == targtext){
                targlists[targ].click();
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
    }catch{
        
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
          x: 'right',
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
            hideScores(data.cont);
        }, i * interval);
    }
}

function hideAseRepeatedly(data, interval, duration) {
    const times = Math.floor(duration / interval);

    for (let i = 0; i <= times; i++) {
        setTimeout(() => {
            hideAssignments(data.cont);
        }, i * interval);
    }
}