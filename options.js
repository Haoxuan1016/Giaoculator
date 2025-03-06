let EXTENSION_VERSION = [4,5,5]
var autologNtw;
var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';


function sendAlertrttip(cont){
  return;
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


document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setLanguage();
});

document.getElementById("darkModeSelect").addEventListener("change", function() {
  document.getElementById("homeSrcDark").style.width = "50%";
  let value = this.value;
  console.log(value);
  if (value == 3) {
    document.getElementById("homeSrcDarkBr").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDarkLabel").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDarkSelect").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDark").style.display = 'inline-block';      // Or 'inline', 'inline-block' as needed
  } else {
    document.getElementById("homeSrcDarkLabel").style.display = 'none';
    document.getElementById("homeSrcDarkBr").style.display = 'none';
    document.getElementById("homeSrcDarkSelect").style.display = 'none';
    document.getElementById("homeSrcDark").style.display = 'none';
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
    if(document.getElementById('calcRange').value == 0){
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent = "不主动计算动态成绩";
        }
        else{
            document.getElementById('calcRangeValue').textContent = "Do Not Calculate Any Score Data";
        }
    }else if(document.getElementById('calcRange').value == 1){
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

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}



document.addEventListener('DOMContentLoaded', function() {
    const res1TypeSelect = document.getElementById('res1TypeSelect');
    const welcomeMsg = document.getElementById('welcomeMsg');

    const homeSrcDarkSelect = document.getElementById('homeSrcDarkSelect');
    const homeSrcDark = document.getElementById('homeSrcDark');
  
    setTimeout(() => {  
      if(welcomeMsg.value.includes("<gcalc_localImg>")){
        res1TypeSelect.value = "local";
      }else if(welcomeMsg.value.includes("bing")){
          res1TypeSelect.value = "bing";
      }else{
          res1TypeSelect.value = "online";
      }

      if(homeSrcDark.value.includes("gcalc_localImg")){
        homeSrcDarkSelect.value = "local";
      }
      if(welcomeMsg.value.includes("bing")){
        homeSrcDarkSelect.value = "bing";
      }
      if(!(homeSrcDark.value.includes("gcalc_localImg")||homeSrcDark.value.includes("bing"))){
        homeSrcDarkSelect.value = "online";
      }
    }, 20);
    

    setTimeout(() => {
      if (res1TypeSelect.value == "bing" || res1TypeSelect.value == "local") {
        welcomeMsg.style.visibility = "hidden";
        welcomeMsg.style.width = "1%";
      } else {
        welcomeMsg.style.visibility = "visible";
        welcomeMsg.style.width = "50%";
      }

      if(homeSrcDarkSelect.value == "bing" || homeSrcDarkSelect.value == "local"){
          homeSrcDark.style.visibility = "hidden";
          homeSrcDark.style.width = "1%";
      }else{
          homeSrcDark.style.visibility = "visible";
          homeSrcDark.style.width = "50%";
      }
    },40);
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
        setTimeout(() => {
            document.getElementById('showReloadTip').innerText = ''
        }, 3000);
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

document.getElementById('res1TypeSelect').addEventListener('change', function() {
    if(this.value == "bing"){
        document.getElementById('welcomeMsg').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        document.getElementById('welcomeMsg').style.visibility = "hidden";
        document.getElementById('welcomeMsg').style.width = "1%";
    }else if(this.value == "local"){
        document.getElementById('welcomeMsg').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        document.getElementById('welcomeMsg').style.visibility = "hidden";
        document.getElementById('welcomeMsg').style.width = "1%";
        SelectImgtoBase64()
        .then(base64String => {
            console.log("Base64 string:", base64String);
            document.getElementById('welcomeMsg').value = "<gcalc_localImg>";
            removeLongStringFromChromeStorage('localImg');
            setTimeout(() => {
                saveToChromeStorage('localImg', base64String);
                document.getElementById('showReloadTip').innerText = tlang("本地图片上传成功，请点击保存","Local image upload successful, please click Save.");
            }, 100);
            
            /*
            // Use the Base64 string here (e.g., set it as the src of an image)
            const imgElement = document.createElement('img');
            imgElement.src = base64String;
            document.body.appendChild(imgElement);*/

        })
        .catch(error => {
            console.error("Error getting Base64:", error);
            sendAlertrttip("Error getting Base64:"+error);
        });
    }else{
        document.getElementById('welcomeMsg').style.visibility = "visible";
        document.getElementById('welcomeMsg').style.width = "50%";
    }
});



document.getElementById('homeSrcDarkSelect').addEventListener('change', function() {
  if(this.value == "bing"){
      document.getElementById('homeSrcDark').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
      document.getElementById('homeSrcDark').style.visibility = "hidden";
      document.getElementById('homeSrcDark').style.width = "1%";
  }else if(this.value == "local"){
      document.getElementById('homeSrcDark').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
      document.getElementById('homeSrcDark').style.visibility = "hidden";
      document.getElementById('homeSrcDark').style.width = "1%";
      SelectImgtoBase64()
      .then(base64String => {
          console.log("Base64 string:", base64String);
          document.getElementById('homeSrcDark').value = "<gcalc_localImg2>";
          removeLongStringFromChromeStorage('localImg2');
          setTimeout(() => {
              saveToChromeStorage('localImg2', base64String);
              document.getElementById('showReloadTip').innerText = tlang("本地图片（深色主题）上传成功，请点击保存","Local image(dark theme) upload successful, please click Save.");
          }, 100);
          
          /*
          // Use the Base64 string here (e.g., set it as the src of an image)
          const imgElement = document.createElement('img');
          imgElement.src = base64String;
          document.body.appendChild(imgElement);*/

      })
      .catch(error => {
          console.error("Error getting Base64:", error);
          sendAlertrttip("Error getting Base64:"+error);
      });
  }else{
      document.getElementById('homeSrcDark').style.visibility = "visible";
      document.getElementById('homeSrcDark').style.width = "50%";
  }
});


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

function removeLongStringFromChromeStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
  
        const keysToRemove = Object.keys(items).filter(itemKey => itemKey.startsWith(key + "_"));
  
        if (keysToRemove.length === 0) {
          resolve(); // 没有找到任何分段，直接 resolve
          return;
        }
  
        chrome.storage.local.remove(keysToRemove, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
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
function saveLongStringToChromeStorage(key, myString) {
    const MAX_CHUNK_SIZE = 20480; 
    const stringLength = myString.length;
    const chunkCount = Math.ceil(stringLength / MAX_CHUNK_SIZE);
  
    return new Promise((resolve, reject) => {
      const promises = [];
  
      for (let i = 0; i < chunkCount; i++) {
        console.log(key,"[suc]sabelong:",i,chunkCount)
        const startIndex = i * MAX_CHUNK_SIZE;
        const endIndex = Math.min((i + 1) * MAX_CHUNK_SIZE, stringLength);
        const chunk = myString.substring(startIndex, endIndex);
        const chunkKey = `${key}_${i}`; // 每个分段的 key
  
        promises.push(new Promise((resolveChunk, rejectChunk) => {
          chrome.storage.local.set({ [chunkKey]: chunk }, () => {
            if (chrome.runtime.lastError) {
              rejectChunk(chrome.runtime.lastError);
            } else {
              resolveChunk();
            }
          });
        }));
      }
  
      Promise.all(promises)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

function loadOptions() {
    // Load the user preferences from chrome.storage.local
    chrome.storage.local.get('user_preference', function(data) {
        if (data.user_preference) {
            document.getElementById('calcRange').value = data.user_preference.calcRange;
            if(document.getElementById('calcRange').value == 0){
                if(langSet == 'cn'){
                    document.getElementById('calcRangeValue').textContent = "不主动计算动态成绩";
                }
                else{
                    document.getElementById('calcRangeValue').textContent = "Do Not Calculate Any Score Data";
                }
            }else if(document.getElementById('calcRange').value == 1){
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
                document.getElementById("homeSrcDarkLabel").style.display = 'none';
                document.getElementById("homeSrcDarkBr").style.display = 'none';
                document.getElementById("homeSrcDarkSelect").style.display = 'none';
                document.getElementById("homeSrcDark").style.display = 'none';
            }else{
                document.getElementById('welcomeMsg').style.width = "30%";
                document.getElementById('homeSrcDark').style.width = "30%";
                document.getElementById("homeSrcDarkBr").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDarkLabel").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDarkSelect").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDark").style.display = 'inline-block';      // Or 'inline', 'inline-block' as needed
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
            input = document.getElementById('darkModeSelect');
            label = document.getElementById('darkModeSelect_Label');
            if (data.user_preference.advLogPage == true) {
                input.style.display = 'inline-block';
                label.style.display = 'inline';
                input.style.visibility = 'visible';
                label.style.visibility = 'visible';
            } else {
                input.style.visibility = 'hidden';
                label.style.visibility = 'hidden';
            }
        }else{
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
            setTimeout(() => {
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
            'goto_report': 'IssueReport',
            'goto_read': 'HelpDocs',
            'main_header_ask': 'Help Center',
            'calcRangeLabel': 'Auto-Calc Range',
            'welcomeMsgLabel': 'Custom Loginpage Background',
            'autoHideGradesLabel': 'Hide Unsatisfactory Score Numbers',
            'enableLabel': 'Enable',
            'enableLabel2': 'Enable',
            'autoHide_Condition_Label': 'When score is below',
            'save': 'Save',
            'advLogPageLabel': 'Better HomePage',
            'darkModeSelect_Label': 'Theme',
            'updateLabel': 'Enable Update Notification',
            'res1TypeLabel': 'Resource Type',
            'homeSrcDarkLabel': 'Resource Type(Dark)'
        },
        'zh': {
            'main_header': '基本设置',
            'goto_report': '报告问题',
            'goto_read': '阅读说明',
            'main_header_ask': '帮助中心',
            'calcRangeLabel': '自动计算范围',
            'welcomeMsgLabel': '自定义登录界面资源',
            'autoHideGradesLabel': '隐藏低分成绩外显',
            'enableLabel': '启用',
            'enableLabel2': '启用',
            'darkModeSelect_Label': '颜色主题',
            'advLogPageLabel': '启用美化',
            'autoHide_Condition_Label': '当分数低于',
            'save': '保存',
            'updateLabel': '启用更新提示',
            'res1TypeLabel': '资源类型',
            'homeSrcDarkLabel': '资源类型(深色模式)'
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
    if(!userLang.startsWith('zh')){
        document.getElementById('darkModeSelect').children[0].textContent = "Light Theme";
        document.getElementById('darkModeSelect').children[1].textContent = "Dark Theme";
        document.getElementById('darkModeSelect').children[2].textContent = "Theme Depends on Time";
        document.getElementById('darkModeSelect').children[3].textContent = "Theme and Background Depends on Time";
        document.getElementById('res1TypeSelect').children[0].textContent = "Bing Wallpaper API";
        document.getElementById('res1TypeSelect').children[1].textContent = "Local Image";
        document.getElementById('res1TypeSelect').children[2].textContent = "Online Image/Video";
        document.getElementById('homeSrcDarkSelect').children[0].textContent = "Bing Wallpaper API";
        document.getElementById('homeSrcDarkSelect').children[1].textContent = "Local Image";
        document.getElementById('homeSrcDarkSelect').children[2].textContent = "Online Image/Video";
    }
    
}

function initExpSettings(){
    var uset = prompt("输入实验功能号码");
    if(uset.includes('avg')){
        chrome.storage.local.get('exp_showFullavg', function(state) {
            if(state.exp_showFullavg){
                chrome.storage.local.set({'exp_showFullavg': false}, function() {
                    alert("avg已关闭！");
                });
            }else{
                chrome.storage.local.set({'exp_showFullavg': true}, function() {
                    alert("avg已开启！");
                });
            }
        });
    }
    /*
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
    });*/
    
}
function SelectImgtoBase64() {
    return new Promise((resolve, reject) => {
      // 创建遮罩层
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;
  
      // 创建退出按钮
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: transparent;
        border: none;
        color: white;
        font-size: 30px;
        cursor: pointer;
        z-index: 10000; /* 确保按钮在最上层 */
      `;
      closeButton.textContent = "×"; // 使用 × 作为关闭图标
  
      // 添加退出按钮到遮罩层
      overlay.appendChild(closeButton);
  
      // 创建提示文字
      const message = document.createElement('span');
      message.style.cssText = `
        color: white;
        font-size: 20px;
        margin-bottom: 10px;
        pointer-events: none;
      `;
      message.textContent = tlang("点击上传图片","Upload image");
  
      // 创建图标
      const icon = document.createElement('span');
      icon.style.cssText = `
        font-family: 'Material Symbols Outlined';
        font-size: 48px;
        color: white;
        pointer-events: none;
        user-select: none;
      `;
      icon.textContent = "upload";
  
      // 创建隐藏的文件输入框
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
  
      // 添加元素到遮罩层
      overlay.appendChild(message);
      overlay.appendChild(icon);
      overlay.appendChild(fileInput);
  
      // 添加遮罩层到页面
      document.body.appendChild(overlay);
  
      // 点击事件监听器 (点击遮罩层打开文件选择对话框)
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) { // 确保点击的是遮罩层本身，而不是子元素
          fileInput.click();
        }
      });
  
      // 退出按钮点击事件监听器
      closeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止事件冒泡到遮罩层
        overlay.remove();
        reject("Upload cancelled"); // Promise reject，表示取消上传
      });
  
      // 文件选择事件监听器
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
  
          reader.onload = (e) => {
            const base64String = e.target.result;
            resolve(base64String);
            overlay.remove();
          };
  
          reader.onerror = (error) => {
            reject(error);
            overlay.remove();
          };
  
          reader.readAsDataURL(file);
        } else {
          reject("No file selected");
          overlay.remove();
        }
      });
    });
  }