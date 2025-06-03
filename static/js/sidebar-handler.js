// Gestionnaire de redimensionnement de la sidebar
class SidebarHandler {
    constructor() {
        this.resizer = document.querySelector(".resizer");
        this.sidebar = document.querySelector(".sidebar");
        this.mainContainer = document.querySelector(".main-container");
        this.sidebarTitle = document.querySelector(".sidebar-title");
        this.isResizing = false;
        this.initialX = 0;
        this.initialWidth = 0;

        this.init();
        
        // Lier les méthodes au contexte actuel pour éviter les problèmes de 'this'
        this.resize = this.resize.bind(this);
        this.stopResize = this.stopResize.bind(this);
    }

    init() {
        // Appliquer la largeur sauvegardée au chargement
        if (this.sidebar) {
            const savedWidth = this.getSavedSidebarWidth();
            this.sidebar.style.width = `${savedWidth}px`;
        }

        // Gestion du collapse de la sidebar
        if (this.sidebarTitle) {
            this.sidebarTitle.addEventListener("click", () => {
                this.sidebar.classList.toggle("collapsed");
            });
        }

        // Configuration du resizer
        if (this.resizer && this.sidebar) {
            this.resizer.addEventListener('mousedown', this.initResize.bind(this));
            this.resizer.addEventListener('touchstart', this.initResize.bind(this));
        }
    }

    initResize(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isResizing = true;
        this.initialX = e.clientX || (e.touches && e.touches[0].clientX);
        this.initialWidth = this.sidebar.getBoundingClientRect().width;

        // Ajout des écouteurs d'événements
        document.addEventListener('mousemove', this.resize);
        document.addEventListener('touchmove', this.resize);
        document.addEventListener('mouseup', this.stopResize);
        document.addEventListener('touchend', this.stopResize);
        
        document.body.style.cursor = 'ew-resize';
        document.body.classList.add('resizing');
    }

    resize(e) {
        if (!this.isResizing) return;

        const currentX = e.clientX || (e.touches && e.touches[0].clientX) || this.initialX;
        const diffX = currentX - this.initialX;
        let newWidth = this.initialWidth + diffX;

        // Limites de redimensionnement
        newWidth = Math.min(Math.max(150, newWidth), 500);

        requestAnimationFrame(() => {
            this.sidebar.style.width = `${newWidth}px`;
            this.saveSidebarWidth(newWidth);
        });
    }

    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.classList.remove('resizing');

        // Suppression des écouteurs d'événements
        document.removeEventListener('mousemove', this.resize);
        document.removeEventListener('touchmove', this.resize);
        document.removeEventListener('mouseup', this.stopResize);
        document.removeEventListener('touchend', this.stopResize);
    }

    saveSidebarWidth(width) {
        localStorage.setItem('sidebarWidth', width);
    }

    getSavedSidebarWidth() {
        return localStorage.getItem('sidebarWidth') || '250';
    }
}

// Initialiser le gestionnaire de sidebar quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new SidebarHandler();
});

document.addEventListener('DOMContentLoaded', () => {
    new SidebarHandler();
});
