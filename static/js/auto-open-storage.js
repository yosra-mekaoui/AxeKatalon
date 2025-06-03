/**
 * Script pour ouvrir automatiquement un projet après le clonage Git
 * en utilisant localStorage pour stocker le chemin du projet
 */
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous avons un projet à ouvrir automatiquement dans localStorage
    const projectToOpen = localStorage.getItem('autoOpenProject');
    
    if (projectToOpen) {
        console.log("Opening project from localStorage:", projectToOpen);
        
        // Supprimer immédiatement l'élément du localStorage pour éviter les réouvertures
        localStorage.removeItem('autoOpenProject');
        
        // Formater le chemin du projet pour s'assurer qu'il est correctement encodé
        let formattedPath = projectToOpen;
        
        // S'assurer que le chemin utilise les bons séparateurs pour Windows
        formattedPath = formattedPath.replace(/\//g, '\\');
        
        console.log("Formatted project path:", formattedPath);
        
        // Ouvrir le projet cloné automatiquement
        if (typeof window.openProjectByPath === 'function') {
            // Utiliser la nouvelle fonction pour ouvrir directement le projet
            console.log("Opening project directly using openProjectByPath:", formattedPath);
            window.openProjectByPath(formattedPath);
        } else {
            // Fallback: utiliser l'API fetch si la fonction n'est pas disponible
            console.log("Fallback: opening project via API call:", formattedPath);
            fetch('/open_project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path: formattedPath })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Project opened successfully:", data);
                    
                    // Afficher une notification de succès
                    if (typeof showNotification === 'function') {
                        showNotification('Project opened successfully', 'success');
                    } else {
                        // Créer une notification simple si la fonction n'existe pas
                        const notification = document.createElement('div');
                        notification.textContent = 'Project opened successfully';
                        notification.style.position = 'fixed';
                        notification.style.top = '20px';
                        notification.style.right = '20px';
                        notification.style.padding = '10px 20px';
                        notification.style.backgroundColor = '#4CAF50';
                        notification.style.color = 'white';
                        notification.style.borderRadius = '4px';
                        notification.style.zIndex = '9999';
                        document.body.appendChild(notification);
                        
                        // Supprimer la notification après 5 secondes
                        setTimeout(() => {
                            notification.style.opacity = '0';
                            notification.style.transition = 'opacity 0.5s';
                            setTimeout(() => {
                                document.body.removeChild(notification);
                            }, 500);
                        }, 5000);
                    }
                    
                    // Rafraîchir la sidebar pour afficher le projet
                    if (typeof refreshSidebarFolder === 'function') {
                        // Rafraîchir tous les dossiers racine du projet
                        const rootFolders = ['TestCases', 'Object Repository', 'Profiles', 'Test Suites', 'Keywords'];
                        
                        // Rafraîchir chaque dossier racine pour s'assurer que le projet est visible
                        rootFolders.forEach(folder => {
                            console.log(`Refreshing folder: ${folder}`);
                            refreshSidebarFolder(folder);
                        });
                        
                        // Afficher un message de succès
                        console.log("Project refreshed successfully");
                    } else if (typeof loadFolderContents === 'function') {
                        // Essayer de charger les dossiers racine directement
                        const rootFolders = ['TestCases', 'Object Repository', 'Profiles', 'Test Suites', 'Keywords'];
                        rootFolders.forEach(folder => {
                            loadFolderContents(folder);
                        });
                    } else {
                        // Si aucune fonction de rafraîchissement n'est disponible, recharger la page
                        console.log("No refresh function available, reloading page");
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                } else {
                    console.error("Failed to open project:", data.message);
                }
            })
            .catch(error => {
                console.error('Error opening project:', error);
            });
        }
    }
});
