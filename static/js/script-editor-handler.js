/**
 * ScriptEditorHandler - Gestionnaire pour l'édition de scripts et la conversion en mode manuel
 * 
 * Cette classe gère les fonctionnalités d'édition de script Python dans l'éditeur Monaco,
 * permettant de:
 * - Supprimer une étape (ligne de code)
 * - Modifier une étape existante
 * - Ajouter une nouvelle étape
 * - Convertir le script modifié en mode manuel
 */
class ScriptEditorHandler {
    constructor() {
        this.monacoHandler = null;
        this.manualViewHandler = null;
        this.currentScript = '';
        this.debug = true;
        this.initializeEventListeners();
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[ScriptEditorHandler] ${message}`);
            if (data !== null) {
                console.log(data);
            }
        }
    }

    initializeEventListeners() {
        console.log('[ScriptEditorHandler] Initializing event listeners');
        
        // Configurer le bouton Manual dès que possible
        this.setupManualButton();
        
        // Attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[ScriptEditorHandler] DOM loaded, initializing handlers');
            
            // Référencer les gestionnaires existants
            this.monacoHandler = window.monacoHandler;
            this.manualViewHandler = window.manualViewHandler;
            
            // Configurer le bouton Manual existant (second essai après chargement complet)
            this.setupManualButton();
            
            // Écouter les changements de contenu dans l'éditeur Monaco
            document.addEventListener('scriptContentChanged', (e) => {
                this.currentScript = e.detail.content;
                console.log('[ScriptEditorHandler] Script content updated');
            });
        });
        
        // Écouter les changements de vue pour configurer le bouton Manual
        document.addEventListener('viewChanged', (event) => {
            console.log('[ScriptEditorHandler] View changed, reconfiguring Manual button');
            this.setupManualButton();
        });
    }

    setupManualButton() {
        console.log('[ScriptEditorHandler] Setting up Manual button - DEBUG MODE');
        
        // Fonction pour configurer un bouton
        const configureButton = (button) => {
            if (!button) return false;
            
            console.log('[ScriptEditorHandler] Found Manual button to configure');
            
            // Ajouter un attribut pour le marquer comme configuré
            if (button.getAttribute('data-script-editor-configured') === 'true') {
                console.log('[ScriptEditorHandler] Button already configured');
                return true;
            }
            
            // Ajouter notre gestionnaire d'événement personnalisé
            button.addEventListener('click', async (e) => {
                console.log('[ScriptEditorHandler] Manual button clicked!');
                
                // Vérifier le mode actuel
                if (window.pythonFileHandler && window.pythonFileHandler.viewType === 'script') {
                    console.log('[ScriptEditorHandler] Currently in script mode, converting to manual...');
                    
                    try {
                        // Récupérer le contenu actuel de l'éditeur Monaco
                        let scriptContent = '';
                        if (window.monacoHandler && window.monacoHandler.editor) {
                            try {
                                scriptContent = window.monacoHandler.getCurrentContent();
                                console.log('[ScriptEditorHandler] Got content from Monaco editor, length:', scriptContent.length);
                                console.log('[ScriptEditorHandler] First 50 chars:', scriptContent.substring(0, 50));
                                
                                // Mettre à jour le contenu actuel dans pythonFileHandler
                                if (window.pythonFileHandler) {
                                    window.pythonFileHandler.currentContent = scriptContent;
                                    console.log('[ScriptEditorHandler] Updated pythonFileHandler.currentContent');
                                }
                            } catch (e) {
                                console.error('[ScriptEditorHandler] Error getting content from Monaco:', e);
                            }
                        }
                        
                        // Sauvegarder le contenu actuel si possible
                        if (window.pythonFileHandler && window.pythonFileHandler.saveCurrentFile) {
                            // Forcer le type de vue à 'manual' pour éviter que la sauvegarde soit sautée
                            window.pythonFileHandler.viewType = 'manual';
                            await window.pythonFileHandler.saveCurrentFile('manual');
                            console.log('[ScriptEditorHandler] File saved with viewType=manual');
                        }
                        
                        // Convertir le script en mode manuel directement via l'API
                        await this.convertScriptToManualDirect(scriptContent);
                        
                        // Forcer la mise à jour de l'affichage après la conversion
                        setTimeout(() => {
                            if (window.pythonFileHandler) {
                                try {
                                    // S'assurer que nous sommes en mode manuel
                                    window.pythonFileHandler.viewType = 'manual';
                                    
                                    // Forcer la mise à jour de l'affichage
                                    window.pythonFileHandler.displayContent();
                                    console.log('[ScriptEditorHandler] Display forcefully updated to manual mode');
                                    
                                    // Activer l'onglet manuel si possible
                                    const manualTab = document.querySelector('button.view-tab[data-view="manual"]');
                                    if (manualTab) {
                                        manualTab.click();
                                        console.log('[ScriptEditorHandler] Manual tab forcefully activated');
                                    }
                                } catch (e) {
                                    console.error('[ScriptEditorHandler] Error forcing display update:', e);
                                }
                            }
                        }, 1000); // Attendre 1 seconde pour s'assurer que tout est prêt
                    } catch (e) {
                        console.error('[ScriptEditorHandler] Error converting to manual:', e);
                        this.showErrorMessage('Erreur lors de la conversion en mode manuel');
                    }
                } else {
                    console.log('[ScriptEditorHandler] Not in script mode, letting default behavior proceed');
                }
            }, true); // Utiliser la phase de capture pour intercepter l'événement avant le gestionnaire par défaut
            
            // Marquer le bouton comme configuré
            button.setAttribute('data-script-editor-configured', 'true');
            
            console.log('[ScriptEditorHandler] Manual button configured successfully');
            return true;
        };
        
        // Fonction pour trouver et configurer le bouton Manual de différentes manières
        const setupExistingButton = () => {
            // Essayer plusieurs sélecteurs pour trouver le bouton Manual
            const selectors = [
                'button.view-tab[data-view="manual"]',
                'button[data-view="manual"]',
                '.view-tab[data-view="manual"]',
                'button:contains("Manual")',
                'button.manual-btn',
                '#manual-btn',
                'button.manual',
                '#manual'
            ];
            
            // Essayer chaque sélecteur
            for (const selector of selectors) {
                try {
                    const buttons = document.querySelectorAll(selector);
                    console.log(`[ScriptEditorHandler] Found ${buttons.length} buttons with selector: ${selector}`);
                    
                    // Configurer chaque bouton trouvé
                    for (const button of buttons) {
                        if (configureButton(button)) {
                            return true;
                        }
                    }
                } catch (e) {
                    console.error(`[ScriptEditorHandler] Error with selector ${selector}:`, e);
                }
            }
            
            // Essayer de trouver par texte
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                if (button.textContent.trim().toLowerCase() === 'manual') {
                    console.log('[ScriptEditorHandler] Found Manual button by text content');
                    if (configureButton(button)) {
                        return true;
                    }
                }
            }
            
            console.log('[ScriptEditorHandler] Manual button not found with any method');
            return false;
        };
        
        // Essayer de configurer le bouton immédiatement
        if (!setupExistingButton()) {
            // Si ça échoue, réessayer périodiquement
            console.log('[ScriptEditorHandler] Button not found, will retry...');
            const checkInterval = setInterval(() => {
                if (setupExistingButton()) {
                    console.log('[ScriptEditorHandler] Button configured successfully on retry');
                    clearInterval(checkInterval);
                }
            }, 500);
        }
        
        // Configurer également les onglets de vue
        this.setupViewTabs();
    }
    
    // Configurer les onglets de vue (script/manual)
    setupViewTabs() {
        console.log('[ScriptEditorHandler] Setting up view tabs');
        
        // Rechercher le sélecteur de vue
        const viewSelector = document.getElementById('view-selector');
        if (viewSelector) {
            console.log('[ScriptEditorHandler] Found view selector');
            
            // Vérifier s'il est déjà configuré
            if (viewSelector.getAttribute('data-script-editor-configured') === 'true') {
                console.log('[ScriptEditorHandler] View selector already configured');
                return;
            }
            
            // Ajouter notre gestionnaire d'événement personnalisé
            viewSelector.addEventListener('change', (e) => {
                const viewType = e.target.value;
                console.log(`[ScriptEditorHandler] View selector changed to: ${viewType}`);
                
                if (viewType === 'manual' && window.pythonFileHandler && window.pythonFileHandler.viewType === 'script') {
                    console.log('[ScriptEditorHandler] Converting to manual via view selector');
                    e.preventDefault();
                    e.stopPropagation();
                    this.convertToManual();
                }
            }, true);
            
            // Marquer le sélecteur comme configuré
            viewSelector.setAttribute('data-script-editor-configured', 'true');
            console.log('[ScriptEditorHandler] View selector configured successfully');
        } else {
            console.log('[ScriptEditorHandler] View selector not found');
        }
    }

    /**
     * Convertit le script modifié en mode manuel
     */
    async convertToManual() {
        console.log('[ScriptEditorHandler] Converting script to manual mode - DEBUG MODE');
        
        // Récupérer le contenu actuel du script depuis l'éditeur Monaco
        let scriptContent = '';
        if (window.monacoHandler && window.monacoHandler.editor) {
            try {
                scriptContent = window.monacoHandler.getCurrentContent();
                console.log('[ScriptEditorHandler] Got content from Monaco editor, length:', scriptContent.length);
                if (scriptContent.length > 0) {
                    console.log('[ScriptEditorHandler] First 50 chars:', scriptContent.substring(0, 50) + '...');
                }
                
                // Mettre à jour le contenu dans window.currentFile
                if (window.currentFile) {
                    window.currentFile.content = scriptContent;
                    console.log('[ScriptEditorHandler] Updated window.currentFile.content with Monaco content');
                }
            } catch (e) {
                console.error('[ScriptEditorHandler] Error getting content from Monaco:', e);
            }
        } else {
            console.log('[ScriptEditorHandler] Monaco editor not found or not initialized');
        }
        
        // Si aucun contenu n'a été récupéré, utiliser le contenu stocké
        if (!scriptContent && this.currentScript) {
            scriptContent = this.currentScript;
            console.log('[ScriptEditorHandler] Using stored script content');
        }
        
        if (!scriptContent) {
            console.error('[ScriptEditorHandler] No script content available');
            this.showErrorMessage('Erreur: Aucun contenu de script disponible');
            return;
        }
        
        // Vérifier si un fichier est actuellement chargé
        if (window.pythonFileHandler && window.pythonFileHandler.currentFilePath) {
            try {
                console.log('[ScriptEditorHandler] Current file path:', window.pythonFileHandler.currentFilePath);
                
                // Mettre à jour le contenu avant de sauvegarder
                window.pythonFileHandler.currentContent = scriptContent;
                
                console.log('[ScriptEditorHandler] Attempting to save current content via pythonFileHandler...');
                await window.pythonFileHandler.saveCurrentFile('script');
                console.log('[ScriptEditorHandler] Content saved successfully');
            } catch (e) {
                console.error('[ScriptEditorHandler] Error saving content:', e);
                // Continuer même si la sauvegarde échoue
            }
        } else {
            console.log('[ScriptEditorHandler] No file currently loaded or path not set');
            console.log('[ScriptEditorHandler] Will convert script directly without saving');
        }
        
        // Si on n'a pas pu récupérer le contenu de Monaco, essayer d'autres sources
        if (!scriptContent && this.currentScript) {
            scriptContent = this.currentScript;
            console.log('[ScriptEditorHandler] Using stored script content');
        } else if (!scriptContent && window.pythonFileHandler && window.pythonFileHandler.currentContent) {
            scriptContent = window.pythonFileHandler.currentContent;
            console.log('[ScriptEditorHandler] Using content from Python handler');
        }
        
        if (!scriptContent) {
            console.error('[ScriptEditorHandler] No script content available');
            this.showErrorMessage('Erreur: Aucun contenu de script disponible');
            return;
        }
        
        // Créer un exemple de script Python minimal si le contenu est trop court
        if (scriptContent.length < 50) {
            console.log('[ScriptEditorHandler] Script content too short, adding minimal Python structure');
            scriptContent = `import json\nimport logging\nfrom WebUI import BuiltinKeywords\nfrom WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI\nfrom WebUI.DriverFactory import DriverFactory\n\n${scriptContent}`;
        }
        
        console.log('[ScriptEditorHandler] Script content to convert:', scriptContent.substring(0, 100));
        
        // Appeler directement l'API pour la conversion
        this.convertScriptToManualDirect(scriptContent);
    }
    
    /**
     * Méthode de secours pour convertir le script en mode manuel directement via l'API
     */
    async convertScriptToManualDirect(scriptContent) {
        this.log('Converting script to manual mode directly via API');
        console.log('[ScriptEditorHandler] Sending script to API, length:', scriptContent.length);
        
        // Vérifier que le contenu du script n'est pas vide
        if (!scriptContent || scriptContent.trim() === '') {
            console.error('[ScriptEditorHandler] Script content is empty or invalid');
            this.showErrorMessage('Erreur: Le contenu du script est vide ou invalide');
            return;
        }
        
        // Mettre à jour le contenu du script dans le gestionnaire Python si disponible
        if (window.pythonFileHandler) {
            window.pythonFileHandler.currentContent = scriptContent;
            console.log('[ScriptEditorHandler] Updated pythonFileHandler.currentContent');
            
            // Si aucun fichier n'est chargé, créer un fichier temporaire en mémoire
            if (!window.pythonFileHandler.currentFilePath) {
                console.log('[ScriptEditorHandler] No file path set, using temporary file for conversion');
                // Nous ne définissons pas de chemin de fichier réel, mais nous indiquons que nous travaillons sur un script Python
                window.pythonFileHandler.viewType = 'script';
            }
        }
        
        const requestData = {
            script: scriptContent
        };
        console.log('[ScriptEditorHandler] Sending request to API...');
        
        try {
            const response = await fetch('/api/script-to-manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('[ScriptEditorHandler] Script successfully converted to manual mode');
                console.log('[ScriptEditorHandler] Manual steps:', data.manual_steps);
                
                // Stocker les étapes manuelles converties pour une utilisation ultérieure
                this.convertedManualSteps = data.manual_steps;
                
                // Mettre à jour le mode d'affichage si possible
                if (window.pythonFileHandler) {
                    console.log('[ScriptEditorHandler] Updating pythonFileHandler with manual steps');
                    
                    // Mettre à jour directement les étapes manuelles dans le gestionnaire Python
                    window.pythonFileHandler.parsedContent = data.manual_steps;
                    window.pythonFileHandler.viewType = 'manual';
                    
                    // Si aucun fichier n'est actuellement chargé, créer un fichier temporaire
                    if (!window.pythonFileHandler.currentFilePath) {
                        console.log('[ScriptEditorHandler] No file path set, creating temporary file');
                        
                        // Créer un nom de fichier temporaire
                        const tempFileName = `temp_script_${Date.now()}.py`;
                        
                        // S'assurer que le chemin du projet est défini
                        if (!window.pythonFileHandler.currentProjectPath) {
                            // Essayer de récupérer le chemin du projet depuis l'interface
                            const projectRoot = document.querySelector('.project-root');
                            if (projectRoot && projectRoot.dataset.path) {
                                window.pythonFileHandler.currentProjectPath = projectRoot.dataset.path;
                                console.log('[ScriptEditorHandler] Found project path from UI:', window.pythonFileHandler.currentProjectPath);
                            } else {
                                // Demander le chemin du projet au serveur
                                fetch('/api/get-current-project')
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.success && data.project_path) {
                        const projectPath = window.pythonFileHandler.currentProjectPath || '';
                        console.log('[ScriptEditorHandler] Project path for save:', projectPath);
                        
                (async () => {
                  try {
                    // Étape 1: Sauvegarde directe
                    const saveResponse = await fetch('/save_py_file', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        path: originalFilePath,
                        content: scriptContent,
                        project_path: projectPath
                      })
                    });

                    const saveResult = await saveResponse.json();
                    if (saveResult.success) {
                      console.log('[ScriptEditorHandler] Script content saved successfully');
                    } else {
                      console.error('[ScriptEditorHandler] Error saving script content:', saveResult.message);
                    }

                    console.log('[ScriptEditorHandler] Creating file with parent:', parent, 'and name:', name);

                    // Étape 2: Créer le fichier vide
                    const createResponse = await fetch('/api/create-file', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        parent: parent,
                        name: name,
                        xmlForTestCase: false
                      })
                    });

                    const createResult = await createResponse.json();
                    if (!createResult.success) {
                      console.error('[ScriptEditorHandler] Error creating temporary file:', createResult.message);
                      return;
                    }

                    console.log('[ScriptEditorHandler] Temporary file created successfully');

                    // Étape 3: Sauvegarder le contenu dans ce fichier
                    const projectPathForSave = window.pythonFileHandler.currentProjectPath || '';
                    console.log('[ScriptEditorHandler] Project path for save:', projectPathForSave);

                    const saveResponse2 = await fetch('/save_py_file', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        path: filePath,
                        content: scriptContent,
                        project_path: projectPathForSave
                      })
                    });

                    const saveResult2 = await saveResponse2.json();
                    if (!saveResult2.success) {
                      console.error('[ScriptEditorHandler] Error saving script content:', saveResult2.message);
                      return;
                    }

                    console.log('[ScriptEditorHandler] Script content saved successfully');

                    // Affichage après sauvegarde
                    if (window.pythonFileHandler) {
                      const manualSteps = this.convertedManualSteps || data.manual_steps;

                      if (manualSteps && manualSteps.length > 0) {
                        window.pythonFileHandler.parsedContent = manualSteps;
                        window.pythonFileHandler.viewType = 'manual';

                        if (window.currentFile) {
                          window.currentFile.parsedContent = manualSteps;
                          window.currentFile.manualSteps = manualSteps;
                        }
                      }

                      setTimeout(() => {
                        try {
                          if (data?.manual_steps?.length > 0) {
                            window.pythonFileHandler.parsedContent = data.manual_steps;

                            if (window.currentFile) {
                              window.currentFile.parsedContent = data.manual_steps;
                              window.currentFile.manualSteps = data.manual_steps;
                            }
                          }

                          window.pythonFileHandler.displayContent();
                          const manualTab = document.querySelector('button.view-tab[data-view="manual"]');
                          manualTab?.click();
                        } catch (e) {
                          console.error('[ScriptEditorHandler] Error updating display after save:', e);
                        }
                      }, 1000);
                    }

                  } catch (e) {
                    console.error('[ScriptEditorHandler] Unexpected error:', e);
                  }
                })();

                    
                    // Mettre à jour le contenu parsé et le type de vue
                    window.pythonFileHandler.parsedContent = data.manual_steps;
                    window.pythonFileHandler.viewType = 'manual';
                    
                    // Forcer la mise à jour de l'affichage
                    try {
                        window.pythonFileHandler.displayContent();
                        console.log('[ScriptEditorHandler] Display updated to manual mode');
                    } catch (e) {
                        console.error('[ScriptEditorHandler] Error updating display:', e);
                    }
                    
                    // Activer l'onglet manuel si possible
                    const manualTab = document.querySelector('button.view-tab[data-view="manual"]');
                    if (manualTab) {
                        try {
                            // Simuler un clic sur l'onglet manuel
                            manualTab.click();
                            console.log('[ScriptEditorHandler] Manual tab activated');
                        } catch (e) {
                            console.error('[ScriptEditorHandler] Error activating manual tab:', e);
                        }
                    }
                } else {
                    console.error('[ScriptEditorHandler] pythonFileHandler not available');
                }
                
                // Mettre à jour la vue manuelle directement si disponible
                if (window.manualViewHandler) {
                    try {
                        window.manualViewHandler.displayManualView(data.manual_steps);
                        console.log('[ScriptEditorHandler] Manual view updated via manualViewHandler');
                    } catch (e) {
                        console.error('[ScriptEditorHandler] Error updating manual view:', e);
                    }
                }
                
                this.showSuccessMessage('Script converti en mode manuel avec succès');
            } else {
                console.error('Error converting script:', data.message);
                this.showErrorMessage('Erreur lors de la conversion: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('Erreur de communication avec le serveur');
        }
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
        messageContainer.className = 'script-editor-message';
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
}

// Initialiser le gestionnaire d'édition de script
document.addEventListener('DOMContentLoaded', () => {
    window.scriptEditorHandler = new ScriptEditorHandler();
});
