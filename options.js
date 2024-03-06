let EXTENSION_VERSION = [4,5,5]

var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';

document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setLanguage();
});

document.getElementById('save').addEventListener('click', saveOptions);

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
    var calcRange = document.getElementById('calcRange').value;
    var welcomeMsg = document.getElementById('welcomeMsg').value;
    var autoHide = document.getElementById('autoHide').checked;
    var autoHide_Condition = document.getElementById('autoHide_Condition').value;

    var user_preference = {
        calcRange: parseInt(calcRange, 10),
        welcomeMsg: welcomeMsg,
        autoHide: autoHide,
        autoHide_Condition: parseInt(autoHide_Condition, 10)
    };

    // Use chrome.storage.local to save the user preferences
    chrome.storage.local.set({user_preference: user_preference}, function() {
        console.log('Preferences saved');
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
    var max = 100; // 最大值
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
            document.getElementById('welcomeMsg').value = data.user_preference.welcomeMsg;
            document.getElementById('autoHide').checked = data.user_preference.autoHide;
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
            }, 10);

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
            'welcomeMsgLabel': 'Custom Welcome Message',
            'autoHideGradesLabel': 'Auto-Hide Unsatisfactory Grades',
            'enableLabel': 'Enable',
            'enableLabel2': 'Enable',
            'autoHide_Condition_Label': 'When score is below',
            'save': 'Save',
            'updateLabel': 'Enable Update Notification',
        },
        'zh': {
            'main_header': '基本设置',
            'calcRangeLabel': '自动计算范围',
            'welcomeMsgLabel': '自定义欢迎语',
            'autoHideGradesLabel': '自动隐藏不满意的成绩',
            'enableLabel': '启用',
            'enableLabel2': '启用',
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
