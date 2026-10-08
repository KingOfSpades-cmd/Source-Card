// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('my_canvas');
    const ctx = canvas.getContext('2d');
    const textEditor = document.getElementById('canvas_text_editor');
    const canvasStage = document.querySelector('.canvas-stage');
    const downloadBtn = document.getElementById('download_btn');

    // Controls
    const bodyFontFamily = document.getElementById('body_font_style');
    const bodyFontSize = document.getElementById('body_font_size');
    const bodyTextAlignment = document.getElementById('body_text_alignment');
    
    const toggleProfile = document.getElementById('toggle_profile');
    const profileControls = document.getElementById('profile_controls');
    const uploadProfile = document.getElementById('upload_profile');
    const usernameInput = document.getElementById('username_input');
    const handleInput = document.getElementById('social_media_handle_input');
    const profilePreviewSvg = document.getElementById('profile_preview_svg');
    const profilePreviewImg = document.getElementById('profile_preview_img');
    const profileUploadFeedback = document.getElementById('profile_upload_feedback');

    const toggleTitle = document.getElementById('toggle_title');
    const titleControls = document.getElementById('title_controls');
    const titleInput = document.getElementById('title_input');
    const titleFontFamily = document.getElementById('title_font_style');
    const titleFontSize = document.getElementById('title_font_size');
    const titleTextAlignment = document.getElementById('title_text_alignment');

    const toggleBorder = document.getElementById('toggle_border');
    const borderControls = document.getElementById('border_controls');
    const borderWidthInput = document.getElementById('border_width');
    const borderColorInput = document.getElementById('border_color');
    const toggleCardSettings = document.getElementById('toggle_card_settings');
    const cardSettingsControls = document.getElementById('card_settings_controls');
    const backgroundModeControl = document.getElementById('background_mode');
    const backgroundColorControls = document.getElementById('background_color_controls');
    const backgroundGradientControls = document.getElementById('background_gradient_controls');
    const backgroundImageControls = document.getElementById('background_image_controls');
    const backgroundColorInput = document.getElementById('background_color');
    const gradientColorStartInput = document.getElementById('gradient_color_start');
    const gradientColorEndInput = document.getElementById('gradient_color_end');
    const borderColorValue = document.getElementById('border_color_value');
    const uploadCardBackground = document.getElementById('upload_card_background');
    const backgroundImageName = document.getElementById('background_image_name');

    let profileImage = null;
    let cardBackgroundImage = null;
    let cardBackgroundMode = 'color';
    let isResizingCanvas = false;
    const maxImageFileSize = 5 * 1024 * 1024;
    const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

    function getImageFileError(file) {
        if (file.size > maxImageFileSize) return 'Image must be 5 MB or smaller.';
        if (!supportedImageTypes.has(file.type.toLowerCase())) return 'Choose a PNG, JPG, GIF, or WebP image.';
        return '';
    }

    function setUploadFeedback(element, message, state = 'info') {
        element.textContent = message;
        element.dataset.state = state;
    }

    function loadImageFile(file, onLoad, onError) {
        const reader = new FileReader();
        reader.onerror = onError;
        reader.onload = event => {
            const image = new Image();
            image.onload = () => onLoad(image, event.target.result);
            image.onerror = onError;
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function getEditorText() {
        const lines = Array.from(textEditor.childNodes).map(node => {
            if (node.nodeType === Node.TEXT_NODE) return node.textContent;
            if (node.nodeName === 'BR') return '';
            return node.textContent || '';
        });
        return lines.join('\n').replace(/\u00a0/g, ' ').replace(/\n+$/, '');
    }

    function getSelectedAlignment(control) {
        return control.querySelector('[aria-pressed="true"]').dataset.alignment;
    }

    function getAlignedTextX(alignment, width, padding) {
        if (alignment === 'center') return width / 2;
        if (alignment === 'right') return width - padding;
        return padding;
    }

    function updateColorPicker(input) {
        const picker = input.closest('.color-picker');
        picker.querySelector('.color-picker__wheel').style.setProperty('--selected-color', input.value);
        picker.querySelector('output').textContent = input.value.toUpperCase();
    }

    function positionTextEditor(currentY, font, fontSize, alignment) {
        const canvasRect = canvas.getBoundingClientRect();
        const scale = canvasRect.width / canvas.width;
        textEditor.style.left = `${40 * scale}px`;
        textEditor.style.top = `${currentY * scale}px`;
        textEditor.style.width = `${(canvas.width - 80) * scale}px`;
        textEditor.style.fontFamily = font;
        textEditor.style.fontSize = `${fontSize * scale}px`;
        textEditor.style.lineHeight = `${1.4 * fontSize * scale}px`;
        textEditor.style.textAlign = alignment;
    }

    // Wrap text but respect explicit newline characters
    function wrapText(text, maxWidth, font, fontSize) {
        ctx.font = `${fontSize}px ${font}`;
        const paragraphs = text.split('\n');
        const lines = [];

        for (const p of paragraphs) {
            if (p === '') {
                lines.push(''); // preserve empty line
                continue;
            }
            const words = p.split(' ');
            let currentLine = words[0] || '';

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine ? currentLine + ' ' + word : word;
                if (ctx.measureText(testLine).width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine !== '') lines.push(currentLine);
        }

        return lines;
    }

    function drawCanvas(forceBodyText = false) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bWidth = toggleBorder.checked ? (parseInt(borderWidthInput.value) || 0) : 0;
        const radius = 10; // Match CSS border-radius

        // Clip the selected background to the card's rounded corners.
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
        ctx.clip();
        if (cardBackgroundMode === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, gradientColorStartInput.value);
            gradient.addColorStop(1, gradientColorEndInput.value);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (cardBackgroundMode === 'image' && cardBackgroundImage) {
            const scale = Math.max(canvas.width / cardBackgroundImage.width, canvas.height / cardBackgroundImage.height);
            const imageWidth = cardBackgroundImage.width * scale;
            const imageHeight = cardBackgroundImage.height * scale;
            ctx.drawImage(
                cardBackgroundImage,
                (canvas.width - imageWidth) / 2,
                (canvas.height - imageHeight) / 2,
                imageWidth,
                imageHeight
            );
        } else {
            ctx.fillStyle = backgroundColorInput.value || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        const padding = 40;
        let currentY = padding;

        // Draw Border
        if (toggleBorder.checked && bWidth > 0) {
            const bColor = borderColorInput.value || '#000000';
            ctx.strokeStyle = bColor;
            ctx.lineWidth = bWidth;
            ctx.beginPath();
            // Draw stroke such that it aligns with the edge of the canvas correctly
            ctx.roundRect(bWidth / 2, bWidth / 2, canvas.width - bWidth, canvas.height - bWidth, radius);
            ctx.stroke();
        }

        // Draw Profile
        if (toggleProfile.checked) {
            const profileX = padding;
            const profileY = padding;
            const profileSize = 50;

            // Draw Profile Picture
            ctx.save();
            ctx.beginPath();
            ctx.arc(profileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
            ctx.clip();
            if (profileImage) {
                ctx.drawImage(profileImage, profileX, profileY, profileSize, profileSize);
            } else {
                // Default blank profile
                ctx.fillStyle = '#ccc';
                ctx.fillRect(profileX, profileY, profileSize, profileSize);
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(profileX + profileSize / 2, profileY + profileSize * 0.4, profileSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(profileX + profileSize / 2, profileY + profileSize * 1.1, profileSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Draw Username and Handle
            const textX = profileX + profileSize + 15;
            const name = usernameInput.value || 'Username';
            const handle = handleInput.value || '@handle';

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px Inter';
            ctx.fillText(name, textX, profileY + 5);

            ctx.fillStyle = '#666';
            ctx.font = '14px Inter';
            ctx.fillText(handle, textX, profileY + 28);

            currentY = profileY + profileSize + 20;
        }

        // Draw Title
        if (toggleTitle.checked && titleInput.value) {
            const titleText = titleInput.value;
            const tFont = titleFontFamily.value;
            const tSize = parseInt(titleFontSize.value);
            const alignment = getSelectedAlignment(titleTextAlignment);

            ctx.fillStyle = '#000';
            ctx.font = `bold ${tSize}px ${tFont}`;
            ctx.textAlign = alignment;
            ctx.textBaseline = 'top';

            const titleLines = wrapText(titleText, canvas.width - padding * 2, `bold ${tSize}px`, tFont);
            const titleX = getAlignedTextX(alignment, canvas.width, padding);
            for (const line of titleLines) {
                ctx.fillText(line, titleX, currentY);
                currentY += tSize * 1.2;
            }
            currentY += 10;
        }

        // Draw Body Text
        const bFont = bodyFontFamily.value;
        const bSize = parseInt(bodyFontSize.value);
        const bodyAlignment = getSelectedAlignment(bodyTextAlignment);
        positionTextEditor(currentY, bFont, bSize, bodyAlignment);
        let text = getEditorText();
        if (!text) text = 'Type your thoughts here...';

        ctx.font = `${bSize}px ${bFont}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = bodyAlignment;
        ctx.textBaseline = 'top';

        const bodyLines = wrapText(text, canvas.width - padding * 2, bFont, bSize);
        const bodyX = getAlignedTextX(bodyAlignment, canvas.width, padding);
        const lastBodyLineY = currentY + Math.max(0, bodyLines.length - 1) * bSize * 1.4;
        const requiredHeight = Math.ceil(Math.max(450, lastBodyLineY + bSize * 1.4 + 10));
        if (canvas.height !== requiredHeight && !isResizingCanvas) {
            isResizingCanvas = true;
            canvas.height = requiredHeight;
            drawCanvas(forceBodyText);
            isResizingCanvas = false;
            return;
        }

        if (forceBodyText) {
            for (const line of bodyLines) {
                ctx.fillText(line, bodyX, currentY);
                currentY += bSize * 1.4;
            }
        }
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileError = getImageFileError(file);
        if (fileError) {
            setUploadFeedback(profileUploadFeedback, fileError, 'error');
            uploadProfile.value = '';
            return;
        }

        loadImageFile(file, (image, dataUrl) => {
            profileImage = image;
            profilePreviewImg.src = dataUrl;
            profilePreviewImg.style.display = 'block';
            profilePreviewSvg.style.display = 'none';
            setUploadFeedback(profileUploadFeedback, `${file.name} uploaded`, 'success');
            drawCanvas();
        }, () => {
            setUploadFeedback(profileUploadFeedback, 'Could not read that image. Try another file.', 'error');
            uploadProfile.value = '';
        });
    }

    // Toggle logic
    toggleProfile.addEventListener('change', () => {
        profileControls.style.display = toggleProfile.checked ? 'block' : 'none';
        drawCanvas();
    });

    toggleTitle.addEventListener('change', () => {
        titleControls.style.display = toggleTitle.checked ? 'block' : 'none';
        drawCanvas();
    });

    toggleBorder.addEventListener('change', () => {
        borderControls.hidden = !toggleBorder.checked;
        drawCanvas();
    });

    toggleCardSettings.addEventListener('change', () => {
        cardSettingsControls.hidden = !toggleCardSettings.checked;
    });

    backgroundModeControl.addEventListener('click', event => {
        const selectedButton = event.target.closest('[data-background]');
        if (!selectedButton) return;

        cardBackgroundMode = selectedButton.dataset.background;
        backgroundModeControl.querySelectorAll('[data-background]').forEach(button => {
            const isSelected = button === selectedButton;
            button.classList.toggle('is-active', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
        backgroundColorControls.hidden = cardBackgroundMode !== 'color';
        backgroundGradientControls.hidden = cardBackgroundMode !== 'gradient';
        backgroundImageControls.hidden = cardBackgroundMode !== 'image';
        drawCanvas();
    });

    // Input listeners
    [textEditor, bodyFontFamily, bodyFontSize, usernameInput, handleInput, titleInput, titleFontFamily, titleFontSize, borderWidthInput, borderColorInput, backgroundColorInput, gradientColorStartInput, gradientColorEndInput].forEach(el => {
        el.addEventListener('input', () => {
            if (el.type === 'color') updateColorPicker(el);
            drawCanvas();
        });
    });

    [backgroundColorInput, gradientColorStartInput, gradientColorEndInput, borderColorInput].forEach(updateColorPicker);

    uploadCardBackground.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file) return;

        const fileError = getImageFileError(file);
        if (fileError) {
            setUploadFeedback(backgroundImageName, fileError, 'error');
            uploadCardBackground.value = '';
            return;
        }

        loadImageFile(file, image => {
            cardBackgroundImage = image;
            setUploadFeedback(backgroundImageName, `${file.name} uploaded`, 'success');
            drawCanvas();
        }, () => {
            setUploadFeedback(backgroundImageName, 'Could not read that image. Try another file.', 'error');
            uploadCardBackground.value = '';
        });
    });

    [bodyTextAlignment, titleTextAlignment].forEach(control => {
        control.addEventListener('click', event => {
            const selectedButton = event.target.closest('[data-alignment]');
            if (!selectedButton) return;

            control.querySelectorAll('[data-alignment]').forEach(button => {
                const isSelected = button === selectedButton;
                button.classList.toggle('is-active', isSelected);
                button.setAttribute('aria-pressed', String(isSelected));
            });
            drawCanvas();
        });
    });

    uploadProfile.addEventListener('change', handleImageUpload);

    textEditor.addEventListener('focus', () => {
        textEditor.classList.add('editing');
        drawCanvas();
    });

    textEditor.addEventListener('blur', () => {
        textEditor.classList.remove('editing');
        drawCanvas();
    });

    canvasStage.addEventListener('click', (event) => {
        if (event.target !== canvas && event.target !== canvasStage) return;

        textEditor.focus({ preventScroll: true });
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(textEditor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    });

    // Click SVG to upload
    profilePreviewSvg.addEventListener('click', () => uploadProfile.click());
    profilePreviewImg.addEventListener('click', () => uploadProfile.click());


    
    // Initial draw
    drawCanvas();

    // Single download handler: generate blob, trigger download, then show donation modal
    downloadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (downloadBtn.disabled) return;
        downloadBtn.disabled = true;
        drawCanvas(true);

        let textSource='';
        if (toggleTitle.checked && titleInput.value.trim()) {
            textSource = titleInput.value.trim();
        } else if (getEditorText().trim()) {
            textSource = getEditorText().trim();
        }

        let fileName = 'source-card';
        if (textSource) {
            const words = textSource.trim().split(/\s+/).slice(0, 5);
            const sanitizedWords = words
                .map(word => word.replace(/[^a-zA-Z0-9]/gi, ''))
                .filter(word => word.length > 0);
            if (sanitizedWords.length > 0) {
                fileName = sanitizedWords.join('-').toLowerCase();
            }
        }

        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName ? `${fileName}.png` : 'source-card.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            drawCanvas();
            showDonationModal();
            setTimeout(() => downloadBtn.disabled = false, 500);
        }, 'image/png');
    });

    // Copy to clipboard handler
    const copyBtn = document.getElementById('copy_to_clipboard_btn');
    const copyFeedback = document.getElementById('copy_feedback');

    if (copyBtn) {
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (copyBtn.disabled) return;
            copyBtn.disabled = true;
            drawCanvas(true);

            canvas.toBlob(function(blob) {
                drawCanvas();
                if (navigator.clipboard && window.ClipboardItem) {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then(() => {
                        // show tick state and feedback
                        copyBtn.classList.add('copied');
                        if (copyFeedback) {
                            copyFeedback.hidden = false;
                            copyFeedback.textContent = 'Copied to clipboard';
                        }
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            if (copyFeedback) copyFeedback.hidden = true;
                            copyBtn.disabled = false;
                        }, 1500);
                    }).catch(err => {
                        console.error('Failed to copy image to clipboard', err);
                        if (copyFeedback) {
                            copyFeedback.hidden = false;
                            copyFeedback.textContent = 'Copy failed — try downloading instead';
                        }
                        setTimeout(() => {
                            if (copyFeedback) copyFeedback.hidden = true;
                            copyBtn.disabled = false;
                        }, 1800);
                    });
                } else {
                    // Fallback: inform user that browser doesn't support direct image clipboard writes
                    if (copyFeedback) {
                        copyFeedback.hidden = false;
                        copyFeedback.textContent = 'Your browser does not support copying images to clipboard. Use Download.';
                    }
                    setTimeout(() => {
                        if (copyFeedback) copyFeedback.hidden = true;
                        copyBtn.disabled = false;
                    }, 2000);
                }
            }, 'image/png');
        });
    }

    function showDonationModal() {
        // Respect user's "don't show again" preference
        try {
            if (localStorage.getItem('donation_do_not_show') === '1') return;
        } catch (err) {
            // ignore localStorage errors (e.g., private mode)
        }
        const modal = document.getElementById('donation_modal');
        modal.setAttribute('aria-hidden', 'false');
        // focus the primary CTA
        const cta = modal.querySelector('.donation-btn');
        cta && cta.focus();
        // prevent quick double-opens
        modal.dataset.opened = '1';
    }
    function hideDonationModal() {
        const modal = document.getElementById('donation_modal');
        // persist "don't show again" if user checked it
        const checkbox = modal.querySelector('#donation_dont_show');
        if (checkbox && checkbox.checked) {
            try {
                localStorage.setItem('donation_do_not_show', '1');
            } catch (err) {
                /* ignore */
            }
        }
        modal.setAttribute('aria-hidden', 'true');
        // return focus to download button
        document.getElementById('download_btn').focus();
    }

    document.getElementById('donation_close').addEventListener('click', hideDonationModal);
    document.getElementById('donation_no').addEventListener('click', hideDonationModal);

    // close on backdrop click
    document.querySelector('.donation-modal__backdrop').addEventListener('click', hideDonationModal);

    // close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hideDonationModal();
    });
});