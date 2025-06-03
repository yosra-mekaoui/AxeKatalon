class TabManager {
    constructor() {
        this.tabsBar = document.querySelector('.tabs-bar');
        this.activeTab = null;
        this.tabs = new Map();
        this.fileCache = new Map(); // Cache pour stocker le contenu des fichiers
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Écouter les clics sur les fichiers dans la sidebar
        document.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file');
            if (fileItem) {
                const filePath = fileItem.dataset.path || fileItem.getAttribute('data-path');
                const fileName = fileItem.querySelector('span').textContent;
                this.openTab(filePath, fileName);
            }
        });

        // Écouter l'événement fileLoaded pour mettre à jour le cache
        document.addEventListener('fileLoaded', (event) => {
            const { filePath, content, type, manualSteps } = event.detail;
            // Ajouter au cache
            this.fileCache.set(filePath, {
                content,
                type,
                manualSteps
            });
        });
    }

    createTabElement(filePath, fileName) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.path = filePath;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'tab-title';
        titleSpan.textContent = fileName;

        const closeButton = document.createElement('span');
        closeButton.className = 'tab-close';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(filePath);
        });

        tab.appendChild(titleSpan);
        tab.appendChild(closeButton);

        // Charger le fichier depuis le cache ou le serveur lors du clic sur l'onglet
        tab.addEventListener('click', () => {
            if (this.activeTab !== tab) { // Eviter de recharger si c'est le même onglet
                this.activateTab(filePath);
                
                // Vérifier si le fichier est déjà dans le cache avant de le charger
                if (this.fileCache.has(filePath)) {
                    // Si le fichier est dans le cache, mettre à jour window.currentFile
                    const fileData = this.fileCache.get(filePath);
                    console.log("Tab click: Cache pour", filePath, ":", fileData);
                    
                    // Récupérer les étapes analysées du cache
                    let parsedSteps = [];
                    if (fileData.parsed_content && Array.isArray(fileData.parsed_content) && fileData.parsed_content.length > 0) {
                        parsedSteps = fileData.parsed_content;
                        console.log("Tab click: Étapes récupérées du cache:", parsedSteps.length, "étapes");
                    } else {
                        console.log("Tab click: Pas d'étapes dans le cache, analyse du contenu...");
                        // Si pas d'étapes dans le cache, essayer d'analyser le contenu
                        if (fileData.content && filePath.endsWith('.py') && window.pythonScriptAnalyzer) {
                            try {
                                const hierarchicalActions = window.pythonScriptAnalyzer.analyze(fileData.content);
                                console.log("Tab click: Actions hiérarchiques extraites:", hierarchicalActions.length, "actions");
                                
                                if (typeof window.convertHierarchicalActionsToSteps === 'function') {
                                    parsedSteps = window.convertHierarchicalActionsToSteps(hierarchicalActions);
                                    console.log("Tab click: Étapes converties:", parsedSteps.length, "étapes");
                                    
                                    // Mettre à jour le cache avec les étapes analysées
                                    fileData.parsed_content = parsedSteps;
                                    this.fileCache.set(filePath, fileData);
                                    console.log("Tab click: Cache mis à jour avec", parsedSteps.length, "étapes");
                                }
                            } catch (error) {
                                console.error("Tab click: Erreur lors de l'analyse:", error);
                            }
                        }
                    }
                    
                    // Mettre à jour window.currentFile avec les données du cache
                    window.currentFile = {
                        path: filePath,
                        content: fileData.content,
                        parsedContent: parsedSteps,
                        type: fileData.type || 'text',
                        manualSteps: fileData.manualSteps || [],
                        isProfile: filePath.endsWith('.glbl') // Marquer comme profil si c'est un fichier .glbl
                    };
                    
                    console.log("Tab click: window.currentFile mis à jour avec", parsedSteps.length, "étapes");
                    
                    // Mettre à jour l'affichage avec le contenu du fichier sélectionné
                    const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                    if (typeof window.displayFileContent === 'function') {
                        window.displayFileContent(viewMode);
                    }
                } else {
                    // Si le fichier n'est pas dans le cache, le charger
                    this.displayFile(filePath);
                }
            }
        });

        return tab;
    }

    // Méthode pour afficher un fichier depuis le cache ou le charger du serveur si nécessaire
    async displayFile(filePath) {
        // Vérifier si le fichier est dans le cache
        if (this.fileCache.has(filePath)) {
            console.log("Utilisation du cache pour:", filePath);
            const fileData = this.fileCache.get(filePath);
            
            // Vérifier si c'est un fichier de profil (.glbl)
            if (filePath.endsWith('.glbl')) {
                console.log("Fichier de profil détecté dans le cache:", filePath);
                
                // Mettre à jour window.currentFile pour les profils
                window.currentFile = {
                    path: filePath,
                    content: fileData.content,
                    type: fileData.type || 'text',
                    isProfile: true
                };
                
                // Mettre à jour l'affichage avec le contenu du profil
                const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                if (typeof window.displayFileContent === 'function') {
                    window.displayFileContent(viewMode);
                }
                
                return;
            }
            
            // Pour les autres types de fichiers, continuer avec le traitement normal
            // Analyser le contenu Python si nécessaire
            let parsedSteps = [];
            
            // Priorité 1: Utiliser les étapes originales de l'API si disponibles
            if (fileData.original_parsed_content && Array.isArray(fileData.original_parsed_content) && fileData.original_parsed_content.length > 0) {
                parsedSteps = fileData.original_parsed_content;
                console.log("Utilisation des étapes originales de l'API:", parsedSteps.length, "étapes");
            }
            // Priorité 2: Utiliser les étapes précédemment analysées si disponibles
            else if (fileData.parsed_content && Array.isArray(fileData.parsed_content) && fileData.parsed_content.length > 0) {
                parsedSteps = fileData.parsed_content;
                console.log("Utilisation des étapes précédemment analysées:", parsedSteps.length, "étapes");
            }
            // Priorité 3: Extraire les étapes du contenu
            else if (fileData.content) {
                // Utiliser notre nouvel analyseur hiérarchique si disponible
                if (window.pythonScriptAnalyzer && filePath.endsWith('.py')) {
                    console.log("Utilisation de l'analyseur hiérarchique de script Python...");
                    try {
                        // Utiliser l'analyseur hiérarchique
                        const hierarchicalActions = window.pythonScriptAnalyzer.analyze(fileData.content);
                        console.log("Actions hiérarchiques extraites:", hierarchicalActions.length, "actions");
                        
                        // Convertir les actions hiérarchiques en étapes plates
                        if (typeof window.convertHierarchicalActionsToSteps === 'function') {
                            parsedSteps = window.convertHierarchicalActionsToSteps(hierarchicalActions);
                            console.log("Étapes converties:", parsedSteps.length, "étapes");
                        }
                    } catch (error) {
                        console.error('Erreur lors de l\'utilisation de l\'analyseur hiérarchique:', error);
                        // Fallback à l'analyseur non hiérarchique
                        if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                            console.log("Fallback à l'analyseur non hiérarchique...");
                            try {
                                const actions = window.extractActionsFromPythonScript(fileData.content);
                                console.log("Actions extraites avec le nouvel analyseur:", actions.length, "actions");
                                const tableFormat = window.convertActionsToTableFormat(actions);
                                console.log("Format tabulaire généré:", tableFormat.length, "lignes");
                                
                                // Convertir le format tabulaire en étapes manuelles
                                if (window.pythonConverter && typeof window.pythonConverter.convertTableFormatToManualSteps === 'function') {
                                    parsedSteps = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                                } else {
                                    // Conversion manuelle si pythonConverter n'est pas disponible
                                    parsedSteps = tableFormat.map(row => ({
                                        actionType: row.actionItem,
                                        action: row.action,
                                        input: row.input,
                                        output: row.output,
                                        description: row.description,
                                        is_control_structure: row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling'
                                    }));
                                }
                                console.log("Étapes converties:", parsedSteps.length, "étapes");
                            } catch (error) {
                                console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                                // Fallback à l'ancienne méthode
                                if (typeof window.extractStepsFromPythonContent === 'function') {
                                    parsedSteps = window.extractStepsFromPythonContent(fileData.content);
                                    console.log("Extraction de nouvelles étapes avec l'ancienne méthode:", parsedSteps.length, "étapes");
                                }
                            }
                        }
                    }
                }
                // Utiliser l'analyseur non hiérarchique si l'analyseur hiérarchique n'est pas disponible
                else if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                    console.log("Utilisation du nouvel analyseur de script Python...");
                    try {
                        const actions = window.extractActionsFromPythonScript(fileData.content);
                        console.log("Actions extraites avec le nouvel analyseur:", actions.length, "actions");
                        const tableFormat = window.convertActionsToTableFormat(actions);
                        console.log("Format tabulaire généré:", tableFormat.length, "lignes");
                        
                        // Convertir le format tabulaire en étapes manuelles
                        if (window.pythonConverter && typeof window.pythonConverter.convertTableFormatToManualSteps === 'function') {
                            parsedSteps = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                        } else {
                            // Conversion manuelle si pythonConverter n'est pas disponible
                            parsedSteps = tableFormat.map(row => ({
                                actionType: row.actionItem,
                                action: row.action,
                                input: row.input,
                                output: row.output,
                                description: row.description,
                                is_control_structure: row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling'
                            }));
                        }
                        console.log("Étapes converties:", parsedSteps.length, "étapes");
                    } catch (error) {
                        console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                        // Fallback à l'ancienne méthode
                        if (typeof window.extractStepsFromPythonContent === 'function') {
                            parsedSteps = window.extractStepsFromPythonContent(fileData.content);
                            console.log("Extraction de nouvelles étapes avec l'ancienne méthode:", parsedSteps.length, "étapes");
                        }
                    }
                }
                // Utiliser l'ancienne méthode si aucun des nouveaux analyseurs n'est disponible
                else if (typeof window.extractStepsFromPythonContent === 'function' && filePath.endsWith('.py')) {
                    parsedSteps = window.extractStepsFromPythonContent(fileData.content);
                    console.log("Extraction de nouvelles étapes avec l'ancienne méthode:", parsedSteps.length, "étapes");
                }
            }
            
            // Mettre à jour le cache avec les étapes analysées
            if (parsedSteps.length > 0) {
                fileData.parsed_content = parsedSteps;
                this.fileCache.set(filePath, fileData);
                console.log("Cache mis à jour avec", parsedSteps.length, "étapes");
            }
            
            // Mettre à jour window.currentFile pour l'affichage
            window.currentFile = {
                path: filePath,
                content: fileData.content,
                parsedContent: parsedSteps,
                type: fileData.type || 'text',
                manualSteps: fileData.manualSteps || [],
                isProfile: filePath.endsWith('.glbl') // Marquer comme profil si c'est un fichier .glbl
            };
            
            console.log("window.currentFile mis à jour avec", parsedSteps.length, "étapes");
            
            // Envoyer l'événement avec les données du cache
            document.dispatchEvent(new CustomEvent('fileLoaded', {
                detail: {
                    filePath: filePath,
                    content: fileData.content,
                    type: fileData.type,
                    manualSteps: fileData.manualSteps,
                    parsedContent: parsedSteps  // Ajouter les étapes analysées
                }
            }));
            
            // Forcer une mise à jour de l'affichage
            setTimeout(() => {
                try {
                    const activeTab = document.querySelector('.view-tab.active');
                    const viewMode = activeTab ? activeTab.getAttribute('data-view') : 'manual';
                    // Vérifier si displayFileContent est accessible via window
                    if (typeof window.displayFileContent === 'function') {
                        window.displayFileContent(viewMode);
                    } else if (typeof displayFileContent === 'function') {
                        displayFileContent(viewMode);
                    } else {
                        console.log("Fonction displayFileContent non trouvée, mais le fichier est bien chargé dans window.currentFile");
                    }
                } catch (error) {
                    console.error("Erreur lors de l'affichage du fichier:", error);
                }
            }, 50); // Petit délai pour s'assurer que l'événement fileLoaded a été traité
        } else {
            // Si pas dans le cache, charger depuis le serveur
            console.log("Fichier non trouvé dans le cache, chargement du serveur:", filePath);
            await this.loadFile(filePath);
        }
    }

    async loadFile(filePath, projectPath) {
        console.log("Chargement du fichier:", filePath);
        try {
            // Si projectPath n'est pas fourni, utiliser la variable currentProjectPath globale
            const currentPath = projectPath || window.currentProjectPath || '';
            
            const response = await fetch('/open_file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: filePath,
                    project_path: currentPath
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                console.log("Fichier chargé avec succès:", filePath);
                
                // Vérifier si c'est un fichier de profil (.glbl)
                if (filePath.endsWith('.glbl')) {
                    console.log("Fichier de profil détecté depuis le serveur:", filePath);
                    
                    // Mettre à jour le cache
                    this.fileCache.set(filePath, {
                        content: data.content,
                        type: data.type || 'text'
                    });
                    
                    // Mettre à jour window.currentFile pour les profils
                    window.currentFile = {
                        path: filePath,
                        content: data.content,
                        type: data.type || 'text',
                        isProfile: true
                    };
                    
                    // Mettre à jour l'affichage avec le contenu du profil
                    const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                    if (typeof window.displayFileContent === 'function') {
                        window.displayFileContent(viewMode);
                    }
                    
                    return;
                }
                
                // Déterminer les étapes à utiliser
                let parsedSteps = [];
                
                // Utiliser notre nouvel analyseur hiérarchique si disponible
                if (window.pythonScriptAnalyzer && filePath.endsWith('.py')) {
                    console.log("Utilisation de l'analyseur hiérarchique de script Python lors du chargement initial...");
                    try {
                        // Utiliser l'analyseur hiérarchique
                        const hierarchicalActions = window.pythonScriptAnalyzer.analyze(data.content);
                        console.log("Actions hiérarchiques extraites:", hierarchicalActions.length, "actions");
                        
                        // Convertir les actions hiérarchiques en étapes plates
                        if (typeof window.convertHierarchicalActionsToSteps === 'function') {
                            parsedSteps = window.convertHierarchicalActionsToSteps(hierarchicalActions);
                            console.log("Étapes converties:", parsedSteps.length, "étapes");
                        }
                    } catch (error) {
                        console.error('Erreur lors de l\'utilisation de l\'analyseur hiérarchique:', error);
                        // Fallback à l'analyseur non hiérarchique
                        if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                            console.log("Fallback à l'analyseur non hiérarchique...");
                            try {
                                const actions = window.extractActionsFromPythonScript(data.content);
                                console.log("Actions extraites avec le nouvel analyseur:", actions.length, "actions");
                                const tableFormat = window.convertActionsToTableFormat(actions);
                                console.log("Format tabulaire généré:", tableFormat.length, "lignes");
                                
                                // Convertir le format tabulaire en étapes manuelles
                                if (window.pythonConverter && typeof window.pythonConverter.convertTableFormatToManualSteps === 'function') {
                                    parsedSteps = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                                } else {
                                    // Conversion manuelle si pythonConverter n'est pas disponible
                                    parsedSteps = tableFormat.map(row => ({
                                        actionType: row.actionItem,
                                        action: row.action,
                                        input: row.input,
                                        output: row.output,
                                        description: row.description,
                                        is_control_structure: row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling'
                                    }));
                                }
                                console.log("Étapes converties:", parsedSteps.length, "étapes");
                            } catch (error) {
                                console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                                // Fallback aux étapes de l'API ou à l'ancienne méthode
                                if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                                    parsedSteps = data.parsed_content;
                                    console.log("Fallback aux étapes de l'API:", parsedSteps.length, "étapes");
                                } else if (typeof window.extractStepsFromPythonContent === 'function') {
                                    parsedSteps = window.extractStepsFromPythonContent(data.content);
                                    console.log("Fallback à l'ancienne méthode d'extraction:", parsedSteps.length, "étapes");
                                }
                            }
                        }
                    }
                }
                // Fallback à l'analyseur non hiérarchique
                else if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                    console.log("Utilisation du nouvel analyseur de script Python lors du chargement initial...");
                    try {
                        const actions = window.extractActionsFromPythonScript(data.content);
                        console.log("Actions extraites avec le nouvel analyseur:", actions.length, "actions");
                        const tableFormat = window.convertActionsToTableFormat(actions);
                        console.log("Format tabulaire généré:", tableFormat.length, "lignes");
                        
                        // Convertir le format tabulaire en étapes manuelles
                        if (window.pythonConverter && typeof window.pythonConverter.convertTableFormatToManualSteps === 'function') {
                            parsedSteps = window.pythonConverter.convertTableFormatToManualSteps(tableFormat);
                        } else {
                            // Conversion manuelle si pythonConverter n'est pas disponible
                            parsedSteps = tableFormat.map(row => ({
                                actionType: row.actionItem,
                                action: row.action,
                                input: row.input,
                                output: row.output,
                                description: row.description,
                                is_control_structure: row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling'
                            }));
                        }
                        console.log("Étapes converties:", parsedSteps.length, "étapes");
                    } catch (error) {
                        console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                        // Fallback aux étapes de l'API ou à l'ancienne méthode
                        if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                            parsedSteps = data.parsed_content;
                            console.log("Fallback aux étapes de l'API:", parsedSteps.length, "étapes");
                        } else if (typeof window.extractStepsFromPythonContent === 'function') {
                            parsedSteps = window.extractStepsFromPythonContent(data.content);
                            console.log("Fallback à l'ancienne méthode d'extraction:", parsedSteps.length, "étapes");
                        }
                    }
                }
                // Fallback aux étapes de l'API ou à l'ancienne méthode
                else if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                    // Utiliser les étapes fournies par l'API
                    parsedSteps = data.parsed_content;
                    console.log("Utilisation des étapes de l'API:", parsedSteps.length, "étapes");
                } else if (data.content && typeof window.extractStepsFromPythonContent === 'function') {
                    // Extraire les étapes du contenu avec l'ancienne méthode
                    parsedSteps = window.extractStepsFromPythonContent(data.content);
                    console.log("Étapes extraites du contenu avec l'ancienne méthode:", parsedSteps.length, "étapes");
                }
                
                // Ajouter au cache avec toutes les données importantes
                this.fileCache.set(filePath, {
                    content: data.content,
                    type: data.type || 'text',
                    manualSteps: data.manual_steps || [],
                    parsed_content: parsedSteps,
                    original_parsed_content: data.parsed_content || [] // Conserver les étapes originales
                });

                // Mettre à jour window.currentFile pour l'affichage
                window.currentFile = {
                    path: filePath,
                    content: data.content,
                    parsedContent: parsedSteps,
                    isProfile: filePath.endsWith('.glbl') // Marquer comme profil si c'est un fichier .glbl
                };
                
                console.log("Contenu mis à jour depuis le serveur:", window.currentFile);

                document.dispatchEvent(new CustomEvent('fileLoaded', {
                    detail: {
                        filePath: filePath,
                        content: data.content,
                        type: data.type,
                        manualSteps: data.manual_steps,
                        parsedContent: parsedSteps  // Ajouter les étapes analysées
                    }
                }));
                
                // Forcer une mise à jour de l'affichage avec un petit délai
                setTimeout(() => {
                    try {
                        const activeTab = document.querySelector('.view-tab.active');
                        const viewMode = activeTab ? activeTab.getAttribute('data-view') : 'manual';
                        if (typeof window.displayFileContent === 'function') {
                            window.displayFileContent(viewMode);
                        }
                    } catch (error) {
                        console.error("Erreur lors de l'affichage du fichier:", error);
                    }
                }, 50); // Petit délai pour s'assurer que l'événement fileLoaded a été traité
            } else {
                console.error('Erreur API:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du fichier:', error);
        }
    }

    openTab(filePath, fileName) {
        if (!this.tabs.has(filePath)) {
            const tab = this.createTabElement(filePath, fileName);
            this.tabsBar.appendChild(tab);
            this.tabs.set(filePath, tab);
        }
        this.activateTab(filePath); // Activer l'onglet
        
        // Ne pas charger automatiquement le fichier ici pour éviter le double chargement
        // Le chargement sera fait par handleFileClick dans project-handler.js
        // this.displayFile(filePath); // Commenté pour éviter le double chargement
    }

    activateTab(filePath) {
        // Désactiver l'onglet actif
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        
        // Activer le nouvel onglet
        const tab = this.tabs.get(filePath);
        if (tab) {
            tab.classList.add('active');
            this.activeTab = tab;
            
            // Mettre à jour l'affichage des onglets de vue en fonction du type de fichier
            if (window.profileHandler && typeof window.profileHandler.updateViewTabs === 'function') {
                window.profileHandler.updateViewTabs();
            }
            
            // Mettre à jour le fichier actif dans window.currentFilePath
            window.currentFilePath = filePath;
        }
    }

    closeTab(filePath) {
        const tab = this.tabs.get(filePath);
        if (tab) {
            // Si c'est l'onglet actif, activer le suivant ou le précédent
            if (tab === this.activeTab) {
                const tabArray = Array.from(this.tabs.keys());
                const currentIndex = tabArray.indexOf(filePath);
                const nextTab = tabArray[currentIndex + 1] || tabArray[currentIndex - 1];

                if (nextTab) {
                    this.activateTab(nextTab);
                    
                    // Mettre à jour window.currentFile avec les données du cache
                    if (this.fileCache.has(nextTab)) {
                        const fileData = this.fileCache.get(nextTab);
                        window.currentFile = {
                            path: nextTab,
                            content: fileData.content,
                            parsedContent: fileData.parsed_content || [],
                            type: fileData.type || 'text',
                            manualSteps: fileData.manualSteps || [],
                            isProfile: nextTab.endsWith('.glbl') // Marquer comme profil si c'est un fichier .glbl
                        };
                        
                        // Mettre à jour l'affichage
                        const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                        if (typeof window.displayFileContent === 'function') {
                            window.displayFileContent(viewMode);
                        }
                    } else {
                        this.displayFile(nextTab); // Charger le fichier si pas dans le cache
                    }
                } else {
                    this.activeTab = null;
                    window.currentFile = null;
                    window.currentFilePath = null;
                    
                    // Effacer le contenu si aucun onglet n'est actif
                    const contentArea = document.querySelector('.test-content');
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="empty-message">Aucun fichier sélectionné</div>';
                    }
                }
            }

            tab.remove();
            this.tabs.delete(filePath);
        }
    }
}

// Initialiser le gestionnaire d'onglets
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
});
