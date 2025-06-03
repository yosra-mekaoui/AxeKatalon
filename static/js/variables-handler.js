class VariablesHandler {
    constructor() {
        this.variablesCache = new Map();
        this.currentXmlFile = null;
        this.monacoEditor = null;
        this.variableTypes = ['String', 'Number', 'Boolean', 'List', 'Map'];

        setTimeout(() => {
            this.initEventListeners();
        }, 100);
    }
    initEventListeners() {
        const viewTabs = document.querySelectorAll('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                console.log("Clic sur l'onglet:", view);
                
                if (view === 'variables') {
                    console.log("Affichage de la vue variables (table)");
                    this.showVariablesTable();
                } else if (view === 'variables-script') {
                    console.log("Affichage de la vue variables (script)");
                    this.showVariablesScript();
                }
            });
        });

        document.addEventListener('fileLoaded', (event) => {
            const { filePath } = event.detail;
            console.log("Fichier chargé:", filePath);
            
            if (filePath.endsWith('.py')) {
                console.log("Fichier Python détecté, recherche du fichier XML correspondant");
                this.findAndLoadXmlFile(filePath);
            }
        });
    }
    async findAndLoadXmlFile(pythonFilePath) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Recherche du fichier XML pour:", pythonFilePath);
                
                const xmlFilePath = pythonFilePath.substring(0, pythonFilePath.lastIndexOf('.py')) + '_variables.xml';
                this.currentXmlFile = xmlFilePath;
                
                const checkResponse = await fetch('/check_file_exists', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: xmlFilePath,
                        project_path: window.currentProjectPath || ''
                    })
                });
                
                const checkData = await checkResponse.json();
                
                if (!checkData.exists && this.variablesCache.has(xmlFilePath)) {
                    console.log("Le fichier XML a été supprimé, suppression du cache:", xmlFilePath);
                    this.variablesCache.delete(xmlFilePath);
                }
                
                if (this.variablesCache.has(xmlFilePath)) {
                    console.log("Variables chargées depuis le cache pour:", xmlFilePath);
                    resolve(this.variablesCache.get(xmlFilePath));
                    return;
                }
                
                const response = await fetch('/open_file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: xmlFilePath,
                        project_path: window.currentProjectPath || ''
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    console.log("Fichier XML trouvé et chargé:", xmlFilePath);
                    const variables = this.parseXmlVariables(data.content);
                    
                    const cacheEntry = {
                        content: data.content,
                        variables: variables
                    };
                    
                    this.variablesCache.set(xmlFilePath, cacheEntry);
                    console.log("Variables chargées pour:", xmlFilePath, variables);
                    
                    resolve(cacheEntry);
                } else {
                    console.log("Fichier XML non trouvé, création d'un nouveau fichier:", xmlFilePath);
                    const emptyXmlContent = this.createEmptyXmlStructure();
                    
                    const cacheEntry = {
                        content: emptyXmlContent,
                        variables: []
                    };
                    
                    this.variablesCache.set(xmlFilePath, cacheEntry);
                    
                    try {
                        await this.saveXmlFile(xmlFilePath, emptyXmlContent);
                        console.log("Nouveau fichier XML créé avec succès:", xmlFilePath);
                        resolve(cacheEntry);
                    } catch (saveError) {
                        console.error("Erreur lors de la création du fichier XML:", saveError);
                        // Même en cas d'erreur de sauvegarde, on résout avec le cache
                        resolve(cacheEntry);
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement du fichier XML:", error);
                const emptyXmlContent = this.createEmptyXmlStructure();
                const cacheEntry = {
                    content: emptyXmlContent,
                    variables: []
                };
                this.variablesCache.set(this.currentXmlFile, cacheEntry);
                resolve(cacheEntry);
            }
        });
    }
    parseXmlVariables(xmlContent) {
        console.log("Analyse du contenu XML:", xmlContent);
        const variables = [];
        
        try {
            xmlContent = xmlContent.replace(/^\uFEFF/, ''); // Supprimer le BOM si présent
            
            if (!xmlContent.trim().startsWith('<?xml')) {
                console.warn("Le contenu XML ne commence pas par une déclaration XML. Ajout de la déclaration.");
                xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlContent.trim();
            }
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                console.error("Erreur lors de l'analyse du XML:", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
                
                if (xmlContent.includes('<Variable>') && xmlContent.includes('</Variable>')) {
                    console.warn("Tentative de récupération manuelle des variables...");
                    
                    const variableRegex = /<Variable>[\s\S]*?<n>(.*?)<\/n>[\s\S]*?<value>(.*?)<\/value>[\s\S]*?<\/Variable>/g;
                    let match;
                    
                    while ((match = variableRegex.exec(xmlContent)) !== null) {
                        const name = match[1].trim();
                        const value = match[2].trim();
                        
                        variables.push({
                            name,
                            type: "String",
                            defaultValue: value,
                            description: "",
                            masked: false
                        });
                    }
                    
                    console.log("Variables récupérées manuellement:", variables);
                    return variables;
                }
                
                return [];
            }
            
            const variableElements = xmlDoc.getElementsByTagName("variable");
            const alternativeVariableElements = xmlDoc.getElementsByTagName("Variable");
            
            if (variableElements.length > 0) {
                console.log("Format XML détecté: attributs");
                
                for (let i = 0; i < variableElements.length; i++) {
                    const element = variableElements[i];
                    
                    const name = element.getAttribute("name") || "";
                    const type = element.getAttribute("type") || "String";
                    const defaultValue = element.textContent || "";
                    const description = element.getAttribute("description") || "";
                    const masked = element.getAttribute("masked") === "true";
                    
                    variables.push({
                        name,
                        type,
                        defaultValue,
                        description,
                        masked
                    });
                }
            }
            else if (alternativeVariableElements.length > 0) {
                console.log("Format XML détecté: balises name/value");
                
                for (let i = 0; i < alternativeVariableElements.length; i++) {
                    const element = alternativeVariableElements[i];
                    
                    const nameElements = element.getElementsByTagName("name").length > 0
                        ? element.getElementsByTagName("name") 
                        : element.getElementsByTagName("n");
                    const valueElements = element.getElementsByTagName("value");
                    
                    if (nameElements.length > 0 && valueElements.length > 0) {
                        const name = nameElements[0].textContent || "";
                        const defaultValue = valueElements[0].textContent || "";
                        
                        let type = "String";
                        if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
                            type = "String";
                        } else if (!isNaN(defaultValue)) {
                            type = "Number";
                        } else if (defaultValue === "TRUE" || defaultValue === "FALSE") {
                            type = "Boolean";
                        }
                        
                        variables.push({
                            name,
                            type,
                            defaultValue,
                            description: "",
                            masked: false
                        });
                    }
                }
            }
            
            console.log("Variables extraites:", variables);
            return variables;
        } catch (error) {
            console.error("Erreur lors de l'analyse du XML:", error);
            return [];
        }
    }

    createEmptyXmlStructure() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<TestCaseVariables>
</TestCaseVariables>`;
    }

    async saveXmlFile(xmlFilePath, content) {
        try {
            const response = await fetch('/save_file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: xmlFilePath,
                    content: content,
                    project_path: window.currentProjectPath || ''
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log("Fichier XML sauvegardé avec succès:", xmlFilePath);
            } else {
                console.error("Erreur lors de la sauvegarde du fichier XML:", data.message);
            }
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du fichier XML:", error);
        }
    }


    generateXmlContent(variables) {
        return this.convertVariablesToXml(variables);
    }


    escapeXml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    escapeXmlPreserveQuotes(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }


    showVariablesTable() {
        console.log("showVariablesTable appelé");
        console.log("currentXmlFile:", this.currentXmlFile);
        console.log("window.currentFile:", window.currentFile);
        
        if (!window.currentFile || !window.currentFile.path) {
            console.log("Aucun fichier sélectionné");
            const contentArea = document.querySelector('.test-content');
            contentArea.innerHTML = `
                <div class="variables-container">
                    <div class="message-box">
                        <p>Veuillez sélectionner un fichier Python pour afficher ses variables.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        if (!window.currentFile.path.endsWith('.py')) {
            console.log("Le fichier sélectionné n'est pas un fichier Python");
            const contentArea = document.querySelector('.test-content');
            contentArea.innerHTML = `
                <div class="variables-container">
                    <div class="message-box">
                        <p>Les variables ne sont disponibles que pour les fichiers Python.</p>
                        <p>Fichier actuel: ${window.currentFile.path}</p>
                    </div>
                </div>
            `;
            return;
        }

        if (!this.currentXmlFile) {
            console.log("Aucun fichier XML chargé, tentative de chargement");
            const xmlFilePath = window.currentFile.path.substring(0, window.currentFile.path.lastIndexOf('.py')) + '_variables.xml';
            this.currentXmlFile = xmlFilePath;
            
            if (!this.variablesCache.has(xmlFilePath)) {
                console.log("Fichier XML non trouvé dans le cache, chargement asynchrone");
                this.displayEmptyVariablesTable();
                
                this.findAndLoadXmlFile(window.currentFile.path).then(() => {
                    console.log("Fichier XML chargé, mise à jour de l'affichage");
                    this.showVariablesTable();
                });
                return;
            }
        }
        
        if (this.variablesCache.has(this.currentXmlFile)) {
            const { variables } = this.variablesCache.get(this.currentXmlFile);
            console.log("Variables trouvées dans le cache:", variables);
            
            const contentArea = document.querySelector('.test-content');
            let tableHTML = `
                <div class="variables-container">
                    <div class="variables-toolbar">
                        <button class="action-btnxml add-variable"><i class="fas fa-plus"></i> Add Variable</button>
                        <button class="action-btnxml delete-variable"><i class="fas fa-trash"></i> Delete Variable</button>
                        <button class="action-btnxml save-variables"><i class="fas fa-save"></i> Save Variables</button>
                    </div>
                    <table class="variables-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Default Value</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            variables.forEach((variable, index) => {
                tableHTML += `
                    <tr data-index="${index}">
                        <td>${index + 1}</td>
                        <td><input type="text" class="variable-name" value="${this.escapeHtml(variable.name)}" /></td>
                        <td>
  <textarea class="variable-value">${this.escapeHtml(variable.defaultValue)}</textarea>
</td>
                        <td><input type="text" class="variable-description" value="${this.escapeHtml(variable.description)}" /></td>
                    </tr>
                `;
            });
            
            if (variables.length === 0) {
                tableHTML += `
                    <tr>
                        <td colspan="4" class="empty-variables">No variables defined. Click "Add Variable" to create one.</td>
                    </tr>
                `;
            }
            
            tableHTML += `
                        </tbody>
                    </table>
                </div>
            `;
            
            contentArea.innerHTML = tableHTML;
            
            this.addVariablesTableEventListeners();
        } else {
            console.log("Aucune variable trouvée dans le cache pour:", this.currentXmlFile);
            this.displayEmptyVariablesTable();
        }
    }
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    displayEmptyVariablesTable() {
        const contentArea = document.querySelector('.test-content');
        
        const tableHTML = `
            <div class="variables-container">
                <div class="variables-toolbar">
                    <button class="action-btnxml add-variable"><i class="fas fa-plus"></i> Add Variable</button>
                    <button class="action-btnxml delete-variable disabled"><i class="fas fa-trash"></i> Delete Variable</button>
                    <button class="action-btnxml save-variables"><i class="fas fa-save"></i> Save Variables</button>
                </div>
                <table class="variables-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Default Value</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" class="empty-variables">No variables defined. Click "Add Variable" to create one.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        contentArea.innerHTML = tableHTML;
        
        this.addVariablesTableEventListeners();
    }
    addVariablesTableEventListeners() {
        const addBtn = document.querySelector('.add-variable');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewVariable());
        }
        
        const deleteBtn = document.querySelector('.delete-variable');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelectedVariable());
        }
        
        const saveBtn = document.querySelector('.save-variables');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveVariablesFromTable());
        }
        
        const rows = document.querySelectorAll('.variables-table tbody tr');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                rows.forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
                
                const deleteBtn = document.querySelector('.delete-variable');
                if (deleteBtn) {
                    deleteBtn.classList.remove('disabled');
                }
            });
        });
        
        const inputs = document.querySelectorAll('.variable-name, .variable-value, .variable-description');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.updateVariablesFromTable());
        });
    }

    addNewVariable() {
        if (!this.currentXmlFile) {
            console.error("Aucun fichier XML actif");
            return;
        }
        
        const cacheEntry = this.variablesCache.get(this.currentXmlFile);
        if (!cacheEntry) {
            console.error("Aucune entrée de cache pour le fichier XML actif");
            return;
        }
        
        const variables = cacheEntry.variables;
        
        variables.push({
            name: 'newVariable',
            type: 'String',
            defaultValue: '',
            description: '',
            masked: false
        });
        
        cacheEntry.content = this.generateXmlContent(variables);
        this.variablesCache.set(this.currentXmlFile, cacheEntry);
        this.saveXmlFile(this.currentXmlFile, cacheEntry.content);
        this.showVariablesTable();
    }

    deleteSelectedVariable() {
        if (!this.currentXmlFile) {
            console.error("Aucun fichier XML actif");
            return;
        }
        const selectedRow = document.querySelector('.variables-table tbody tr.selected');
        if (!selectedRow) {
            console.log("Aucune variable sélectionnée");
            return;
        }
        const index = parseInt(selectedRow.getAttribute('data-index'));
        const cacheEntry = this.variablesCache.get(this.currentXmlFile);
        if (!cacheEntry) {
            console.error("Aucune entrée de cache pour le fichier XML actif");
            return;
        }
        const variables = cacheEntry.variables;
        
        if (index >= 0 && index < variables.length) {
            variables.splice(index, 1);
            
            cacheEntry.content = this.generateXmlContent(variables);
            this.variablesCache.set(this.currentXmlFile, cacheEntry);
            this.saveXmlFile(this.currentXmlFile, cacheEntry.content);
            this.showVariablesTable();
        }
    }

    updateVariablesFromTable() {
        if (!this.currentXmlFile) {
            console.error("Aucun fichier XML actif");
            return;
        }
        
        const cacheEntry = this.variablesCache.get(this.currentXmlFile);
        if (!cacheEntry) {
            console.error("Aucune entrée de cache pour le fichier XML actif");
            return;
        }
        
        const variables = [];
        
        const rows = document.querySelectorAll('.variables-table tbody tr');
        rows.forEach(row => {
            if (row.querySelector('.empty-variables')) {
                return;
            }
            const nameInput = row.querySelector('.variable-name');
            const valueInput = row.querySelector('.variable-value');
            const descriptionInput = row.querySelector('.variable-description');
            if (nameInput && valueInput && descriptionInput) {
                variables.push({
                    name: nameInput.value,
                    type: 'String',
                    defaultValue: valueInput.value,
                    description: descriptionInput.value,
                    masked: false
                });
            }
        });
        cacheEntry.variables = variables;
        cacheEntry.content = this.generateXmlContent(variables);
        this.variablesCache.set(this.currentXmlFile, cacheEntry);
    }
    saveVariablesFromTable() {
        if (!this.currentXmlFile) {
            console.error("Aucun fichier XML actif");
            return;
        }
        this.updateVariablesFromTable();
        const cacheEntry = this.variablesCache.get(this.currentXmlFile);
        if (!cacheEntry) {
            console.error("Aucune entrée de cache pour le fichier XML actif");
            return;
        }
        this.saveXmlFile(this.currentXmlFile, cacheEntry.content);
        alert("Variables sauvegardées avec succès");
    }

    showVariablesScript() {
        if (!this.currentXmlFile || !this.variablesCache.has(this.currentXmlFile)) {
            console.log("Aucun fichier XML chargé ou variables non disponibles");
            this.displayEmptyVariablesScript();
            return;
        }
        
        const { content } = this.variablesCache.get(this.currentXmlFile);
        
        const contentArea = document.querySelector('.test-content');
        
        contentArea.innerHTML = `
            <div class="variables-script-container">

                <textarea id="xmlContent" style="display: none;">${content || ''}</textarea>
                <div id="monaco-xml-editor-container" style="width: 100%; height: 500px;"></div>
            </div>
        `;
        
        this.initMonacoXmlEditor(content);
        
        this.addVariablesScriptEventListeners();
    }

    addVariablesScriptEventListeners() {
        const saveBtn = document.querySelector('.save-xml-script');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Récupérer le contenu de l'éditeur
                const editor = monaco.editor.getModels()[0];
                if (editor) {
                    const xmlContent = editor.getValue();
                    this.updateXmlContent(xmlContent);
                    alert("XML sauvegardé avec succès");
                }
            });
        }
        
        const convertBtn = document.querySelector('.convert-to-table');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                const editor = monaco.editor.getModels()[0];
                if (editor) {
                    const xmlContent = editor.getValue();
                    this.updateXmlContent(xmlContent);
                    const variablesTab = document.querySelector('.view-tab[data-view="variables"]');
                    if (variablesTab) {
                        variablesTab.click();
                    }
                }
            });
        }
    }
    displayEmptyVariablesScript() {
        const contentArea = document.querySelector('.test-content');
        contentArea.innerHTML = `
            <div class="variables-script-container">
                <textarea id="xmlContent" style="display: none;"></textarea>
                <div id="monaco-xml-editor-container" style="width: 100%; height: 500px;"></div>
            </div>
        `;
        this.initMonacoXmlEditor(this.createEmptyXmlStructure());

        this.addVariablesScriptEventListeners();
    }
    initMonacoXmlEditor(content) {
        if (typeof monaco === 'undefined') {
            console.error("Monaco Editor n'est pas disponible");
            return;
        }
        
        const editor = monaco.editor.create(document.getElementById('monaco-xml-editor-container'), {
            value: content,
            language: 'xml',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            contextmenu: true, // Activer le menu contextuel
            formatOnPaste: true,
            formatOnType: false
        });
        
        editor.addAction({
            id: 'format-xml',
            label: 'Formater le XML',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F],
            contextMenuGroupId: 'modification',
            contextMenuOrder: 1.5,
            run: () => this.formatXmlContent(editor)
        });
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
            this.formatXmlContent(editor);
            const newContent = editor.getValue();
            this.updateXmlContent(newContent);
        });
        editor.onDidChangeModelContent(debounce(() => {
            const newContent = editor.getValue();
            this.updateXmlContent(newContent);
        }, 500));
        this.monacoEditor = editor;
    }
    formatXmlContent(editor) {
        console.log("Formatage du contenu XML...");
        try {
            const content = editor.getValue();
            fetch('/format_xml', {
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
                    console.log("XML formaté avec succès par le serveur");
                    const position = editor.getPosition();
                    editor.setValue(data.formatted_code);
                    
                    if (position) {
                        editor.setPosition(position);
                    }
                    
                    this.showMessage('XML formaté avec succès', 'success');
                } else {
                    console.error("Erreur lors du formatage XML:", data.error);
                    this.showMessage('Erreur de formatage: ' + data.error, 'error');
                }
            })
            .catch(error => {
                console.error("Erreur lors de la communication avec le serveur:", error);
                this.showMessage('Erreur de communication avec le serveur', 'error');
            });
            
            return true;
        } catch (error) {
            console.error("Erreur lors du formatage XML:", error);
            this.showMessage('Erreur lors du formatage', 'error');
            return false;
        }
    }
    showMessage(message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `format-message ${type}`;
        messageContainer.textContent = message;
        messageContainer.style.position = 'absolute';
        messageContainer.style.top = '10px';
        messageContainer.style.right = '10px';
        messageContainer.style.backgroundColor = type === 'success' ? 'rgba(0, 128, 0, 0.8)' : 
                                               type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 
                                               'rgba(255, 165, 0, 0.8)';
        messageContainer.style.color = 'white';
        messageContainer.style.padding = '8px 12px';
        messageContainer.style.borderRadius = '4px';
        messageContainer.style.zIndex = '1000';
        messageContainer.style.transition = 'opacity 0.5s ease-in-out';
        document.body.appendChild(messageContainer);
        
        setTimeout(() => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageContainer);
            }, 500);
        }, 3000);
    }
    updateXmlContent(newContent) {
        if (!this.currentXmlFile) {
            console.error("Aucun fichier XML actif");
            return;
        }
        
        try {
            if (!newContent.trim().startsWith('<?xml')) {
                console.warn("Le contenu XML ne commence pas par une déclaration XML. Ajout de la déclaration.");
                newContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + newContent.trim();
            }
            
            newContent = newContent.replace(/^\uFEFF/, ''); // Supprimer le BOM si présent
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(newContent, "text/xml");
            
            const parseError = xmlDoc.getElementsByTagName('parsererror');
            if (parseError.length > 0) {
                console.error("Erreur de validation XML:", parseError[0].textContent);
                if (newContent.includes('<TestCaseVariables>') && newContent.includes('</TestCaseVariables>')) {
                    console.warn("Le XML semble avoir une structure correcte malgré l'erreur. Tentative de sauvegarde.");
                    this.variablesCache.set(this.currentXmlFile, {
                        content: newContent,
                        variables: this.parseXmlVariables(newContent) || []
                    });
                    this.saveXmlFile(this.currentXmlFile, newContent);
                }
                return;
            }
            const variables = this.parseXmlVariables(newContent);
            this.variablesCache.set(this.currentXmlFile, {
                content: newContent,
                variables: variables
            });
            this.saveXmlFile(this.currentXmlFile, newContent);
        } catch (error) {
            console.error("Erreur lors de la mise à jour du contenu XML:", error);
        }
    }
    convertVariablesToXml(variables) {
        console.log("Conversion des variables en XML:", variables);
        
        let xmlContent = `<?xml version='1.0' encoding='utf-8'?>\n<TestCaseVariables>\n`;
        
        variables.forEach(variable => {
            xmlContent += `<Variable>\n`;
            xmlContent += `<name>${this.escapeXml(variable.name)}</name>\n`;
            
            let formattedValue = variable.defaultValue;

            xmlContent += `<value>${this.escapeXmlPreserveQuotes(formattedValue)}</value>\n`;
            xmlContent += `</Variable>\n`;
        });
        
        xmlContent += `</TestCaseVariables>`;
        
        return xmlContent;
    }
    clearCache() {
        console.log("Vidage du cache des variables");
        this.variablesCache.clear();
        this.currentXmlFile = null;
    }
    async createDefaultXmlForTestCase(parent, xmlName) {
        // parent = chemin relatif du dossier, xmlName = nom du fichier xml
        const xmlPath = (parent ? parent + '/' : '') + xmlName;
        const emptyXmlContent = this.createEmptyXmlStructure();
        try {
            await this.saveXmlFile(xmlPath, emptyXmlContent);
            return true;
        } catch (e) {
            throw new Error(e.message || e);
        }
    }
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
document.addEventListener('DOMContentLoaded', () => {
    window.variablesHandler = new VariablesHandler();
});
