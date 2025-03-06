function runWhenElementReady(selector, callback, interval, maxAttempts) {
    let attempts = 0;

    function check() {
        if (document.querySelector(selector)) {
            callback();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, interval);
        }
    }

    check();
}

// 使用示例：每隔 500ms 检查一次目标元素，最多检查 10 次
runWhenElementReady('link', diyHomepage_LocalImg, 10, 5);
runWhenElementReady('link', diyHomepage_LocalImg, 100, 3);

async function getFromChromeStorage(keyName) {
    try {
        const result = await chrome.storage.local.get(keyName); // 异步获取
        if (result[keyName] !== undefined) {
            return result[keyName]; // 返回存储的值
        } else {
            console.warn('Key not found in chrome.storage:', keyName);
            return null;
        }
    } catch (error) {
        console.error('Error reading from chrome.storage or parsing:', error);
        //err
        return null;
    }
}

function changeLoginBox(colormode,retries){
    try{
            var enterBoxs = document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ ");
            enterBoxs[0].style.borderRadius='10px'
            enterBoxs[0].style.backdropFilter="blur(10px)"
            enterBoxs[0].style.background=colormode? "rgba(255, 255, 255, .01)" : "rgba(088, 080, 082, .065)"
            enterBoxs[1].style.borderRadius='10px'
            enterBoxs[1].style.backdropFilter="blur(10px)"
            enterBoxs[1].style.background=colormode? "rgba(255, 255, 255, .01)" : "rgba(088, 080, 082, .065)"
            document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__signBtn--2VrsqhNGgcjYTh7LuAGzve")[0].style.borderRadius='10px'
            //document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__signBtn--2VrsqhNGgcjYTh7LuAGzve")[0].style.background='rgba(91,138,249,0.5)'
            document.getElementsByClassName('ng-scope fe-components-stu-business-login-enter-box-__headMain--7bzuRu-Sq5O2sOCFgPNQH')[0].children[0].style.maxHeight="95px"
            document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop = "40px"
            document.getElementsByClassName("fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_")[0].style.paddingTop = "52px"
            document.getElementsByClassName("fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_")[0].style.zIndex = "99"
            document.querySelector(".fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_").style.backdropFilter="blur(10px)"
            document.querySelector(".fe-components-stu-business-login-enter-box-__loginInformation--W2yiibeHcVKj_lJeq1rW_").style.background=colormode? "rgba(255, 255, 255, .7)" : "rgba(038, 040, 042, .065)"
            delBox();
            beauty_dymCode();
        }catch(e){
            if(retries>100){
                return;
            }
            setTimeout(() => {
                changeLoginBox(colormode,retries+1);
            }, 10*retries);
        }
}

function beauty_dymCode(){
    console.log("Sdadsadbeauty_dymCode()");
    try {//验证码适配
        let codeInput=document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ fe-components-stu-business-login-enter-box-__loginAccount--V6OxcxzYg1Kv38n9KjsDg fe-components-stu-business-login-enter-box-__codeAccount--1v5pY_k1CJAvtvhBeacNLV")[0];
        codeInput.children[0].outerHTML="<span>";
        document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
    } catch (e) {
        console.log(e)
    }
    try {
        if(document.getElementsByClassName("ng-binding fe-components-stu-business-login-enter-box-__another--2h0L224JEWaxwWm501-8Vi")[0]){
            document.getElementsByClassName("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
        }
    } catch (error) {
        console.log(error)
    }
}

function delBox(){
    document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundSize = "cover";
    document.getElementsByClassName("fe-components-stu-business-login-enter-box-__schoolBackground--2S3KJugj_l_m7T5hRdY_cv")[0].remove();
}
function diyHomepage_LocalImg(){
    try{
        chrome.storage.local.get('user_preference', function(result) {
            var srcData = result.user_preference;
            if(!result.user_preference.advLogPage){
                return;
            }
            
            
    
            let colormode = srcData.homeDarkMode*1;
            console.log("mc",colormode);
            var loginPageSrc = srcData.homeSrc;
            if(colormode >= 2){
                const hours = new Date().getHours();
                if (hours >= 6 && hours <= 18) {
                    colormode = 1;
                } else {
                    if(colormode == 3){
                        loginPageSrc = srcData.homeSrcDark;
                    }
                    colormode = 0;
                }
            }
            setTimeout(() => {
                changeLoginBox(colormode,0);
            }, 10);
            if(loginPageSrc.includes("gcalc_localImg2")){
                console.log("localImgStar");
                getFromChromeStorage("localImg2")
                .then((retrievedData) => {
                    if (retrievedData) {
                        document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundImage = "url("+retrievedData+")";
                    } else {
                        console.log("NOdataFOund for userImg2");
                        
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
            }
            else if(loginPageSrc.includes("gcalc_localImg")){
                console.log("localImgStar");
                getFromChromeStorage("localImg")
                .then((retrievedData) => {
                    if (retrievedData) {
                        document.getElementsByClassName("ng-scope fe-apps-login-__bgWhite--17b4s19HLx5VBdUGMT5Gz0")[0].style.backgroundImage = "url("+retrievedData+")";
                    } else {
                        console.log("NOdataFOund for userImg");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
            }
        });
    }catch(e){
        var enterBoxs = document.getElementsByClassName("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ ");
        changeLoginBox(0,0);
    }
    
}