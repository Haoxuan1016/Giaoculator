document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setLanguage();
});

document.getElementById('save').addEventListener('click', saveOptions);

// Update display for calcRange slider dynamically
document.getElementById('calcRange').addEventListener('input', function() {
    if(document.getElementById('calcRange').value == 1){
        document.getElementById('calcRangeValue').textContent = "仅计算现学期的数据"
    }else{
        document.getElementById('calcRangeValue').textContent =  "计算最近 " + document.getElementById('calcRange').value + " 个学期的数据";
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
        document.getElementById('showReloadTip').innerText = "设置已保存，重新登录平台后生效";
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
            'settingsHeader': 'Basic Settings General',
            'calcRangeLabel': 'Auto-Calc Range',
            'welcomeMsgLabel': 'Custom Welcome Message',
            'autoHideGradesLabel': 'Auto-Hide Unsatisfactory Grades',
            'enableLabel': 'Enable',
            'scoreBelowLabel': 'When score is below',
            'saveButton': 'Save'
        },
        'zh': {
            'settingsHeader': '基本设置 General',
            'calcRangeLabel': '自动计算范围 Auto-Calc Range',
            'welcomeMsgLabel': '自定义欢迎语 Custom WelcomeMsg',
            'autoHideGradesLabel': '自动隐藏不满意的成绩 Auto-Hide Unsatisfactory Grades',
            'enableLabel': '启用 Enable',
            'scoreBelowLabel': '当分数低于',
            'saveButton': '保存 Save'
        }
    };
    

    var langKey = userLang.startsWith('zh') ? 'zh' : 'en'; // Default to English if not Chinese

    // Update text content for each element based on the browser language
    document.getElementById('welcomeMsgLabel').textContent = texts[langKey]['welcomeMsgLabel'];
    document.getElementById('autoHideLabel').textContent = texts[langKey]['autoHideLabel'];
}
