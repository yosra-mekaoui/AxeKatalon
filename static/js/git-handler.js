/**
 * Gestionnaire des fonctionnalités Git
 * Permet de cloner des projets depuis Azure DevOps et de gérer les opérations Git de base
 */

class GitHandler {
    constructor() {
        this.initUI();
        this.initEventListeners();
    }

    /**
     * Initialise l'interface utilisateur Git
     */
    initUI() {
        // Création de la modale de clonage
        const modalHTML = `
            <div id="gitCloneModal" class="git-clone-modal">
                <div class="git-clone-modal-content">
                    <div class="git-clone-modal-header">
                        <i class="fab fa-git-alt git-icon"></i>
                        <h2>Clone Git Repository</h2>
                    </div>
                    <div class="git-clone-modal-body">
                        <div class="git-form-group">
                            <label for="repositoryUrl">Repository URL:</label>
                            <input type="text" id="repositoryUrl" placeholder="https://dev.azure.com/organization/project/_git/repository">
                            <div id="urlError" class="git-error"></div>
                        </div>
                        <div class="git-form-group">
                            <label>Authentication</label>
                        </div>
                        <div class="git-form-group">
                            <label for="gitUsername">User:</label>
                            <input type="text" id="gitUsername">
                        </div>
                        <div class="git-form-group">
                            <label for="gitPassword">Password/PAT:</label>
                            <input type="password" id="gitPassword">
                            <div id="authError" class="git-error"></div>
                        </div>
                        <div class="git-form-group">
                            <div class="checkbox-container">
                                <input type="checkbox" id="saveAuth">
                                <label for="saveAuth">Save authentication</label>
                            </div>
                        </div>
                    </div>
                    <div class="git-clone-modal-footer">
                        <div id="cloneLoading" class="git-loading" style="display: none;"></div>
                        <button id="cancelClone" class="cancel-btn">Cancel</button>
                        <button id="confirmClone" class="clone-btn">Clone</button>
                    </div>
                </div>
            </div>
        `;

        // Ajout de la modale au body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Bouton Git dans la barre d'outils
        const gitButton = document.getElementById('gitMainButton');
        if (gitButton) {
            // Les événements sont gérés par CSS pour l'affichage du menu
            console.log('Git button initialized');
        }

        // Événement de clonage
        const cloneProjectBtn = document.getElementById('cloneProject');
        if (cloneProjectBtn) {
            cloneProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCloneModal();
            });
        }

        // Événements de la modale de clonage
        const cancelCloneBtn = document.getElementById('cancelClone');
        const confirmCloneBtn = document.getElementById('confirmClone');
        
        if (cancelCloneBtn) {
            cancelCloneBtn.addEventListener('click', () => {
                this.hideCloneModal();
            });
        }
        
        if (confirmCloneBtn) {
            confirmCloneBtn.addEventListener('click', () => {
                this.cloneRepository();
            });
        }

        // Fermer la modale si on clique en dehors
        const modal = document.getElementById('gitCloneModal');
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCloneModal();
                }
            });
        }

        // Événements pour les autres fonctionnalités Git
        this.initGitOperationsEvents();
    }

    /**
     * Initialise les événements pour les opérations Git (commit, push, pull, etc.)
     */
    initGitOperationsEvents() {
        const commitBtn = document.getElementById('commitChanges');
        const pushBtn = document.getElementById('pushChanges');
        const pullBtn = document.getElementById('pullChanges');
        const fetchBtn = document.getElementById('fetchChanges');
        const newBranchBtn = document.getElementById('newBranch');
        const checkoutBranchBtn = document.getElementById('checkoutBranch');
        const deleteBranchBtn = document.getElementById('deleteBranch');

        if (commitBtn) {
            commitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Commit functionality will be implemented soon', 'info');
            });
        }

        if (pushBtn) {
            pushBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Push functionality will be implemented soon', 'info');
            });
        }

        if (pullBtn) {
            pullBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Pull functionality will be implemented soon', 'info');
            });
        }

        if (fetchBtn) {
            fetchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Fetch functionality will be implemented soon', 'info');
            });
        }

        if (newBranchBtn) {
            newBranchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('New Branch functionality will be implemented soon', 'info');
            });
        }

        if (checkoutBranchBtn) {
            checkoutBranchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Checkout Branch functionality will be implemented soon', 'info');
            });
        }

        if (deleteBranchBtn) {
            deleteBranchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Delete Branch functionality will be implemented soon', 'info');
            });
        }
    }

    /**
     * Affiche la modale de clonage
     */
    showCloneModal() {
        const modal = document.getElementById('gitCloneModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * Cache la modale de clonage
     */
    hideCloneModal() {
        const modal = document.getElementById('gitCloneModal');
        if (modal) {
            modal.style.display = 'none';
            // Réinitialiser les champs et les erreurs
            document.getElementById('repositoryUrl').value = '';
            document.getElementById('gitUsername').value = '';
            document.getElementById('gitPassword').value = '';
            document.getElementById('saveAuth').checked = false;
            document.getElementById('urlError').textContent = '';
            document.getElementById('authError').textContent = '';
            document.getElementById('cloneLoading').style.display = 'none';
        }
    }

    /**
     * Valide les entrées du formulaire de clonage
     * @returns {boolean} True si les entrées sont valides, false sinon
     */
    validateCloneInputs() {
        const url = document.getElementById('repositoryUrl').value.trim();
        const username = document.getElementById('gitUsername').value.trim();
        const password = document.getElementById('gitPassword').value;
        let isValid = true;

        // Validation de l'URL
        if (!url) {
            document.getElementById('urlError').textContent = 'Repository URL is required';
            isValid = false;
        } else if (!url.includes('dev.azure.com') && !url.includes('visualstudio.com')) {
            document.getElementById('urlError').textContent = 'URL must be an Azure DevOps repository';
            isValid = false;
        } else {
            document.getElementById('urlError').textContent = '';
        }

        // Validation des identifiants
        if (!username || !password) {
            document.getElementById('authError').textContent = 'Username and password/PAT are required';
            isValid = false;
        } else {
            document.getElementById('authError').textContent = '';
        }

        return isValid;
    }

    /**
     * Clone le dépôt Git
     */
    cloneRepository() {
        if (!this.validateCloneInputs()) {
            return;
        }

        const url = document.getElementById('repositoryUrl').value.trim();
        const username = document.getElementById('gitUsername').value.trim();
        const password = document.getElementById('gitPassword').value;
        const saveAuth = document.getElementById('saveAuth').checked;

        // Afficher l'indicateur de chargement
        document.getElementById('cloneLoading').style.display = 'inline-block';
        document.getElementById('confirmClone').disabled = true;

        // Appel à l'API backend pour cloner le dépôt
        fetch('/api/git/clone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                repositoryUrl: url,
                username: username,
                password: password,
                saveAuth: saveAuth
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('cloneLoading').style.display = 'none';
            document.getElementById('confirmClone').disabled = false;

            if (data.success) {
                this.hideCloneModal();
                this.showNotification('Repository cloned successfully!', 'success');
                
                // Rafraîchir la sidebar pour afficher le nouveau projet
                if (typeof refreshProject === 'function') {
                    refreshProject();
                } else if (typeof loadFolderContents === 'function') {
                    loadFolderContents('');
                } else {
                    // Fallback: recharger la page
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            } else {
                this.showNotification('Error: ' + (data.message || 'Failed to clone repository'), 'error');
            }
        })
        .catch(error => {
            document.getElementById('cloneLoading').style.display = 'none';
            document.getElementById('confirmClone').disabled = false;
            this.showNotification('Error: ' + error.message, 'error');
        });
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Utiliser la fonction de notification existante si disponible
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Sinon, créer une notification simple
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
}

// Initialiser le gestionnaire Git au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    window.gitHandler = new GitHandler();
});
