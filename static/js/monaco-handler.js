class MonacoEditorHandler {
    constructor() {
        this.editor = null;
        this.pythonDiagnostics = null;
        this.currentContent = '';
        this.initializeEditor();
    }
    initializeEditor() {
        require(['vs/editor/editor.main'], () => {
            // Register Python language
            monaco.languages.register({ id: 'python' });
            // Create editor when switching to script view
            document.addEventListener('viewChanged', (event) => {
                if (event.detail.view === 'script') {
                    this.createEditor();
                }
            });
        });
    }
    createEditor() {
        const scriptContent = document.querySelector('#scriptContent');
        if (!scriptContent) return;

        const container = document.createElement('div');
        container.id = 'monaco-editor-container';
        container.style.width = '100%';
        container.style.height = '700px';
        scriptContent.parentNode.replaceChild(container, scriptContent);

        this.currentContent = scriptContent.value || '';

        this.editor = monaco.editor.create(container, {
            value: this.currentContent,
            language: 'python',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
                enabled: true
            },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 4,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            contextmenu: true
        });
        this.setupPythonValidation();
        this.setupContextMenu();
        this.editor.onDidChangeModelContent(() => {
            this.currentContent = this.editor.getValue();
            this.updateContent();
            const event = new CustomEvent('scriptContentChanged', {
                detail: { content: this.currentContent }
            });
            document.dispatchEvent(event);
        });
    }
    getCurrentContent() {
        return this.currentContent;
    }
    setContent(content) {
        this.currentContent = content;
        if (this.editor) {
            this.editor.setValue(content);
        }
    }
    setupPythonValidation() {
        if (!this.editor) return;

        const model = this.editor.getModel();
        if (!model) return;
        model.onDidChangeContent(() => {
            const content = model.getValue();
            const diagnostics = this.validatePythonContent(content);
            monaco.editor.setModelMarkers(model, "python", diagnostics);
        });
    }
    validatePythonContent(content) {
        const errors = [];
        const lines = content.split("\n");

        let openParensTotal = 0;
        let openBracketsTotal = 0;
        let openBracesTotal = 0;
        let inMultilineString = false;
        let stringDelimiter = '';
        
        lines.forEach((line, index) => {
            if (line.trim() === '' || line.trim().startsWith('#')) {
                return;
            }
            
            // Gestion des chaînes multilignes
            if (!inMultilineString) {
                if ((line.includes('"""') && (line.match(/"""/g) || []).length % 2 !== 0) ||
                    (line.includes("'''") && (line.match(/'''/g) || []).length % 2 !== 0)) {
                    inMultilineString = true;
                    stringDelimiter = line.includes('"""') ? '"""' : "'''";
                    return;
                }
            } else {
                if (line.includes(stringDelimiter)) {
                    inMultilineString = false;
                }
                return;
            }
            
            if (inMultilineString) {
                return;
            }
            
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            const openBrackets = (line.match(/\[/g) || []).length;
            const closeBrackets = (line.match(/\]/g) || []).length;
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            
            openParensTotal += openParens - closeParens;
            openBracketsTotal += openBrackets - closeBrackets;
            openBracesTotal += openBraces - closeBraces;

            if (Math.abs(openParens - closeParens) > 2) {
                errors.push({
                    severity: monaco.MarkerSeverity.Warning, // Réduire à Warning au lieu de Error
                    message: "Possible déséquilibre de parenthèses",
                    startLineNumber: index + 1,
                    endLineNumber: index + 1,
                    startColumn: 1,
                    endColumn: line.length + 1
                });
            }
            
            if (Math.abs(openBrackets - closeBrackets) > 2) {
                errors.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: "Possible déséquilibre de crochets",
                    startLineNumber: index + 1,
                    endLineNumber: index + 1,
                    startColumn: 1,
                    endColumn: line.length + 1
                });
            }
            
            if (Math.abs(openBraces - closeBraces) > 2) {
                errors.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: "Possible déséquilibre d'accolades",
                    startLineNumber: index + 1,
                    endLineNumber: index + 1,
                    startColumn: 1,
                    endColumn: line.length + 1
                });
            }
            
            // Vérifier l'indentation de manière moins stricte
            if (line.length > 0 && line.trim().length > 0) {
                const leadingSpaces = line.match(/^[ ]*/)[0].length;
                if (leadingSpaces % 4 !== 0 && leadingSpaces > 0) {
                    // Ne signaler que si l'indentation est vraiment problématique
                    if (leadingSpaces % 2 !== 0) {
                        errors.push({
                            severity: monaco.MarkerSeverity.Hint, // Réduire à Hint au lieu de Warning
                            message: "L'indentation pourrait être améliorée avec le formatage",
                            startLineNumber: index + 1,
                            endLineNumber: index + 1,
                            startColumn: 1,
                            endColumn: leadingSpaces + 1
                        });
                    }
                }
            }
        });
        
        // Vérifier l'équilibre global des parenthèses, crochets et accolades
        if (openParensTotal !== 0 || openBracketsTotal !== 0 || openBracesTotal !== 0) {
            errors.push({
                severity: monaco.MarkerSeverity.Error,
                message: "Déséquilibre global des parenthèses, crochets ou accolades dans le fichier",
                startLineNumber: 1,
                endLineNumber: 1,
                startColumn: 1,
                endColumn: 2
            });
        }
        
        return errors;
    }

    setupContextMenu() {
        // Ajouter des éléments de menu contextuel pour le formatage
        this.editor.addAction({
            id: 'format-python-code',
            label: 'Formater le code Python',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F],
            contextMenuGroupId: 'modification',
            contextMenuOrder: 1.5,
            run: () => this.formatPythonCode()
        });

        // Raccourci clavier pour sauvegarder
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
            // Formatage du code
            this.formatPythonCode();
            // Déclencher un événement de sauvegarde
            document.dispatchEvent(new CustomEvent('saveCurrentFile'));
        });

        // Raccourci pour rechercher et remplacer
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F, () => {
            // Rechercher et remplacer
            this.editor.trigger('', 'editor.action.startFindReplaceAction', '');
        });
    }

    formatPythonCode() {
        console.log("Formatage du code Python...");
        try {
            const content = this.editor.getValue();
            
            // Utiliser le serveur Flask pour formater le code Python avec black
            fetch('/format_python', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: content
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Code formaté avec succès par le serveur");
                    
                    // Sauvegarder la position du curseur
                    const position = this.editor.getPosition();
                    
                    // Mettre à jour le contenu
                    this.editor.setValue(data.formatted_code);
                    
                    // Restaurer la position du curseur si possible
                    if (position) {
                        this.editor.setPosition(position);
                    }
                    
                    // Afficher un message de succès
                    this.showSuccessMessage('Code formaté avec succès');
                } else {
                    console.error("Erreur lors du formatage:", data.error);
                    this.showErrorMessage('Erreur de formatage: ' + data.error);
                }
            })
            .catch(error => {
                console.error("Erreur lors de la communication avec le serveur:", error);
                
                // Fallback au formateur local en cas d'échec
                const formattedContent = this.applyBasicFormatting(content);
                this.editor.setValue(formattedContent);
                this.showWarningMessage('Formatage basique appliqué (serveur non disponible)');
            });
            
            return true;
        } catch (error) {
            console.error("Erreur lors du formatage:", error);
            return false;
        }
    }
    
    showSuccessMessage(message) {
        this.showMessage(message, 'rgba(0, 128, 0, 0.8)');
    }
    
    showErrorMessage(message) {
        this.showMessage(message, 'rgba(255, 0, 0, 0.8)');
    }
    
    showWarningMessage(message) {
        this.showMessage(message, 'rgba(255, 165, 0, 0.8)');
    }
    
    showMessage(message, backgroundColor) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'format-message';
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
    
    // Formateur basique pour le fallback
    applyBasicFormatting(content) {
        let formatted = content.replace(/\t/g, '    ');

        if (!formatted.endsWith('\n')) {
            formatted += '\n';
        }
        
        return formatted;
    }

    updateContent() {
        this.currentContent = this.editor.getValue();
        
        // Vérifier les marqueurs d'erreur Monaco au lieu d'utiliser getValidation
        const model = this.editor.getModel();
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const isValid = markers.length === 0;
        
        const event = new CustomEvent('monacoContentChanged', {
            detail: {
                content: this.currentContent,
                isValid: isValid
            }
        });
        document.dispatchEvent(event);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.monacoHandler = new MonacoEditorHandler();
});
