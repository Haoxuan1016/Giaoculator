POP_addPopComponent();
console.log("POP_addPopComponent()");
function POP_addPopComponent(){
    let mainHtml = `
        <div class="floating-container">
            <div class="switch-box">
                <label class="switch">
                    <input type="checkbox" id="light-switch">
                    <span class="slider round"></span>
                </label>
                <span class="switch-text">${tlang("解除会员限制","Unlock")}</span>
            </div>
            <div class="floating-ball">
                <div class="content-container">
                    <img src="`+chrome.runtime.getURL("icon.png")+`" alt="Logo" id="xfc-logo">
                </div>
            </div>
        </div>
    `;

    var styleElement = document.createElement('style');
    let manCss = `
    .floating-container {
        position: fixed;
        right: 10px;
        bottom: 12px;
        display: flex;
        align-items: center;
        gap: 5px; /* 这里可以调整 switch 和 悬浮球 之间的距离 */
        z-index: 999;
    }
    
    .switch-box {
        display: flex;
        opacity: 0;
        align-items: center;
        background: white;
        padding: 5px 10px;
        border-radius: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        transition: opacity 0.3s ease;
    }
    
    .switch-text {
        margin-left: 5px;
        font-size: 14px;
        color: #333;
    }
    
    .switch {
        position: relative;
        display: inline-block;
        width: 34px;
        height: 20px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    
    input:checked + .slider {
        background-color: #4CAF50;
    }
    
    input:checked + .slider:before {
        transform: translateX(14px);
    }
    
    .floating-ball {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    
    .content-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    #xfc-logo {
        width: 27px; /* 缩小 logo 大小 */
        height: 27px;
    }
    `;
    
    styleElement.type = 'text/css';
    if (styleElement.styleSheet){
      styleElement.styleSheet.cssText = manCss;
    } else {
      styleElement.appendChild(document.createTextNode(manCss));
    }
    
    document.head.appendChild(styleElement);

    var pop_component = document.createElement('div');
    pop_component.innerHTML = mainHtml;
    document.body.appendChild(pop_component);
    document.getElementsByClassName("btn justify-content-center btn-floating ButtonIcon_medium__yVUr1 ButtonIcon_circle__KcHMY ButtonIcon_button__8mJq7 PageWrapper_themeButton___4sCM Theme_button__0S2kp")[0].style.position = "fixed";
    document.getElementsByClassName("btn justify-content-center btn-floating ButtonIcon_medium__yVUr1 ButtonIcon_circle__KcHMY ButtonIcon_button__8mJq7 PageWrapper_themeButton___4sCM Theme_button__0S2kp")[0].style.bottom = "72px";
    document.getElementsByClassName("btn justify-content-center btn-floating ButtonIcon_medium__yVUr1 ButtonIcon_circle__KcHMY ButtonIcon_button__8mJq7 PageWrapper_themeButton___4sCM Theme_button__0S2kp")[0].style.right = "15px";

    
    let floatingBall = document.getElementsByClassName("floating-ball")[0];
    let switchBox = document.getElementsByClassName("switch-box")[0];
    let hideTimeout;


    floatingBall.addEventListener("mouseenter", () => {
        switchBox.style.opacity = 1;
        clearTimeout(hideTimeout);
    });

    floatingBall.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => {
            switchBox.style.opacity = 0;
        }, 2000); // 2秒后隐藏
    });

    switchBox.addEventListener("mouseenter", () => {
        clearTimeout(hideTimeout);
    });

    switchBox.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => {
            switchBox.style.opacity = 0;
        }, 2000);
    });


    let intervalID = null;  
    const lightSwitch = document.getElementById("light-switch");

    lightSwitch.addEventListener("change", function () {
        if (this.checked) {
            intervalID = setInterval(() => {
                sessionStorage.clear();
                localStorage.clear();
            }, 100);
        } else {
            clearInterval(intervalID);
            intervalID = null;
        }
    });

    floatingBall.addEventListener("click", () => {
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
            duration: 7000,
            position: {
              x: 'left',
              y: 'top',
            },
            dismissible: true,
            message : tlang(`
                <div style="color: white; font-size: 11px;">
  <p style="margin-bottom: 2px; margin-top: 2px;"><strong>开启功能后：</strong></p>
  <p style="margin-bottom: 2px; margin-top: 2px;">无需登录会员账号也可无限次使用 SaveMyExams。</p>
  <p style="margin-bottom: 0px; margin-top: 2px;"><strong>若您已购买 SaveMyExams 会员，则无需开启该功能。</strong></p>

`, `<div style="color: white; font-size: 11px;">
  <p style="margin-bottom: 2px; margin-top: 2px;"><strong>After enabling this feature:</strong></p>
  <p style="margin-bottom: 2px; margin-top: 2px;">You can use SaveMyExams unlimited times without logging into a member account.</p>
  <p style="margin-bottom: 0px; margin-top: 2px;"><strong>If you have purchased a SaveMyExams membership, you may ignore this feature.</strong></p>
</div>`)
        })
    });
}

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}