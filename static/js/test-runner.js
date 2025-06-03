// Variables globales
let isTestRunning = false;
let currentTestCase = null;
let executionLogs = [];
let testStartTime = null;

function initializeTestRunner() {
    connectExistingButtons();
    initializeConsoleTabs();

    document.addEventListener('fileLoaded', function(event) {
        updateRunButtonState();
    });
}

function initializeConsoleTabs() {
    const tabs = document.querySelectorAll('.console-tabs .tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const consoleType = this.getAttribute('data-console');
            const panels = document.querySelectorAll('.console-panel');
            
            panels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            const activePanel = document.getElementById(`${consoleType}-panel`);
            if (activePanel) {
                activePanel.classList.add('active');
            }
        });
    });
}

function connectExistingButtons() {
    // Bouton d'exécution (play)
    const runButton = document.querySelector('.toolbar .left-group button:nth-child(1)');
    if (runButton) {
        runButton.id = 'run-test-btn';
        runButton.classList.add('run-btn');
        runButton.title = 'Exécuter le test case avec le profil sélectionné';
        runButton.disabled = true;
        
        runButton.addEventListener('click', function() {
            if (!isTestRunning) {
                runTestCase();
            }
        });
    } else {
        console.error('Bouton d\'exécution non trouvé');
    }
    
    // Bouton d'arrêt (stop)
    const stopButton = document.querySelector('.toolbar .left-group button:nth-child(2)');
    if (stopButton) {
        stopButton.id = 'stop-test-btn';
        stopButton.classList.add('stop-btn');
        stopButton.title = 'Arrêter l\'exécution du test';
        stopButton.disabled = true;
        
        stopButton.addEventListener('click', function() {
            if (isTestRunning) {
                stopTestCase();
            }
        });
    } else {
        console.error('Bouton d\'arrêt non trouvé');
    }
}


function updateRunButtonState() {
    const runButton = document.querySelector('#run-test-btn');
    const stopButton = document.querySelector('#stop-test-btn');
    
    if (!runButton || !stopButton) {
        return;
    }
    
    // Vérifier si un fichier de test case est sélectionné
    const isTestCase = window.currentFile && window.currentFile.path && 
                       window.currentFile.path.includes('TestCases') && 
                       window.currentFile.path.endsWith('.py');
    
    // Activer ou désactiver le bouton en fonction du type de fichier
    runButton.disabled = !isTestCase || isTestRunning;
    stopButton.disabled = !isTestRunning;
}

// Exécute le test case actuel avec le profil sélectionné

function runTestCase() {
    // Vérifier si un fichier de test case est sélectionné
    if (!window.currentFile || !window.currentFile.path ||
        !window.currentFile.path.includes('TestCases') ||
        !window.currentFile.path.endsWith('.py')) {
        showNotification('Veuillez sélectionner un fichier de test case (.py)', 'warning');
        return;
    }
    // Vérifier si un profil est sélectionné
    const profileSelect = document.querySelector('.profile-select');
    if (!profileSelect || !profileSelect.value) {
        showNotification('Veuillez sélectionner un profil', 'warning');
        return;
    }

    // Récupérer le nom du test case et du profil
    const testCasePath = window.currentFile.path;
    const testCaseName = testCasePath.split('\\').pop().split('/').pop().replace('.py', '');
    const profileName = profileSelect.value;

    // Mettre à jour l'état d'exécution
    isTestRunning = true;
    currentTestCase = testCaseName;
    executionLogs = [];
    testStartTime = new Date();

    // Mettre à jour l'interface utilisateur
    updateUIForRunningTest(testCaseName, profileName);

    // Activer l'onglet d'exécution de test d'abord pour montrer le statut
    activateTestExecutionTab();

    // Ajouter des messages de log pour indiquer le démarrage de l'exécution
    addExecutionLog(`Démarrage de l'exécution du test case: ${testCaseName}`, 'info');
    addExecutionLog(`Utilisation du profil: ${profileName}`, 'info');
    addExecutionLog(`Modification du fichier TestCaseExecutorLauncher.py...`, 'info');

    // Démarrer le streaming des logs dans l'onglet Log Viewer
    startLogStreaming(testCaseName);

    // Appeler l'API pour exécuter le test case
    fetch('/api/execute_test_case', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectPath: window.currentProjectPath,
            testCasePath: testCasePath,
            profileName: profileName
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Afficher un résumé de la sortie dans les logs d'exécution
            addExecutionLog(`Test exécuté avec succès`, 'info');

            // Mettre à jour l'état d'exécution
            isTestRunning = false;
            updateUIForStoppedTest(true);

            // Afficher un résumé de l'exécution
            displayExecutionSummary(true, 'Test exécuté avec succès');
        } else {
            // Afficher l'erreur dans les logs d'exécution
            addExecutionLog(`Erreur lors de l'exécution du test: ${data.error}`, 'error');

            // Mettre à jour l'état d'exécution
            isTestRunning = false;
            updateUIForStoppedTest(false);

            // Afficher un résumé de l'exécution
            displayExecutionSummary(false, `Erreur lors de l'exécution du test: ${data.error}`);
        }
    })
    .catch(error => {
        // Afficher l'erreur dans les logs
        addExecutionLog(`Erreur lors de l'appel à l'API: ${error}`, 'error');

        // Mettre à jour l'état d'exécution
        isTestRunning = false;
        updateUIForStoppedTest(false);

        // Afficher un résumé de l'exécution
        displayExecutionSummary(false, `Erreur lors de l'appel à l'API: ${error}`);
    });
}

//Active l'onglet d'exécution de test dans la console
function activateTestExecutionTab() {
    const tabs = document.querySelectorAll('.console-tabs .tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const testExecutionTab = document.querySelector('.console-tabs .tab[data-console="test-execution"]');
    if (testExecutionTab) {
        testExecutionTab.classList.add('active');
    }

    const panels = document.querySelectorAll('.console-panel');
    panels.forEach(panel => panel.classList.remove('active'));

    const testExecutionPanel = document.getElementById('test-execution-panel');
    if (testExecutionPanel) {
        testExecutionPanel.classList.add('active');
    }
}

function stopTestCase() {
    isTestRunning = false;

    // Arrêter le streaming des logs
    stopLogStreaming();

    updateUIForStoppedTest();
    addExecutionLog('Test arrêté par l\'utilisateur', 'warning');
    displayExecutionSummary(false, 'Test arrêté par l\'utilisateur');
}

//Met à jour l'interface utilisateur pour un test en cours d'exécution  Le nom du test case et nom du profil

function updateUIForRunningTest(testCaseName, profileName) {
    const runButton = document.querySelector('#run-test-btn');
    const stopButton = document.querySelector('#stop-test-btn');

    if (runButton) {
        runButton.disabled = true;
    }

    if (stopButton) {
        stopButton.disabled = false;
    }

    // Créer l'en-tête d'exécution
    const headerContainer = document.querySelector('.test-execution-header');
    if (headerContainer) {
        headerContainer.innerHTML = `
            <h2>Exécution du test: ${testCaseName}</h2>
            <p>Profil: ${profileName}</p>
            <p>Démarré à: ${testStartTime.toLocaleTimeString()}</p>
            <div class="test-stats">
                <div class="test-stat">
                    <span class="test-stat-label">Runs:</span>
                    <span class="test-stat-value">1/1</span>
                </div>
                <div class="test-stat test-stat-success">
                    <span class="test-stat-label">Passes:</span>
                    <span class="test-stat-value">0</span>
                </div>
                <div class="test-stat test-stat-failure">
                    <span class="test-stat-label">Failures:</span>
                    <span class="test-stat-value">0</span>
                </div>
                <div class="test-stat">
                    <span class="test-stat-label">Errors:</span>
                    <span class="test-stat-value">0</span>
                </div>
                <div class="test-stat">
                    <span class="test-stat-label">Skips:</span>
                    <span class="test-stat-value">0</span>
                </div>
            </div>
        `;
    }

    // Vider le conteneur de logs
    const logContainer = document.querySelector('.test-execution-log');
    if (logContainer) {
        logContainer.innerHTML = '';
    }

    // Vider le conteneur de résumé
    const summaryContainer = document.querySelector('.test-execution-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = '';
    }
}

//Met à jour l'interface utilisateur pour un test arrêté
function updateUIForStoppedTest(success = null) {
    // Mettre à jour les boutons
    const runButton = document.querySelector('#run-test-btn');
    const stopButton = document.querySelector('#stop-test-btn');

    if (runButton) {
        runButton.disabled = false;
    }

    if (stopButton) {
        stopButton.disabled = true;
    }

    // Mettre à jour les statistiques
    const successStat = document.querySelector('.test-stat-success .test-stat-value');
    const failureStat = document.querySelector('.test-stat-failure .test-stat-value');

    if (successStat && failureStat) {
        if (success === null) {
            // Si aucun résultat n'est fourni, utiliser une valeur par défaut
            successStat.textContent = '0';
            failureStat.textContent = '0';
        } else if (success) {
            // Test réussi
            successStat.textContent = '1';
            failureStat.textContent = '0';
        } else {
            // Test échoué
            successStat.textContent = '0';
            failureStat.textContent = '1';
        }
    }
}

//Ajoute un message au log d'exécution('info'...)
function addExecutionLog(message, type = 'info') {
    // Ajouter le message au tableau des logs
    executionLogs.push({
        time: new Date(),
        message: message,
        type: type
    });

    // Mettre à jour l'affichage des logs
    updateExecutionLogDisplay();

    // Afficher le message dans la console
    console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Met à jour l'affichage des logs d'exécution
 */
function updateExecutionLogDisplay() {
    const logContainer = document.querySelector('.test-execution-log');
    if (!logContainer) {
        return;
    }

    logContainer.innerHTML = '';

    executionLogs.forEach(log => {
        const logElement = document.createElement('div');
        logElement.className = `log-entry log-${log.type}`;
        logElement.innerHTML = `[${log.time.toLocaleTimeString()}] ${log.message}`;
        logContainer.appendChild(logElement);
    });

    logContainer.scrollTop = logContainer.scrollHeight;
}

//Affiche un résumé de l'exécution(Indique si le test a réussi,message de résumé)
function displayExecutionSummary(success, message) {
    // Calculer la durée d'exécution
    const endTime = new Date();
    const duration = (endTime - testStartTime) / 1000; // en secondes

    // Créer l'élément de résumé
    const summaryContainer = document.querySelector('.test-execution-summary');
    if (summaryContainer) {
        summaryContainer.className = `test-execution-summary summary-${success ? 'success' : 'failure'}`;
        summaryContainer.innerHTML = `
            <h3>Résumé de l'exécution</h3>
            <p><strong>Statut:</strong> ${success ? 'Succès' : 'Échec'}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Durée:</strong> ${duration.toFixed(2)} secondes</p>
            <p><strong>Heure de fin:</strong> ${endTime.toLocaleTimeString()}</p>
        `;
    }
    // Afficher le résumé dans la console
    console.log(`[${success ? 'SUCCESS' : 'FAILURE'}] ${message}`);
    console.log(`Durée d'exécution: ${duration.toFixed(2)} secondes`);
    console.log(`Heure de fin: ${endTime.toLocaleTimeString()}`);
}

/**
 * Simule l'exécution d'un test case
 * @param {string} testCaseName - Le nom du test case
 * @param {string} profileName - Le nom du profil
 */
function simulateTestExecution(testCaseName, profileName) {
    // Ajouter des logs d'exécution simulés
    addExecutionLog(`Démarrage de l'exécution du test case: ${testCaseName}`);
    addExecutionLog(`Utilisation du profil: ${profileName}`);

    // Simuler des étapes d'exécution
    setTimeout(() => {
        addExecutionLog('Initialisation de l\'environnement de test...');
    }, 1000);

    setTimeout(() => {
        addExecutionLog('Chargement des variables du profil...');
    }, 2000);

    setTimeout(() => {
        addExecutionLog('Ouverture du navigateur...', 'info');
    }, 3000);

    setTimeout(() => {
        addExecutionLog('Navigation vers l\'URL: ' + getProfileVariable(profileName, 'URL'));
    }, 4000);

    setTimeout(() => {
        addExecutionLog('Connexion avec l\'utilisateur: ' + getProfileVariable(profileName, 'Username'));
    }, 5000);

    setTimeout(() => {
        addExecutionLog('Exécution des étapes du test...');
    }, 6000);

    setTimeout(() => {
        // Simuler une réussite ou un échec aléatoire
        const success = Math.random() > 0.3; // 70% de chance de réussite

        if (success) {
            addExecutionLog('Test exécuté avec succès!', 'info');
            // Mettre à jour l'état d'exécution
            isTestRunning = false;
            updateUIForStoppedTest(true);

            // Afficher un résumé de l'exécution
            displayExecutionSummary(true, 'Test exécuté avec succès');
        } else {
            addExecutionLog('Erreur lors de l\'exécution du test: Élément non trouvé', 'error');
            // Mettre à jour l'état d'exécution
            isTestRunning = false;
            updateUIForStoppedTest(false);

            // Afficher un résumé de l'exécution
            displayExecutionSummary(false, 'Erreur lors de l\'exécution du test: Élément non trouvé');
        }
    }, 8000);
}

//Récupère la valeur d'une variable de profil(Le nom du profil,Le nom de la variable)
function getProfileVariable(profileName, variableName) {
    if (window.profileHandler && window.profileHandler.getProfileVariables) {
        const variables = window.profileHandler.getProfileVariables(profileName);
        if (variables) {
            const variable = variables.find(v => v.name === variableName);
            if (variable) {
                return variable.value;
            }
        }
    }
    const defaultValues = {
        'URL': 'https://github.com',
        'Username': 'Administrator',
        'Password': '********'
    };

    return defaultValues[variableName] || 'Valeur non trouvée';
}
//Affiche une notification Le type de notification (info, success, warning, error)
function showNotification(message, type = 'info') {
    // Vérifier si la fonction existe dans le contexte global
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }
}

// Variable pour stocker l'EventSource
let logStream = null;

/**
 * Démarre le streaming des logs pour un test case
 * @param {string} testCaseName - Le nom du test case
 */
function startLogStreaming(testCaseName) {
    // Fermer toute connexion existante
    if (logStream) {
        logStream.close();
        logStream = null;
    }

    // Activer l'onglet Log Viewer
    activateLogViewerTab();

    // Vider le contenu du Log Viewer
    const logViewerContent = document.querySelector('.log-viewer-content');
    if (logViewerContent) {
        logViewerContent.innerHTML = `<div class="streaming-indicator">Streaming des logs en cours...</div>`;
    }

    // Créer une nouvelle connexion EventSource
    const url = `/api/stream_logs?project_path=${encodeURIComponent(window.currentProjectPath)}&test_case_name=${encodeURIComponent(testCaseName)}`;
    console.log("URL de streaming:", url);
    logStream = new EventSource(url);

    // Gérer les événements de données
    logStream.onmessage = function(event) {
        try {
            console.log("Message SSE reçu:", event.data);
            const data = JSON.parse(event.data);

            // Si nous avons du contenu, l'ajouter aux logs
            if (data.content) {
                console.log("Contenu reçu:", data.content.substring(0, 50) + "...");

                // Récupérer le contenu actuel du log viewer (sans l'indicateur de streaming)
                let currentContent = '';
                if (logViewerContent) {
                    // Vérifier si c'est la première mise à jour
                    if (logViewerContent.querySelector('.streaming-indicator')) {
                        logViewerContent.innerHTML = '';
                    } else {
                        currentContent = logViewerContent.innerHTML;
                    }

                    // Formater et ajouter les nouvelles lignes
                    let formattedContent = '';
                    const lines = data.content.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            // Déterminer la classe CSS en fonction du contenu
                            let logClass = '';
                            if (line.includes('ERROR') || line.includes('FAILED') || line.includes('Exception') || line.includes('Error')) {
                                logClass = 'log-error';
                            } else if (line.includes('WARNING') || line.includes('Warn')) {
                                logClass = 'log-warning';
                            } else if (line.includes('SUCCESS') || line.includes('PASSED')) {
                                logClass = 'log-success';
                            }

                            // Ajouter la ligne au contenu formaté
                            formattedContent += `<div class="log-line ${logClass}">${line}</div>`;

                            // Ne pas ajouter ces lignes aux logs d'exécution pour éviter la duplication
                            // Les logs d'exécution seront réservés aux messages de statut de l'application
                        }
                    });

                    // Mettre à jour le contenu du log viewer
                    logViewerContent.innerHTML = currentContent + formattedContent;

                    // Faire défiler vers le bas
                    logViewerContent.scrollTop = logViewerContent.scrollHeight;
                }
            }

            // Si le test est terminé, fermer la connexion
            if (data.status === 'completed') {
                console.log('Test terminé, fermeture du stream');
                if (logStream) {
                    logStream.close();
                    logStream = null;
                }

                // Ajouter un message indiquant que le streaming est terminé
                if (logViewerContent) {
                    logViewerContent.innerHTML += `<div class="streaming-end">Fin du streaming des logs</div>`;
                }

                // Ajouter un message dans les logs d'exécution
                addExecutionLog('Test terminé', 'info');
            }

            // Si une erreur est survenue
            if (data.error) {
                console.error('Erreur de streaming:', data.error);
                addExecutionLog(`Erreur de streaming: ${data.error}`, 'error');
                if (logViewerContent) {
                    logViewerContent.innerHTML += `<div class="log-error">Erreur de streaming: ${data.error}</div>`;
                }
                if (logStream) {
                    logStream.close();
                    logStream = null;
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement des données de streaming:', error, event.data);
            if (logViewerContent) {
                logViewerContent.innerHTML += `<div class="log-error">Erreur lors du traitement des données: ${error.message}</div>`;
            }
        }
    };

    // Gérer les événements de connexion
    logStream.onopen = function(event) {
        console.log('Connexion au stream de logs établie');
        addExecutionLog('Connexion au stream de logs établie', 'info');
    };

    // Gérer les erreurs
    logStream.onerror = function(error) {
        console.error('Erreur de connexion au stream de logs:', error);
        addExecutionLog('Erreur de connexion au stream de logs', 'error');
        if (logViewerContent) {
            logViewerContent.innerHTML += `<div class="log-error">Erreur de connexion au stream de logs</div>`;
        }
        if (logStream) {
            logStream.close();
            logStream = null;
        }
    };
}

/**
 * Active l'onglet Log Viewer dans la console
 */
function activateLogViewerTab() {
    const tabs = document.querySelectorAll('.console-tabs .tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const logViewerTab = document.querySelector('.console-tabs .tab[data-console="log-viewer"]');
    if (logViewerTab) {
        logViewerTab.classList.add('active');
    }
    
    const panels = document.querySelectorAll('.console-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    const logViewerPanel = document.getElementById('log-viewer-panel');
    if (logViewerPanel) {
        logViewerPanel.classList.add('active');
    }
}

/**
 * Arrête le streaming des logs
 */
function stopLogStreaming() {
    if (logStream) {
        logStream.close();
        logStream = null;
        console.log('Stream de logs arrêté');
    }
}

document.addEventListener('DOMContentLoaded', initializeTestRunner);

window.testRunner = {
    runTestCase,
    stopTestCase,
    updateRunButtonState
};
