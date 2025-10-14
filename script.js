// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up canvas
    const canvas = document.getElementById('my_canvas');
    const ctx = canvas.getContext('2d');
    
    // Text input element
    const textArea = document.getElementById('text_area');
    
    // Function to wrap text into lines
    function wrapText(text, maxWidth, fontSize) {
        ctx.font = `${fontSize}px Inter`;
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
    
    // Function to draw text on canvas
    function drawText() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get text from textarea
        let text = textArea.value.trim();
        if (!text) {
            text = 'Type your thoughts here...';
        }
        
        // Set up text properties
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate max width and height for text area (accounting for 2px border/margin)
        const maxWidth = canvas.width - 4; // 2px on each side
        const maxHeight = canvas.height - 4;
        const lineHeightFactor = 1.2; // Approximate line height multiplier
        
        // Binary search for the largest font size that fits
        let fontSize = 1;
        let low = 1;
        let high = 200; // Reasonable upper limit
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            ctx.font = `${mid}px Inter`;
            
            // Wrap text at this font size
            const lines = wrapText(text, maxWidth, mid);
            
            // Find the longest line width
            let maxLineWidth = 0;
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxLineWidth) {
                    maxLineWidth = metrics.width;
                }
            }
            
            // Calculate total height
            const totalHeight = lines.length * (mid * lineHeightFactor);
            
            if (maxLineWidth <= maxWidth && totalHeight <= maxHeight) {
                fontSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        
        // Now draw with the optimal font size
        ctx.font = `${fontSize}px Inter`;
        const lines = wrapText(text, maxWidth, fontSize);
        
        // Calculate starting y for centering the block of text
        const blockHeight = lines.length * (fontSize * lineHeightFactor);
        const startY = (canvas.height / 2) - (blockHeight / 2);
        let currentY = startY + (fontSize * lineHeightFactor / 2); // Offset for middle baseline
        
        // Draw each line
        for (const line of lines) {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += fontSize * lineHeightFactor;
        }
    }
    
    // Initial draw
    drawText();
    
    // Live update on input
    textArea.addEventListener('input', drawText);
});