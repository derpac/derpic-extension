const token = getCookie("token");
const username = getCookie("user");

const apiKey = token;
const apiUrl = 'https://i.dev.alv.cx/i';

const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("input-img");
const imageView = document.getElementById("img-view");

let selectedItem = null;
let slug = "";
let liveSlug = "";

loadGallery();

function loadGallery() {
    const requestOptions = {
        method: 'GET',
        headers: {
            'X-Derpic-Token': apiKey,
        },
    };

    fetch(apiUrl, requestOptions)
        .then(response => {
            if (!response.ok) {
                window.location.href = "/derpic-login.html";
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const galleryGrid = document.getElementById('galleryGrid');
            galleryGrid.innerHTML = "";
            data.forEach(item => {
                const imgDataStorage = `${apiUrl}/${item.slug}`;
                const img = document.createElement('img');
                img.src = imgDataStorage;
                img.className = "galleryImg";

                const cell = document.createElement('div');
                cell.className = 'grid-item';
                cell.id = `grid-item-slug-${item.slug}`;
                cell.appendChild(img);
                galleryGrid.appendChild(cell);
            });
        })
        .catch(error => console.error('Error:', error));
}

function uploadImageAPI() {
    const file = inputFile.files[0];
    if (!file) {
        console.error("No file selected");
        return;
    }

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'X-Derpic-Token': apiKey,
            'Content-Type': 'application/octet-stream'
        },
        body: file
    };

    fetch(apiUrl, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            loadGallery();
            localStorage.removeItem('imageData');
            document.getElementById('uploadButton').disabled = true;
            inputFile.value = '';
            resetDropArea();
            displayMetadata();
        })
        .catch(error => console.error('Error:', error));
}

function deleteImageAPI() {
    if (!slug) {
        console.error('No slug available for deletion.');
        return;
    }

    const requestOptions = {
        method: 'DELETE',
        headers: {
            'X-Derpic-Token': apiKey,
        },
    };

    fetch(`${apiUrl}/${slug}`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('deleteButton').disabled = true;
            document.getElementById('metadata').textContent = "";
            slug = "";
            loadGallery();
        })
        .catch(error => console.error('Error:', error));
}

function clearDisplayCopyImg() {
    const gridContainer = document.querySelector('.copy-area');
    gridContainer.innerHTML = "";
}

function uploadImage() {
    selectedItem = null;
    slug = "";

    const imgLink = URL.createObjectURL(inputFile.files[0]);
    imageView.innerHTML = `<div class="mainPic" id="mainPic">
                                <img src="${imgLink}">
                            </div>`;
    imageView.style.border = 0;

    clearDisplayCopyImg();
}

function displayMetadata(tags) {
    const metadataElement = document.getElementById('metadata');
    metadataElement.textContent = JSON.stringify(tags, null, 2);
}

async function getImageFile() {
    const imgElement = document.getElementById('imgElement');
    const metadataElement = document.getElementById('metadata');

    if (imgElement && imgElement.src) {
        const imgUrl = imgElement.src;

        try {
            const response = await fetch(imgUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const filename = imgUrl.split('/').pop();
            const file = new File([blob], filename, { type: blob.type });

            metadataElement.textContent = `Slug: ${file.name}\nFile Size: ${file.size} bytes\nFile Type: ${file.type}`;
        } catch (error) {
            console.error('Error fetching image:', error);
            metadataElement.textContent = 'Error fetching image';
        }
    } else {
        metadataElement.textContent = '';
        if (imgElement) imgElement.src = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const nightCheckbox = document.getElementById('night-checkbox');
    nightCheckbox.addEventListener('change', () => {
        nightCheckbox.checked ? lightMode() : nightMode();
    });

    const grid = document.getElementById('galleryGrid');
    const deleteBtn = document.getElementById('deleteButton');

    grid.addEventListener('click', event => {
        if (event.target.closest('.grid-item')) {
            let previouslySelectedItem = document.querySelector('.grid-item.selected');
            selectedItem = event.target.closest('.grid-item');

            if (event.target.closest(".selected")) {
                selectedItem.classList.remove('selected');
                selectedItem = null;
                document.getElementById('deleteButton').disabled = true;
                clearSelectedPopup();
                clearDisplayCopyImg();
            } else {
                if (previouslySelectedItem) {
                    previouslySelectedItem.classList.remove('selected');
                }
                selectedItem.classList.add('selected');
                slug = selectedItem.id.split("-").slice(3).join("-");
                selectedPopup();
                getImageFile();
                clearDisplayCopyImg();
                displayCopyImg();
                document.getElementById('deleteButton').disabled = false;
            }
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedItem) {
            grid.removeChild(selectedItem);
            selectedItem = null;
            clearDisplayCopyImg();
            deleteImageAPI();
            resetDropArea();
        } else {
            alert('Please select an item to delete.');
        }
    });
});

function resetDropArea() {
    const parentDiv = document.getElementById('img-view');
    const childDiv = document.getElementById('mainPic');

    if (parentDiv && childDiv) {
        parentDiv.removeChild(childDiv);
    } else {
        console.error('Parent or child div not found!');
    }
    imageView.innerHTML = "<i class='fa fa-photo' style='font-size: 150px;'></i><p>Click here <br> to upload image</p>";
    imageView.style.border = "2px dashed #a8a8a8";
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

document.getElementById('logoutButton').addEventListener('click', () => {
    deleteCookie('username');
    deleteCookie('token');
    window.location.href = '/derpic-login.html';
});

function adjustFontSize() {
    const container = document.getElementById('info-area');
    const text = document.getElementById('metadata');
    text.style.fontSize = (container.clientWidth / 19) + 'px';
}

window.addEventListener('resize', adjustFontSize);
window.addEventListener('load', adjustFontSize);

function copyURL() {
    const customCheck = document.getElementById("cus");
    let rotationdeg, widthpx, heightpx, flipvBool, fliphBool;
    const allowedValues = [0, 90, 180, 270, 360];

    if (customCheck.checked) {
        const rotation = document.getElementById("rt");
        const width = document.getElementById("wd");
        const height = document.getElementById("hi");
        const flipvCB = document.getElementById("fv");
        const fliphCB = document.getElementById("fh");

        rotationdeg = allowedValues.includes(parseInt(rotation.value, 10)) ? rotation.value : 0;
        widthpx = width.value > 5 ? calculateWidth(extractWidth(), width.value) : extractWidth();
        heightpx = height.value > 5 ? calculateHeight(extractHeight(), height.value) : extractHeight();
        flipvBool = flipvCB.checked ? "true" : "false";
        fliphBool = fliphCB.checked ? "true" : "false";

        if (widthpx && heightpx && rotationdeg) {
            const copyURL = `https://i.dev.alv.cx/i/${slug}?rotation=${rotationdeg}&width=${widthpx}&height=${heightpx}&flipv=${flipvBool}&fliph=${fliphBool}`;
            navigator.clipboard.writeText(copyURL).then(() => {
                alert('URL copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy URL: ', err);
            });
        } else {
            console.error('Invalid parameters for URL construction.');
        }
    } else {
        alert("Custom mode is not enabled. Select custom mode and set parameters.");
    }
}

function calculateWidth(originalWidth, scale) {
    return originalWidth * (scale / 100);
}

function calculateHeight(originalHeight, scale) {
    return originalHeight * (scale / 100);
}

function extractHeight() {
    const img = new Image;
    img.src = `https://i.dev.alv.cx/i/${slug}`

 
      
    const height = img.height;
  
    return height;
    

}

function extractWidth() {
    const img = new Image;
    img.src = `https://i.dev.alv.cx/i/${slug}`

   
        
    const width = img.width;
    
    return width;
    
}