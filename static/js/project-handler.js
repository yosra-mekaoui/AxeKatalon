// Configuration des dossiers
const FOLDER_CONFIG = {
    'Keywords': {
        extensions: ['.py'],
        icon: 'fas fa-key',
        allowSubfolders: true,
        showSubfolderContent: true,
        visible: true
    },
    'Object Repository': {
        extensions: ['.xml'],
        icon: 'fas fa-cube',
        allowSubfolders: true,
        showSubfolderContent: true,
        visible: true
    },
    'report': {
        icon: 'fas fa-chart-bar',
        showAllContent: true,
        allowSubfolders: true,
        showSubfolderContent: true,
        visible: true
    },
    'reports': {
        extensions: ['.xml'],
        icon: 'fas fa-chart-bar',
        openInEdge: true,
        visible: true
    },
    'Test Suites': {
        extensions: ['.xml', '.py'],
        icon: 'fas fa-layer-group',
        visible: true
    },
    'TestCases': {
        extensions: ['.py', '.xml'],
        icon: 'fas fa-file-code',
        allowSubfolders: true,
        showSubfolderContent: true,
        visible: true
    },
    'Profiles': {
        extensions: ['.glbl'],
        icon: 'fas fa-cog',
        allowSubfolders: true,
        showSubfolderContent: true,
        showAllContent: true,
        visible: true
    },
    'settings': {
        icon: 'fas fa-cog',
        showAllContent: true,
        allowSubfolders: true,
        showSubfolderContent: true,
        visible: true
    }
};

// Liste des dossiers autorisés dans l'ordre d'affichage
const ALLOWED_FOLDERS = [
    'Profiles',
    'TestCases',
    'Object Repository',
    'Test Suites',
    'Keywords',
    'report',
    'reports',
    'settings'
];

// Dossiers à cacher
const HIDDEN_FOLDERS = ['resources', 'Utils', 'WebUI'];

// Variable globale pour stocker le chemin du projet
let currentProjectPath = '';

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    // Rendre la variable accessible globalement
    window.currentProjectPath = currentProjectPath;
    
    initializeFileMenu();
    initializeDefaultFolders();
});

function initializeFileMenu() {
    const fileMenu = document.getElementById('fileMenu');
    if (!fileMenu) {
        console.error('Menu File non trouvé');
        return;
    }

    const dropdownMenu = fileMenu.querySelector('.dropdown-menu');
    if (!dropdownMenu) {
        console.error('Dropdown menu non trouvé');
        return;
    }

    // Gestionnaire de clic pour le menu File
    fileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Fermer le menu lors d'un clic ailleurs
    document.addEventListener('click', function() {
        dropdownMenu.style.display = 'none';
    });

    // Gestionnaire pour "Open Project"
    const openProjectBtn = document.getElementById('openProject');
    if (!openProjectBtn) {
        console.error('Bouton Open Project non trouvé');
        return;
    }

    openProjectBtn.addEventListener('click', handleFileSelect);
}

async function handleFileSelect(event) {
    try {
        const directoryHandle = await window.showDirectoryPicker({
            startIn: 'desktop'
        });
        
        // Récupérer le chemin du projet à partir du nom du dossier sélectionné
        let projectPath = '';
        
        try {
            // Essayer d'obtenir le chemin complet via l'API File System Access
            const fileHandle = await directoryHandle.getFileHandle('.project', { create: false });
            const file = await fileHandle.getFile();
            const projectInfo = await file.text();
            
            // Extraire le chemin du projet du fichier .project si possible
            const pathMatch = projectInfo.match(/<location>([^<]+)<\/location>/);
            if (pathMatch && pathMatch[1]) {
                projectPath = pathMatch[1];
            }
        } catch (e) {
            console.log("Impossible de lire le fichier .project, utilisation du chemin alternatif");
            
            // Récupérer le nom du dossier sélectionné
            const directoryName = directoryHandle.name;
            
            // Essayer de récupérer des informations sur le chemin à partir du contexte de navigation
            try {
                // Récupérer les informations de l'utilisateur actuel
                const userInfoResponse = await fetch('/get_user_info', {
                    method: 'GET'
                });
                
                if (userInfoResponse.ok) {
                    const userData = await userInfoResponse.json();
                    if (userData.success && userData.user_info) {
                        const username = userData.user_info.username;
                        
                        // Construire une liste de chemins possibles
                        const possiblePaths = [
                            // Chemin absolu direct (si le nom contient déjà un chemin)
                            directoryName,
                            // Chemins standards
                            `C:\\Users\\${username}\\Desktop\\${directoryName}`,
                            `C:\\Users\\${username}\\Downloads\\${directoryName}`,
                            `C:\\Users\\${username}\\Documents\\${directoryName}`,
                            // Chemins spécifiques pour les projets de développement
                            `C:\\Users\\${username}\\Documents\\GitHub\\${directoryName}`,
                            `C:\\Users\\${username}\\PycharmProjects\\${directoryName}`,
                            `C:\\Users\\${username}\\IdeaProjects\\${directoryName}`,
                            `C:\\Users\\${username}\\Projects\\${directoryName}`,
                            // Autres lecteurs possibles
                            `D:\\${directoryName}`,
                            `E:\\${directoryName}`
                        ];
                        
                        // Envoyer ces chemins possibles au serveur pour vérification
                        const pathCheckResponse = await fetch('/check_paths', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                paths: possiblePaths
                            })
                        });
                        
                        if (pathCheckResponse.ok) {
                            const pathData = await pathCheckResponse.json();
                            if (pathData.success && pathData.valid_path) {
                                projectPath = pathData.valid_path;
                                console.log("Chemin valide trouvé:", projectPath);
                            } else {
                                // Si aucun chemin n'est valide, demander à l'utilisateur de confirmer le chemin complet
                                const userPath = prompt(
                                    "Impossible de déterminer le chemin complet du projet. " +
                                    "Veuillez entrer le chemin complet du projet (par exemple: C:\\Users\\username\\Documents\\GitHub\\Backk):",
                                    `C:\\Users\\${username}\\Documents\\GitHub\\${directoryName}`
                                );
                                
                                if (userPath) {
                                    // Vérifier si le chemin entré par l'utilisateur existe
                                    const userPathCheckResponse = await fetch('/check_paths', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            paths: [userPath]
                                        })
                                    });
                                    
                                    if (userPathCheckResponse.ok) {
                                        const userPathData = await userPathCheckResponse.json();
                                        if (userPathData.success && userPathData.valid_path) {
                                            projectPath = userPathData.valid_path;
                                            console.log("Chemin utilisateur valide:", projectPath);
                                        } else {
                                            // Si le chemin utilisateur n'est pas valide, utiliser quand même le chemin fourni
                                            projectPath = userPath;
                                            console.log("Utilisation du chemin fourni par l'utilisateur (non vérifié):", projectPath);
                                        }
                                    } else {
                                        projectPath = userPath;
                                        console.log("Utilisation du chemin fourni par l'utilisateur (erreur de vérification):", projectPath);
                                    }
                                } else {
                                    // L'utilisateur a annulé, utiliser le nom du dossier mais afficher un avertissement
                                    projectPath = directoryName;
                                    console.warn("L'utilisateur a annulé la saisie du chemin. Utilisation du nom du dossier:", projectPath);
                                    alert("Attention: Utilisation du nom du dossier comme chemin relatif. Cela pourrait ne pas fonctionner correctement.");
                                }
                            }
                        } else {
                            // En cas d'erreur, demander à l'utilisateur de confirmer le chemin complet
                            const userPath = prompt(
                                "Erreur lors de la vérification des chemins. " +
                                "Veuillez entrer le chemin complet du projet (par exemple: C:\\Users\\username\\Documents\\GitHub\\Backk):",
                                `C:\\Users\\${username}\\Documents\\GitHub\\${directoryName}`
                            );
                            
                            if (userPath) {
                                projectPath = userPath;
                                console.log("Utilisation du chemin fourni par l'utilisateur:", projectPath);
                            } else {
                                // L'utilisateur a annulé, utiliser le nom du dossier mais afficher un avertissement
                                projectPath = directoryName;
                                console.warn("L'utilisateur a annulé la saisie du chemin. Utilisation du nom du dossier:", projectPath);
                                alert("Attention: Utilisation du nom du dossier comme chemin relatif. Cela pourrait ne pas fonctionner correctement.");
                            }
                        }
                    } else {
                        // Si les informations utilisateur ne sont pas disponibles, utiliser le nom du dossier
                        projectPath = directoryName;
                        console.log("Informations utilisateur non disponibles, utilisation du nom du dossier:", projectPath);
                    }
                } else {
                    // En cas d'erreur, utiliser le nom du dossier
                    projectPath = directoryName;
                    console.log("Erreur lors de la récupération des informations utilisateur, utilisation du nom du dossier:", projectPath);
                }
            } catch (userError) {
                console.error("Erreur lors de la récupération des informations utilisateur:", userError);
                projectPath = directoryName;
                console.log("Fallback - Utilisation du nom du dossier:", projectPath);
            }
        }
        
        // Mettre à jour la variable globale avec le chemin du projet
        currentProjectPath = projectPath;
        window.currentProjectPath = currentProjectPath;
        
        console.log("Ouverture du projet:", currentProjectPath);
        
        // Envoyer au serveur pour obtenir la structure de base
        const response = await fetch('/open_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: currentProjectPath
            })
        });

        const data = await response.json();
        if (data.success) {
            // Mettre à jour le chemin du projet avec celui retourné par le serveur
            if (data?.project?.path) {
                currentProjectPath = data.project.path;
                window.currentProjectPath = currentProjectPath;
                console.log("Chemin du projet mis à jour depuis le serveur:", currentProjectPath);
            } else {
                console.log("Attention: data.project ou data.project.path est manquant dans la réponse du serveur");
                console.log("Réponse complète:", JSON.stringify(data));
            }
            
            // Vérifier si data.project existe avant de mettre à jour l'arbre du projet
            if (data.project) {
                updateProjectTree(data.project);
            } else {
                console.error("Erreur: data.project est manquant dans la réponse du serveur");
                showNotification('Erreur lors de la mise à jour de l\'arbre du projet', 'error');
            }
            
            // Charger les profils disponibles pour ce projet
            if (window.profileHandler && typeof window.profileHandler.refreshProfiles === 'function') {
                window.profileHandler.refreshProfiles();
            }
            
            // Afficher un message de succès
            showNotification('Projet ouvert avec succès', 'success');
        } else {
            console.error('Erreur:', data.message);
            showNotification('Erreur lors de l\'ouverture du projet: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la sélection du dossier:', error);
        showNotification('Erreur lors de la sélection du dossier', 'error');
    }
}

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Faire disparaître la notification après 3 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function initializeDefaultFolders() {
    // Ajouter les gestionnaires d'événements pour les flèches des dossiers
    document.querySelectorAll('.folder-content').forEach(folderContent => {
        folderContent.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêcher la propagation de l'événement
            
            const arrow = this.querySelector('.folder-arrow');
            const folder = this.closest('.folder');
            const subfolderContent = folder.querySelector('.subfolder-content');
            
            if (arrow) {
                arrow.classList.toggle('rotated');
                if (subfolderContent) {
                    subfolderContent.classList.toggle('hidden');
                }
            }
        });
    });
}

function initializeFolderHandlers() {
    // Add click handlers to all folders
    const folders = document.querySelectorAll('.folder');
    folders.forEach(folder => {
        folder.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Toggle the folder open/closed state
            const ul = this.nextElementSibling;
            if (ul) {
                const isOpen = this.classList.toggle('open');
                if (isOpen) {
                    ul.style.display = 'block';
                } else {
                    ul.style.display = 'none';
                }
            }
        });
    });
}

function initializeTestStepsTable() {
    // Sélection des lignes dans la table
    const testStepsTable = document.querySelector('.test-steps');
    if (testStepsTable) {
        testStepsTable.addEventListener('click', function(e) {
            const tr = e.target.closest('tr');
            if (tr && !tr.closest('thead')) {
                document.querySelectorAll('.test-steps tbody tr').forEach(row => row.classList.remove('selected'));
                tr.classList.add('selected');
            }
        });
    }

    // Gestion des boutons d'action
    const addButton = document.querySelector('.action-btn:nth-child(1)');
    const deleteButton = document.querySelector('.action-btn:nth-child(2)');
    const moveUpButton = document.querySelector('.action-btn:nth-child(3)');
    const moveDownButton = document.querySelector('.action-btn:nth-child(4)');

    if (addButton) {
        addButton.addEventListener('click', function() {
            const tbody = document.querySelector('.test-steps tbody');
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${tbody.children.length + 1}</td>
                <td>Object</td>
                <td>Action</td>
                <td>Input</td>
                <td>Description</td>
            `;
            tbody.appendChild(newRow);
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            const selectedRow = document.querySelector('.test-steps tr.selected');
            if (selectedRow) {
                selectedRow.remove();
                updateStepNumbers();
            }
        });
    }

    // Gestion du déplacement des étapes
    if (moveUpButton) {
        moveUpButton.addEventListener('click', function() {
            const selectedRow = document.querySelector('.test-steps tr.selected');
            if (selectedRow && selectedRow.previousElementSibling) {
                selectedRow.parentNode.insertBefore(selectedRow, selectedRow.previousElementSibling);
                updateStepNumbers();
            }
        });
    }

    if (moveDownButton) {
        moveDownButton.addEventListener('click', function() {
            const selectedRow = document.querySelector('.test-steps tr.selected');
            if (selectedRow && selectedRow.nextElementSibling) {
                selectedRow.parentNode.insertBefore(selectedRow.nextElementSibling, selectedRow);
                updateStepNumbers();
            }
        });
    }

    // Mise à jour des numéros d'étapes
    function updateStepNumbers() {
        const rows = document.querySelectorAll('.test-steps tbody tr');
        rows.forEach((row, index) => {
            const stepCell = row.cells[0];
            const stepText = stepCell.textContent.split('-')[1].trim();
            stepCell.textContent = `${index + 1}`;
        });
    }
}

function initializeViewTabs() {
    // Gestion des onglets de vue (Manual/Script/Variables)
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Marquer l'onglet actif
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Récupérer le type de vue depuis l'attribut data-view
            const viewType = tab.getAttribute('data-view');
            console.log("Changement de vue vers:", viewType);
            
            // Si window.currentFile existe, mettre à jour l'affichage
            if (window.currentFile) {
                // Vérifier si le fichier actuel est un profil
                if (window.currentFile.isProfile) {
                    // Déléguer l'affichage au gestionnaire de profils
                    if (window.profileHandler) {
                        if (viewType === 'script' || viewType === 'variables-script') {
                            window.profileHandler.displayProfileAsScript();
                        } else {
                            window.profileHandler.displayProfileInTable();
                        }
                    } else {
                        console.error("Gestionnaire de profils non trouvé");
                    }
                } else if (window.currentFile.path) {
                    // Pour les fichiers normaux, utiliser displayFileContent
                    if (viewType === 'manual' || viewType === 'script') {
                        // Utiliser displayFileContent pour les vues manual et script
                        if (typeof window.displayFileContent === 'function') {
                            window.displayFileContent(viewType);
                        }
                    } else if (viewType === 'variables') {
                        // Pour la vue variables, utiliser le gestionnaire de variables
                        if (window.variablesHandler) {
                            window.variablesHandler.showVariablesTable();
                        } else {
                            console.error("Le gestionnaire de variables n'est pas initialisé");
                        }
                    } else if (viewType === 'variables-script') {
                        // Pour la vue variables-script, utiliser le gestionnaire de variables
                        if (window.variablesHandler) {
                            window.variablesHandler.showVariablesScript();
                        } else {
                            console.error("Le gestionnaire de variables n'est pas initialisé");
                        }
                    }
                } else {
                    console.warn("Fichier actif incomplet (pas de chemin)");
                }
            } else {
                console.warn("Aucun fichier actif pour changer de vue");
                const contentArea = document.querySelector('.test-content');
                contentArea.innerHTML = '<div class="no-file-message">Veuillez sélectionner un fichier pour afficher son contenu.</div>';
            }
        });
    });
}

function initializeStatusBarTabs() {
    // Gestion des onglets de la barre de statut
    const statusTabs = document.querySelectorAll('.status-bar .tab');
    statusTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            statusTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

function initializeToolButtons() {
    // Gestion des boutons de la barre d'outils
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Ajouter ici la logique pour chaque bouton
            console.log('Tool button clicked:', button.innerHTML);
        });
    });
}

function handleFileClick(filePath) {
    console.log("handleFileClick appelé avec:", filePath);
    
    // Vérifier si le gestionnaire d'onglets existe
    if (window.tabManager) {
        // Extraire le nom du fichier à partir du chemin
        const fileName = filePath.split('\\').pop().split('/').pop();
        console.log("Nom du fichier extrait:", fileName);
        
        // Ouvrir l'onglet avant de charger le contenu
        window.tabManager.openTab(filePath, fileName);
    } else {
        console.error("Gestionnaire d'onglets non trouvé");
    }
    
    // Vérifier si c'est un fichier de profil (.glbl)
    if (filePath.endsWith('.glbl')) {
        // Extraire le nom du profil (sans l'extension .glbl)
        const profileName = filePath.split('\\').pop().split('/').pop().replace('.glbl', '');
        
        // Mettre à jour le profil actif dans le gestionnaire de profils
        if (window.profileHandler && typeof window.profileHandler.updateActiveProfile === 'function') {
            window.profileHandler.updateActiveProfile(profileName);
            
            // Sélectionner le profil dans le menu déroulant
            const profileSelect = document.querySelector('.profile-select');
            if (profileSelect) {
                profileSelect.value = profileName;
            }
            
            // Charger le contenu du profil
            if (typeof window.profileHandler.loadProfileContent === 'function') {
                window.profileHandler.loadProfileContent(profileName);
            }
            
            // Mettre à jour l'affichage des onglets de vue pour les profils
            if (typeof window.profileHandler.updateViewTabs === 'function') {
                window.profileHandler.updateViewTabs();
            }
        }
        
        // Charger quand même le contenu du fichier pour l'affichage dans l'éditeur
        fetch('/open_file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: filePath,
                project_path: window.currentProjectPath || currentProjectPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mettre à jour window.currentFile
                window.currentFile = {
                    path: filePath,
                    content: data.content,
                    type: data.type || 'text',
                    isProfile: filePath.endsWith('.glbl') // Marquer comme profil si c'est un fichier .glbl
                };
                
                // Mettre à jour le cache du gestionnaire d'onglets si disponible
                if (window.tabManager && typeof window.tabManager.fileCache !== 'undefined') {
                    window.tabManager.fileCache.set(filePath, {
                        content: data.content,
                        type: data.type || 'text'
                    });
                }
                
                // Déclencher un événement pour indiquer que le fichier a été chargé
                document.dispatchEvent(new CustomEvent('fileLoaded', {
                    detail: {
                        filePath: filePath,
                        content: data.content,
                        type: data.type
                    }
                }));
            } else {
                console.error('Erreur lors du chargement du fichier:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête:', error);
        });
    } else if (filePath.endsWith('.py')) {
        fetch('/open_file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: filePath,
                project_path: window.currentProjectPath || currentProjectPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Réponse API complète:", data);
                
                // Analyser le contenu Python si nécessaire
                let parsedSteps = [];
                
                // Utiliser notre nouvel analyseur hiérarchique si disponible
                if (window.pythonScriptAnalyzer && filePath.endsWith('.py')) {
                    console.log("handleFileClick: Utilisation de l'analyseur hiérarchique de script Python...");
                    try {
                        // Utiliser l'analyseur hiérarchique
                        const hierarchicalActions = window.pythonScriptAnalyzer.analyze(data.content);
                        console.log("handleFileClick: Actions hiérarchiques extraites:", hierarchicalActions.length, "actions");
                        
                        // Convertir les actions hiérarchiques en étapes plates
                        parsedSteps = window.convertHierarchicalActionsToSteps(hierarchicalActions);
                        console.log("handleFileClick: Étapes converties:", parsedSteps.length, "étapes");
                        
                        // Si aucune étape n'a été extraite, essayer l'extraction basique directement
                        if (parsedSteps.length === 0) {
                            console.log("handleFileClick: Aucune étape extraite, essai de l'extraction basique...");
                            parsedSteps = window.convertHierarchicalActionsToSteps([]); // Passer un tableau vide pour forcer l'extraction basique
                            console.log("handleFileClick: Extraction basique:", parsedSteps.length, "étapes");
                        }
                    } catch (error) {
                        console.error('handleFileClick: Erreur lors de l\'utilisation de l\'analyseur hiérarchique:', error);
                        // Fallback à l'ancienne méthode
                        if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                            parsedSteps = data.parsed_content;
                            console.log("handleFileClick: Fallback aux étapes de l'API:", parsedSteps.length, "étapes");
                        } else if (data.content && typeof window.extractStepsFromPythonContent === 'function') {
                            parsedSteps = window.extractStepsFromPythonContent(data.content);
                            console.log("handleFileClick: Fallback à l'ancienne méthode d'extraction:", parsedSteps.length, "étapes");
                        }
                    }
                }
                // Utiliser l'ancien analyseur non hiérarchique si l'analyseur hiérarchique n'est pas disponible
                else if (window.extractActionsFromPythonScript && filePath.endsWith('.py')) {
                    console.log("handleFileClick: Utilisation du nouvel analyseur de script Python (non hiérarchique)...");
                    try {
                        const actions = window.extractActionsFromPythonScript(data.content);
                        console.log("handleFileClick: Actions extraites avec le nouvel analyseur:", actions.length, "actions");
                        const tableFormat = window.convertActionsToTableFormat(actions);
                        console.log("handleFileClick: Format tabulaire généré:", tableFormat.length, "lignes");
                        
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
                        console.log("handleFileClick: Étapes converties:", parsedSteps.length, "étapes");
                    } catch (error) {
                        console.error('handleFileClick: Erreur lors de l\'utilisation du nouvel analyseur:', error);
                        // Fallback à l'ancienne méthode
                        if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                            parsedSteps = data.parsed_content;
                            console.log("handleFileClick: Fallback aux étapes de l'API:", parsedSteps.length, "étapes");
                        } else if (data.content && typeof window.extractStepsFromPythonContent === 'function') {
                            parsedSteps = window.extractStepsFromPythonContent(data.content);
                            console.log("handleFileClick: Fallback à l'ancienne méthode d'extraction:", parsedSteps.length, "étapes");
                        }
                    }
                }
                // Fallback à l'ancienne méthode
                else if (data.parsed_content && Array.isArray(data.parsed_content) && data.parsed_content.length > 0) {
                    parsedSteps = data.parsed_content;
                    console.log("handleFileClick: Utilisation des étapes de l'API:", parsedSteps.length, "étapes");
                } else if (data.content && typeof window.extractStepsFromPythonContent === 'function') {
                    parsedSteps = window.extractStepsFromPythonContent(data.content);
                    console.log("handleFileClick: Étapes extraites avec l'ancienne méthode:", parsedSteps.length, "étapes");
                }
                
                // S'assurer que parsedSteps n'est pas vide
                if (parsedSteps.length === 0 && data.content) {
                    // Réessayer l'extraction avec une méthode alternative si nécessaire
                    parsedSteps = window.extractStepsFromPythonContent(data.content);
                    console.log("handleFileClick: Réessai d'extraction avec l'ancienne méthode:", parsedSteps.length, "étapes");
                }
                
                // Mettre à jour window.currentFile avec les données analysées
                window.currentFile = {
                    path: filePath,
                    content: data.content,
                    parsedContent: parsedSteps,
                    type: data.type || 'text',
                    manualSteps: data.manual_steps || []
                };
                
                // Mettre à jour le cache du gestionnaire d'onglets si disponible
                if (window.tabManager && typeof window.tabManager.fileCache !== 'undefined') {
                    window.tabManager.fileCache.set(filePath, {
                        content: data.content,
                        type: data.type || 'text',
                        manualSteps: data.manual_steps || [],
                        parsed_content: parsedSteps
                    });
                }
                
                // Afficher le contenu du fichier
                const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                if (typeof window.displayFileContent === 'function') {
                    window.displayFileContent(viewMode);
                }
                
                // Déclencher un événement pour indiquer que le fichier a été chargé
                document.dispatchEvent(new CustomEvent('fileLoaded', {
                    detail: {
                        filePath: filePath,
                        content: data.content,
                        type: data.type,
                        manualSteps: data.manual_steps,
                        parsedContent: parsedSteps
                    }
                }));
            } else {
                console.error('Erreur lors du chargement du fichier:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête:', error);
        });
    } else {
        // Traitement pour les autres types de fichiers...
        fetch('/open_file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: filePath,
                project_path: window.currentProjectPath || currentProjectPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mettre à jour window.currentFile
                window.currentFile = {
                    path: filePath,
                    content: data.content,
                    type: data.type || 'text'
                };
                
                // Mettre à jour le cache du gestionnaire d'onglets si disponible
                if (window.tabManager && typeof window.tabManager.fileCache !== 'undefined') {
                    window.tabManager.fileCache.set(filePath, {
                        content: data.content,
                        type: data.type || 'text'
                    });
                }
                
                // Afficher le contenu du fichier
                const viewMode = document.querySelector('.view-tab.active')?.getAttribute('data-view') || 'manual';
                if (typeof window.displayFileContent === 'function') {
                    window.displayFileContent(viewMode);
                }
                
                // Déclencher un événement pour indiquer que le fichier a été chargé
                document.dispatchEvent(new CustomEvent('fileLoaded', {
                    detail: {
                        filePath: filePath,
                        content: data.content,
                        type: data.type
                    }
                }));
            } else {
                console.error('Erreur lors du chargement du fichier:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête:', error);
        });
    }
}

function addStep() {
    if (!window.currentFile || !window.currentFile.parsedContent) return;
    window.currentFile.parsedContent.push({
        action: 'click',
        target: '',
        value: ''
    });
    saveCurrentFile();
}

function deleteStep(index) {
    if (!window.currentFile || !window.currentFile.parsedContent) return;
    window.currentFile.parsedContent.splice(index, 1);
    saveCurrentFile();
}

function moveStepUp(index) {
    if (!window.currentFile || !window.currentFile.parsedContent || index <= 0) return;
    const steps = window.currentFile.parsedContent;
    [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
    saveCurrentFile();
}

function moveStepDown(index) {
    if (!window.currentFile || !window.currentFile.parsedContent) return;
    const steps = window.currentFile.parsedContent;
    if (index >= steps.length - 1) return;
    [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    saveCurrentFile();
}

function saveCurrentFile() {
    if (!window.currentFile) {
        console.error('Aucun fichier à sauvegarder');
        return;
    }

    const activeTab = document.querySelector('.view-tab.active');
    const viewMode = activeTab ? activeTab.getAttribute('data-view') : 'manual';
    let content;

    if (viewMode === 'script') {
        // Utiliser le contenu de l'éditeur de script
        const scriptEditor = document.getElementById('scriptEditor');
        content = scriptEditor.value;
    } else {
        // Convertir le contenu manuel en script Python
        content = convertToScript(window.currentFile.parsedContent);
    }

    fetch('/save_file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            path: window.currentFile.path,
            content: content,
            project_path: currentProjectPath
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Fichier sauvegardé avec succès');
        } else {
            console.error('Erreur lors de la sauvegarde:', data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde:', error);
    });
}

// Fonction pour convertir les étapes en script Python
function convertToScript(steps) {
    let script = 'def test():\n';
    steps.forEach(step => {
        let line = `    ${step.action}("${step.target}"`;
        if (step.value) {
            line += `, "${step.value}"`;
        }
        line += ')\n';
        script += line;
    });
    return script;
}

// Mise à jour de la fonction displayFileContent pour ajouter les boutons d'action
function displayFileContent(viewMode) {
    const contentArea = document.querySelector('.test-content');
    
    console.log("displayFileContent appelé avec viewMode:", viewMode);
    console.log("window.currentFile:", window.currentFile);
    
    // Vérifier si le fichier actuel est un profil
    if (window.currentFile && window.currentFile.isProfile) {
        console.log("Délégation de l'affichage au gestionnaire de profils");
        
        // Mettre à jour l'affichage des onglets de vue pour les profils
        if (window.profileHandler && typeof window.profileHandler.updateViewTabs === 'function') {
            window.profileHandler.updateViewTabs();
        }
        
        // Déléguer l'affichage au gestionnaire de profils
        if (window.profileHandler) {
            if (viewMode === 'script' || viewMode === 'variables-script') {
                window.profileHandler.displayProfileAsScript();
            } else {
                window.profileHandler.displayProfileInTable();
            }
        } else {
            console.error("Gestionnaire de profils non trouvé");
            contentArea.innerHTML = `<div class="error-message">Gestionnaire de profils non trouvé.</div>`;
        }
        return;
    } else {
        // Pour les fichiers non-profils, s'assurer que les onglets de variables sont visibles
        if (window.profileHandler && typeof window.profileHandler.updateViewTabs === 'function') {
            window.profileHandler.updateViewTabs();
        }
    }
    
    // Vérifier que window.currentFile existe et contient des données valides
    if (!window.currentFile || !window.currentFile.path) {
        console.error("window.currentFile est invalide ou manquant:", window.currentFile);
        contentArea.innerHTML = `<div class="error-message">Aucun fichier sélectionné ou fichier invalide.</div>`;
        return;
    }
        
    if (viewMode === 'script') {
        // Create container for Monaco Editor
        contentArea.innerHTML = `
            <div class="script-editor">
                <textarea id="scriptContent" style="display: none;">${window.currentFile.content || ''}</textarea>

            </div>
        `;

        // Trigger view change event for Monaco Editor initialization
        document.dispatchEvent(new CustomEvent('viewChanged', {
            detail: { view: 'script' }
        }));

        // Set content in Monaco Editor if it exists
        if (window.monacoHandler && window.monacoHandler.editor) {
            window.monacoHandler.setContent(window.currentFile.content || '');
        }
    } else if (viewMode === 'manual') {
        let tableHTML = `
            <table class="test-steps">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Action Type</th>
                        <th>Action</th>
                        <th>Input</th>
                        <th>Output</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Vérifier si parsedContent existe et est un tableau
        if (window.currentFile && window.currentFile.parsedContent && Array.isArray(window.currentFile.parsedContent)) {
            console.log("Nombre d'étapes à afficher:", window.currentFile.parsedContent.length);
            
            window.currentFile.parsedContent.forEach((step, index) => {
                console.log("Étape", step.index || (index + 1), ":", step);
                
                // Déterminer le type d'action
                let actionType = step.actionType || '';
                
                // Extraire l'action réelle
                let action = step.action || '';
                
                // Gérer les inputs - peut être un tableau ou une chaîne
                let inputDisplay = '';
                if (Array.isArray(step.inputs)) {
                    // Si c'est un tableau, afficher chaque élément sur une nouvelle ligne
                    inputDisplay = step.inputs.join('<br>');
                } else if (step.input && typeof step.input === 'string') {
                    // Si c'est une chaîne, l'utiliser directement
                    inputDisplay = step.input;
                } else if (step.target || step.value) {
                    // Pour la compatibilité avec l'ancien format
                    const inputs = [];
                    if (step.target) inputs.push(step.target);
                    if (step.value) inputs.push(step.value);
                    inputDisplay = inputs.join('<br>');
                }
                
                // Gérer la description
                let description = step.description || '';
                
                // Déterminer l'indice de l'étape (numérotation hiérarchique)
                let stepIndex = step.index || (index + 1);
                
                // Déterminer la profondeur de l'étape pour l'indentation
                let depth = step.depth || 0;
                
                tableHTML += `
                    <tr data-depth="${depth}" data-action-type="${actionType.toLowerCase()}">
                        <td class="step-index">${stepIndex}</td>
                        <td>${actionType}</td>
                        <td>${action}</td>
                        <td>${inputDisplay}</td>
                        <td>${step.output || ''}</td>
                        <td>${description}</td>
                    </tr>
                `;
            });
        } else {
            console.warn("Pas de parsedContent valide dans window.currentFile:", window.currentFile);
            // Ajouter une ligne vide si pas de contenu
            tableHTML += `
                <tr>
                    <td colspan="6" class="empty-message">Aucune étape trouvée dans ce fichier.</td>
                </tr>
            `;
        }

        tableHTML += `
                </tbody>
            </table>
        `;

        contentArea.innerHTML = tableHTML;

        // Ajouter la sélection des lignes
        const rows = contentArea.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                rows.forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
            });
        });
    }
}

// Rendre la fonction displayFileContent accessible globalement
window.displayFileContent = displayFileContent;

// Ajouter un gestionnaire d'événement pour mettre à jour window.currentFile.parsedContent
document.addEventListener('fileLoaded', (event) => {
    console.log('Événement fileLoaded reçu:', event.detail);
    
    // Mettre à jour window.currentFile si l'événement contient parsedContent
    if (window.currentFile && event.detail.parsedContent) {
        console.log('Mise à jour de window.currentFile.parsedContent avec', event.detail.parsedContent.length, 'étapes');
        window.currentFile.parsedContent = event.detail.parsedContent;
    }
});

function initializeFileHandlers() {
    // Gestionnaire pour les clics sur les fichiers
    document.addEventListener('click', function(e) {
        const fileItem = e.target.closest('.file-item');
        if (fileItem && fileItem.dataset.path) {
            handleFileClick(fileItem.dataset.path);
        }
    });

    // Gestionnaire pour les onglets Manual/Script
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Retirer la classe active de tous les onglets
            document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            // Ajouter la classe active à l'onglet cliqué
            this.classList.add('active');

            const viewMode = this.getAttribute('data-view');
            if (window.currentFile) {
                displayFileContent(viewMode);
            }
        });
    });

    // Gestionnaire pour le bouton de sauvegarde
    const saveBtn = document.querySelector('.tool-btn i.fas.fa-save');
    if (saveBtn) {
        saveBtn.parentElement.addEventListener('click', saveCurrentFile);
    }
}

// Initialiser les gestionnaires lors du chargement de la page
document.addEventListener('DOMContentLoaded', initializeFileHandlers);

// Listen for script content changes
document.addEventListener('scriptContentChanged', (event) => {
    if (window.currentFile) {
        window.currentFile.content = event.detail.content;
        window.currentFile.isDirty = true;
    }
});

function getFileIcon(fileName) {
    if (fileName.endsWith('.py')) return 'fab fa-python';
    if (fileName.endsWith('.xml')) return 'fas fa-file-code';
    if (fileName.endsWith('.glbl')) return 'fas fa-globe';
    return 'fas fa-file';
}

function createFolderElement(folder) {
    console.log(`Création de l'élément dossier:`, folder);
    
    // Vérifier si folder est défini et a les propriétés nécessaires
    if (!folder || typeof folder !== 'object') {
        console.error("Objet dossier invalide:", folder);
        return document.createElement('li'); // Retourner un élément vide pour éviter les erreurs
    }
    
    // S'assurer que les propriétés essentielles existent
    const folderName = folder.name || 'Dossier sans nom';
    const folderPath = folder.path || folderName;
    
    const li = document.createElement('li');
    li.className = 'folder';
    li.setAttribute('data-path', folderPath);
    
    const folderContent = document.createElement('div');
    folderContent.className = 'folder-content';
    
    const icon = document.createElement('i');
    // Utiliser l'icône spécifique du dossier si elle existe dans FOLDER_CONFIG
    if (FOLDER_CONFIG[folderName] && FOLDER_CONFIG[folderName].icon) {
        icon.className = FOLDER_CONFIG[folderName].icon;
    } else {
        icon.className = 'fas fa-folder';
    }
    
    const span = document.createElement('span');
    span.textContent = folderName;
    
    const arrow = document.createElement('i');
    arrow.className = 'fas fa-chevron-right folder-arrow';
    
    folderContent.appendChild(arrow);
    folderContent.appendChild(icon);
    folderContent.appendChild(span);
    li.appendChild(folderContent);
    
    // Créer un conteneur pour les sous-éléments
    const ul = document.createElement('ul');
    ul.className = 'subfolder-content hidden';
    li.appendChild(ul);
    
    // Ajouter un indicateur de chargement
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator hidden';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
    li.appendChild(loadingIndicator);
    
    // Ajouter l'événement de clic pour le dossier avec chargement progressif
    folderContent.addEventListener('click', async (event) => {
        event.stopPropagation();
        
        // Rotation de la flèche
        arrow.classList.toggle('rotated');
        
        // Si le dossier est fermé, on ne fait rien de plus
        if (!arrow.classList.contains('rotated')) {
            ul.classList.add('hidden');
            return;
        }
        
        // Si le dossier est vide ou déjà chargé, on affiche simplement son contenu
        if (ul.children.length > 0) {
            ul.classList.remove('hidden');
            return;
        }
        
        // Si le dossier n'a pas d'enfants selon has_children, on n'a rien à charger
        if (folder.has_children === false) {
            const emptyElement = document.createElement('li');
            emptyElement.className = 'empty-folder';
            emptyElement.innerHTML = '<i class="fas fa-info-circle"></i> Dossier vide';
            ul.appendChild(emptyElement);
            ul.classList.remove('hidden');
            return;
        }
        
        // Afficher l'indicateur de chargement
        loadingIndicator.classList.remove('hidden');
        ul.classList.add('hidden');
        
        try {
            // Charger le contenu du dossier
            const folderPath = li.getAttribute('data-path');
            console.log("Chargement du dossier:", folderPath);
            
            // Vérifier que le chemin du projet est défini
            if (!window.currentProjectPath) {
                console.error("Chemin du projet non défini");
                showNotification("Erreur: Chemin du projet non défini", "error");
                return;
            }
            
            console.log("Envoi de la requête avec:", {
                project_path: window.currentProjectPath,
                folder_path: folderPath
            });
            
            // Envoyer la requête au serveur
            const response = await fetch('/load_folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project_path: window.currentProjectPath,
                    folder_path: folderPath
                })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log(`Contenu du dossier ${folderPath} chargé:`, data.contents);
                
                // Cibler le bon dossier dans la sidebar
                const folderLi = document.querySelector(`.folder[data-path="${CSS.escape(folderPath)}"]`);
                const ul = folderLi ? folderLi.querySelector('.subfolder-content') : null;
                if (!ul) {
                    console.warn('Impossible de trouver le conteneur UL pour', folderPath);
                    return;
                }
                // Vider le contenu existant pour éviter les doublons
                ul.innerHTML = '';
                if (data.contents && Array.isArray(data.contents)) {
                    // Trier les éléments: dossiers d'abord, puis fichiers (par ordre alphabétique)
                    data.contents.sort((a, b) => {
                        if (a.type !== b.type) {
                            return a.type === 'directory' ? -1 : 1;
                        }
                        return a.name.localeCompare(b.name);
                    });
                    data.contents.forEach(item => {
                        try {
                            if (item.type === 'directory') {
                                const subfolderElement = createFolderElement(item);
                                ul.appendChild(subfolderElement);
                            } else {
                                const fileElement = document.createElement('li');
                                fileElement.className = 'file';
                                
                                const fileIcon = document.createElement('i');
                                fileIcon.className = getFileIcon(item.name);
                                
                                const fileSpan = document.createElement('span');
                                fileSpan.textContent = item.name || 'Fichier sans nom';
                                
                                fileElement.appendChild(fileIcon);
                                fileElement.appendChild(fileSpan);
                                fileElement.setAttribute('data-path', item.path || '');
                                
                                fileElement.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    handleFileClick(item.path);
                                });
                                
                                ul.appendChild(fileElement);
                            }
                        } catch (error) {
                            console.error("Erreur lors de l'ajout d'un élément:", item, error);
                        }
                    });
                } else {
                    // Si le contenu est null ou non valide, afficher un message d'erreur
                    loadingIndicator.classList.add('hidden');
                    const errorElement = document.createElement('li');
                    errorElement.className = 'error-message';
                    errorElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erreur de chargement';
                    ul.appendChild(errorElement);
                }
                ul.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Erreur lors du chargement du dossier:", error);
            showNotification("Erreur lors du chargement du dossier", "error");
        }
    });
    
    return li;
}

function updateProjectTree(project) {
    console.log("Mise à jour de l'arbre du projet avec:", project);
    const projectTree = document.getElementById('projectTree');
    if (!projectTree) {
        console.error("Élément projectTree non trouvé");
        return;
    }

    // Vérifier si project est défini et a les propriétés nécessaires
    if (!project || typeof project !== 'object') {
        console.error("Objet projet invalide:", project);
        return;
    }

    // Sauvegarder l'état des dossiers
    const folderStates = {};
    projectTree.querySelectorAll('.folder').forEach(folder => {
        const folderName = folder.querySelector('span').textContent;
        const arrow = folder.querySelector('.folder-arrow');
        folderStates[folderName] = {
            isOpen: arrow ? arrow.classList.contains('rotated') : false
        };
    });

    // Vider l'arbre du projet pour le reconstruire
    projectTree.innerHTML = '';
    
    // Créer les dossiers principaux
    if (project.children && Array.isArray(project.children)) {
        project.children.forEach(folder => {
            try {
                const folderElement = createFolderElement(folder);
                projectTree.appendChild(folderElement);
            } catch (error) {
                console.error("Erreur lors de la création du dossier:", folder, error);
            }
        });
    } else {
        console.warn("Aucun enfant trouvé dans le projet ou project.children n'est pas un tableau");
    }

    // Restaurer l'état des dossiers
    Object.entries(folderStates).forEach(([folderName, state]) => {
        const folder = Array.from(projectTree.querySelectorAll('.folder')).find(el => 
            el.querySelector('span').textContent === folderName
        );
        
        if (folder && state.isOpen) {
            const arrow = folder.querySelector('.folder-arrow');
            const subfolderContent = folder.querySelector('.subfolder-content');
            if (arrow && subfolderContent) {
                arrow.classList.add('rotated');
                subfolderContent.classList.remove('hidden');
            }
        }
    });
}

function shouldShowFile(fileName, folderName, isInSubfolder = false) {
    const config = FOLDER_CONFIG[folderName];
    if (!config) return false;

    // Pour les dossiers qui montrent tout le contenu
    if (config.showAllContent) return true;

    // Cas spécial pour Profiles : accepter tous les fichiers .glbl
    if (folderName === 'Profiles' && fileName.toLowerCase().endsWith('.glbl')) {
        return true;
    }
    
    // Masquer les fichiers XML associés aux fichiers Python
    if (fileName.toLowerCase().endsWith('.xml') || fileName.toLowerCase().endsWith('_variables.xml')) {
        // Masquer tous les fichiers XML dans tous les dossiers
        return false;
    }

    // Vérifier les extensions
    if (!config.extensions) return true;
    return config.extensions.some(ext =>
        fileName.toLowerCase().endsWith(ext.toLowerCase())
    );
}

// Fonction pour charger le contenu d'un dossier à la demande
async function loadFolderContents(folderPath) {
    // Trouver l'élément UL correspondant au dossier
    const folderLi = document.querySelector(`.folder[data-path="${CSS.escape(folderPath)}"]`);
    const ul = folderLi ? folderLi.querySelector('.subfolder-content') : null;
    
    if (!ul) {
        console.error('Impossible de trouver le conteneur UL pour', folderPath);
        return;
    }
    
    // Ajouter un indicateur de chargement
    ul.innerHTML = '';
    const loadingIndicator = document.createElement('li');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
    ul.appendChild(loadingIndicator);
    ul.classList.remove('hidden');

    try {
        const response = await fetch('/load_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_path: window.currentProjectPath,
                folder_path: folderPath
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log(`Contenu du dossier ${folderPath} chargé:`, data.contents);
            
            // Traiter et afficher les contenus au lieu de simplement les retourner
            if (data.contents && Array.isArray(data.contents)) {
                // Trier les éléments: dossiers d'abord, puis fichiers (par ordre alphabétique)
                data.contents.sort((a, b) => {
                    if (a.type !== b.type) {
                        return a.type === 'directory' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                });
                
                // Vider l'indicateur de chargement
                loadingIndicator.classList.add('hidden');
                
                // Ajouter les éléments au dossier
                data.contents.forEach(item => {
                    try {
                        if (item.type === 'directory') {
                            const subfolderElement = createFolderElement(item);
                            ul.appendChild(subfolderElement);
                        } else {
                            const fileElement = document.createElement('li');
                            fileElement.className = 'file';
                            
                            const fileIcon = document.createElement('i');
                            fileIcon.className = getFileIcon(item.name);
                            
                            const fileSpan = document.createElement('span');
                            fileSpan.textContent = item.name || 'Fichier sans nom';
                            
                            fileElement.appendChild(fileIcon);
                            fileElement.appendChild(fileSpan);
                            fileElement.setAttribute('data-path', item.path || '');
                            
                            fileElement.addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleFileClick(item.path);
                            });
                            
                            ul.appendChild(fileElement);
                        }
                    } catch (error) {
                        console.error("Erreur lors de l'ajout d'un élément:", item, error);
                    }
                });
                
                // Si aucun élément n'a été ajouté, afficher un message
                if (ul.children.length === 0) {
                    const emptyElement = document.createElement('li');
                    emptyElement.className = 'empty-folder';
                    emptyElement.innerHTML = '<i class="fas fa-info-circle"></i> Dossier vide';
                    ul.appendChild(emptyElement);
                }
                
                // Afficher le contenu
                ul.classList.remove('hidden');
            } else {
                // Si le contenu est null ou non valide, afficher un message d'erreur
                loadingIndicator.classList.add('hidden');
                const errorElement = document.createElement('li');
                errorElement.className = 'error-message';
                errorElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erreur de chargement';
                ul.appendChild(errorElement);
                ul.classList.remove('hidden');
            }
        } else {
            console.error('Erreur lors du chargement du dossier:', data.message);
            
            // Si le chemin n'existe pas, essayer avec un chemin alternatif
            if (data.message && data.message.includes("n'existe pas")) {
                console.log("Tentative avec un chemin alternatif...");
                
                // Essayer avec un chemin relatif
                const altFolderPath = folderPath.replace(/\\/g, '/');
                console.log("Chemin alternatif:", altFolderPath);
                
                const altResponse = await fetch('/load_folder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        project_path: window.currentProjectPath,
                        folder_path: altFolderPath
                    })
                });
                
                const altData = await altResponse.json();
                if (altData.success) {
                    console.log(`Contenu du dossier ${altFolderPath} chargé avec le chemin alternatif:`, altData.contents);
                    
                    // Traiter et afficher les contenus alternatifs
                    if (altData.contents && Array.isArray(altData.contents)) {
                        // Trier les éléments: dossiers d'abord, puis fichiers
                        altData.contents.sort((a, b) => {
                            if (a.type !== b.type) {
                                return a.type === 'directory' ? -1 : 1;
                            }
                            return a.name.localeCompare(b.name);
                        });
                        
                        // Vider l'indicateur de chargement
                        loadingIndicator.classList.add('hidden');
                        
                        // Ajouter les éléments au dossier
                        altData.contents.forEach(item => {
                            try {
                                if (item.type === 'directory') {
                                    const subfolderElement = createFolderElement(item);
                                    ul.appendChild(subfolderElement);
                                } else {
                                    const fileElement = document.createElement('li');
                                    fileElement.className = 'file';
                                    
                                    const fileIcon = document.createElement('i');
                                    fileIcon.className = getFileIcon(item.name);
                                    
                                    const fileSpan = document.createElement('span');
                                    fileSpan.textContent = item.name || 'Fichier sans nom';
                                    
                                    fileElement.appendChild(fileIcon);
                                    fileElement.appendChild(fileSpan);
                                    fileElement.setAttribute('data-path', item.path || '');
                                    
                                    fileElement.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        handleFileClick(item.path);
                                    });
                                    
                                    ul.appendChild(fileElement);
                                }
                            } catch (error) {
                                console.error("Erreur lors de l'ajout d'un élément:", item, error);
                            }
                        });
                        
                        // Si aucun élément n'a été ajouté, afficher un message
                        if (ul.children.length === 0) {
                            const emptyElement = document.createElement('li');
                            emptyElement.className = 'empty-folder';
                            emptyElement.innerHTML = '<i class="fas fa-info-circle"></i> Dossier vide';
                            ul.appendChild(emptyElement);
                        }
                        
                        // Afficher le contenu
                        ul.classList.remove('hidden');
                        return;
                    }
                }
            }
            
            // Afficher un message d'erreur si aucune des tentatives n'a fonctionné
            loadingIndicator.classList.add('hidden');
            const errorElement = document.createElement('li');
            errorElement.className = 'error-message';
            errorElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erreur de chargement';
            ul.appendChild(errorElement);
            ul.classList.remove('hidden');
            
            showNotification(`Erreur: ${data.message}`, "error");
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dossier:', error);
        showNotification("Erreur lors du chargement du dossier", "error");
    }
}

function initializeEventListeners() {
    // Menu File
    const fileMenu = document.getElementById('fileMenu');
    const dropdownMenu = fileMenu.querySelector('.dropdown-menu');
    
    fileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Fermer le menu lors d'un clic ailleurs
    document.addEventListener('click', function() {
        dropdownMenu.style.display = 'none';
    });

    // Gestionnaire pour "Open Project"
    const openProjectBtn = document.getElementById('openProject');
    if (!openProjectBtn) {
        console.error('Bouton Open Project non trouvé');
        return;
    }

    openProjectBtn.addEventListener('click', handleFileSelect);
    
    // Gestionnaire pour "Refresh Project"
    const refreshProjectBtn = document.getElementById('refreshProject');
    if (refreshProjectBtn) {
        refreshProjectBtn.addEventListener('click', refreshProject);
    } else {
        console.error('Bouton Refresh Project non trouvé');
    }
    
    // Menu Project
    const projectMenu = document.getElementById('projectMenu');
    if (projectMenu) {
        const projectDropdownMenu = projectMenu.querySelector('.dropdown-menu');
        
        projectMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            projectDropdownMenu.style.display = projectDropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
    }
}

// Fonction pour rafraîchir le projet actuel
async function refreshProject() {
    if (!currentProjectPath) {
        showNotification('Aucun projet ouvert à rafraîchir', 'error');
        return;
    }
    
    console.log("Rafraîchissement du projet:", currentProjectPath);
    
    try {
        // Envoyer au serveur pour obtenir la structure de base
        const response = await fetch('/open_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: currentProjectPath
            })
        });

        const data = await response.json();
        if (data.success) {
            // Mettre à jour le chemin du projet avec celui retourné par le serveur
            if (data?.project?.path) {
                currentProjectPath = data.project.path;
                window.currentProjectPath = currentProjectPath;
                console.log("Chemin du projet mis à jour depuis le serveur:", currentProjectPath);
            }
            
            // Vider le cache des variables si le gestionnaire de variables existe
            if (window.variablesHandler && typeof window.variablesHandler.clearCache === 'function') {
                window.variablesHandler.clearCache();
                console.log("Cache des variables vidé");
            }
            
            // Vérifier si data.project existe avant de mettre à jour l'arbre du projet
            if (data.project) {
                updateProjectTree(data.project);
            } else {
                console.error("Erreur: data.project est manquant dans la réponse du serveur");
                showNotification('Erreur lors de la mise à jour de l\'arbre du projet', 'error');
                return;
            }
            
            // Charger les profils disponibles pour ce projet
            if (window.profileHandler && typeof window.profileHandler.refreshProfiles === 'function') {
                window.profileHandler.refreshProfiles();
            }
            
            // Afficher un message de succès
            showNotification('Projet rafraîchi avec succès', 'success');
        } else {
            console.error('Erreur:', data.message);
            showNotification('Erreur lors du rafraîchissement du projet: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du projet:', error);
        showNotification('Erreur lors du rafraîchissement du projet', 'error');
    }
}

function extractStepsFromPythonContent(content) {
    // Utiliser l'analyseur Python pour extraire les actions de manière hiérarchique
    if (!window.pythonScriptAnalyzer) {
        window.pythonScriptAnalyzer = new PythonScriptAnalyzer();
    }
    
    // Analyser le script et obtenir les actions avec leur hiérarchie
    const hierarchicalActions = window.pythonScriptAnalyzer.analyze(content);
    
    // Convertir les actions hiérarchiques en étapes plates pour la compatibilité avec le code existant
    const steps = convertHierarchicalActionsToSteps(hierarchicalActions);
    
    console.log("Étapes extraites:", steps.length, "étapes");
    return steps;
}

/**
 * Convertit les actions hiérarchiques en étapes plates pour la compatibilité avec le code existant
 * @param {Array} hierarchicalActions - Les actions hiérarchiques
 * @param {number} parentIndex - L'index du parent (pour la numérotation)
 * @param {number} depth - La profondeur actuelle dans la hiérarchie
 * @returns {Array} - Les étapes plates
 */
function convertHierarchicalActionsToSteps(hierarchicalActions, parentIndex = '', depth = 0) {
    const steps = [];
    
    // Si aucune action n'est détectée mais que nous avons du contenu Python,
    // essayer d'extraire des étapes basiques à partir des appels de méthode
    if (!hierarchicalActions || hierarchicalActions.length === 0) {
        console.log("Aucune action hiérarchique détectée, fallback à l'extraction basique");
        
        // Vérifier si window.currentFile existe et contient du contenu
        if (window.currentFile && window.currentFile.content) {
            const content = window.currentFile.content;
            const lines = content.split('\n');
            
            // Rechercher les appels de méthode courants dans Katalon
            const katalanPatterns = [
                { pattern: /WebUI\.click\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'click' },
                { pattern: /WebUI\.setText\(findTestObject\(['"]([^'"]+)['"]\),\s*['"]([^'"]+)['"]\)/, action: 'setText' },
                { pattern: /WebUI\.verifyElementPresent\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'verifyElementPresent' },
                { pattern: /WebUI\.waitForElementVisible\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'waitForElementVisible' },
                { pattern: /WebUI\.waitForElementClickable\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'waitForElementClickable' },
                { pattern: /WebUI\.selectOptionByValue\(findTestObject\(['"]([^'"]+)['"]\),\s*['"]([^'"]+)['"]\)/, action: 'selectOptionByValue' },
                { pattern: /WebUI\.check\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'check' },
                { pattern: /WebUI\.uncheck\(findTestObject\(['"]([^'"]+)['"]\)/, action: 'uncheck' },
                { pattern: /WebUI\.sendKeys\(findTestObject\(['"]([^'"]+)['"]\),\s*['"]([^'"]+)['"]\)/, action: 'sendKeys' },
                { pattern: /WebUI\.delay\((\d+)\)/, action: 'delay' },
                { pattern: /WebUI\.openBrowser\(['"]([^'"]+)['"]\)/, action: 'openBrowser' },
                { pattern: /WebUI\.navigateToUrl\(['"]([^'"]+)['"]\)/, action: 'navigateToUrl' },
                { pattern: /WebUI\.closeBrowser\(\)/, action: 'closeBrowser' }
            ];
            
            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('import ')) {
                    return; // Ignorer les lignes vides, commentaires et imports
                }
                
                // Vérifier si la ligne correspond à un pattern Katalon
                for (const pattern of katalanPatterns) {
                    const match = trimmedLine.match(pattern.pattern);
                    if (match) {
                        const step = {
                            index: steps.length + 1,
                            actionType: 'WebUI',
                            action: pattern.action,
                            target: match[1] || '',
                            value: match[2] || '',
                            input: match[1] ? `findTestObject('${match[1]}')` : '',
                            output: '',
                            description: `Line ${index + 1}: ${trimmedLine}`,
                            depth: 0
                        };
                        steps.push(step);
                        break;
                    }
                }
                
                // Si aucun pattern spécifique n'a été trouvé, essayer de détecter d'autres appels de méthode
                if (!katalanPatterns.some(p => trimmedLine.match(p.pattern))) {
                    const genericMethodCall = trimmedLine.match(/(\w+)\.(\w+)\(([^)]*)\)/);
                    if (genericMethodCall) {
                        const [_, object, method, params] = genericMethodCall;
                        const step = {
                            index: steps.length + 1,
                            actionType: object,
                            action: method,
                            target: '',
                            value: params,
                            input: params,
                            output: '',
                            description: `Line ${index + 1}: ${trimmedLine}`,
                            depth: 0
                        };
                        steps.push(step);
                    }
                }
            });
            
            console.log(`Extraction basique: ${steps.length} étapes extraites`);
            return steps;
        }
    }
    
    // Traitement normal des actions hiérarchiques
    hierarchicalActions.forEach((action, index) => {
        // Calculer l'index de l'étape (1, 2, 3 ou 1.1, 1.2, etc.)
        const stepIndex = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
        
        // Créer l'étape
        const step = {
            index: stepIndex,
            actionType: action.actionType || '',
            action: action.action || '',
            target: action.target || '',
            value: action.value || '',
            input: action.input || '',
            output: action.output || '',
            description: action.description || '',
            depth: depth
        };
        
        // Si l'action a des inputs, les ajouter
        if (action.inputs) {
            step.inputs = action.inputs;
        }
        
        // Ajouter l'étape à la liste
        steps.push(step);
        
        // Si l'action a des sous-actions, les ajouter récursivement
        if (action.subActions && action.subActions.length > 0) {
            const subSteps = convertHierarchicalActionsToSteps(action.subActions, stepIndex, depth + 1);
            steps.push(...subSteps);
        }
    });
    
    return steps;
}

// Rendre la fonction convertHierarchicalActionsToSteps accessible globalement
window.convertHierarchicalActionsToSteps = convertHierarchicalActionsToSteps;

// Rendre la fonction extractStepsFromPythonContent accessible globalement
window.extractStepsFromPythonContent = extractStepsFromPythonContent;

// Fonction pour récupérer les informations de l'utilisateur actuel
async function getUserInfo() {
    try {
        // Essayer de récupérer les informations de l'utilisateur à partir du serveur
        const response = await fetch('/get_user_info', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        }
        
        // Si le serveur ne répond pas correctement, essayer de déterminer l'utilisateur à partir du chemin
        const currentPath = window.location.pathname;
        if (currentPath.includes('Users') || currentPath.includes('users')) {
            const parts = currentPath.split('/');
            const usersIndex = parts.findIndex(part => part.toLowerCase() === 'users');
            if (usersIndex >= 0 && usersIndex + 1 < parts.length) {
                return { username: parts[usersIndex + 1] };
            }
        }
        
        // Essayer de récupérer l'utilisateur à partir du localStorage
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            return { username: savedUsername };
        }
        
        // Si aucune méthode ne fonctionne, retourner un objet vide
        return {};
    } catch (error) {
        console.error("Erreur lors de la récupération des informations utilisateur:", error);
        return {};
    }
}

// Ajouter les styles CSS nécessaires
const style = document.createElement('style');
style.textContent = `
    .project-tree {
        font-family: Arial, sans-serif;
        font-size: 14px;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 4px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    }
    
    .project-tree ul {
        list-style-type: none;
        padding-left: 0;
    }
    
    .project-tree .subfolder-content {
        padding-left: 20px;
    }
    
    .project-tree .folder, .project-tree .file {
        margin: 5px 0;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .project-tree .folder-content {
        display: flex;
        align-items: center;
        padding: 3px 5px;
        border-radius: 3px;
    }
    
    .project-tree .folder-content:hover {
        background-color: #e0e0e0;
    }
    
    .project-tree .file {
        display: flex;
        align-items: center;
        padding: 3px 5px;
        border-radius: 3px;
    }
    
    .project-tree .file:hover {
        background-color: #e0e0e0;
    }
    
    .project-tree i {
        margin-right: 5px;
    }
    
    .project-tree .folder-arrow {
        transition: transform 0.2s;
        font-size: 10px;
        width: 10px;
    }
    
    .project-tree .folder-arrow.rotated {
        transform: rotate(90deg);
    }
    
    .project-tree .hidden {
        display: none;
    }
    
    .loading-indicator {
        padding: 5px 10px;
        margin-left: 20px;
        font-size: 0.9em;
        color: #666;
    }
    
    .loading-indicator.hidden {
        display: none;
    }
    
    .error-message {
        color: #e74c3c;
        padding: 5px 10px;
        margin-left: 20px;
        font-size: 0.9em;
    }
    
    .empty-folder {
        color: #7f8c8d;
        padding: 5px 10px;
        margin-left: 20px;
        font-size: 0.9em;
        font-style: italic;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.5s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .notification.info {
        background-color: #3498db;
    }
    
    .notification.success {
        background-color: #2ecc71;
    }
    
    .notification.warning {
        background-color: #f39c12;
    }
    
    .notification.error {
        background-color: #e74c3c;
    }
`;
document.head.appendChild(style);

// Initialiser les gestionnaires d'événements au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Fonction pour ouvrir directement un projet à partir d'un chemin
// Cette fonction est utilisée pour l'ouverture automatique après clonage Git
async function openProjectByPath(projectPath) {
    try {
        if (!projectPath) {
            console.error('Chemin du projet non spécifié');
            showNotification('Chemin du projet non spécifié', 'error');
            return;
        }
        
        console.log("Ouverture directe du projet:", projectPath);
        
        // Mettre à jour la variable globale avec le chemin du projet
        currentProjectPath = projectPath;
        window.currentProjectPath = currentProjectPath;
        
        // Envoyer au serveur pour obtenir la structure de base
        const response = await fetch('/open_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: currentProjectPath
            })
        });

        const data = await response.json();
        if (data.success) {
            // Mettre à jour le chemin du projet avec celui retourné par le serveur
            if (data?.project?.path) {
                currentProjectPath = data.project.path;
                window.currentProjectPath = currentProjectPath;
                console.log("Chemin du projet mis à jour depuis le serveur:", currentProjectPath);
            } else {
                console.log("Attention: data.project ou data.project.path est manquant dans la réponse du serveur");
                console.log("Réponse complète:", JSON.stringify(data));
            }
            
            // Vérifier si data.project existe avant de mettre à jour l'arbre du projet
            if (data.project) {
                updateProjectTree(data.project);
            } else {
                console.error("Erreur: data.project est manquant dans la réponse du serveur");
                showNotification('Erreur lors de la mise à jour de l\'arbre du projet', 'error');
            }
            
            // Charger les profils disponibles pour ce projet
            if (window.profileHandler && typeof window.profileHandler.refreshProfiles === 'function') {
                window.profileHandler.refreshProfiles();
            }
            
            // Afficher un message de succès
            showNotification('Projet ouvert avec succès', 'success');
            
            // Rafraîchir tous les dossiers racine du projet
            if (typeof refreshSidebarFolder === 'function') {
                const rootFolders = ['TestCases', 'Object Repository', 'Profiles', 'Test Suites', 'Keywords'];
                rootFolders.forEach(folder => {
                    console.log(`Refreshing folder: ${folder}`);
                    refreshSidebarFolder(folder);
                });
            }
            
            return true;
        } else {
            console.error('Erreur:', data.message);
            showNotification('Erreur lors de l\'ouverture du projet: ' + data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du projet:', error);
        showNotification('Erreur lors de l\'ouverture du projet', 'error');
        return false;
    }
}

// Exposer la fonction globalement pour qu'elle puisse être appelée depuis d'autres scripts
window.openProjectByPath = openProjectByPath;
