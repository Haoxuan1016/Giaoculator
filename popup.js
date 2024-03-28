document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var currentTab = tabs[0];
    if (currentTab.url) {
      if (currentTab.url.indexOf("4.3.2.1") !== -1) {
        ntwMode=true;
        chrome.storage.local.get('user_preference', function(result) {
          if(result.user_preference.autologNtw==0){
            ntwMode=false;
            updateButton();
          }
        });

      }
    }
  });
  chrome.storage.local.get('enable_state', function(result) {
    enable = result.enable_state;
    updateButton();
  });
  var myButton = document.getElementById('toggle-button');
  var mySettings = document.getElementsByClassName('footer')[0];
  myButton.addEventListener('click', function() {
      onclickButton();
  });
  mySettings.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});

let ntwMode = false;
let enable = true;

function updateButton(){
  document.getElementById('goSettingsBtn').innerText = (navigator.language || navigator.userLanguage).startsWith('zh') ? '前往设置' : 'Settings';
  if(ntwMode){
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '一键登录' : 'Login'
    document.querySelector('#toggle-button').classList.add('enabled');
    try {
      chrome.storage.local.get('savedPostData', function(result) {
        console.log(result);
        document.getElementById('addi_text').innerText = "暂未储存登录凭据";
        document.getElementById('addi_text').innerText = "👤账号: " + result.savedPostData.formData.userName;
        if(length(result.savedPostData.formData.userName)<3){
          document.getElementById('addi_text').innerText = "本地暂无登录凭据";
        }
      });
    } catch (error) {
        document.getElementById('addi_text').innerText = "本地暂无登录凭据";
    }
  }else if (enable) {
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '关闭' : 'Enabled'
    // 加入一个enable的class
    document.querySelector('#toggle-button').classList.add('enabled');
    // 减去一个disable的class
    document.querySelector('#toggle-button').classList.remove('disabled');
  } else {
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '开启' : 'Disabled'
    // 加入一个disable的class
    document.querySelector('#toggle-button').classList.add('disabled');
    // 减去一个enable的class
    document.querySelector('#toggle-button').classList.remove('enabled');
  }
}

function onclickButton(){
  if(ntwMode){
    send_msg("bp-ntwlogin",enable);
    window.close();
    return;
  }
  enable = !enable;
  chrome.storage.local.set({enable_state: enable});
  send_msg("enable_change",enable);
  updateButton();
}

// updateButton();

// document.querySelector('#toggle-button').addEventListener('click', function() {
  // enable = !enable;
  // updateButton();
// });



function send_msg(msgtype,mycont){
  let message = {
    type: msgtype,
    data: {
      cont : mycont
    }
  };

  chrome.runtime.sendMessage(message);
}