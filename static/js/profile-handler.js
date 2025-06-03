window.activeProfile = 'default';
window.activeProfileView = 'manual';

document.addEventListener('DOMContentLoaded', function() {
    initializeProfileHandlers();
    updateViewTabs();
});
function initializeProfileHandlers() {
    const profileSelect = document.querySelector('.profile-select');
    
    if (!profileSelect) {
        console.error('Sélecteur de profil non trouvé');
        return;
    }
    loadProfiles();
    profileSelect.addEventListener('change', function() {
        const selectedProfile = this.value;
        updateActiveProfile(selectedProfile);
        console.log(`Profil sélectionné pour l'exécution: ${selectedProfile}`);
    });
    document.addEventListener('click', function(event) {
        const viewTab = event.target.closest('.view-tab');
        if (viewTab) {
            const viewMode = viewTab.getAttribute('data-view');
            if (window.currentFile && window.currentFile.isProfile) {
                handleProfileViewChange(viewMode);
            }
        }
    });
}
function handleProfileViewChange(viewMode) {
    if (viewMode === 'manual' || viewMode === 'variables') {
        window.activeProfileView = 'manual';
        displayProfileInTable();
    } else if (viewMode === 'script' || viewMode === 'variables-script') {
        window.activeProfileView = 'script';
        displayProfileAsScript();
    }
}
//Charge les profils disponibles depuis l'API
function loadProfiles() {
    if (!window.currentProjectPath) {
        return;
    }
    fetch(`/api/profiles?project_path=${encodeURIComponent(window.currentProjectPath)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProfileSelector(data.profiles);
            } else {
                console.error('Erreur lors du chargement des profils:', data.error);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête API pour les profils:', error);
        });
}
function updateProfileSelector(profiles) {
    const profileSelect = document.querySelector('.profile-select');
    
    if (!profileSelect) {
        console.error('Sélecteur de profil non trouvé');
        return;
    }
    profileSelect.innerHTML = '';
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile;
        option.textContent = profile;
        profileSelect.appendChild(option);
    });
    if (profiles.includes(window.activeProfile)) {
        profileSelect.value = window.activeProfile;
    } else if (profiles.length > 0) {
        updateActiveProfile(profiles[0]);
        profileSelect.value = profiles[0];
    }
}
function updateActiveProfile(profile) {
    window.activeProfile = profile;
    console.log(`Profil actif mis à jour: ${profile}`);
    document.dispatchEvent(new CustomEvent('profileChanged', {
        detail: { profile }
    }));
}
function loadProfileContent(profileName) {
    if (!window.currentProjectPath) {
        console.warn('Aucun projet ouvert, impossible de charger le contenu du profil');
        return;
    }
    // Récupérer le contenu du profil depuis l'API
    fetch(`/api/profile_content?project_path=${encodeURIComponent(window.currentProjectPath)}&profile_name=${encodeURIComponent(profileName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const profileData = {
                    name: profileName,
                    variables: data.variables,
                    isProfile: true
                };
                
                window.currentFile = profileData;
                
                if (window.activeProfileView === 'manual') {
                    displayProfileInTable();
                } else {
                    displayProfileAsScript();
                }

                updateTabTitle(profileName);
            } else {
                console.error('Erreur lors du chargement du contenu du profil:', data.error);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête API pour le contenu du profil:', error);
        });
}
function updateTabTitle(profileName) {
    if (window.tabManager) {
        const activeTab = document.querySelector('.tabs-bar .tab.active');
        if (activeTab) {
            const tabTitle = activeTab.querySelector('.tab-title');
            if (tabTitle) {
                tabTitle.textContent = `${profileName}.glbl`;
            }
        }
    }
}
function displayProfileInTable() {
    if (!window.currentFile || !window.currentFile.isProfile) {
        console.warn('Aucun profil actif à afficher');
        return;
    }
    
    console.log("Affichage du profil en mode tableau:", window.currentFile.name || (window.currentFile.path ? window.currentFile.path.split('\\').pop().split('/').pop().replace('.glbl', '') : 'Inconnu'));

    const contentArea = document.querySelector('.test-content');
    if (!contentArea) {
        console.error('Zone de contenu principale non trouvée');
        return;
    }
    if (window.monacoEditor) {
        console.log("Destruction de l'éditeur Monaco existant");
        window.monacoEditor.dispose();
        window.monacoEditor = null;
    }

    if (!window.currentFile.variables && window.currentFile.path) {
        console.log("Profil chargé via sidebar, chargement des variables via API");
        const profileName = window.currentFile.path.split('\\').pop().split('/').pop().replace('.glbl', '');

        contentArea.innerHTML = `
            <div class="profile-header">
                <h2>Variables du profil: ${profileName}</h2>
            </div>
            <div class="loading-message">Chargement des variables du profil...</div>
        `;
        fetch(`/api/profile_content?project_path=${encodeURIComponent(window.currentProjectPath)}&profile_name=${encodeURIComponent(profileName)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.currentFile.variables = data.variables;
                    displayProfileVariablesTable(data.variables, profileName);
                } else {
                    contentArea.innerHTML = `
                        <div class="profile-header">
                            <h2>Variables du profil: ${profileName}</h2>
                        </div>
                        <div class="error-message">Erreur lors du chargement des variables: ${data.error || 'Erreur inconnue'}</div>
                    `;
                }
            })
            .catch(error => {
                contentArea.innerHTML = `
                    <div class="profile-header">
                        <h2>Variables du profil: ${profileName}</h2>
                    </div>
                    <div class="error-message">Erreur lors de la requête API: ${error.message || 'Erreur inconnue'}</div>
                `;
            });
    } else if (window.currentFile.variables) {
        const profileName = window.currentFile.name || (window.currentFile.path ? window.currentFile.path.split('\\').pop().split('/').pop().replace('.glbl', '') : 'Inconnu');
        displayProfileVariablesTable(window.currentFile.variables, profileName);
    } else {
        contentArea.innerHTML = `
            <div class="profile-header">
                <h2>Variables du profil: Inconnu</h2>
            </div>
            <div class="error-message">Impossible d'afficher les variables du profil: données insuffisantes</div>
        `;
    }
    const manualViewTab = document.querySelector('[data-view="manual"]');
    if (manualViewTab) {
        const allTabs = document.querySelectorAll('.view-tab');
        allTabs.forEach(tab => tab.classList.remove('active'));
        manualViewTab.classList.add('active');
    }
    window.activeProfileView = 'manual';
}
function displayProfileVariablesTable(variables, profileName) {
    const contentArea = document.querySelector('.test-content');
    if (!contentArea) {
        console.error('Zone de contenu principale non trouvée');
        return;
    }
    contentArea.innerHTML = `
        <div class="profile-header">
            <h2>Variables du profil: ${profileName}</h2>
        </div>
        <table class="test-steps">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    `;
    const tbody = contentArea.querySelector('.test-steps tbody');
    if (tbody) {
        variables.forEach(variable => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.textContent = variable.name;
            row.appendChild(nameCell);
            const valueCell = document.createElement('td');
            valueCell.textContent = variable.value;
            row.appendChild(valueCell);
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = variable.description || '';
            row.appendChild(descriptionCell);
            tbody.appendChild(row);
        });
    }
}
function displayProfileAsScript() {
    if (!window.currentFile || !window.currentFile.isProfile) {
        console.warn('Aucun profil actif à afficher');
        return;
    }
    const contentArea = document.querySelector('.test-content');
    if (!contentArea) {
        console.error('Zone de contenu principale non trouvée');
        return;
    }
    if (!window.currentFile.variables) {
        console.log("Profil chargé via sidebar, utilisation du contenu brut");
        
        contentArea.innerHTML = `
            <div class="profile-header">
                <h2>Variables du profil: ${window.currentFile.path ? window.currentFile.path.split('\\').pop().split('/').pop().replace('.glbl', '') : 'Inconnu'} (XML)</h2>
            </div>
            <div id="monaco-editor-container" style="width:100%;height:600px;"></div>
        `;
        if (typeof monaco !== 'undefined') {
            window.monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
                value: window.currentFile.content || '',
                language: 'xml',
                theme: 'vs-dark',
                automaticLayout: true,
                readOnly: false
            });
        } else {
            contentArea.innerHTML += `<div class="error-message">Éditeur Monaco non disponible. Contenu brut :</div><pre>${window.currentFile.content || ''}</pre>`;
        }
    } else {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlContent += '<GlobalVariableEntities>\n';
        xmlContent += '    <description></description>\n';
        xmlContent += '    <name>' + window.currentFile.name + '</name>\n';
        xmlContent += '    <tag></tag>\n';

        window.currentFile.variables.forEach(variable => {
            xmlContent += '    <GlobalVariableEntity>\n';
            xmlContent += '        <description>' + (variable.description || '') + '</description>\n';
            xmlContent += '        <initValue>' + (variable.value || '') + '</initValue>\n';
            xmlContent += '        <name>' + variable.name + '</name>\n';
            xmlContent += '    </GlobalVariableEntity>\n';
        });
        xmlContent += '</GlobalVariableEntities>';
        
        if (!window.monacoEditor) {
            contentArea.innerHTML = `
                <div class="profile-header">
                    <h2>Variables du profil: ${window.currentFile.name} (XML)</h2>
                </div>
                <div id="monaco-editor-container" style="width:100%;height:600px;"></div>
            `;

            if (typeof monaco !== 'undefined') {
                window.monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
                    value: xmlContent,
                    language: 'xml',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    readOnly: false
                });
            } else {
                contentArea.innerHTML += `<div class="error-message">Éditeur Monaco non disponible. Contenu brut :</div><pre>${xmlContent}</pre>`;
            }
        } else {
            window.monacoEditor.setValue(xmlContent);
            monaco.editor.setModelLanguage(window.monacoEditor.getModel(), 'xml');
        }
    }
    const scriptViewTab = document.querySelector('[data-view="script"]');
    if (scriptViewTab) {
        const allTabs = document.querySelectorAll('.view-tab');
        allTabs.forEach(tab => tab.classList.remove('active'));
        scriptViewTab.classList.add('active');
    }

    window.activeProfileView = 'script';
}
function updateContentTitle(title) {
    const contentTitle = document.querySelector('.content-title');
    if (contentTitle) {
        contentTitle.textContent = title;
    } else {
        const testContent = document.querySelector('.test-content');
        if (testContent) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'content-title';
            titleElement.textContent = title;
            testContent.insertBefore(titleElement, testContent.firstChild);
        }
    }
}
function activateViewTab(viewName) {
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        if (tab.getAttribute('data-view') === viewName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}
function refreshProfiles() {
    loadProfiles();
}
function updateViewTabs() {
    // Vérifier si le fichier actuel est un profil
    const isProfile = window.currentFile && window.currentFile.isProfile;
    
    // Récupérer tous les onglets de vue
    const variablesTab = document.querySelector('.view-tab[data-view="variables"]');
    const variablesScriptTab = document.querySelector('.view-tab[data-view="variables-script"]');
    
    if (variablesTab && variablesScriptTab) {
        if (isProfile) {
            variablesTab.style.display = 'none';
            variablesScriptTab.style.display = 'none';
        } else {
            variablesTab.style.display = '';
            variablesScriptTab.style.display = '';
        }
    }
}
function getProfileVariables(profileName) {
    // Vérifier si le profil existe dans le cache
    if (profileCache[profileName]) {
        return profileCache[profileName];
    }
    loadProfileContent(profileName);
    return profileCache[profileName];
}
window.profileHandler = {
    refreshProfiles,
    updateActiveProfile,
    loadProfileContent,
    displayProfileInTable,
    displayProfileAsScript,
    updateViewTabs,
    getProfileVariables
};
document.addEventListener('projectOpened', function(event) {
    console.log('Projet ouvert, chargement des profils...');
    loadProfiles();
});
document.addEventListener('DOMContentLoaded', function() {
    initializeProfileHandlers();
    updateViewTabs();
});
document.addEventListener('fileLoaded', function(event) {
    console.log('Fichier chargé, mise à jour des onglets de vue...');
    updateViewTabs();
});
