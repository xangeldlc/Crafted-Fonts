document.addEventListener('DOMContentLoaded', () => {
    const newPackForm = document.getElementById('newPackForm');
    const existingPackForm = document.getElementById('existingPackForm');
    const imageUpload = document.getElementById('imageUpload');
    const additionalImageUpload = document.getElementById('additionalImageUpload');
    const packIcon = document.getElementById('packIcon');
    const existingZip = document.getElementById('existingZip');
    const imageList = document.getElementById('imageList');
    const additionalImageList = document.getElementById('additionalImageList');
    const extractedContent = document.getElementById('extractedContent');
    const extractedImages = document.getElementById('extractedImages');
    const extractedConfig = document.getElementById('extractedConfig');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

    let images = [];
    let additionalImages = [];
    let existingZipContent = null;
    let packIconFile = null;

    const charLibrary = [
        'ツ', '♋', '웃', '유', 'Σ', '⊗', '♒', '☠', '☮', '☯', '♠', 'Ω', '♤', '♣', '♧', '♥', '♡', '♦', '♢', '♔', '♕', '♚', '♛', '★', '☆', '✮', '✯', '☄', '☾', '☽', '☼', '☀', '☁', '☂', '☃', '☻', '☺', '۞', '۩', '♬', '✄', '✂', '✆', '✉', '✦', '✧', '∞', '♂', '♀', '☿', '❤', '❥', '❦', '❧', '™', '®', '©', '✗', '✘', '⊗', '♒', '▢', '▲', '△', '▼', '▽', '◆', '◇', '○', '◎', '●', '◯', 'Δ', '◕', '◔', 'ʊ', 'ϟ', 'ღ', '回', '₪', '✓', '✔', '✕', '✖', '☢', '☣', '☤', '☥', '☦', '☧', '☨', '☩', '☪', '☫', '☬', '☭'
    ];

    let charIndex = 0;
    let usedChars = new Set();

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('class', 'dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('class', '');
            localStorage.setItem('theme', 'light');
        }    
    }

    toggleSwitch.addEventListener('change', switchTheme, false);

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('class', currentTheme === 'dark' ? 'dark-mode' : '');
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    } else {
        // Set dark mode as default if no theme is stored in localStorage
        document.documentElement.setAttribute('class', 'dark-mode');
        toggleSwitch.checked = true;
        localStorage.setItem('theme', 'dark');
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    async function processImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 256;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(blob => {
                        const resizedFile = new File([blob], file.name, {
                            type: 'image/png',
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    }, 'image/png');
                } else {
                    resolve(file);
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    function normalizeFileName(fileName) {
        return fileName.toLowerCase()
                      .replace(/ñ/g, 'n')
                      .replace(/[^a-z0-9.-]/g, '');
    }

    async function handleImageUpload(e, imageArray, listElement) {
        const files = Array.from(e.target.files).filter(file => file.type === 'image/png');
        const processedFiles = await Promise.all(files.map(async file => {
            const processedFile = await processImage(file);
            const normalizedName = normalizeFileName(file.name);
            return {
                file: Object.defineProperty(processedFile, 'name', {
                    writable: true,
                    value: normalizedName
                }),
                char: getNextChar()
            };
        }));
        
        imageArray.push(...processedFiles);
        updateImageList(listElement, imageArray);
        e.target.value = '';
    }

    imageUpload.addEventListener('change', e => handleImageUpload(e, images, imageList));
    additionalImageUpload.addEventListener('change', e => handleImageUpload(e, additionalImages, additionalImageList));

    packIcon.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'image/png') {
            packIconFile = await processImage(file);
            showToast('Pack icon loaded successfully', 'success');
        } else {
            showToast('Please select a valid PNG file', 'error');
        }
    });

    function updateImageList(listElement, imageArray, providers = []) {
        const existingChars = {};
        document.querySelectorAll('[id^="chars-"]').forEach(input => {
            const index = input.id.split('-')[1];
            existingChars[index] = input.value;
        });

        listElement.innerHTML = '';
        imageArray.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            const fileName = image.name || image.file?.name || image;
            const provider = providers[index] || {};
        
            const imageUrl = (image instanceof File || image.file instanceof File) ? URL.createObjectURL(image.file || image) : null;
            const char = existingChars[index] || provider.chars?.[0] || getNextChar();
        
            item.innerHTML = `
                ${imageUrl ? `<img src="${imageUrl}" alt="${fileName}">` : ''}
                <p>${fileName}</p>
                <p class="help-text">Recommended size: 32px x 32px Maximum size: 256x256</p>
                <label>
                    Ascent:
                    <input type="number" id="ascent-${index}" value="${provider.ascent || 9}">
                </label>
                <label>
                    Height:
                    <input type="number" id="height-${index}" value="${provider.height || 11}">
                </label>
                <label>
                    Chars:
                    <input type="text" id="chars-${index}" value="${char}">
                </label>
                <button type="button" class="remove-image" data-index="${index}">×</button>
            `;
            listElement.appendChild(item);

            const charsInput = document.getElementById(`chars-${index}`);
            charsInput.addEventListener('change', (e) => {
                // Asegurarse de que los unicodes se guarden correctamente
                const value = e.target.value;
                if (value.startsWith('\\u')) {
                    try {
                        const char = JSON.parse('"' + value + '"');
                        e.target.value = char;
                    } catch (error) {
                        console.error('Invalid unicode sequence');
                    }
                }
                updateUsedChars();
            });
        });
        updateUsedChars();
    }

    function getNextChar() {
        let nextChar;
        for (let i = 0; i < charLibrary.length; i++) {
            nextChar = charLibrary[charIndex % charLibrary.length];
            charIndex++;
            if (!usedChars.has(nextChar)) {
                return nextChar;
            }
        }
        return String.fromCharCode(0xE000 + Math.floor(Math.random() * (0xF8FF - 0xE000 + 1)));
    }

    function updateUsedChars() {
        usedChars.clear();
        document.querySelectorAll('[id^="chars-"]').forEach(input => {
            if (input.value) {
                usedChars.add(input.value);
            }
        });
    }

    function removeImage(index, imageArray, listElement) {
        imageArray.splice(index, 1);
        updateImageList(listElement, imageArray);
    }

    imageList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image')) {
            const index = parseInt(e.target.dataset.index);
            removeImage(index, images, imageList);
        }
    });

    additionalImageList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image')) {
            const index = parseInt(e.target.dataset.index);
            removeImage(index, additionalImages, additionalImageList);
        }
    });

    newPackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const packName = document.getElementById('packName').value;
        const gameVersion = document.getElementById('gameVersion').value;

        if (!packName || !gameVersion) {
            showToast('Please complete all required fields', 'error');
            return;
        }

        let zip = new JSZip();

        const packMcmeta = {
            pack: {
                pack_format: parseInt(gameVersion),
                description: packName
            }
        };
        zip.file("pack.mcmeta", JSON.stringify(packMcmeta, null, 2));

        const defaultJson = {
            providers: images.map((image, index) => ({
                type: "bitmap",
                file: `along:font/${image.file.name}`,
                ascent: parseInt(document.getElementById(`ascent-${index}`).value),
                height: parseInt(document.getElementById(`height-${index}`).value),
                chars: [document.getElementById(`chars-${index}`).value]
            }))
        };
        zip.file("assets/minecraft/font/default.json", JSON.stringify(defaultJson, null, 2));

        for (let image of images) {
            const imageData = await readFileAsArrayBuffer(image.file);
            zip.file(`assets/along/textures/font/${image.file.name}`, imageData);
        }

        if (packIconFile) {
            const iconData = await readFileAsArrayBuffer(packIconFile);
            zip.file("pack.png", iconData);
        }

        generateAndDownloadZip(zip, packName);
    });

    existingPackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!existingZipContent) {
            showToast("Please load an existing ZIP file first.", 'error');
            return;
        }

        let zip = existingZipContent;

        try {
            const defaultJsonContent = await zip.file("assets/minecraft/font/default.json").async("string");
            let defaultJson = JSON.parse(defaultJsonContent);

            const newProviders = additionalImages.map((image, index) => ({
                type: "bitmap",
                file: `along:font/${image.file.name}`,
                ascent: parseInt(document.getElementById(`ascent-${index}`).value),
                height: parseInt(document.getElementById(`height-${index}`).value),
                chars: [document.getElementById(`chars-${index}`).value]
            }));

            defaultJson.providers = [...defaultJson.providers, ...newProviders];
            zip.file("assets/minecraft/font/default.json", JSON.stringify(defaultJson, null, 2));

            for (let image of additionalImages) {
                const imageData = await readFileAsArrayBuffer(image.file);
                zip.file(`assets/along/textures/font/${image.file.name}`, imageData);
            }

            generateAndDownloadZip(zip, "modified_texture_pack");
        } catch (error) {
            showToast(`Error modifying the package: ${error.message}`, 'error');
        }
    });

    function generateAndDownloadZip(zip, fileName) {
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Texture pack generated successfully", 'success');
        })
        .catch(function(error) {
            showToast(`Error generating the file: ${error.message}`, 'error');
        });
    }

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
});
