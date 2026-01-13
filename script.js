// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('my_canvas');
    const ctx = canvas.getContext('2d');
    const textArea = document.getElementById('text_area');
    const downloadBtn = document.getElementById('download_btn');

    // Wrap text but respect explicit newline characters
    function wrapText(text, maxWidth, fontSize) {
        ctx.font = `${fontSize}px Inter`;
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

    function drawText() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let text = textArea.value;
        if (!text) text = 'Type your thoughts here...';

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = canvas.width - 8;
        const maxHeight = canvas.height - 8;
        const lineHeightFactor = 1.2;

        // Binary search for largest font size that fits
        let fontSize = 1;
        let low = 1;
        let high = 200;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            ctx.font = `${mid}px Inter`;
            const lines = wrapText(text, maxWidth, mid);
            const totalHeight = lines.length * (mid * lineHeightFactor);

            let maxLineWidth = 0;
            for (const line of lines) {
                const w = ctx.measureText(line).width;
                if (w > maxLineWidth) maxLineWidth = w;
            }

            if (maxLineWidth <= maxWidth && totalHeight <= maxHeight) {
                fontSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        // Draw with chosen font size
        ctx.font = `${fontSize}px Inter`;
        const lines = wrapText(text, maxWidth, fontSize);

        const blockHeight = lines.length * (fontSize * lineHeightFactor);
        const startY = (canvas.height / 2) - (blockHeight / 2);
        let currentY = startY + (fontSize * lineHeightFactor / 2);

        for (const line of lines) {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += fontSize * lineHeightFactor;
        }
    }

    function downloadCanvas() {
        const link = document.createElement('a');
        link.download = 'source-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    downloadBtn.addEventListener('click', downloadCanvas);
    textArea.addEventListener('input', drawText);
    drawText();
});