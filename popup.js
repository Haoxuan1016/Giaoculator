// document.addEventListener('DOMContentLoaded', function() {
//   chrome.runtime.openOptionsPage();
// });

let enable = true;

function updateButton(){
  if (enable) {
    document.querySelector('#toggle-button').innerHTML = '关闭';
    // 加入一个enable的class
    document.querySelector('#toggle-button').classList.add('enabled');
    // 减去一个disable的class
    document.querySelector('#toggle-button').classList.remove('disabled');
  } else {
    document.querySelector('#toggle-button').innerHTML = '开启';
    // 加入一个disable的class
    document.querySelector('#toggle-button').classList.add('disabled');
    // 减去一个enable的class
    document.querySelector('#toggle-button').classList.remove('enabled');
  }
}

function onclickButton(){
  enable = !enable;
  updateButton();
}

// updateButton();

// document.querySelector('#toggle-button').addEventListener('click', function() {
  // enable = !enable;
  // updateButton();
// });

document.addEventListener('DOMContentLoaded', function() {
  var myButton = document.getElementById('toggle-button');
  myButton.addEventListener('click', function() {
      onclickButton();
  });
});