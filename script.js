// Wait for DOM to be ready

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('my_canvas');
    const ctx = canvas.getContext('2d');
    const textArea = document.getElementById('text_area');
    const downloadBtn = document.getElementById('download_btn');

    // Controls
    const bodyFontFamily = document.getElementById('body_font_style');
    const bodyFontSize = document.getElementById('body_font_size');
    
    const toggleProfile = document.getElementById('toggle_profile');
    const profileControls = document.getElementById('profile_controls');
    const uploadProfile = document.getElementById('upload_profile');
    const usernameInput = document.getElementById('username_input');
    const handleInput = document.getElementById('social_media_handle_input');
    const profilePreviewSvg = document.getElementById('profile_preview_svg');
    const profilePreviewImg = document.getElementById('profile_preview_img');

    const toggleTitle = document.getElementById('toggle_title');
    const titleControls = document.getElementById('title_controls');
    const titleInput = document.getElementById('title_input');
    const titleFontFamily = document.getElementById('title_font_style');
    const titleFontSize = document.getElementById('title_font_size');

    const toggleBorder = document.getElementById('toggle_border');
    const borderControls = document.getElementById('border_controls');
    const borderWidthInput = document.getElementById('border_width');
    const borderColorInput = document.getElementById('border_color');

    let profileImage = null;

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

    function drawCanvas() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bWidth = toggleBorder.checked ? (parseInt(borderWidthInput.value) || 0) : 0;
        const radius = 10; // Match CSS border-radius

        // White background (clipped to rounded rectangle for exports)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
        ctx.clip();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

            ctx.fillStyle = '#000';
            ctx.font = `bold ${tSize}px ${tFont}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            const titleLines = wrapText(titleText, canvas.width - padding * 2, `bold ${tSize}px`, tFont);
            for (const line of titleLines) {
                ctx.fillText(line, padding, currentY);
                currentY += tSize * 1.2;
            }
            currentY += 10;
        }

        // Draw Body Text
        let text = textArea.value;
        if (!text) text = 'Type your thoughts here...';

        const bFont = bodyFontFamily.value;
        const bSize = parseInt(bodyFontSize.value);
        ctx.font = `${bSize}px ${bFont}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const bodyLines = wrapText(text, canvas.width - padding * 2, bFont, bSize);
        for (const line of bodyLines) {
            ctx.fillText(line, padding, currentY);
            currentY += bSize * 1.4;
        }
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    profileImage = img;
                    profilePreviewImg.src = event.target.result;
                    profilePreviewImg.style.display = 'block';
                    profilePreviewSvg.style.display = 'none';
                    drawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
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
        borderControls.style.display = toggleBorder.checked ? 'block' : 'none';
        drawCanvas();
    });

    // Input listeners
    [textArea, bodyFontFamily, bodyFontSize, usernameInput, handleInput, titleInput, titleFontFamily, titleFontSize, borderWidthInput, borderColorInput].forEach(el => {
        el.addEventListener('input', drawCanvas);
    });

    uploadProfile.addEventListener('change', handleImageUpload);

    // Click SVG to upload
    profilePreviewSvg.addEventListener('click', () => uploadProfile.click());
    profilePreviewImg.addEventListener('click', () => uploadProfile.click());

    function downloadCanvas() {
        const link = document.createElement('a');
        link.download = 'source-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    downloadBtn.addEventListener('click', downloadCanvas);
    
    // Initial draw
    drawCanvas();
});