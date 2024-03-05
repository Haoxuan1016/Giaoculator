// document.addEventListener('DOMContentLoaded', function() {
//   chrome.runtime.openOptionsPage();
// });

let enable = true;

function updateButton(){
  document.getElementById('goSettingsBtn').innerText = (navigator.language || navigator.userLanguage).startsWith('zh') ? '前往设置' : 'Settings';
  if (enable) {
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

document.addEventListener('DOMContentLoaded', function() {
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

function send_msg(msgtype,mycont){
  let message = {
    type: msgtype,
    data: {
      cont : mycont
    }
  };

  chrome.runtime.sendMessage(message);
}