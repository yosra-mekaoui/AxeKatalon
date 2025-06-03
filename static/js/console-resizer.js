let isHResizing = false;
let lastY = 0;
let consoleHeight = 200;

function initConsoleResizer() {
    const resizer = document.getElementById('console-resizer');
    const consoleContent = document.querySelector('.console-content');
    
    if (!resizer || !consoleContent) {
        console.error('Éléments nécessaires pour le resizer horizontal non trouvés');
        return;
    }
    consoleContent.style.height = `${consoleHeight}px`;
    resizer.addEventListener('mousedown', function(e) {
        isHResizing = true;
        lastY = e.clientY;
        document.body.classList.add('h-resizing');
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!isHResizing) return;

        const deltaY = e.clientY - lastY;
        lastY = e.clientY;

        consoleHeight -= deltaY;

        const minConsoleHeight = 100;
        const maxConsoleHeight = 500;
        consoleHeight = Math.max(minConsoleHeight, Math.min(maxConsoleHeight, consoleHeight));
        consoleContent.style.height = `${consoleHeight}px`;
    });
    document.addEventListener('mouseup', function() {
        if (isHResizing) {
            isHResizing = false;
            document.body.classList.remove('h-resizing');
        }
    });
    document.addEventListener('mouseleave', function() {
        if (isHResizing) {
            isHResizing = false;
            document.body.classList.remove('h-resizing');
        }
    });
}
document.addEventListener('DOMContentLoaded', initConsoleResizer);
