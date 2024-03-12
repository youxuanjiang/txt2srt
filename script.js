const fileInput = document.getElementById("fileInput");
const fixInterval = document.getElementById("fix_interval");
const customizeInterval = document.getElementById("customize_interval");
const convertTimingButton = document.getElementById("convert-timing");
const secondInput = document.getElementById("secondInput");

let fileContent = "";
let fileName = "";
let isTiming = false;
let timmerInterval;
let startTime;
let elapsedTime = 0;
let requestId;

fileInput.addEventListener('change', function() {
    handleFileSelect();
});

fixInterval.addEventListener('change', function (){
    if(fixInterval.checked) {
        secondInput.disabled = false;
        secondInput.value = "";
        convertTimingButton.textContent = "轉換";
    }
});

customizeInterval.addEventListener('change', function() {
    if(customizeInterval.checked) {
        secondInput.disabled = true;
        secondInput.value = "00:00:00.000";
        convertTimingButton.textContent = "計時開始";
    }
})

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
    };
    reader.readAsText(file);
}

function handleCovertTimingBtn() {
    if(fixInterval.checked) {
        convert();
    } else if (customizeInterval.checked) {
        timing();
    }
}

function convert() {
    const second = parseFloat(secondInput.value);
    if (isNaN(second)) {
        alert("請輸入純數字並且不要添加任何符號");
        return;
    }

    const lines = fileContent.split("\n");
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

function updateTimer() {
    const currentTime = performance.now() - startTime + elapsedTime;
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
