// Gestionnaire des fichiers Python
class PythonFileHandler {
    constructor() {
        this.currentFilePath = null;
        this.currentContent = '';
        this.lastSavedContent = '';
        this.parsedContent = [];
        this.currentProjectPath = '';
        this.viewType = 'script'; // 'script' ou 'manual'
        this.saveTimeout = null;
        this.debug = true;
        this.originalScript = ''; // Stocke le script original
        
        // Initialiser le gestionnaire de structure Python et le gestionnaire de vue manuelle
        this.initializeEventListeners();
    }

    log(message, data = null) {
        if (this.debug) {
            if (data !== null) {
                console.log(data);
            }
        }
    }

    initializeEventListeners() {
        this.log('Initializing event listeners');
        
        // Écouter les clics sur les fichiers .py dans l'arborescence
        document.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file');
            if (fileItem && fileItem.dataset.path && fileItem.dataset.path.endsWith('.py')) {
                const filePath = fileItem.dataset.path;
                this.log('Python file clicked:', filePath);
                
                // Obtenir le chemin complet du projet depuis l'élément parent
                const projectRoot = fileItem.closest('.project-root');
                if (projectRoot && projectRoot.dataset.path) {
                    this.currentProjectPath = projectRoot.dataset.path;
                    this.log('Project path found:', this.currentProjectPath);
                } else {
                    // Si pas de project-root, utiliser le chemin courant
                    this.currentProjectPath = window.location.pathname.endsWith('/') ? 
                        window.location.pathname.slice(0, -1) : 
                        window.location.pathname;
                    this.log('Using current path as project path:', this.currentProjectPath);
                }
                
                this.loadPythonFile(filePath);
            }
        });

        // Écouter les changements de vue (Manual/Script)
document.addEventListener('DOMContentLoaded', () => {
    const viewSelector = document.getElementById('view-selector');
    if (viewSelector) {
        viewSelector.addEventListener('change', (e) => {
            const viewType = e.target.value;
            this.log('View changed to:', viewType);
            
            // Si on passe de script à manual, utiliser la nouvelle API de conversion
            if (this.viewType === 'script' && viewType === 'manual') {
                this.convertScriptToManual();
            } else {
                this.saveCurrentFile(this.viewType);
                this.viewType = viewType;
                this.displayContent();
            }
        });
    } else {
        console.error("Élément #view-selector introuvable dans le DOM.");
    }
});

        // Écouter les changements dans l'éditeur Monaco
        document.addEventListener('monacoContentChanged', (e) => {
            this.log('Monaco content changed');
            this.currentContent = e.detail.content;
            this.handleContentChange('script');
        });

        // Gestionnaire de sauvegarde
        document.addEventListener('click', (e) => {
            if (e.target.matches('.save-btn')) {
                this.log('Save button clicked');
                this.saveCurrentFile();
            }
        });

        // Écouter les changements dans le tableau (délégation d'événements)
        document.addEventListener('input', (e) => {
            if (e.target.closest('.test-steps') && e.target.hasAttribute('contenteditable')) {
                this.log('Manual table changed');
                this.handleContentChange('manual');
            }
        });
        
        // Écouter les suppressions de lignes dans le tableau
        document.addEventListener('click', (e) => {
            if (e.target.matches('.delete-step-btn')) {
                const row = e.target.closest('tr');
                if (row) {
                    this.log('Delete step button clicked');
                    this.deleteStep(row);
                }
            }
        });
    }

    async loadPythonFile(filePath) {
        this.log('Loading Python file:', filePath);
        this.log('Project path:', this.currentProjectPath);
        
        try {
            const response = await fetch('/open_file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: filePath.replace(/\\/g, '/'),  // Normaliser les backslashes en slashes
                    project_path: this.currentProjectPath.replace(/\\/g, '/')  // Normaliser les backslashes en slashes
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.log('Response data:', data);
            
            if (data.success) {
                this.log('File loaded successfully');
                this.currentFilePath = filePath;
                this.currentContent = data.content;
                this.lastSavedContent = data.content;
                this.originalScript = data.content; // Sauvegarder le script original
                
                // IMPORTANT: Ignorer les données parsées du serveur et utiliser notre nouvel analyseur
                if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                    console.log('Utilisation du nouvel analyseur de script Python côté client...');
                    try {
                        const actions = window.extractActionsFromPythonScript(this.currentContent);
                        console.log('Actions extraites avec le nouvel analyseur:', actions);
                        const tableFormat = window.convertActionsToTableFormat(actions);
                        console.log('Format tabulaire généré:', tableFormat);
                        
                        // Convertir le format tabulaire en étapes manuelles
                        if (window.pythonConverter) {
                            this.parsedContent = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                        } else {
                            // Conversion manuelle si pythonConverter n'est pas disponible
                            this.parsedContent = tableFormat.map(row => ({
                                actionItem: row.actionItem,
                                action: row.action,
                                input: row.input,
                                output: row.output,
                                description: row.description,
                                is_control_structure: row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling'
                            }));
                        }
                        this.log('Parsed content from new analyzer:', this.parsedContent);
                    } catch (error) {
                        console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                        console.log('Utilisation des données parsées du serveur...');
                        this.parsedContent = data.parsed_content || [];
                    }
                } else {
                    // Utiliser les données parsées du serveur si le nouvel analyseur n'est pas disponible
                    console.log('Nouvel analyseur non disponible, utilisation des données parsées du serveur...');
                    this.parsedContent = data.parsed_content || [];
                }
                
                this.log('Parsed content:', this.parsedContent);
                
                // Initialiser le convertisseur Python avec le contenu original
                if (window.pythonConverter) {
                    window.pythonConverter.originalScript = data.content;
                    this.log('Set original script in converter');
                }
                
                this.displayContent();
            } else {
                console.error('Error loading file:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    displayContent() {
        this.log('Displaying content with view type:', this.viewType);
        
        // S'assurer que nous avons un fichier valide à afficher
        if (!this.currentFilePath && window.currentFile && window.currentFile.path) {
            this.log('No current file path set, using window.currentFile.path');
            this.currentFilePath = window.currentFile.path;
            this.currentContent = window.currentFile.content;
            this.originalScript = window.currentFile.content;
        }
        
        // Si nous passons du mode manuel au mode script, sauvegarder les modifications manuelles
        if (this.viewType === 'script' && window.currentFile && window.currentFile.manualSteps && window.currentFile.manualSteps.length > 0) {
            this.log('Switching to script mode, saving manual steps for later');
            // Stocker les étapes manuelles pour les réutiliser plus tard
            this._savedManualSteps = window.currentFile.manualSteps;
        }
        
        // Si nous passons du mode script au mode manuel, réanalyser le script pour obtenir les étapes manuelles les plus récentes
        if (this.viewType === 'manual') {
            // Si nous avons des étapes manuelles sauvegardées précédemment, les utiliser
            if (this._savedManualSteps && this._savedManualSteps.length > 0) {
                this.log('Using previously saved manual steps, count:', this._savedManualSteps.length);
                this.parsedContent = this._savedManualSteps;
            } 
            // Sinon, analyser le script actuel pour générer les étapes manuelles
            else if (this.currentContent && window.extractActionsFromPythonScript) {
                this.log('Reanalyzing script to get latest manual steps');
                try {
                    const actions = window.extractActionsFromPythonScript(this.currentContent);
                    console.log('Actions extraites avec le nouvel analyseur:', actions);
                    const tableFormat = window.convertActionsToTableFormat(actions);
                    console.log('Format tabulaire généré:', tableFormat);
                    
                    // Convertir le format tabulaire en étapes manuelles
                    if (window.pythonConverter) {
                        this.parsedContent = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                        this.log('Generated manual steps from current script, count:', this.parsedContent.length);
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'analyse du script:', error);
                }
            }
        }
        
        if (this.viewType === 'script') {
            this.displayScriptView();
        } else {
            this.displayManualView();
        }
    }

    displayScriptView() {
        this.log('Displaying script view');
        
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            this.log('Content area not found');
            return;
        }
        
        // Afficher l'éditeur Monaco
        contentArea.innerHTML = '<div id="monaco-editor" style="width:100%;height:600px;"></div>';
        
        // Initialiser l'éditeur Monaco
        if (window.monacoHandler) {
            window.monacoHandler.initializeEditor('monaco-editor', this.currentContent, 'python');
            
            // Ajouter un écouteur pour les changements dans l'éditeur
            window.monacoHandler.onContentChange(() => {
                this.handleContentChange('script');
            });
        } else {
            this.log('Monaco handler not found, using fallback');
            contentArea.innerHTML = '<pre>' + this.currentContent + '</pre>';
        }
    }

    displayManualView() {
        this.log('Displaying manual view');
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            this.log('Content area not found');
            return;
        }
        
        // Mettre à jour window.currentFile avec les étapes manuelles si disponible
        if (window.currentFile && this.parsedContent && this.parsedContent.length > 0) {
            this.log('Updating window.currentFile with manual steps, count:', this.parsedContent.length);
            window.currentFile.parsedContent = this.parsedContent;
            window.currentFile.manualSteps = this.parsedContent;
            window.currentFile.viewType = 'manual';
        }
        
        // Vérifier si nous avons des étapes manuelles à afficher
        if (!this.parsedContent || this.parsedContent.length === 0) {
            this.log('No manual steps to display, showing empty table');
            contentArea.innerHTML = `
                <div class="no-steps-message">
                    <p>Aucune étape manuelle à afficher. Veuillez convertir un script en mode manuel ou ajouter des étapes manuellement.</p>
                    <button id="add-step-btn" class="add-step-btn">Ajouter une étape</button>
                </div>
            `;
            
            // Ajouter l'écouteur d'événement pour le bouton d'ajout d'étape
            const addStepBtn = document.getElementById('add-step-btn');
            if (addStepBtn) {
                addStepBtn.addEventListener('click', () => this.addEmptyStep());
            }
            
            return;
        }
        
        // Créer le tableau HTML
        let tableHtml = `
            <table class="test-steps">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Action</th>
                        <th>Input</th>
                        <th>Output</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Ajouter chaque étape au tableau
        this.parsedContent.forEach((step, index) => {
            const isControlStructure = step.is_control_structure || false;
            const action = step.action || '';
            const input = step.input || '';
            const output = step.output || '';
            
            // Ajouter une classe spéciale pour les structures de contrôle
            const rowClass = isControlStructure ? 'control-structure-row' : '';
            const editableAttr = isControlStructure ? 'contenteditable="false" data-non-editable="true"' : 'contenteditable="true"';
            
            tableHtml += `
                <tr class="${rowClass}" data-index="${index}">
                    <td>${index + 1}</td>
                    <td ${editableAttr} class="action-cell" spellcheck="false">${action}</td>
                    <td ${editableAttr} class="input-cell" spellcheck="false">${input}</td>
                    <td ${editableAttr} class="output-cell" spellcheck="false">${output}</td>
                    <td>
                        <button class="delete-step-btn" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // Ajouter une méthode pour ajouter une étape vide
        this.addEmptyStep = function() {
            if (!this.parsedContent) {
                this.parsedContent = [];
            }
            
            // Ajouter une étape vide
            this.parsedContent.push({
                action: '',
                input: '',
                output: '',
                is_control_structure: false
            });
            
            // Mettre à jour l'affichage
            this.displayManualView();
            
            // Mettre à jour le contenu
            this.handleContentChange('manual');
        };
        
        tableHtml += `
                </tbody>
            </table>
            <button id="add-step-btn" class="add-step-btn">Ajouter une étape</button>
        `;
        
        // Afficher le tableau
        contentArea.innerHTML = tableHtml;
        
        // Log le nombre de cellules éditables trouvées
        const tableCells = contentArea.querySelectorAll('td[contenteditable="true"]');
        this.log('Nombre de cellules éditables trouvées:', tableCells.length);
        
        // Ajouter les écouteurs d'événements pour les cellules éditables
        tableCells.forEach((cell, index) => {
            this.log(`Configuration de la cellule éditable #${index}:`, cell.className);
            
            // Écouteur pour les modifications
            cell.addEventListener('input', (e) => {
                this.log(`Modification détectée dans la cellule #${index}:`, e.target.textContent);
                this.updateParsedContentFromTable();
                this.handleContentChange('manual');
            });
            
            // Écouteur pour le clic
            cell.addEventListener('click', (e) => {
                this.log(`Clic détecté sur la cellule #${index}`);
                e.stopPropagation();
                
                // Forcer le focus sur la cellule et rendre le contenu éditable
                setTimeout(() => {
                    // S'assurer que l'attribut contenteditable est bien défini
                    cell.setAttribute('contenteditable', 'true');
                    
                    // Forcer le focus
                    cell.focus();
                    this.log(`Focus appliqué à la cellule #${index}`);
                    
                    // Placer le curseur à la fin du texte
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(cell);
                    range.collapse(false); // placer le curseur à la fin
                    selection.removeAllRanges();
                    selection.addRange(range);
                    this.log('Curseur placé à la fin du texte');
                }, 10); // Augmenter légèrement le délai
            });
            
            // Écouteur pour les touches spéciales
            cell.addEventListener('keydown', (e) => {
                // Gérer la touche Tab pour la navigation
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.navigateCells(cell, e.shiftKey);
                }
                
                // Gérer la touche Entrée
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Déclencher l'événement input pour sauvegarder les modifications
                    const inputEvent = new Event('input', { bubbles: true });
                    cell.dispatchEvent(inputEvent);
                    
                    // Naviguer vers la cellule suivante
                    this.navigateCells(cell, false);
                }
            });
        });
        
        // Ajouter les écouteurs d'événements pour les boutons de suppression
        const deleteButtons = contentArea.querySelectorAll('.delete-step-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(button.getAttribute('data-index'));
                this.log('Delete button clicked for index:', index);
                
                // Supprimer l'étape du tableau parsedContent
                if (index >= 0 && index < this.parsedContent.length) {
                    // Sauvegarder l'étape avant de la supprimer pour la traiter correctement
                    const removedStep = this.parsedContent[index];
                    this.log('Removing step:', removedStep);
                    
                    // Supprimer l'étape
                    this.parsedContent.splice(index, 1);
                    
                    // Rafraîchir l'affichage
                    this.displayManualView();
                    
                    // Déclencher la sauvegarde automatique
                    this.handleContentChange('manual');
                }
            });
        });
        
        // Ajouter un écouteur d'événements pour le bouton d'ajout d'étape
        const addButton = contentArea.querySelector('#add-step-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.log('Add step button clicked');
                
                // Ajouter une nouvelle étape vide
                this.parsedContent.push({
                    actionItem: 'WebUI Action',
                    action: '',
                    input: '',
                    output: '',
                    description: 'New step'
                });
                
                // Rafraîchir l'affichage
                this.displayManualView();
                
                // Mettre le focus sur la nouvelle étape
                const rows = contentArea.querySelectorAll('tbody tr');
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    const firstEditableCell = lastRow.querySelector('td[contenteditable="true"]');
                    if (firstEditableCell) {
                        firstEditableCell.focus();
                    }
                }
            });
        }
        
        this.log('Configuration de la vue manuelle terminée');
    }

    // Méthode pour naviguer entre les cellules avec Tab
    navigateCells(currentCell, isShiftKey) {
        const row = currentCell.parentElement;
        const allCells = Array.from(row.cells).filter(cell => cell.hasAttribute('contenteditable') && cell.getAttribute('contenteditable') !== 'false');
        const currentIndex = allCells.indexOf(currentCell);
        
        if (isShiftKey) {
            // Naviguer vers la cellule précédente
            if (currentIndex > 0) {
                const prevCell = allCells[currentIndex - 1];
                prevCell.focus();
                this.placeCursorAtEnd(prevCell);
            } else if (row.previousElementSibling) {
                // Aller à la dernière cellule de la ligne précédente
                const prevRow = row.previousElementSibling;
                const editableCells = Array.from(prevRow.cells).filter(cell => 
                    cell.hasAttribute('contenteditable') && cell.getAttribute('contenteditable') !== 'false');
                if (editableCells.length > 0) {
                    const lastCell = editableCells[editableCells.length - 1];
                    lastCell.focus();
                    this.placeCursorAtEnd(lastCell);
                }
            }
        } else {
            // Naviguer vers la cellule suivante
            if (currentIndex < allCells.length - 1) {
                const nextCell = allCells[currentIndex + 1];
                nextCell.focus();
                this.placeCursorAtEnd(nextCell);
            } else if (row.nextElementSibling) {
                // Aller à la première cellule de la ligne suivante
                const nextRow = row.nextElementSibling;
                const editableCells = Array.from(nextRow.cells).filter(cell => 
                    cell.hasAttribute('contenteditable') && cell.getAttribute('contenteditable') !== 'false');
                if (editableCells.length > 0) {
                    editableCells[0].focus();
                    this.placeCursorAtEnd(editableCells[0]);
                }
            }
        }
    }

        // Méthode pour placer le curseur à la fin du texte d'un élément
    placeCursorAtEnd(element) {
        if (!element) return;

        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(element);
        range.collapse(false); // place le curseur à la fin

        selection.removeAllRanges();
        selection.addRange(range);

        // Rafraîchir l'affichage
        this.displayManualView();

        // Mettre le focus sur la nouvelle étape
        const contentArea = document.querySelector('#your-content-area'); // à adapter
        const rows = contentArea.querySelectorAll('tbody tr');

        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const cells = lastRow.querySelectorAll('td');
            const firstEditableCell = lastRow.querySelector('td[contenteditable="true"]');

            if (firstEditableCell) {
                firstEditableCell.focus();
            }

            const input = cells[2]?.innerText.trim();
            const output = cells[3]?.innerText.trim();
            const action = cells[1]?.innerText.trim(); // hypothèse

            const index = rows.length - 1; // ou toute autre logique
            this.log(`Row ${index} values:`, { action, input, output });

            const updatedParsedContent = [];
            const oldParsedContent = this.parsedContent || [];

            // Vérifier si cette étape existe déjà dans l'ancien contenu parsé
            const existingStep = oldParsedContent[index];

            if (existingStep) {
                this.log('Using existing step:', existingStep);
                const updatedStep = { ...existingStep };
                updatedStep.action = action;
                updatedStep.input = input;
                updatedStep.output = output;
                updatedParsedContent.push(updatedStep);
            } else {
                this.log('Creating new step for action:', action);
                const newStep = {
                    actionItem: 'WebUI Action',
                    action: action,
                    input: input,
                    output: output,
                    description: `Execute ${action} with parameters: ${input}, ${output}`
                };
                updatedParsedContent.push(newStep);
            }

            // Mettre à jour le contenu parsé
            this.parsedContent = updatedParsedContent;
            this.log('Updated parsed content:', this.parsedContent);

            // Déclencher un événement pour notifier les autres composants
            const event = new CustomEvent('parsedContentUpdated', {
                detail: {
                    parsedContent: this.parsedContent
                }
            });
            document.dispatchEvent(event);
        }
    }


    handleContentChange(viewType) {
        this.log(`Content changed in ${viewType} view`);
        
        // Annuler le timeout précédent s'il existe
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Définir un nouveau timeout pour la sauvegarde automatique
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentFile(viewType);
        }, 1000);
    }

    async saveCurrentFile(viewType, forceSave = false) {
        // Si aucun fichier n'est actuellement chargé mais que window.currentFile existe
        if (!this.currentFilePath && window.currentFile && window.currentFile.path) {
            console.log('[PythonFileHandler] No current file path set, using window.currentFile.path');
            this.currentFilePath = window.currentFile.path;
            this.currentContent = window.currentFile.content || '';
            this.originalScript = window.currentFile.content || '';
        }
        
        // Vérifier à nouveau si nous avons un chemin de fichier valide
        if (!this.currentFilePath) {
            console.log('[PythonFileHandler] No current file to save, skipping save operation');
            return false;
        }
        
        // Si c'est un fichier temporaire et que window.currentFile existe avec un chemin valide
        // alors utiliser le chemin de window.currentFile pour la sauvegarde
        if (this.currentFilePath.includes('temp_script_') && window.currentFile && window.currentFile.path) {
            console.log('[PythonFileHandler] Using original file path instead of temp file');
            this.currentFilePath = window.currentFile.path;
        }

        try {
            let content;
            
            if (viewType === 'script') {
                console.log('[PythonFileHandler] Getting content from Monaco for save');
                
                // Vérifier si Monaco est disponible et récupérer le contenu
                if (window.monacoHandler && window.monacoHandler.editor) {
                    try {
                        content = window.monacoHandler.getCurrentContent();
                        console.log('[PythonFileHandler] Content retrieved from Monaco, length:', content.length);
                    } catch (e) {
                        console.error('[PythonFileHandler] Error getting content from Monaco:', e);
                        content = this.currentContent;
                    }
                } else {
                    console.log('[PythonFileHandler] Monaco not available, using stored content');
                    content = this.currentContent;
                }
                
                // Mettre à jour le script original
                this.originalScript = content;
                
                // Mettre à jour le contenu parsé à partir du script
                if (window.pythonConverter) {
                    // Utiliser directement le nouvel analyseur de script Python si disponible
                    if (window.extractActionsFromPythonScript) {
                        console.log('Utilisation directe du nouvel analyseur de script Python...');
                        try {
                            const actions = window.extractActionsFromPythonScript(content);
                            console.log('Actions extraites avec le nouvel analyseur:', actions);
                            const tableFormat = window.convertActionsToTableFormat(actions);
                            console.log('Format tabulaire généré:', tableFormat);
                            
                            // Convertir le format tabulaire en étapes manuelles
                            this.parsedContent = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                            this.log('Updated parsed content from new analyzer:', this.parsedContent);
                        } catch (error) {
                            console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                            console.log('Retour à l\'ancienne méthode...');
                            this.parsedContent = window.pythonConverter.scriptToManual(content);
                        }
                    } else {
                        console.log('Nouvel analyseur non disponible, utilisation de l\'ancienne méthode...');
                        this.parsedContent = window.pythonConverter.scriptToManual(content);
                    }
                    this.log('Updated parsed content from script:', this.parsedContent);
                }
            } else {
                this.log('Getting content from manual table for save');
                // Mettre à jour le contenu parsé à partir du tableau
                this.updateParsedContentFromTable();
                
                // Préserver la structure originale du script
                content = this.preserveOriginalStructure();
            }

            // Vérifier si le contenu a changé
            if (content === this.lastSavedContent) {
                // Si nous sommes en train de convertir en mode manuel, forcer la sauvegarde
                if (viewType === 'manual' && this.viewType === 'script') {
                    console.log('[PythonFileHandler] Converting to manual mode, forcing save despite unchanged content');
                } else {
                    console.log('[PythonFileHandler] Content unchanged, skipping save');
                    return true; // Considéré comme un succès car il n'y a pas de changement à sauvegarder
                }
            }

            console.log('[PythonFileHandler] Saving file:', this.currentFilePath);
            console.log('[PythonFileHandler] Content length to save:', content.length);
            
            // Vérifier si le chemin est absolu ou relatif
            let filePath = this.currentFilePath.replace(/\\/g, '/');
            
            // Vérifier si nous avons un chemin de projet valide
            if (!this.currentProjectPath) {
                if (window.currentProjectPath) {
                    this.currentProjectPath = window.currentProjectPath;
                    console.log('[PythonFileHandler] Using window.currentProjectPath:', this.currentProjectPath);
                } else {
                    // Essayer de déduire le chemin du projet à partir du chemin du fichier
                    // Chercher un dossier Katalon standard dans le chemin
                    const katalanFolders = ['TestCases', 'Keywords', 'Object Repository', 'Test Suites', 'Profiles'];
                    let projectPath = this.currentFilePath;
                    
                    for (const folder of katalanFolders) {
                        const index = projectPath.indexOf('/' + folder + '/');
                        if (index !== -1) {
                            projectPath = projectPath.substring(0, index);
                            console.log('[PythonFileHandler] Deduced project path from file path:', projectPath);
                            this.currentProjectPath = projectPath;
                            break;
                        }
                    }
                }
            }
            
            // Si le chemin est relatif et que nous avons un chemin de projet, le convertir en absolu
            if (!filePath.match(/^[A-Z]:\\/) && !filePath.startsWith('/') && this.currentProjectPath) {
                filePath = this.currentProjectPath.replace(/\\/g, '/') + '/' + filePath;
                console.log('[PythonFileHandler] Using absolute path for save:', filePath);
            } else {
                console.log('[PythonFileHandler] Using path as is for save:', filePath);
            }
            
            // Nous ne vérifions plus si le dossier parent existe car l'API save_py_file crée automatiquement les dossiers parents
            console.log('[PythonFileHandler] Using save_py_file API which creates parent directories if needed');
            
            // Ajouter le projet actuel pour s'assurer que le backend trouve le fichier
            const response = await fetch('/save_py_file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: filePath,
                    content: content,
                    project_path: this.currentProjectPath || ''
                })
            });

            const data = await response.json();
            if (data.success) {
                console.log('[PythonFileHandler] File saved successfully');
                this.currentContent = content;
                this.lastSavedContent = content;
                return true;
            } else {
                console.error('[PythonFileHandler] Error saving file:', data.message);
                this.showErrorMessage('Erreur lors de la sauvegarde: ' + data.message);
                return false;
            }
        } catch (error) {
            console.error('[PythonFileHandler] Error during save:', error);
            this.showErrorMessage('Erreur lors de la sauvegarde');
            return false;
        }
    }

    preserveOriginalStructure() {
        this.log('Preserving original script structure');
        
        // Si nous n'avons pas de script original, utiliser la méthode standard
        if (!this.originalScript) {
            this.log('No original script available, using standard conversion');
            if (window.pythonConverter) {
                return window.pythonConverter.manualToScript(this.parsedContent);
            }
            return this.currentContent;
        }
        
        // Analyser le script original
        const lines = this.originalScript.split('\n');
        
        // Créer un index des actions WebUI dans le script original
        const webUIActions = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('WebUI.')) {
                webUIActions.push({
                    index: i,
                    line: line
                });
            }
        }
        
        console.log(`[PythonFileHandler] Found ${webUIActions.length} WebUI actions in original script`);
        console.log(`[PythonFileHandler] Current parsed content has ${this.parsedContent.length} steps`);
        
        // Créer un nouvel array pour les lignes mises à jour
        // Nous allons marquer les lignes à supprimer avec null, puis les filtrer à la fin
        const updatedLines = [...lines];
        
        // Marquer toutes les lignes d'action WebUI comme à supprimer par défaut
        // Nous ne garderons que celles qui correspondent aux étapes actuelles
        webUIActions.forEach(action => {
            updatedLines[action.index] = null; // Marquer pour suppression
        });
        
        // Mettre à jour les actions WebUI avec les valeurs du tableau
        this.parsedContent.forEach((step, index) => {
            if (index < webUIActions.length) {
                const actionInfo = webUIActions[index];
                const lineIndex = actionInfo.index;
                const originalLine = lines[lineIndex];
                
                // Extraire l'action et les paramètres
                const match = originalLine.match(/(.*)WebUI\.(\w+)\((.*)\)(.*)/);
                if (match) {
                    const prefix = match[1];
                    const suffix = match[4];
                    
                    // Construire les nouveaux paramètres
                    let params = [];
                    if (step.input) {
                        params.push(`"${step.input}"`);
                    }
                    if (step.output) {
                        params.push(`"${step.output}"`);
                    }
                    
                    // Reconstruire la ligne et la réinsérer (annuler la suppression)
                    updatedLines[lineIndex] = `${prefix}WebUI.${step.action}(${params.join(', ')})${suffix}`;
                }
            }
        });
        
        // Filtrer les lignes marquées pour suppression (null)
        const filteredLines = updatedLines.filter(line => line !== null);
        
        console.log(`[PythonFileHandler] Original script had ${lines.length} lines, new script has ${filteredLines.length} lines`);
        
        // Reconstruire le script
        return filteredLines.join('\n');
    }

    setProjectPath(projectPath) {
        this.log('Setting project path:', projectPath);
        this.currentProjectPath = projectPath;
    }
    
    /**
     * Convertit le script actuel en mode manuel en utilisant la nouvelle API
     */
    async convertScriptToManual() {
        console.log('[PythonFileHandler] Converting script to manual mode');
        
        // Sauvegarder d'abord le contenu actuel et attendre que la sauvegarde soit terminée
        console.log('[PythonFileHandler] Saving current content before conversion...');
        const saveResult = await this.saveCurrentFile('script');
        
        if (!saveResult) {
            console.error('[PythonFileHandler] Failed to save content before conversion');
            this.showErrorMessage('Erreur: Impossible de sauvegarder le contenu avant la conversion');
            return;
        }
        
        console.log('[PythonFileHandler] Current content saved successfully before conversion');
        
        // Récupérer le contenu actuel du script
        const scriptContent = this.currentContent;
        
        if (!scriptContent) {
            console.error('[PythonFileHandler] No script content available');
            this.showErrorMessage('Erreur: Aucun contenu de script disponible');
            return;
        }
        
        console.log('[PythonFileHandler] Script content length:', scriptContent.length);
        
        // Vérifier si le nouveau gestionnaire d'édition de script est disponible
        if (window.scriptEditorHandler) {
            console.log('[PythonFileHandler] Using ScriptEditorHandler for conversion');
            // Utiliser le nouveau gestionnaire pour la conversion
            window.scriptEditorHandler.convertToManual();
            return;
        }
        
        console.log('[PythonFileHandler] ScriptEditorHandler not available, using fallback method');
        
        // Méthode de secours - Appeler l'API directement
        fetch('/api/script-to-manual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                script: scriptContent
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('[PythonFileHandler] Script successfully converted to manual mode');
                
                // Mettre à jour le contenu parsé avec les étapes converties
                this.parsedContent = data.manual_steps;
                
                // Changer la vue en mode manuel
                this.viewType = 'manual';
                
                // Afficher la vue manuelle
                this.displayContent();
                
                // Afficher un message de succès
                this.showSuccessMessage('Script converti en mode manuel avec succès');
            } else {
                console.error('[PythonFileHandler] Error converting script:', data.message);
                this.showErrorMessage('Erreur lors de la conversion: ' + data.message);
            }
        })
        .catch(error => {
            console.error('[PythonFileHandler] Error:', error);
            this.showErrorMessage('Erreur de communication avec le serveur');
        });
    }
    
    /**
     * Affiche un message de succès
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'rgba(0, 128, 0, 0.8)');
    }
    
    /**
     * Affiche un message d'erreur
     */
    showErrorMessage(message) {
        this.showMessage(message, 'rgba(255, 0, 0, 0.8)');
    }
    
    /**
     * Affiche un message avec un style spécifique
     */
    showMessage(message, backgroundColor) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'python-handler-message';
        messageContainer.textContent = message;
        messageContainer.style.position = 'absolute';
        messageContainer.style.top = '10px';
        messageContainer.style.right = '10px';
        messageContainer.style.backgroundColor = backgroundColor;
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
    
    /**
     * Gère les changements de contenu en mode manuel
     * Cette méthode est appelée par manualViewHandler.notifyContentChanged()
     * Elle sauvegarde les modifications dans le fichier source
     * @param {Array} manualSteps - Les étapes manuelles mises à jour
     */
    /**
     * Met à jour le contenu parsé à partir du tableau des étapes manuelles
     * Cette méthode est appelée avant la sauvegarde en mode manuel
     */
    updateParsedContentFromTable() {
        console.log('[PythonFileHandler] Updating parsed content from manual table');
        
        // Vérifier si nous avons un chemin de fichier valide
        if (!this.currentFilePath && window.currentFile && window.currentFile.path) {
            console.log('[PythonFileHandler] No current file path, using window.currentFile.path');
            this.currentFilePath = window.currentFile.path;
            this.currentContent = window.currentFile.content || '';
            this.originalScript = window.currentFile.content || '';
            
            // Vérifier également le chemin du projet
            if (!this.currentProjectPath && window.currentProjectPath) {
                this.currentProjectPath = window.currentProjectPath;
                console.log('[PythonFileHandler] Using window.currentProjectPath:', this.currentProjectPath);
            }
        }
        
        // Trouver toutes les lignes du tableau (essayer les deux classes possibles)
        let rows = document.querySelectorAll('table.test-steps tbody tr');
        if (!rows || rows.length === 0) {
            rows = document.querySelectorAll('table.steps-table tbody tr');
        }
        
        if (!rows || rows.length === 0) {
            console.warn('[PythonFileHandler] No rows found in the manual table');
            return;
        }
        
        console.log('[PythonFileHandler] Found', rows.length, 'rows in the manual table');
        
        // Extraire les données du tableau
        const manualSteps = [];
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                manualSteps.push({
                    action: cells[1] ? cells[1].textContent.trim() : '',
                    input: cells[2] ? cells[2].textContent.trim() : '',
                    output: cells[3] ? cells[3].textContent.trim() : ''
                });
            }
        });
        
        console.log('[PythonFileHandler] Extracted', manualSteps.length, 'steps from the manual table');
        
        // Mettre à jour le contenu parsé
        this.parsedContent = manualSteps;
        
        // Mettre à jour window.currentFile.parsedContent pour la cohérence
        if (window.currentFile) {
            window.currentFile.parsedContent = manualSteps;
            window.currentFile.manualSteps = manualSteps;
            console.log('[PythonFileHandler] Updated window.currentFile with', manualSteps.length, 'steps');
        }
    }
    
    handleManualContentChange(manualSteps) {
        console.log('[PythonFileHandler] handleManualContentChange called with', manualSteps.length, 'steps');
        
        if (!manualSteps || !Array.isArray(manualSteps)) {
            console.error('[PythonFileHandler] Invalid manual steps data:', manualSteps);
            this.showErrorMessage('Erreur: Données d\'étapes invalides');
            return;
        }
        
        // Vérifier si nous avons un chemin de fichier valide
        if (!this.currentFilePath) {
            console.log('[PythonFileHandler] No current file path, checking window.currentFile');
            
            // Essayer d'utiliser window.currentFile si disponible
            if (window.currentFile && window.currentFile.path) {
                console.log('[PythonFileHandler] Using window.currentFile.path:', window.currentFile.path);
                this.currentFilePath = window.currentFile.path;
                this.currentContent = window.currentFile.content || '';
                this.originalScript = window.currentFile.content || '';
                
                // Vérifier également le chemin du projet
                if (!this.currentProjectPath && window.currentProjectPath) {
                    this.currentProjectPath = window.currentProjectPath;
                    console.log('[PythonFileHandler] Using window.currentProjectPath:', this.currentProjectPath);
                }
            } else {
                console.error('[PythonFileHandler] No current file path and window.currentFile not available');
                this.showErrorMessage('Erreur: Aucun fichier ouvert');
                return;
            }
        }
        
        // Vérifier si le script original est disponible
        if (!this.originalScript && window.currentFile && window.currentFile.content) {
            console.log('[PythonFileHandler] No original script, using window.currentFile.content');
            this.originalScript = window.currentFile.content;
        }
        
        // Mettre à jour le contenu parsé
        this.parsedContent = manualSteps;
        
        // Mettre à jour window.currentFile.parsedContent pour la cohérence
        if (window.currentFile) {
            window.currentFile.parsedContent = manualSteps;
            window.currentFile.manualSteps = manualSteps;
            console.log('[PythonFileHandler] Updated window.currentFile with', manualSteps.length, 'steps');
        }
        
        // Générer le nouveau contenu du script en préservant la structure originale
        // mais en supprimant les étapes qui ont été enlevées
        const newScriptContent = this.preserveOriginalStructure();
        
        // Mettre à jour le contenu actuel avec le nouveau script généré
        this.currentContent = newScriptContent;
        
        // Mettre à jour window.currentFile.content pour la cohérence
        if (window.currentFile) {
            window.currentFile.content = newScriptContent;
            console.log('[PythonFileHandler] Updated window.currentFile.content with new script');
        }
        
        // Sauvegarder immédiatement les modifications
        this.saveCurrentFile('manual', true);
        
        console.log('[PythonFileHandler] Manual content changes saved successfully');
    }
}

// Initialiser le gestionnaire de fichiers Python
document.addEventListener('DOMContentLoaded', () => {
    const pythonFileHandler = new PythonFileHandler();
    window.pythonFileHandler = pythonFileHandler; // Exposer l'instance globalement
});
