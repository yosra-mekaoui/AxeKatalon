class ManualViewHandler {
    constructor() {
        this.currentActions = [];
        this.contentArea = null;
        this.pythonHandler = null;
        this.debug = true;
        this.isInitialized = false;
        this.selectedRowIndex = -1; // Indice de la ligne sélectionnée
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[ManualViewHandler] ${message}`);
            if (data !== null) {
                console.log(data);
            }
        }
    }

    initialize(pythonHandler) {
        this.log('Initializing manual view handler');
        this.pythonHandler = pythonHandler;
        this.contentArea = document.getElementById('content-area');
        
        if (!this.contentArea) {
            this.log('Content area not found');
            return false;
        }
        
        // Initialiser les écouteurs d'événements pour les boutons de la barre d'outils
        this.initToolbarButtons();
        
        this.isInitialized = true;
        return true;
    }
    
    initToolbarButtons() {
        this.log('Initializing toolbar buttons');
        console.log('Initializing toolbar buttons - DEBUG');
        
        // Configurer le bouton Delete dans la barre d'outils
        const deleteActionBtn = document.getElementById('delete-action-btn');
        console.log('Delete button element:', deleteActionBtn);
        
        if (deleteActionBtn) {
            this.log('Delete button found in toolbar');
            console.log('Delete button found in toolbar - DEBUG');
            
            // Ajouter une classe visuelle pour confirmer que le bouton est configuré
            deleteActionBtn.classList.add('configured-button');
            
            // Ajouter un gestionnaire d'événement click direct
            deleteActionBtn.onclick = (e) => {
                console.log('Delete button clicked via onclick - DEBUG');
                this.log('Delete action button clicked via onclick');
                
                // Vérifier si une ligne est sélectionnée
                if (this.selectedRowIndex >= 0 && this.selectedRowIndex < this.currentActions.length) {
                    // Confirmer la suppression
                    if (confirm(`Êtes-vous sûr de vouloir supprimer l'étape ${this.selectedRowIndex + 1} ?`)) {
                        this.deleteAction(this.selectedRowIndex);
                    }
                } else {
                    alert('Veuillez sélectionner une étape à supprimer.');
                }
            };
            
            // Ajouter également un écouteur d'événement classique en secours
            deleteActionBtn.addEventListener('click', (e) => {
                console.log('Delete button clicked via addEventListener - DEBUG');
                this.log('Delete action button clicked via addEventListener');
            });
            
            // Ajouter un style visuel pour déboguer
            deleteActionBtn.style.border = '2px solid green';
        } else {
            this.log('Delete button not found in toolbar');
            console.error('Delete button not found in toolbar - DEBUG');
            
            // Essayer de trouver le bouton par un autre moyen
            const allButtons = document.querySelectorAll('button');
            console.log('All buttons found:', allButtons.length);
            allButtons.forEach((btn, index) => {
                console.log(`Button ${index}:`, btn.id, btn.textContent);
                if (btn.textContent.includes('Delete')) {
                    console.log('Found a Delete button by text content:', btn);
                }
            });
        }
        
        // Configurer les autres boutons de la barre d'outils si nécessaire
        // TODO: Implémenter les fonctionnalités pour les boutons Add, Move Up et Move Down
    }

    displayManualView(actions) {
        if (!this.isInitialized) {
            this.log('Handler not initialized');
            return;
        }
        
        this.log('Displaying manual view', actions);
        this.currentActions = actions || [];
        
        let tableHtml = `
            <table class="steps-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Action</th>
                        <th>Input</th>
                        <th>Output</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.currentActions.forEach((action, index) => {
            const isControlStructure = action.is_control_structure || false;
            const actionName = action.action || '';
            const input = action.input || '';
            const output = action.output || '';
            
            const rowClass = isControlStructure ? 'control-structure-row' : '';
            
            tableHtml += `
                <tr class="${rowClass}" data-index="${index}">
                    <td>${index + 1}</td>
                    <td contenteditable="${!isControlStructure}" class="action-cell">${actionName}</td>
                    <td contenteditable="${!isControlStructure}" class="input-cell">${input}</td>
                    <td contenteditable="${!isControlStructure}" class="output-cell">${output}</td>
                    <td>
                        <button class="delete-step-btn" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHtml += `
                </tbody>
            </table>
            <button id="add-step-btn" class="add-step-btn">Ajouter une étape</button>
        `;
        this.contentArea.innerHTML = tableHtml;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.log('Setting up event listeners');
        
        // écouteurs sur cellules éditables
        const editableCells = this.contentArea.querySelectorAll('[contenteditable="true"]');
        editableCells.forEach(cell => {
            cell.addEventListener('blur', () => {
                const row = cell.closest('tr');
                const index = parseInt(row.getAttribute('data-index'));
                const cellClass = cell.className;
                
                let field = '';
                if (cellClass.includes('action-cell')) field = 'action';
                else if (cellClass.includes('input-cell')) field = 'input';
                else if (cellClass.includes('output-cell')) field = 'output';
                
                if (field && index >= 0 && index < this.currentActions.length) {
                    this.currentActions[index][field] = cell.textContent;
                    this.notifyContentChanged();
                }
            });
        });
        
        // sélection des lignes - IMPORTANT pour le bouton Delete de la toolbar
        const tableRows = this.contentArea.querySelectorAll('tbody tr');
        this.log(`Setting up row selection for ${tableRows.length} rows`);
        
        tableRows.forEach(row => {
            // Supprimer les écouteurs d'événements existants pour éviter les doublons
            const newRow = row.cloneNode(true);
            row.parentNode.replaceChild(newRow, row);
            
            // Ajouter le nouvel écouteur d'événement
            newRow.addEventListener('click', (e) => {
                // Ne pas déclencher si on clique sur un bouton ou une cellule éditable
                if (e.target.closest('button') || e.target.hasAttribute('contenteditable')) {
                    return;
                }
                
                // Désélectionner toutes les lignes
                tableRows.forEach(r => r.classList.remove('selected-row'));
                
                // Sélectionner cette ligne
                newRow.classList.add('selected-row');
                
                // Stocker l'index de la ligne sélectionnée
                this.selectedRowIndex = parseInt(newRow.getAttribute('data-index'));
                this.log('Row selected:', this.selectedRowIndex);
                console.log('[ManualViewHandler] Row selected:', this.selectedRowIndex);
            });
            
            // Ré-ajouter les écouteurs pour les cellules éditables dans cette ligne
            const rowEditableCells = newRow.querySelectorAll('[contenteditable="true"]');
            rowEditableCells.forEach(cell => {
                cell.addEventListener('blur', () => {
                    const index = parseInt(newRow.getAttribute('data-index'));
                    const cellClass = cell.className;
                    
                    let field = '';
                    if (cellClass.includes('action-cell')) field = 'action';
                    else if (cellClass.includes('input-cell')) field = 'input';
                    else if (cellClass.includes('output-cell')) field = 'output';
                    
                    if (field && index >= 0 && index < this.currentActions.length) {
                        this.currentActions[index][field] = cell.textContent;
                        this.notifyContentChanged();
                    }
                });
            });
        });
        
        // boutons suppression dans tableau
        const deleteButtons = this.contentArea.querySelectorAll('.delete-step-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(button.getAttribute('data-index'));
                this.log('Delete button clicked for index:', index);
                if (confirm(`Êtes-vous sûr de vouloir supprimer l'étape ${index + 1} ?`)) {
                    this.deleteAction(index);
                }
            });
        });
        
        // bouton ajout étape
        const addButton = this.contentArea.querySelector('#add-step-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.log('Add button clicked');
                this.addNewAction();
            });
        }
        
        // Les boutons de la barre d'outils sont configurés dans la méthode initToolbarButtons
    }

    handleKeyNavigation(e, cell) {
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const currentRow = cell.parentElement;
            const currentIndex = Array.from(currentRow.cells).indexOf(cell);
            
            if (e.shiftKey) {
                if (currentIndex > 1) {
                    const prevCell = currentRow.cells[currentIndex - 1];
                    if (prevCell.hasAttribute('contenteditable')) {
                        prevCell.focus();
                    }
                } else if (currentRow.previousElementSibling) {
                    const prevRow = currentRow.previousElementSibling;
                    const lastEditableCell = Array.from(prevRow.cells).filter(c => c.hasAttribute('contenteditable')).pop();
                    if (lastEditableCell) {
                        lastEditableCell.focus();
                    }
                }
            } else {
                if (currentIndex < currentRow.cells.length - 2) {
                    const nextCell = currentRow.cells[currentIndex + 1];
                    if (nextCell.hasAttribute('contenteditable')) {
                        nextCell.focus();
                    }
                } else if (currentRow.nextElementSibling) {
                    const nextRow = currentRow.nextElementSibling;
                    const firstEditableCell = Array.from(nextRow.cells).find(c => c.hasAttribute('contenteditable'));
                    if (firstEditableCell) {
                        firstEditableCell.focus();
                    }
                }
            }
        }
    }
    updateActionsFromTable() {
        this.log('Updating actions from table');
        
        const rows = this.contentArea.querySelectorAll('tbody tr');
        if (!rows || rows.length === 0) {
            this.log('No rows found in table');
            return;
        }
        
        const updatedActions = [];
        
        // Parcourir chaque ligne du tableau
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 4) {
                this.log('Row has insufficient cells:', cells.length);
                return;
            }
            
            const actionCell = cells[1];
            const inputCell = cells[2];
            const outputCell = cells[3];
            
            const action = actionCell.textContent.trim();
            const input = inputCell.textContent.trim();
            const output = outputCell.textContent.trim();

            const originalAction = index < this.currentActions.length ? this.currentActions[index] : null;
            
            if (originalAction) {
                const updatedAction = { ...originalAction };
                updatedAction.action = action;
                updatedAction.input = input;
                updatedAction.output = output;
                updatedActions.push(updatedAction);
            } else {
                updatedActions.push({
                    action: action,
                    input: input,
                    output: output
                });
            }
        });
        this.currentActions = updatedActions;
        this.log('Updated actions:', this.currentActions);
    }

    /**
     * Supprime une étape à l'index spécifié
     * @param {number} index - L'index de l'étape à supprimer
     */
    deleteAction(index) {
        console.log('[ManualViewHandler] deleteAction called with index:', index);
        
        // Vérifier si l'index est valide
        if (index < 0 || index >= this.currentActions.length) {
            console.error('[ManualViewHandler] Invalid action index:', index);
            return false;
        }
        
        try {
            console.log('[ManualViewHandler] Current actions before deletion:', JSON.stringify(this.currentActions));
            
            // 1. Créer une copie des actions actuelles
            const updatedActions = [...this.currentActions];
            
            // 2. Supprimer l'action à l'index spécifié
            updatedActions.splice(index, 1);
            console.log('[ManualViewHandler] Actions after deletion:', JSON.stringify(updatedActions));
            
            // 3. Mettre à jour la liste des actions
            this.currentActions = updatedActions;
            
            // 4. Mettre à jour l'affichage du tableau
            this.contentArea.innerHTML = ''; // Vider le contenu actuel
            this.displayManualView(this.currentActions);
            
            // 5. Mettre à jour le script Python via pythonHandler
            if (this.pythonHandler && typeof this.pythonHandler.handleManualContentChange === 'function') {
                console.log('[ManualViewHandler] Updating Python script via pythonHandler');
                this.pythonHandler.handleManualContentChange(this.currentActions);
            } else {
                console.warn('[ManualViewHandler] pythonHandler not available or missing handleManualContentChange method');
                // Appel direct à notifyContentChanged comme fallback
                this.notifyContentChanged();
            }
            
            // 6. Afficher un message de confirmation
            this.showMessage(`Étape ${index + 1} supprimée avec succès`);
            
            // 7. Réinitialiser l'index de ligne sélectionnée
            this.selectedRowIndex = -1;
            
            console.log('[ManualViewHandler] Delete operation completed successfully');
            return true;
        } catch (error) {
            console.error('[ManualViewHandler] Error in deleteAction:', error);
            return false;
        }
    }
    addNewAction() {
        this.log('Adding new action');
        
        this.currentActions.push({
            action: '',
            input: '',
            output: ''
        });
        
        this.displayManualView(this.currentActions);
        
        const rows = this.contentArea.querySelectorAll('tbody tr');
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const firstEditableCell = lastRow.querySelector('td[contenteditable="true"]');
            if (firstEditableCell) {
                firstEditableCell.focus();
            }
        }
    }
    notifyContentChanged() {
        if (this.pythonHandler) {
            this.pythonHandler.handleManualContentChange(this.currentActions);
        }
    }
    
    /**
     * Affiche un message de notification temporaire
     * @param {string} message - Le message à afficher
     */
    showMessage(message) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'manual-view-message';
        messageContainer.textContent = message;
        messageContainer.style.position = 'absolute';
        messageContainer.style.top = '10px';
        messageContainer.style.right = '10px';
        messageContainer.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
        messageContainer.style.color = 'white';
        messageContainer.style.padding = '8px 12px';
        messageContainer.style.borderRadius = '4px';
        messageContainer.style.zIndex = '1000';
        messageContainer.style.transition = 'opacity 0.5s ease-in-out';
        
        document.body.appendChild(messageContainer);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageContainer);
            }, 500);
        }, 3000);
    }
    
    getCurrentActions() {
        return this.currentActions;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.manualViewHandler = new ManualViewHandler();
    
    // Attendre que pythonFileHandler soit disponible
    const checkPythonHandler = setInterval(() => {
        if (window.pythonFileHandler) {
            clearInterval(checkPythonHandler);
            console.log('[ManualViewHandler] PythonFileHandler found, initializing...');
            window.manualViewHandler.initialize(window.pythonFileHandler);
            
            // Pour la compatibilité avec le code existant
            window.pythonHandler = window.pythonFileHandler;
        }
    }, 100);
});
