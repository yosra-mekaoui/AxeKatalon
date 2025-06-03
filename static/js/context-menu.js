// Menu contextuel dynamique pour la sidebar
const contextMenu = document.createElement('div');
contextMenu.className = 'custom-context-menu';
document.body.appendChild(contextMenu);

// Modal réutilisable pour la création
let modalOverlay = document.createElement('div');
modalOverlay.className = 'custom-modal-overlay';
document.body.appendChild(modalOverlay);

function showModal(options) {
    // options: { title, iconClass, fields: [{label, type, name, value}], onOk, onCancel }
    modalOverlay.innerHTML = '';
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    // Header
    const header = document.createElement('div');
    header.className = 'custom-modal-header';
    if (options.iconClass) {
        const icon = document.createElement('i');
        icon.className = 'modal-icon ' + options.iconClass;
        header.appendChild(icon);
    }
    header.appendChild(document.createTextNode(options.title));
    modal.appendChild(header);
    // Body
    const body = document.createElement('div');
    body.className = 'custom-modal-body';
    let fieldRefs = {};
    options.fields.forEach(f => {
        const label = document.createElement('label');
        label.textContent = f.label;
        body.appendChild(label);
        let input;
        if (f.type === 'textarea') {
            input = document.createElement('textarea');
        } else {
            input = document.createElement('input');
            input.type = f.type || 'text';
        }
        input.value = f.value || '';
        input.name = f.name;
        body.appendChild(input);
        fieldRefs[f.name] = input;
    });
    modal.appendChild(body);
    // Footer
    const footer = document.createElement('div');
    footer.className = 'custom-modal-footer';
    const okBtn = document.createElement('button');
    okBtn.className = 'ok-btn';
    okBtn.textContent = 'OK';
    okBtn.onclick = () => {
        okBtn.disabled = true;
        options.onOk(Object.fromEntries(Object.entries(fieldRefs).map(([k, v]) => [k, v.value])));
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
        hideModal();
        if (options.onCancel) options.onCancel();
    };
    footer.appendChild(okBtn);
    footer.appendChild(cancelBtn);
    modal.appendChild(footer);
    modalOverlay.appendChild(modal);
    modalOverlay.classList.add('active');
    // Focus premier champ
    setTimeout(() => {
        const first = modal.querySelector('input,textarea');
        if (first) first.focus();
    }, 100);
    // Enter/esc shortcuts
    modal.addEventListener('keydown', e => {
        if (e.key === 'Enter') okBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
}
function hideModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.innerHTML = '';
}

// Liste des options par type de dossier
const genericContextOptions = [
    { label: 'Rename', action: 'rename' },
    { label: 'Delete', action: 'delete' },
    { label: 'New Folder', action: 'newFolder' },
    { label: 'New File', action: 'newFile' }
];

const contextOptions = {
    'Profiles': [
        { label: 'New Execution Profile', action: 'newProfile' },
        { label: 'New Folder', action: 'newFolder' },
        { label: 'New File', action: 'newFile' }
    ],
    'TestCases': [
        { label: 'New Folder', action: 'newFolder' },
        { label: 'New Test Case', action: 'newTestCase' }
    ],
    'Keywords': [
        { label: 'New Folder', action: 'newFolder' },
        { label: 'New Keyword', action: 'newKeyword' }
    ],
    'Object Repository': [
        { label: 'New Folder', action: 'newFolder' },
        { label: 'New Object', action: 'newObject' }
    ],
    'Reports': [
        { label: 'New Report', action: 'newReport' }
    ],
    'Test Suites': [
        { label: 'New Folder', action: 'newFolder' },
        { label: 'New Suite', action: 'newTestSuite' }
    ]
    // Ajoutez d'autres dossiers principaux ici si besoin
};

function showContextMenu(e, folderType, folderElement, folderPath, options) {
    e.preventDefault();
    contextMenu.innerHTML = '';
    (options || genericContextOptions).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = opt.label;
        item.onclick = (ev) => {
            ev.stopPropagation();
            contextMenu.style.display = 'none';
            handleContextAction(opt.action, folderType, folderElement, folderPath);
        };
        contextMenu.appendChild(item);
    });
    if (!options || options.length === 0) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = 'No actions available';
        item.style.color = '#999';
        item.style.cursor = 'default';
        contextMenu.appendChild(item);
    }
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.classList.add('active');
    contextMenu.style.display = 'block';
}

function hideContextMenu() {
    contextMenu.classList.remove('active');
    contextMenu.style.display = 'none';
}
document.addEventListener('click', hideContextMenu);
document.addEventListener('scroll', hideContextMenu, true);
window.addEventListener('resize', hideContextMenu);

// Délégation d'événement sur toute la tree-view pour tous les dossiers
const treeView = document.querySelector('.tree-view');
if (treeView) {
    treeView.addEventListener('contextmenu', function(e) {
        let folderContent = e.target.closest('.folder-content');
        let fileElement = e.target.closest('.file');
        if (folderContent && treeView.contains(folderContent)) {
            e.preventDefault();
            const folderSpan = folderContent.querySelector('span');
            const folderType = folderSpan?.textContent?.trim();
            const folderLi = folderContent.parentElement;
            const folderPath = folderLi.getAttribute('data-path');
            const opts = contextOptions[folderType] || genericContextOptions;
            showContextMenu(e, folderType, folderContent, folderPath, opts);
        } else if (fileElement && treeView.contains(fileElement)) {
            e.preventDefault();
            const fileName = fileElement.querySelector('span')?.textContent?.trim();
            const filePath = fileElement.getAttribute('data-path');
            showContextMenu(e, 'file', fileElement, filePath, [
                { label: 'Rename', action: 'rename' },
                { label: 'Delete', action: 'delete' }
            ]);
        }
    });
}
function handleContextAction(action, folderType, folderElement, folderPath) {
    if (action === 'rename') {
        const currentName = folderElement.querySelector('span')?.textContent?.trim() || '';
        showModal({
            title: 'Rename',
            iconClass: 'fas fa-edit',
            fields: [ { label: 'New name', name: 'name', value: currentName } ],
            onOk: ({ name }) => {
                hideModal();
                renameItem(folderPath, name, currentName);
            },
            onCancel: hideModal
        });
        return;
    }
    if (action === 'delete') {
        const currentName = folderElement.querySelector('span')?.textContent?.trim() || '';
        showModal({
            title: 'Delete',
            iconClass: 'fas fa-trash',
            fields: [],
            onOk: () => {
                hideModal();
                deleteItem(folderPath, currentName);
            },
            onCancel: hideModal
        });
        // Ajoute un message de confirmation dans la modal
        const modal = document.querySelector('.custom-modal');
        if (modal) {
            const msg = document.createElement('div');
            msg.style.margin = '16px 0';
            msg.style.fontSize = '15px';
            msg.innerHTML = `Do you want to delete <b>${currentName}</b>?`;
            modal.querySelector('.custom-modal-body').appendChild(msg);
        }
        return;
    }
    if (action === 'newFolder') {
        showModal({
            title: 'New Folder',
            iconClass: 'fas fa-folder',
            fields: [ { label: 'Name', name: 'name', value: 'New Folder' } ],
            onOk: ({ name }) => {
                hideModal();
                createFolder(folderPath, name);
            },
            onCancel: hideModal
        });
        return;
    }
    if (action === 'newFile') {
        showModal({
            title: 'New File',
            iconClass: 'fas fa-file',
            fields: [ { label: 'Name', name: 'name', value: 'NewFile.py' } ],
            onOk: ({ name }) => {
                hideModal();
                createFile(folderPath, name);
            },
            onCancel: hideModal
        });
        return;
    }
    if (action === 'newProfile') {
        showModal({
            title: 'New Execution Profile',
            iconClass: 'fas fa-user-cog',
            fields: [ { label: 'Name', name: 'name', value: 'New Profile' } ],
            onOk: ({ name }) => {
                hideModal();
                createProfile(folderPath, name);
            },
            onCancel: hideModal
        });
        return;
    }
    if (action === 'newTestCase') {
        showModal({
            title: 'Test Case',
            iconClass: 'fas fa-file-code',
            fields: [
                { label: 'Name', name: 'name', value: 'New Test Case' },
                { label: 'Description', name: 'desc', type: 'textarea', value: '' },
                { label: 'Tag', name: 'tag', value: '' }
            ],
            onOk: ({ name }) => {
                hideModal();
                createFile(folderPath, name.endsWith('.py') ? name : name + '.py');
            },
            onCancel: hideModal
        });
        return;
    }
    if (action === 'newTestSuite') {
        showModal({
            title: 'New Test Suite',
            iconClass: 'fas fa-layer-group',
            fields: [ { label: 'Name', name: 'name', value: 'New Suite' } ],
            onOk: ({ name }) => {
                hideModal();
                createFile(folderPath, name + '.suite');
            },
            onCancel: hideModal
        });
        return;
    }
 if (action === 'newKeywords') {
        showModal({
            title: 'Keywords',
            iconClass: 'fas fa-file-code',
            fields: [
                { label: 'Name', name: 'name', value: 'New Keywords' },
                { label: 'Description', name: 'desc', type: 'textarea', value: '' },
                { label: 'Tag', name: 'tag', value: '' }
            ],
            onOk: ({ name }) => {
                hideModal();
                createFile(folderPath, name.endsWith('.py') ? name : name + '.py');
            },
            onCancel: hideModal
        });
        return;
    }    alert('Action non gérée : ' + action);
}

function createFolder(parent, name) {
    fetch('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Rafraîchir le dossier parent dans la sidebar
            refreshSidebarFolder(parent);
            console.log('Dossier créé !');
        } else {
            console.error('Erreur : ' + (data.message || 'Création dossier échouée'));
        }
    });
}
function createFile(parent, name) {
    fetch('/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            refreshSidebarFolder(parent);
            // Création automatique du fichier XML pour les nouveaux test cases .py
            if (name.endsWith('.py')) {
                // Création directe du XML via le backend, sans passer par variables-handler.js
                const baseName = name.replace(/\.py$/, '');
                const xmlName = baseName + '_variables.xml';
                
                // Appel direct au backend pour créer le XML
                fetch('/api/create-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parent, name: xmlName, xmlForTestCase: true })
                })
                .then(r2 => r2.json())
                .then(data2 => {
                    if (data2.success) {
                        refreshSidebarFolder(parent);
                        console.log('Fichier XML associé créé avec succès !');
                        // Affichage d'une alerte simple au lieu d'utiliser showNotification
                        alert('Fichier .py et son XML associé créés avec succès !');
                    } else {
                        console.error('Erreur création XML :', data2.message || 'Échec');
                    }
                })
                .catch(err => {
                    console.error('Erreur lors de la création du XML :', err);
                });
            } else {
                console.log('Fichier créé avec succès !');
            }
        } else {
            console.error('Erreur création fichier :', data.message || 'Échec');
            alert('Erreur lors de la création du fichier : ' + (data.message || 'Échec'));
        }
    })
    .catch(err => {
        console.error('Erreur lors de la création du fichier :', err);
    });
}
function createProfile(parent, name) {
    fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            refreshSidebarFolder(parent);
            console.log('Profil créé !');
        } else {
            console.error('Erreur : ' + (data.message || 'Création profil échouée'));
        }
    });
}

// Rafraîchit uniquement le dossier concerné dans la sidebar
function refreshSidebarFolder(folderName) {
    if (typeof loadFolderContents === 'function') {
        // On suppose que folderName correspond au nom du dossier racine (ex: 'TestCases')
        loadFolderContents(folderName);
    } else if (typeof refreshProject === 'function') {
        // Fallback: rafraîchir tout le projet si la fonction ciblée n'existe pas
        refreshProject();
    } else {
        location.reload();
    }
}

// Petite notification UX - version simplifiée sans risque de récursion
function showNotification(message, type = 'info') {
    // Implémentation directe sans aucune référence à window.showNotification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 2000);
}

// Supprimer complètement la référence globale pour éviter tout problème
window.showNotification = null;

// Appelle le backend pour renommer
function renameItem(path, newName, oldName) {
    // Vérifier si c'est un fichier Python avec un XML associé
    const isPythonFile = oldName.endsWith('.py');
    const xmlOldName = isPythonFile ? oldName.replace(/\.py$/, '_variables.xml') : null;
    const xmlNewName = isPythonFile ? newName.replace(/\.py$/, '_variables.xml') : null;
    
    // Renommer le fichier principal
    fetch('/api/rename-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, newName, oldName })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Récupérer le chemin parent pour rafraîchir le dossier contenant
            const parentPath = getParentPath(path);
            console.log('Élément renommé, rafraîchissement du dossier parent:', parentPath);
            
            // Si c'est un fichier Python, renommer aussi son XML associé
            if (isPythonFile) {
                // Le chemin du XML est dans le même dossier que le fichier Python
                console.log('Fichier Python détecté, renommage du XML associé:', xmlOldName, '->', xmlNewName);
                
                // Vérifier si le fichier XML existe
                fetch('/check_file_exists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        path: getParentPath(path) + '/' + xmlOldName,
                        project_path: window.currentProjectPath || '' 
                    })
                })
                .then(r => r.json())
                .then(checkData => {
                    console.log('Vérification du XML:', checkData);
                    if (checkData.exists) {
                        // Le XML existe, le renommer
                        console.log('XML trouvé, renommage en cours...');
                        fetch('/api/rename-item', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                path: getParentPath(path), 
                                newName: xmlNewName, 
                                oldName: xmlOldName 
                            })
                        })
                        .then(r2 => r2.json())
                        .then(xmlData => {
                            if (xmlData.success) {
                                console.log('Fichier XML associé renommé avec succès !');
                            } else {
                                console.error('Erreur lors du renommage du XML associé:', xmlData.message);
                            }
                            
                            // Rafraîchir la sidebar après toutes les opérations
                            refreshSidebarWithDelay(parentPath);
                        });
                    } else {
                        console.log('Aucun fichier XML associé trouvé');
                        // Rafraîchir la sidebar même si pas de XML
                        refreshSidebarWithDelay(parentPath);
                    }
                })
                .catch(err => {
                    console.error('Erreur lors de la vérification du XML:', err);
                    // Rafraîchir la sidebar en cas d'erreur
                    refreshSidebarWithDelay(parentPath);
                });
            } else {
                // Si ce n'est pas un fichier Python, rafraîchir directement
                refreshSidebarWithDelay(parentPath);
            }
            
            // Notification visuelle
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.textContent = 'Élément renommé avec succès !';
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 2000);
            
            console.log('Renommé avec succès !');
        } else {
            console.error('Erreur : ' + (data.message || 'Échec du renommage'));
        }
    });
}

// Fonction pour rafraîchir la sidebar avec un délai pour garantir la mise à jour
function refreshSidebarWithDelay(folderPath) {
    setTimeout(() => {
        // Essayer d'abord de rafraîchir le dossier parent spécifique
        refreshSidebarFolder(folderPath);
        
        // Si le parent est un sous-dossier, rafraîchir aussi le dossier racine
        const rootFolder = folderPath.split('/')[0];
        if (rootFolder && rootFolder !== folderPath) {
            setTimeout(() => {
                refreshSidebarFolder(rootFolder);
            }, 100);
        }
    }, 100);
}

// Appelle le backend pour supprimer
function deleteItem(path, name) {
    fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Récupérer le chemin parent pour rafraîchir le dossier contenant
            const parentPath = getParentPath(path);
            console.log('Élément supprimé, rafraîchissement du dossier parent:', parentPath);
            
            // Forcer un délai court pour s'assurer que le backend a terminé
            setTimeout(() => {
                // Essayer d'abord de rafraîchir le dossier parent spécifique
                refreshSidebarFolder(parentPath);
                
                // Si le parent est un sous-dossier, rafraîchir aussi le dossier racine
                const rootFolder = parentPath.split('/')[0];
                if (rootFolder && rootFolder !== parentPath) {
                    setTimeout(() => {
                        refreshSidebarFolder(rootFolder);
                    }, 100);
                }
            }, 100);
            
            console.log('Supprimé !');
            // Afficher une notification visuelle pour confirmer la suppression
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.textContent = 'Élément supprimé avec succès !';
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 2000);
        } else {
            console.error('Erreur : ' + (data.message || 'Échec de la suppression'));
        }
    });
}

// Utilitaire pour obtenir le chemin parent
function getParentPath(path) {
    if (!path) return '';
    const parts = path.split(/[\\\/]/);
    parts.pop();
    return parts.join('/');
}
