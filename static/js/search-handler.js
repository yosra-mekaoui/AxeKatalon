// Gestionnaire de recherche pour la sidebar
document.addEventListener('DOMContentLoaded', function() {
    const fileSearch = document.getElementById('fileSearch');
    const searchIcon = document.querySelector('.search-icon');

    if (!fileSearch) {
        console.error('Input de recherche non trouvé!');
        return;
    }

    function filterTreeItems(searchTerm) {
        console.log('Démarrage de la recherche avec:', searchTerm);
        
        // Récupérer tous les éléments de l'arborescence
        const allItems = document.querySelectorAll('#projectTree li');
        console.log('Nombre d\'éléments trouvés:', allItems.length);

        // Si la recherche est vide, réinitialiser l'affichage
        if (!searchTerm) {
            console.log('Réinitialisation de l\'affichage');
            allItems.forEach(item => {
                item.style.display = '';
                const subfolder = item.querySelector('.subfolder-content');
                if (subfolder) {
                    subfolder.classList.add('hidden');
                }
                const arrow = item.querySelector('.folder-arrow');
                if (arrow) {
                    arrow.classList.remove('fa-chevron-down');
                    arrow.classList.add('fa-chevron-right');
                }
            });
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        
        // Parcourir tous les éléments
        allItems.forEach(item => {
            const span = item.querySelector('span');
            if (!span) return;

            const itemText = span.textContent;
            const isMatch = itemText.toLowerCase().includes(searchTermLower);
            
            if (isMatch) {
                // Afficher l'élément correspondant
                item.style.display = '';
                
                // Si c'est un dossier, l'ouvrir
                if (item.classList.contains('folder')) {
                    const subfolder = item.querySelector('.subfolder-content');
                    if (subfolder) {
                        subfolder.classList.remove('hidden');
                    }
                    const arrow = item.querySelector('.folder-arrow');
                    if (arrow) {
                        arrow.classList.remove('fa-chevron-right');
                        arrow.classList.add('fa-chevron-down');
                    }
                }
                
                // Rendre visible tous les parents
                let parent = item.parentElement;
                while (parent && parent !== document) {
                    if (parent.classList.contains('folder')) {
                        parent.style.display = '';
                        const subfolder = parent.querySelector('.subfolder-content');
                        if (subfolder) {
                            subfolder.classList.remove('hidden');
                        }
                        const arrow = parent.querySelector('.folder-arrow');
                        if (arrow) {
                            arrow.classList.remove('fa-chevron-right');
                            arrow.classList.add('fa-chevron-down');
                        }
                    }
                    parent = parent.parentElement;
                }
            } else {
                // Masquer les éléments qui ne correspondent pas
                item.style.display = 'none';
            }
        });
    }

    // Gestionnaire d'événement pour la recherche en temps réel
    let searchTimeout = null;
    fileSearch.addEventListener('input', function(e) {
        console.log('Saisie détectée:', e.target.value);
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            filterTreeItems(searchTerm);
        }, 50);
    });

    // Réinitialiser la recherche en cliquant sur l'icône
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            fileSearch.value = '';
            filterTreeItems('');
        });
    }
});
