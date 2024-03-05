let enable = true;
let stat = 1; // 1: enabled, 0: disabled, 2: half enabled

function updateButton(){
  document.getElementById('goSettingsBtn').innerText = (navigator.language || navigator.userLanguage).startsWith('zh') ? '前往设置' : 'Settings';
  if (stat == 1) {
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '开启' : 'Enabled'
    document.querySelector('#toggle-button').classList.add('enabled');
    document.querySelector('#toggle-button').classList.remove('disabled');
    document.querySelector('#toggle-button').classList.remove('partial');
  }
  else if (stat == 0) {
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '关闭' : 'Disabled'
    document.querySelector('#toggle-button').classList.add('disabled');
    document.querySelector('#toggle-button').classList.remove('enabled');
    document.querySelector('#toggle-button').classList.remove('partial');
  }
  else if (stat == 2) {
    document.querySelector('#toggle-button').innerHTML = (navigator.language || navigator.userLanguage).startsWith('zh') ? '部分功能' : 'Part Enabled'
    document.querySelector('#toggle-button').classList.add('partial');
    document.querySelector('#toggle-button').classList.remove('enabled');
    document.querySelector('#toggle-button').classList.remove('disabled');
  }
}

function onclickButton(){
  // enable = !enable;
  if (stat == 1) {
    stat = 2;
  }
  else if (stat == 2) {
    stat = 0;
    enable = false;
  }
  else if (stat == 0) {
    stat = 1;
    enable = true;
  }
  
  chrome.storage.local.set({enable_state: enable});
  chrome.storage.local.set({partial_state: stat}); 
  send_msg("enable_change",enable);
  updateButton();
}


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