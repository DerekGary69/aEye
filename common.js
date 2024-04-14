import { imageViewBase64 } from './chat.js';

let numToasts = 0;
let topOffset = 0;

function showToast(message, timeout = 3000) {

    
    
    let toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerHTML = message;
    toast.style.top = topOffset + 'px';

    document.body.appendChild(toast);

    topOffset += toast.offsetHeight;

    numToasts++;

    setTimeout(() => {
        toast.classList.add('toastclose');
    }, timeout - 1000);

    setTimeout(() => {
        topOffset -= toast.offsetHeight;

        toast.remove();
        numToasts--;
    }, timeout);
}

document.addEventListener('DOMContentLoaded', function() {

    let captureBtn = document.getElementById('captureBtn');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

    let key = document.getElementById('keyInput');

    let vf = document.getElementById('viewfinder');
    let toggleVfBtn = document.getElementById('toggleVfBtn');
    let viewBtn = document.getElementById('viewBtn');
    addTooltip(viewBtn, 'View the AI response');
    addTooltip(toggleVfBtn, 'Toggle the camera viewfinder');

    toggleVfBtn.addEventListener('click', function() {
        toggleCamViewFinder(vf, 'environment', canvas);
        showToast('Toggled camera viewfinder');
    });

    // toggleCamViewFinder(vf, 'environment', canvas);

    let vfPrompt = document.getElementById('vfPrompt');

    captureBtn.addEventListener('click', function() {
        if(!vf.srcObject) {
            // showToast('Please start the camera first');
            toggleCamViewFinder(vf, 'environment', canvas);
            return;
        }
        // Set the canvas dimensions to the video dimensions
        canvas.width = vf.videoWidth;
        canvas.height = vf.videoHeight;

        // Draw the current frame of the video onto the canvas
        context.drawImage(vf, 0, 0, canvas.width, canvas.height);
        toggleCamViewFinder(vf, 'environment', canvas);
        
        
        viewBtn.disabled = false;

    });

    viewBtn.addEventListener('click', async function() {
        viewBtn.disabled = true;
        let aiResContainer = document.getElementById('aiResContainer');
        aiResContainer.classList.remove('d-none');
        let viewSpinner = document.getElementById('viewSpinner');
        viewSpinner.classList.remove('d-none');
        canvas.toBlob(async function(blob) {
            
            let imageFile = new File([blob], 'frame.png', {type: 'image/png'});

            let chatObj = {
                model: 'gpt-4-vision-preview',
                messages: []
            };

            

            if(vfPrompt.value === '') vfPrompt.value = null;
        
            await imageViewBase64(imageFile, chatObj, vfPrompt.value, key.value).then(response => {

                console.log(response.choices[0].message.content);
                let aiResText = response.choices[0].message.content;
                let resDisp = document.getElementById('resDisp');
                resDisp.innerHTML = aiResText;
                viewBtn.disabled = false;
                viewSpinner.classList.add('d-none');
                resDisp.scrollIntoView({behavior: 'smooth'});
            });
        }, 'image/png');
    });

    let imgInputBtn = document.getElementById('imgInputBtn');
    addTooltip(imgInputBtn, 'Upload an image from your device');
    imgInputBtn.addEventListener('click', function() {
        let fileInput = document.getElementById('fileInput');
        fileInput.click();

        
    });

    fileInput.addEventListener('change', function() {

        let file = fileInput.files[0];
        let url = URL.createObjectURL(file);

        let img = new Image();
        img.src = url;
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
        };
        canvas.classList.remove('d-none');

        viewBtn.disabled = false;
    });

});

function toggleCamViewFinder(viewfinder, facingMode = 'user', canvas = null) {
    if(viewfinder.srcObject) {
        viewfinder.pause();
        viewfinder.srcObject.getTracks().forEach(track => track.stop());
        viewfinder.srcObject = null;
        canvas.classList.remove('d-none')
        viewfinder.classList.add('d-none')
    } else {
        


        // Check if the browser supports the getUserMedia API
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Request access to the camera
            navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode }  })
                .then(function(stream) {
                    // Set the source of the video element to the camera stream
                    viewfinder.srcObject = stream;
                    viewfinder.play();
                    canvas.classList.add('d-none')

                    viewfinder.classList.remove('d-none')
                })
                .catch(function(error) {
                    console.error('Error accessing camera: ' + error);
                });
        } else {
            console.error('getUserMedia not supported in this browser.');
        }
    }
}

function addTooltip(element, tooltipText) {
    let tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.textContent = tooltipText;

    element.appendChild(tooltip);

    element.addEventListener('mouseenter', function() {
        tooltip.style.display = 'block';
        tooltip.style.opacity = 1;
    });

    element.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
        tooltip.style.opacity = 0;
    });
}

function removeTooltip(element) {
    let tooltip = element.querySelector('.tooltip');

    if (tooltip) {
        element.removeChild(tooltip);
    }
}