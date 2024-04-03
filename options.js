let EXTENSION_VERSION = [4,5,5]
var autologNtw;
var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';

document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setLanguage();
});

document.getElementById("darkModeSelect").addEventListener("change", function() {
    let value = this.value;
    console.log(value)
    if(value==3){
        document.getElementById("welcomeMsg").style.width = "30%";
        document.getElementById("homeSrcDark").style.width = "30%";
        document.getElementById("homeSrcDark").style.visibility = 'visible';
    }else{
        document.getElementById("welcomeMsg").style.width = "50%";
        document.getElementById("homeSrcDark").style.width = "1%";  
        //隐藏homeSrcDark
        document.getElementById("homeSrcDark").style.visibility = 'hidden';
    }
});

document.getElementById('advLogPage').addEventListener('change', function() {
    var checkbox = this;
    var input = document.getElementById('darkModeSelect');
    var label = document.getElementById('darkModeSelect_Label');

    if (checkbox.checked == true) {
        input.style.display = 'inline-block';
        label.style.display = 'inline';
        input.style.visibility = 'visible';
        label.style.visibility = 'visible';
    } else {
        input.style.visibility = 'hidden';
        label.style.visibility = 'hidden';
    }
});


document.getElementById('save').addEventListener('click', saveOptions);

document.getElementById('exp_settings').addEventListener('click', initExpSettings);

// Update display for calcRange slider dynamically
document.getElementById('calcRange').addEventListener('input', function() {
    if(document.getElementById('calcRange').value == 1){
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent = "仅计算当前学期的数据";
        }
        else{
            document.getElementById('calcRangeValue').textContent = "Calculate the Current Semester Only";
        }
    }else{
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent =  "计算最近 " + document.getElementById('calcRange').value + " 个学期的数据";
        }
        else{
            document.getElementById('calcRangeValue').textContent =  "Calculate Last " + document.getElementById('calcRange').value + " Semesters' Scores";

        }
    }
});

function saveOptions() {
    var advLogPage = document.getElementById('advLogPage').checked;
    var calcRange = document.getElementById('calcRange').value;
    var welcomeMsg = document.getElementById('welcomeMsg').value;
    var autoHide = document.getElementById('autoHide').checked;
    var autoHide_Condition = document.getElementById('autoHide_Condition').value;

    var user_preference = {
        calcRange: parseInt(calcRange, 10),
        welcomeMsg: welcomeMsg,
        advLogPage: advLogPage,
        autoHide: autoHide,
        autologNtw: autologNtw,
        autoHide_Condition: parseInt(autoHide_Condition, 10),
        homeSrc: welcomeMsg,
        homeSrcDark: document.getElementById('homeSrcDark').value,
        homeDarkMode: document.getElementById('darkModeSelect').value // 0:Black 1:White 2:Depends on Time 3:Color&Pic
    };

    // Use chrome.storage.local to save the user preferences
    chrome.storage.local.set({user_preference: user_preference}, function() {
        console.log('Preferences saved',user_preference);
        if(langSet == 'cn'){
            document.getElementById('showReloadTip').innerText = "设置已保存，重新登录平台后生效";
        }
        else{
            document.getElementById('showReloadTip').innerText = "Saved, re-login to apply changes.";
        }
    });

}

document.getElementById('autoHide_Condition').addEventListener('input', function() {
    var min = 1; // 最小值
    var max = 101; // 最大值
    var value = parseInt(this.value, 10); // 获取用户输入的数值，并转换为整数

    // 检查值是否低于最小值
    if (value < min) {
        this.value = min; // 设置为最小值
    }
    // 检查值是否高于最大值
    else if (value > max) {
        this.value = max; // 设置为最大值
    }
});


function loadOptions() {
    // Load the user preferences from chrome.storage.local
    chrome.storage.local.get('user_preference', function(data) {
        if (data.user_preference) {
            document.getElementById('calcRange').value = data.user_preference.calcRange;
            if(document.getElementById('calcRange').value == 1){
                document.getElementById('calcRangeValue').textContent = "仅计算现学期的数据"
            }else{
                document.getElementById('calcRangeValue').textContent =  "计算最近 " + document.getElementById('calcRange').value + " 个学期的数据";
            }
            try {
                autologNtw = data.user_preference.autologNtw;
            } catch (error) {
                autologNtw = 0;
            }
            
            document.getElementById('welcomeMsg').value = data.user_preference.homeSrc;
            document.getElementById('darkModeSelect').value = data.user_preference.homeDarkMode;
            if(data.user_preference.homeDarkMode!=3){
                document.getElementById('homeSrcDark').style.visibility = "hidden";
                document.getElementById('homeSrcDark').style.width = "1%";
            }else{
                document.getElementById('welcomeMsg').style.width = "30%";
                document.getElementById('homeSrcDark').style.width = "30%";
            }
            document.getElementById('homeSrcDark').value = data.user_preference.homeSrcDark;
            document.getElementById('autoHide').checked = data.user_preference.autoHide;
            document.getElementById('advLogPage').checked = data.user_preference.advLogPage;
            document.getElementById('autoHide_Condition').value = data.user_preference.autoHide_Condition;
            var input = document.getElementById('autoHide_Condition');
            var label = document.getElementById('autoHide_Condition_Label');

            if (data.user_preference.autoHide == true) {
                input.style.display = 'inline-block';
                label.style.display = 'inline';
                input.style.visibility = 'visible';
                label.style.visibility = 'visible';
            } else {
                input.style.visibility = 'hidden';
                label.style.visibility = 'hidden';
            }
        }else{
            var newWindow = window.open('https://tsinglanstudent.schoolis.cn', '_blank');
            setTimeout(() => {
                newWindow.close();
                location.reload(true);
            }, 100);

        }
        
    });
}

document.getElementById('autoHide').addEventListener('change', function() {
    var checkbox = this;
    var input = document.getElementById('autoHide_Condition');
    var label = document.getElementById('autoHide_Condition_Label');

    if (checkbox.checked == true) {
        input.style.display = 'inline-block';
        label.style.display = 'inline';
        input.style.visibility = 'visible';
        label.style.visibility = 'visible';
    } else {
        input.style.visibility = 'hidden';
        label.style.visibility = 'hidden';
    }
});


function setLanguage() {
    console.log(navigator.language || navigator.userLanguage);
    var userLang = navigator.language || navigator.userLanguage; 
    var texts = {
        'en': {
            'main_header': 'General',
            'calcRangeLabel': 'Auto-Calc Range',
            'welcomeMsgLabel': 'Custom Loginpage Banner',
            'autoHideGradesLabel': 'Auto-Hide Unsatisfactory Grades',
            'enableLabel': 'Enable',
            'enableLabel2': 'Enable',
            'autoHide_Condition_Label': 'When score is below',
            'save': 'Save',
            'advLogPageLabel': 'Better HomePage',
            'updateLabel': 'Enable Update Notification',
        },
        'zh': {
            'main_header': '基本设置',
            'calcRangeLabel': '自动计算范围',
            'welcomeMsgLabel': '自定义登录界面资源',
            'autoHideGradesLabel': '自动隐藏不满意的成绩',
            'enableLabel': '启用',
            'enableLabel2': '启用',
            'advLogPageLabel': '启用美化',
            'autoHide_Condition_Label': '当分数低于',
            'save': '保存',
            'updateLabel': '启用更新提示',
        }
    };
    

    var langKey = userLang.startsWith('zh') ? 'zh' : 'en'; // Default to English if not Chinese
    var data = texts[langKey];
    for (id in data) {
        var element = document.getElementById(id);
        if (element) {
            element.textContent = data[id];
        }
    }
}

function initExpSettings(){
    chrome.storage.local.get('user_preference', function(data) {
        var tmp = data.user_preference.autologNtw;
        if(data.user_preference.autologNtw == 0){
            tmp = "已关闭❌"
        }else{
            tmp = "已开启✅"
        }
        var uset = prompt("[实验功能]\n自动保存凭据并快捷登录至4.3.2.1\n开启状态: "+tmp+"\n输入0/1/2即可关闭/开启/清除数据");
        if(uset.includes('0')){
            autologNtw = 0;
            chrome.storage.local.remove('savedPostData', function() {
                alert("已关闭并清除本地数据！");
            });
        }else if(uset.includes('1')){
            autologNtw = 1;
            alert("功能已开启！");
        }else if(uset.includes('2')){
            chrome.storage.local.remove('savedPostData', function() {
                alert("已重置本地数据！");
            });
        }
    });
    
}