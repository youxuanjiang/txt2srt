const fileInput = document.getElementById("fileInput");
const fixInterval = document.getElementById("fix_interval");
const customizeInterval = document.getElementById("customize_interval");
const convertTimingButton = document.getElementById("convert-timing");
const secondInput = document.getElementById("secondInput");
const convertedPreview = document.getElementById("convertedPreview");
const currentState = document.getElementById("current-state");
const youtubeMode = document.getElementById("youtube_mode");
const inputHint = document.getElementById("input_hint");
const youtubePlayer = document.getElementById('youtubePlayer');
const refershTimingButton = document.getElementById('refresh-timing');
const nextLineButton = document.getElementById('next-line');
const stopLineButton = document.getElementById('stop-line');

let fileContent = "";
let lines;
let fileName = "";
let isTiming = false;
let timmerInterval;
let startTime;
let elapsedTime = 0;
let requestId;
let currentTime = 0;
let previousTime = 0;
let isGeneratingSRT = false;
let srtIndexForCustomize = 1;
let contentIndex = 0;
let player;
let isVideoPlaying = false;

// Youtube api
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

fileInput.addEventListener('change', function() {
    handleFileSelect();
});

fixInterval.addEventListener('change', function (){
    if(fixInterval.checked) {
        refershTimingButton.style.display = 'none';
        nextLineButton.style.display = 'none';
        stopLineButton.style.display = 'none';
        cancelAnimationFrame(requestId);
        elapsedTime = 0;
        isTiming = false;
        isGeneratingSRT = false;
        isVideoPlaying = false;
        secondInput.disabled = false;
        secondInput.value = "";
        convertTimingButton.textContent = "轉換";
        inputHint.textContent = "秒數：";
        destroyPlayer();
    }
});

customizeInterval.addEventListener('change', function() {
    if(customizeInterval.checked) {
        refershTimingButton.style.display = 'inline-block';
        nextLineButton.style.display = 'inline-block';
        stopLineButton.style.display = 'inline-block';
        secondInput.disabled = true;
        isGeneratingSRT = false;
        isVideoPlaying = false;
        secondInput.value = "00:00:00.000";
        convertTimingButton.textContent = "計時開始";
        inputHint.textContent = "秒數：";
        destroyPlayer();
    }
})

youtubeMode.addEventListener('change', function (){
    if(youtubeMode.checked) {
        refershTimingButton.style.display = 'none';
        nextLineButton.style.display = 'inline-block';
        stopLineButton.style.display = 'inline-block';
        cancelAnimationFrame(requestId);
        elapsedTime = 0;
        isTiming = false;
        isGeneratingSRT = false;
        secondInput.disabled = false;
        secondInput.value = "";
        convertTimingButton.textContent = "嵌入影片";
        inputHint.textContent = "YoutubeID："
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key == 's') {
        if(customizeInterval.checked) timing();
    }

    if (event.key == '0') {
        if(customizeInterval.checked) refreshTiming();
    }
    
    // 文件要先讀取進來才有辦法開始記錄SRT
    if (fileContent.length != 0) {
        if (event.key == 'a') { // start reading line
            if(customizeInterval.checked) genSRTFromTimer();
            else if (youtubeMode.checked) genSRTFromTimer();
            isGeneratingSRT = true;
            currentState.textContent = "正在讀取：" + lines[contentIndex];

        } else if (event.key == 'b') { // break from reading line
            if(customizeInterval.checked) genSRTFromTimer();
            else if (youtubeMode.checked) genSRTFromTimer();
            isGeneratingSRT = false;
            currentState.textContent = "暫停讀取";
        }
    }
    
    // Log the key code when a key is pressed
    console.log('Key pressed:', event.key);
});

function handleFileSelect() {
    const file = document.getElementById("fileInput").files[0];
    fileName = file.name;
    if (!fileName.endsWith(".txt")) {
        alert("這不是txt檔");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        fileContent = event.target.result;
        document.getElementById("originalPreview").textContent = fileContent;
        lines = fileContent.split("\n")
    };
    reader.readAsText(file);
}

function handleCovertTimingBtn() {
    if(fixInterval.checked) {
        convert();
    } else if (customizeInterval.checked) {
        timing();
    } else if (youtubeMode.checked) {
        youtubeEmbed();
    }
}

function convert() {
    const second = parseFloat(secondInput.value);
    if (isNaN(second)) {
        alert("請輸入純數字並且不要添加任何符號");
        return;
    }

    let srtContent = "";
    let index = 1;
    let startTime = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line !== "") {
            const endTime = startTime + second;
            srtContent += index + "\n";
            srtContent += formatTime(startTime) + " --> " + formatTime(endTime) + "\n";
            srtContent += line + "\n\n";
            startTime = endTime;
            index++;
        }
    }
    // preview result with line breaks
    // var srtDataWithBreaks = srtContent.replace(/\n/g, "<br>"); // 不知道為什麼突然不需要改成<br>了
    document.getElementById("convertedPreview").textContent = srtContent;
}

function formatTime(time) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = (time % 60).toFixed(3).replace(".", ",");
    return `${padZero(hours)}:${padZero(minutes)}:${seconds}`;
}

function formattedTimeForCustomize(time) {
    const milliseconds = Math.floor(time % 1000);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds)}`;
}

function formattedTimeForYoutube(time) {
    const milliseconds = Math.floor((time % 1) * 1000);
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor((time / 60) % 60);
    const hours = Math.floor((time / (60 * 60)) % 24);
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds)}`;
}

function timing() {
    isTiming = !isTiming;
    if(isTiming) {
        convertTimingButton.textContent = "停止計時";
        startTimer();
    } else {
        convertTimingButton.textContent = "開始計時";
        stopTimer();
    }
}

function refreshTiming() {
    cancelAnimationFrame(requestId);
    isTiming = true; // 為了方便做的調整，讓呼叫timing之後可以確定保持在「暫停」的狀態
    timing();
    elapsedTime = 0;
    secondInput.value = "00:00:00.000";
}

function youtubeEmbed() {
    destroyPlayer();
    const youtube_id = secondInput.value;
    if(youtube_id === '') {
        alert("要輸入影片的ID唷！");
        return;
    }
    player = new YT.Player('youtubePlayer', {
        height: '390',
        width: '640',
        videoId: youtube_id,
        playerVars: {
          'playsinline': 1
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // Player is ready, you can perform additional actions here if needed
    setInterval(getCurrentTime, 1); // Update current time every millisecond
}

function destroyPlayer() {
    if (player) {
        player.destroy();
        player = null; // Reset player variable
        console.log('Player destroyed.');
    } else {
        console.log('Player not initialized.');
    }
}

function onPlayerStateChange(event) {
    isVideoPlaying = event.data == YT.PlayerState.PLAYING;
}

function getCurrentTime() {
    if (player && isVideoPlaying) {
        currentTime = player.getCurrentTime();
    }
}

function nextLine() {
    const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(keyEvent);
}

function stopLine() {
    const keyEvent = new KeyboardEvent('keydown', { key: 'b' });
    document.dispatchEvent(keyEvent);
}

function genSRTFromTimer() {
    if(isGeneratingSRT && contentIndex<lines.length) {
        let srtContent = "";
        srtContent += srtIndexForCustomize + "\n";
        srtContent += formattedTimeForCustomize(previousTime) + " --> " + formattedTimeForCustomize(currentTime) + "\n";
        srtContent += lines[contentIndex].trim() + "\n\n";
        document.getElementById("convertedPreview").textContent += srtContent;
        srtIndexForCustomize++;
        contentIndex++;
        convertedPreview.scrollTop = convertedPreview.scrollHeight;
    }
    previousTime = currentTime;
}

function genSRTFromYoutube() {
    if(isGeneratingSRT && contentIndex<lines.length) {
        let srtContent = "";
        srtContent += srtIndexForCustomize + "\n";
        srtContent += formattedTimeForYoutube(previousTime) + " --> " + formattedTimeForYoutube(currentTime) + "\n";
        srtContent += lines[contentIndex].trim() + "\n\n";
        document.getElementById("convertedPreview").textContent += srtContent;
        srtIndexForCustomize++;
        contentIndex++;
        convertedPreview.scrollTop = convertedPreview.scrollHeight;
    }
    previousTime = currentTime;
}

function updateTimer() {
    currentTime = performance.now() - startTime + elapsedTime;
    const milliseconds = Math.floor(currentTime % 1000);
    const seconds = Math.floor((currentTime / 1000) % 60);
    const minutes = Math.floor((currentTime / (1000 * 60)) % 60);
    const hours = Math.floor((currentTime / (1000 * 60 * 60)) % 24);

    const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds)}`;
    secondInput.value = formattedTime;

    requestId = requestAnimationFrame(updateTimer);
}

function parseFormattedTime(formattedTime) {
    const parts = formattedTime.split(':');
    const milliseconds = parseInt(parts[2].split('.')[1]);
    const seconds = parseInt(parts[2].split('.')[0]);
    const minutes = parseInt(parts[1]);
    const hours = parseInt(parts[0]);
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

function startTimer() {
    startTime = performance.now();
    requestId = requestAnimationFrame(updateTimer);
}

function stopTimer() {
    cancelAnimationFrame(requestId);
    elapsedTime = parseFormattedTime(secondInput.value);

}

function padZero(num) {
    return num.toString().padStart(2, "0");
}

function downloadSrt() {
    const blob = new Blob([document.getElementById("convertedPreview").innerHTML.replace(/<br>/g, "\n").replace(/&gt;/g, ">")], {type: "text/plain;charset=utf-8"});
    saveAs(blob, fileName.replace(".txt", ".srt"));
    document.getElementById("convertedPreview").innerHTML = "下載完成！";
}

function saveAs(blob, filename) {
    if (typeof navigator.msSaveOrOpenBlob !== "undefined") {
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            throw new Error("Saving blobs not supported");
        }
    }
}
