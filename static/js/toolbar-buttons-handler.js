/**
 * ToolbarButtonsHandler - Gestionnaire pour les boutons de la barre d'outils
 * 
 * Cette classe gère les fonctionnalités des boutons de la barre d'outils de l'éditeur,
 * en particulier le bouton de suppression d'étape.
 */
class ToolbarButtonsHandler {
    constructor() {
        this.debug = true;
        this.initialized = false;
        
        // Initialiser après le chargement complet du DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
        
        // Essayer d'initialiser immédiatement aussi
        setTimeout(() => {
            if (!this.initialized) {
                this.init();
            }
        }, 500);
    }
    
    log(message, data = null) {
        if (this.debug) {
            console.log(`[ToolbarButtonsHandler] ${message}`);
            if (data !== null) {
                console.log(data);
            }
        }
    }
    
    init() {
        if (this.initialized) {
            return;
        }
        
        this.log('Initializing toolbar buttons handler - DISABLED');
        // Désactivé pour éviter les conflits avec direct-delete-handler.js
        // this.setupDeleteButton();
        this.initialized = true;
        
        // Ajouter une classe au body pour indiquer que le gestionnaire est initialisé
        document.body.classList.add('toolbar-handler-initialized');
    }
    
    setupDeleteButton() {
        // Trouver le bouton Delete par son ID
        const deleteBtn = document.getElementById('delete-action-btn');
        
        if (!deleteBtn) {
            this.log('Delete button not found by ID');
            return;
        }
        
        this.log('Delete button found:', deleteBtn);
        
        // Ajouter une classe pour indiquer que le bouton est configuré
        deleteBtn.classList.add('configured-button');
        
        // Supprimer tous les gestionnaires d'événements existants
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        // Ajouter un gestionnaire d'événement pour le clic
        newDeleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.log('Delete button clicked');
            console.log('Delete button clicked');
            
            // Trouver la ligne sélectionnée
            const selectedRow = document.querySelector('.steps-table tbody tr.selected-row');
            
            if (!selectedRow) {
                alert('Veuillez sélectionner une étape à supprimer.');
                return;
            }
            
            // Obtenir l'index de la ligne sélectionnée
            const index = parseInt(selectedRow.getAttribute('data-index'));
            this.log('Selected row index:', index);
            
            // Confirmer la suppression
            if (confirm(`Êtes-vous sûr de vouloir supprimer l'étape ${index + 1} ?`)) {
                this.log('Confirmation acceptée, tentative de suppression');
                
                // Appeler la méthode de suppression du ManualViewHandler
                if (window.manualViewHandler) {
                    this.log('Calling manualViewHandler.deleteAction');
                    const success = window.manualViewHandler.deleteAction(index);
                    
                    if (success) {
                        this.log('Deletion successful');
                    } else {
                        this.log('Deletion failed');
                        alert('La suppression a échoué. Veuillez réessayer.');
                    }
                } else {
                    this.log('manualViewHandler not available');
                    alert('Impossible de supprimer l\'action: le gestionnaire n\'est pas disponible.');
                }
            }
        });
        
        this.log('Delete button configured successfully');
    }
}

// Créer une instance du gestionnaire de boutons de la barre d'outils
window.toolbarButtonsHandler = new ToolbarButtonsHandler();
