/**
 * Gestionnaire direct pour la suppression d'étapes
 * Cette approche contourne les problèmes potentiels avec les gestionnaires d'événements
 */

/**
 * Affiche un message de confirmation
 * @param {string} message - Le message à afficher
 * @param {number} [duration=3000] - Durée d'affichage en millisecondes
 */
function showMessage(message, duration = 3000) {
    console.log('Affichage du message:', message);
    
    // Vérifier si manualViewHandler a une méthode showMessage
    if (window.manualViewHandler && typeof window.manualViewHandler.showMessage === 'function') {
        window.manualViewHandler.showMessage(message);
        return;
    }
    
    // Créer ou réutiliser l'élément de message
    let messageElement = document.getElementById('action-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'action-message';
        messageElement.style.position = 'fixed';
        messageElement.style.bottom = '20px';
        messageElement.style.right = '20px';
        messageElement.style.padding = '10px 20px';
        messageElement.style.backgroundColor = '#4CAF50';
        messageElement.style.color = 'white';
        messageElement.style.borderRadius = '5px';
        messageElement.style.zIndex = '1000';
        messageElement.style.opacity = '0';
        messageElement.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(messageElement);
    }
    
    // Mettre à jour le message et l'afficher
    messageElement.textContent = message;
    messageElement.style.opacity = '1';
    
    // Masquer le message après la durée spécifiée
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, duration);
}

// Définir les fonctions globales

/**
 * Supprime l'étape à la position spécifiée
 * @param {number} index - L'index de l'étape à supprimer
 * @returns {boolean} - True si la suppression a réussi, false sinon
 */
function deleteStepByPosition(index) {
    console.log('NOUVELLE APPROCHE: Suppression de l\'étape à la position:', index);
    
    // Trouver toutes les lignes du tableau (essayer les deux classes possibles)
    let rows = document.querySelectorAll('table.test-steps tbody tr');
    if (!rows || rows.length === 0) {
        rows = document.querySelectorAll('table.steps-table tbody tr');
    }
    
    console.log('Nombre total de lignes:', rows.length);
    
    if (rows.length === 0) {
        alert('Aucune étape à supprimer.');
        return false;
    }
    
    // Vérifier que l'index est valide
    if (index < 0 || index >= rows.length) {
        console.error('Index invalide pour la suppression:', index, 'nombre total de lignes:', rows.length);
        return false;
    }
    
    // Obtenir la ligne à supprimer
    const rowToDelete = rows[index];
    if (!rowToDelete) {
        console.error('Aucune ligne trouvée à l\'index:', index);
        return false;
    }
    
    // Demander confirmation avant de supprimer
    const confirmation = confirm(`Êtes-vous sûr de vouloir supprimer l'étape ${index + 1} ?`);
    if (!confirmation) {
        console.log('Suppression annulée par l\'utilisateur');
        return false;
    }
    
    try {
        // 1. Extraire toutes les données du tableau avant la suppression
        const allActions = [];
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                allActions.push({
                    action: cells[1] ? cells[1].textContent.trim() : '',
                    input: cells[2] ? cells[2].textContent.trim() : '',
                    output: cells[3] ? cells[3].textContent.trim() : ''
                });
            }
        });
        
        console.log('Données extraites du tableau:', allActions.length, 'actions');
        
        // 2. Supprimer l'action de la liste
        if (index < allActions.length) {
            allActions.splice(index, 1);
            console.log('Action supprimée de la liste, nouvelles données:', allActions.length, 'actions');
        }
        
        // 3. Supprimer la ligne du DOM
        if (rowToDelete.parentNode) {
            rowToDelete.parentNode.removeChild(rowToDelete);
            console.log('Ligne supprimée du DOM avec succès');
        }
        
        // 4. Mettre à jour les numéros de ligne dans le tableau
        const remainingRows = document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr');
        remainingRows.forEach((row, idx) => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell) {
                firstCell.textContent = (idx + 1).toString();
            }
        });
        
        // 5. Mettre à jour manualViewHandler si disponible
        if (window.manualViewHandler) {
            // Mettre à jour currentActions
            window.manualViewHandler.currentActions = allActions;
            console.log('manualViewHandler.currentActions mis à jour avec', allActions.length, 'actions');
            
            // Réinitialiser l'index sélectionné
            window.manualViewHandler.selectedRowIndex = -1;
            
            // Notifier le backend du changement
            if (typeof window.manualViewHandler.notifyContentChanged === 'function') {
                window.manualViewHandler.notifyContentChanged();
                console.log('Backend notifié du changement via notifyContentChanged');
            } else if (window.manualViewHandler.pythonHandler && 
                       typeof window.manualViewHandler.pythonHandler.handleManualContentChange === 'function') {
                window.manualViewHandler.pythonHandler.handleManualContentChange(allActions);
                console.log('Backend notifié du changement via pythonHandler.handleManualContentChange');
            } else if (window.pythonFileHandler && 
                       typeof window.pythonFileHandler.handleManualContentChange === 'function') {
                // Utiliser directement pythonFileHandler si pythonHandler n'est pas disponible
                window.pythonFileHandler.handleManualContentChange(allActions);
                console.log('Backend notifié du changement via pythonFileHandler.handleManualContentChange');
            } else {
                console.warn('Aucun gestionnaire disponible pour persister les modifications!');
            }
        }
        
        // 6. Afficher un message de confirmation
        showMessage(`Étape ${index + 1} supprimée avec succès`);
        
        // Réinitialiser l'index sélectionné global
        window.currentSelectedRowIndex = -1;
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression par position:', error);
        return false;
    }
    
    // Cette partie du code ne devrait jamais être exécutée car nous avons déjà géré tous les cas ci-dessus
    console.error('Code inattendu atteint - cela ne devrait jamais se produire');
    return false;
}

/**
 * Supprime la première étape du script
 * @returns {boolean} - True si la suppression a réussi, false sinon
 */
function deleteFirstStep() {
    console.log('Tentative de suppression de la première étape...');
    
    // Vérifier d'abord s'il y a une ligne sélectionnée
    const selectedRow = document.querySelector('table.test-steps tbody tr.selected-row, table.steps-table tbody tr.selected-row');
    if (selectedRow) {
        console.log('Une ligne est déjà sélectionnée, utilisation de deleteSelectedStep() au lieu de deleteFirstStep()');
        return deleteSelectedStep();
    }
    
    // Si aucune ligne n'est sélectionnée, supprimer la première
    return deleteStepByPosition(0);
}

/**
 * Supprime l'étape sélectionnée ou la première étape si aucune n'est sélectionnée
 * @returns {boolean} - True si la suppression a réussi, false sinon
 */
function deleteSelectedStep() {
    console.log('deleteSelectedStep called - version diagnostic');
    
    // Trouver toutes les lignes du tableau (essayer les deux classes possibles)
    let allRows = document.querySelectorAll('table.test-steps tbody tr');
    if (!allRows || allRows.length === 0) {
        allRows = document.querySelectorAll('table.steps-table tbody tr');
    }
    
    console.log('Nombre de lignes dans le tableau:', allRows.length);
    
    if (allRows.length === 0) {
        alert('Aucune étape à supprimer.');
        return false;
    }
    
    // Synchroniser manualViewHandler.currentActions avec le tableau si nécessaire
    if (window.manualViewHandler && (!window.manualViewHandler.currentActions || window.manualViewHandler.currentActions.length === 0)) {
        console.log('Synchronisation des données: manualViewHandler.currentActions est vide');
        
        // Extraire les données du tableau
        const extractedActions = [];
        allRows.forEach(tableRow => {
            const cells = tableRow.querySelectorAll('td');
            if (cells.length >= 4) {
                extractedActions.push({
                    action: cells[1].textContent.trim(),
                    input: cells[2].textContent.trim(),
                    output: cells[3].textContent.trim()
                });
            }
        });
        
        // Mettre à jour currentActions
        if (extractedActions.length > 0) {
            console.log('Mise à jour de manualViewHandler.currentActions avec', extractedActions.length, 'actions');
            window.manualViewHandler.currentActions = extractedActions;
        }
    }
    
    // Vérifier d'abord si nous avons un index global sélectionné
    if (window.currentSelectedRowIndex !== undefined && window.currentSelectedRowIndex >= 0 && window.currentSelectedRowIndex < allRows.length) {
        console.log('Utilisation de l\'index global sélectionné pour la suppression:', window.currentSelectedRowIndex);
        return deleteStepByPosition(window.currentSelectedRowIndex);
    }
    
    // Trouver la ligne sélectionnée visuellement
    const selectedRow = document.querySelector('table.test-steps tbody tr.selected-row, table.steps-table tbody tr.selected-row');
    
    if (selectedRow) {
        console.log('Ligne sélectionnée trouvée visuellement');
        
        // Déterminer l'index visuel à partir du contenu de la première cellule
        let visualIndex = -1;
        const firstCell = selectedRow.querySelector('td:first-child');
        if (firstCell && firstCell.textContent && firstCell.textContent.trim() !== '') {
            visualIndex = parseInt(firstCell.textContent.trim()) - 1; // Convertir en index basé sur 0
            console.log('Index visuel déterminé à partir du contenu de la cellule:', visualIndex);
            
            // Vérifier si cet index est valide
            if (visualIndex >= 0 && visualIndex < allRows.length) {
                console.log('Utilisation de l\'index visuel pour la suppression:', visualIndex);
                
                // Mettre à jour l'index global pour référence future
                window.currentSelectedRowIndex = visualIndex;
                if (window.manualViewHandler) {
                    window.manualViewHandler.selectedRowIndex = visualIndex;
                }
                
                return deleteStepByPosition(visualIndex);
            }
        }
        
        // Vérifier si la ligne a un attribut data-selected-index
        const dataSelectedIndex = selectedRow.getAttribute('data-selected-index');
        if (dataSelectedIndex !== null && dataSelectedIndex !== undefined && dataSelectedIndex !== '') {
            const indexFromAttribute = parseInt(dataSelectedIndex);
            console.log('Index trouvé dans l\'attribut data-selected-index:', indexFromAttribute);
            
            // Vérifier si cet index est valide
            if (indexFromAttribute >= 0 && indexFromAttribute < allRows.length) {
                console.log('Utilisation de l\'index depuis l\'attribut data-selected-index pour la suppression:', indexFromAttribute);
                return deleteStepByPosition(indexFromAttribute);
            }
        }
        
        // Déterminer l'index de position de la ligne sélectionnée
        for (let i = 0; i < allRows.length; i++) {
            if (allRows[i] === selectedRow) {
                console.log('Index de position trouvé pour la ligne sélectionnée:', i);
                return deleteStepByPosition(i);
            }
        }
        
        // Si aucun index n'a été trouvé jusqu'ici, utiliser notre fonction de diagnostic
        console.log('Aucun index valide trouvé, utilisation de la fonction de diagnostic');
        const recommendedIndex = diagnosticRowInfo(selectedRow);
        
        // Vérifier si l'index est valide
        if (recommendedIndex >= 0 && recommendedIndex < allRows.length) {
            console.log('Utilisation de l\'index recommandé pour la suppression:', recommendedIndex);
            return deleteStepByPosition(recommendedIndex);
        }
    }
    
    // Si aucune ligne n'est sélectionnée visuellement ou si l'index recommandé est invalide
    console.log('Aucune ligne sélectionnée trouvée ou index invalide');
    
    // Vérifier si manualViewHandler a un index valide
    if (window.manualViewHandler && 
        window.manualViewHandler.selectedRowIndex >= 0 && 
        window.manualViewHandler.selectedRowIndex < allRows.length) {
        
        const manualIndex = window.manualViewHandler.selectedRowIndex;
        console.log('Utilisation de l\'index depuis manualViewHandler:', manualIndex);
        return deleteStepByPosition(manualIndex);
    }
    
    // Dernier recours : utiliser la première ligne
    console.log('Aucune ligne sélectionnée valide, utilisation de la première ligne');
    return deleteStepByPosition(0);
}

// Cette fonction a été déplacée en haut du fichier

// Les fonctions seront exposées globalement à la fin du fichier

/**
 * Sélectionne une ligne du tableau par son index
 * @param {number} index - Index de la ligne à sélectionner (0-based)
 * @returns {boolean} - True si la sélection a réussi, false sinon
 */
function selectRowByIndex(index) {
    console.log('Sélection de la ligne à l\'index:', index);
        
    // Récupérer toutes les lignes du tableau (essayer les deux classes possibles)
    let rows = document.querySelectorAll('table.test-steps tbody tr');
    if (!rows || rows.length === 0) {
        rows = document.querySelectorAll('table.steps-table tbody tr');
    }
        
    console.log('Nombre de lignes disponibles:', rows.length);
        
    // Vérifier si l'index est valide
    if (index < 0 || index >= rows.length) {
        console.log('Index invalide:', index);
        return false;
    }
        
    try {
        // Désélectionner toutes les lignes
        document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr').forEach(row => {
            row.classList.remove('selected-row');
        });
            
        // Sélectionner la ligne spécifiée
        const selectedRow = rows[index];
        selectedRow.classList.add('selected-row');
        console.log('Ligne sélectionnée avec succès');
            
        // Mettre à jour l'index de ligne sélectionnée dans manualViewHandler
        if (window.manualViewHandler) {
            // Trouver l'index visuel (numéro affiché dans la première cellule)
            const firstCell = selectedRow.querySelector('td:first-child');
            if (firstCell && firstCell.textContent) {
                const visualIndex = parseInt(firstCell.textContent.trim()) - 1; // Convertir en index basé sur 0
                if (!isNaN(visualIndex) && visualIndex >= 0) {
                    window.manualViewHandler.selectedRowIndex = visualIndex;
                    console.log('selectedRowIndex mis à jour dans manualViewHandler avec l\'index visuel:', visualIndex, '(ligne visuelle:', visualIndex + 1, ')');
                } else {
                    window.manualViewHandler.selectedRowIndex = index;
                    console.log('selectedRowIndex mis à jour dans manualViewHandler avec l\'index de position:', index, '(ligne visuelle:', index + 1, ')');
                }
            } else {
                window.manualViewHandler.selectedRowIndex = index;
                console.log('selectedRowIndex mis à jour dans manualViewHandler avec l\'index de position:', index, '(ligne visuelle:', index + 1, ')');
            }
        }
            
        return true;
    } catch (error) {
        console.error('Erreur lors de la sélection de la ligne:', error);
        return false;
    }
}

/**
 * Fonction de diagnostic qui affiche toutes les informations sur une ligne cliquée
 * @param {HTMLElement} row - L'élément de ligne cliqué
 */
function diagnosticRowInfo(row) {
    console.log('=== DIAGNOSTIC DE LA LIGNE CLIQUÉE ===');
    console.log('\u00c9lément de ligne:', row);
    
    // 1. Index de position dans le DOM (méthode améliorée avec isSameNode)
    const allRows = document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr');
    const rowsArray = Array.from(allRows);
    
    let positionIndex = -1;
    positionIndex = rowsArray.findIndex(r => r.isSameNode(row));
    console.log('Index de position dans le DOM (via isSameNode):', positionIndex);
    
    // 2. Essayer d'obtenir l'index visuel (numéro affiché dans la première cellule)
    const firstCell = row.querySelector('td:first-child');
    let visualIndex = -1;
    
    if (firstCell && firstCell.textContent && firstCell.textContent.trim() !== '') {
        visualIndex = parseInt(firstCell.textContent.trim()) - 1; // Convertir en index basé sur 0
        console.log('Index visuel (numéro - 1):', visualIndex);
    } else {
        console.log('Pas de première cellule ou pas de contenu');
        
        // Si l'index visuel n'est pas disponible, essayer de déterminer l'index de position dans le tableau
        const allRows = document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr');
        const rowArray = Array.from(allRows);
        
        let rowIndex = -1;
        rowIndex = rowArray.findIndex(r => r.isSameNode(row));
        
        if (rowIndex !== -1) {
            console.log('Index déterminé par position dans le tableau (via isSameNode):', rowIndex);
            visualIndex = rowIndex;
        }
    }
    
    // 3. Attribut data-index
    const dataIndex = row.hasAttribute('data-index') ? parseInt(row.getAttribute('data-index')) : -1;
    console.log('Attribut data-index:', dataIndex);
    
    // 4. Classes CSS
    console.log('Classes CSS:', row.className);
    console.log('A la classe selected-row:', row.classList.contains('selected-row'));
    
    // 5. Contenu des cellules
    const cells = row.querySelectorAll('td');
    console.log('Nombre de cellules:', cells.length);
    cells.forEach((cell, idx) => {
        console.log(`Cellule ${idx}:`, cell.textContent.trim());
    });
    
    // 6. Index recommandé pour la suppression
    const recommendedIndex = visualIndex >= 0 ? visualIndex : positionIndex;
    console.log('Index recommandé pour la suppression:', recommendedIndex);
    
    // 7. État actuel de manualViewHandler
    if (window.manualViewHandler) {
        console.log('manualViewHandler.selectedRowIndex:', window.manualViewHandler.selectedRowIndex);
        console.log('manualViewHandler.currentActions.length:', window.manualViewHandler.currentActions ? window.manualViewHandler.currentActions.length : 0);
        
        // Si currentActions est vide mais qu'il y a des lignes dans le tableau, synchroniser les données
        const allRows = document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr');
        if ((!window.manualViewHandler.currentActions || window.manualViewHandler.currentActions.length === 0) && allRows.length > 0) {
            console.log('Synchronisation des données: manualViewHandler.currentActions est vide mais le tableau contient des lignes');
            
            // Extraire les données du tableau
            const extractedActions = [];
            allRows.forEach(tableRow => {
                const cells = tableRow.querySelectorAll('td');
                if (cells.length >= 4) {
                    extractedActions.push({
                        action: cells[1].textContent.trim(),
                        input: cells[2].textContent.trim(),
                        output: cells[3].textContent.trim()
                    });
                }
            });
            
            // Mettre à jour currentActions
            if (extractedActions.length > 0) {
                console.log('Mise à jour de manualViewHandler.currentActions avec', extractedActions.length, 'actions');
                window.manualViewHandler.currentActions = extractedActions;
            }
        }
    } else {
        console.log('manualViewHandler non disponible');
    }
    
    console.log('=== FIN DU DIAGNOSTIC ===');
    
    return recommendedIndex;
}

// Configurer la fonction de suppression au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('direct-delete-handler.js loaded - fonctions exposées globalement');
    
    // Variable globale pour stocker l'index de la ligne actuellement sélectionnée
    window.currentSelectedRowIndex = -1;
    
    // Ajouter un gestionnaire d'événement au bouton Delete
    const deleteButton = document.querySelector('#delete-action-btn, button.delete-btn');
    if (deleteButton) {
        console.log('Bouton Delete trouvé, ajout du gestionnaire d\'événement');
        
        // Supprimer les gestionnaires existants pour éviter les doublons
        const newDeleteButton = deleteButton.cloneNode(true);
        if (deleteButton.parentNode) {
            deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
            
            newDeleteButton.addEventListener('click', function() {
                console.log('Bouton Delete cliqué - vérification de la sélection actuelle');
                
                // Vérifier si une ligne est sélectionnée visuellement
                const selectedRow = document.querySelector('table.test-steps tbody tr.selected-row, table.steps-table tbody tr.selected-row');
                let indexToDelete = -1;
                
                if (selectedRow) {
                    console.log('Ligne sélectionnée trouvée visuellement');
                    indexToDelete = diagnosticRowInfo(selectedRow);
                } else if (typeof window.currentSelectedRowIndex === 'number' && window.currentSelectedRowIndex >= 0) {
                    indexToDelete = window.currentSelectedRowIndex;
                }
                
                if (indexToDelete < 0) {
                    console.log('Aucune ligne sélectionnée trouvée ou index invalide');
                    return;
                }
                
                // Puis supprimer avec indexToDelete
                console.log('Suppression de l\'étape à la position:', indexToDelete);
                deleteStepByPosition(indexToDelete);
            });
        }
    } else {
        console.warn('Bouton Delete non trouvé');
    }

    // Ajouter des gestionnaires d'événements pour la sélection des lignes
    function setupRowSelectionHandlers() {
        console.log('Configuration des gestionnaires de sélection de lignes');

        // Supprimer tous les gestionnaires d'événements existants pour éviter les doublons
        const tables = document.querySelectorAll('table.test-steps, table.steps-table');
        tables.forEach(table => {
            const newTable = table.cloneNode(true);
            if (table.parentNode) {
                table.parentNode.replaceChild(newTable, table);
            }
        });

        // Vérifier s'il y a déjà une ligne sélectionnée pour préserver la sélection
        let preserveIndex = -1;
        const existingSelectedRow = document.querySelector('table.test-steps tbody tr.selected-row, table.steps-table tbody tr.selected-row');

        if (existingSelectedRow) {
            console.log('Ligne déjà sélectionnée trouvée');
            const firstCell = existingSelectedRow.querySelector('td:first-child');

            if (firstCell && firstCell.textContent && firstCell.textContent.trim() !== '') {
                preserveIndex = parseInt(firstCell.textContent.trim()) - 1;
                console.log('Préservation de la sélection existante à l\'index:', preserveIndex);
            }
        }

        // Utiliser une vraie délégation d'événements au niveau du document
        // Cela garantit que les événements fonctionnent même si le DOM est recréé
        document.addEventListener('click', function(event) {
            // Trouver si le clic était sur une ligne de tableau ou un de ses enfants
            const clickedRow = event.target.closest('table.test-steps tbody tr, table.steps-table tbody tr');

            // Si ce n'est pas une ligne ou si c'est un bouton ou une cellule éditable, ignorer
            if (!clickedRow || event.target.closest('button') || event.target.getAttribute('contenteditable') === 'true') {
                return;
            }

            console.log('Ligne cliquée détectée via délégation d\'événements globale');

            // Désélectionner toutes les lignes
            document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr').forEach(r => {
                r.classList.remove('selected-row');
                r.removeAttribute('data-selected-index');
            });

            // Sélectionner cette ligne
            clickedRow.classList.add('selected-row');

            // Obtenir l'index recommandé via la fonction de diagnostic
            const recommendedIndex = diagnosticRowInfo(clickedRow);

            // Mettre à jour notre variable globale pour l'index sélectionné
            window.currentSelectedRowIndex = recommendedIndex;
            console.log('currentSelectedRowIndex mis à jour avec l\'index recommandé:', recommendedIndex);

            // Mettre à jour l'index de ligne sélectionnée dans manualViewHandler
            if (window.manualViewHandler) {
                window.manualViewHandler.selectedRowIndex = recommendedIndex;
                console.log('selectedRowIndex mis à jour dans manualViewHandler avec l\'index recommandé:', recommendedIndex);
            }

            // Ajouter un attribut data-selected-index pour faciliter le débogage
            clickedRow.setAttribute('data-selected-index', recommendedIndex);
        }, true); // Utiliser la phase de capture pour s'assurer que cet événement est traité en premier

        // Si une ligne était précédemment sélectionnée, restaurer la sélection
        if (preserveIndex >= 0) {
            const rows = document.querySelectorAll('table.test-steps tbody tr, table.steps-table tbody tr');
            rows.forEach((row) => {
                const firstCell = row.querySelector('td:first-child');
                if (firstCell && firstCell.textContent && firstCell.textContent.trim() !== '') {
                    const rowVisualIndex = parseInt(firstCell.textContent.trim()) - 1;
                    if (rowVisualIndex === preserveIndex) {
                        row.classList.add('selected-row');
                        window.currentSelectedRowIndex = preserveIndex;
                        if (window.manualViewHandler) {
                            window.manualViewHandler.selectedRowIndex = preserveIndex;
                        }
                        row.setAttribute('data-selected-index', preserveIndex);
                        console.log('Sélection restaurée pour la ligne avec index visuel:', preserveIndex);
                    }
                }
            });
        }

        console.log('Gestionnaires de sélection de lignes configurés avec succès');
    }

    // Configurer les gestionnaires de sélection de lignes
    setupRowSelectionHandlers();

    
    // Fonction pour observer les changements dans le tableau et reconfigurer les gestionnaires
    const tableObserver = new MutationObserver(function(mutations) {
        console.log('Changements détectés dans le tableau, reconfiguration des gestionnaires');
        // Attendre un court instant pour s'assurer que le DOM est stabilisé
        setTimeout(() => {
            setupRowSelectionHandlers();
            console.log('Gestionnaires réinitialisés après mutation du tableau');
        }, 100);
    });
    
    // Observer les changements dans le tableau (essayer les deux classes possibles)
    let tableBody = document.querySelector('table.test-steps tbody');
    if (!tableBody) {
        tableBody = document.querySelector('table.steps-table tbody');
    }
    
    if (tableBody) {
        console.log('Observation des mutations du tableau configurée');
        tableObserver.observe(tableBody, { childList: true, subtree: true });
    } else {
        console.warn('Aucun tableau trouvé pour configurer l\'observateur de mutations');
    }
    
    // Observer également les changements dans le conteneur principal pour détecter le chargement d'un nouveau test case
    const contentContainer = document.querySelector('#content-container, #manual-view-container');
    if (contentContainer) {
        const contentObserver = new MutationObserver(function(mutations) {
            console.log('Changements détectés dans le conteneur principal, vérification des tableaux');
            // Attendre que le DOM soit complètement mis à jour
            setTimeout(() => {
                setupRowSelectionHandlers();
                console.log('Gestionnaires réinitialisés après chargement possible d\'un test case');
            }, 300);
        });
        
        contentObserver.observe(contentContainer, { childList: true, subtree: true });
        console.log('Observation des mutations du conteneur principal configurée');
    }
    
    // Ajouter un gestionnaire d'événements pour le bouton Delete dans la barre d'outils
    const deleteBtn = document.getElementById('delete-action-btn');
    if (deleteBtn) {
        // Supprimer les gestionnaires d'événements existants
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        // Ajouter le nouveau gestionnaire d'événements
        newDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Bouton Delete cliqué - gestionnaire direct');
            
            // Essayer d'abord de supprimer l'étape sélectionnée
            const result = deleteSelectedStep();
            
            // Si ça ne fonctionne pas, essayer de supprimer la première étape
            if (!result) {
                console.log('Tentative de suppression de la première étape...');
                deleteFirstStep();
            }
        });
    }
});

// Exposer toutes les fonctions au niveau global
window.deleteStepByPosition = deleteStepByPosition;
window.deleteFirstStep = deleteFirstStep;
window.deleteSelectedStep = deleteSelectedStep;
window.selectRowByIndex = selectRowByIndex;
window.diagnosticRowInfo = diagnosticRowInfo;
window.showMessage = showMessage;

console.log('Toutes les fonctions ont été exposées globalement');