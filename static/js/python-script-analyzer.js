/**
 * PythonScriptAnalyzer - Classe avancée pour analyser les scripts Python/Katalon
 * 
 * Cette classe est conçue pour extraire les actions et leurs sous-actions à partir
 * d'un script Python/Katalon, en suivant les règles spécifiques de classification.
 */
class PythonScriptAnalyzer {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.imports = [];
        this.variables = {};
        this.actions = [];
        this.lastImportLine = -1;
        this.blockStack = [];
        this.currentIndentLevel = 0;
        this.indentationMap = new Map(); // Map pour stocker l'indentation de chaque ligne
        this.actionHierarchy = []; // Structure hiérarchique des actions
        this.debug = false;
    }
    
    log(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }
    
    analyze(scriptContent) {
        this.reset();
        const lines = scriptContent.split('\n');
        
        // Prétraiter les instructions multi-lignes
        const processedLines = this.preprocessMultilineStatements(lines);
        
        // Analyser l'indentation de chaque ligne
        this.analyzeIndentation(processedLines);
        
        // Première passe : collecter les imports et les variables
        this.collectImportsAndVariables(processedLines);
        
        // Deuxième passe : analyser les actions
        this.parseActions(processedLines);
        
        // Construire la hiérarchie des actions
        this.buildActionHierarchy();
        
        return this.actionHierarchy;
    }
    
    /**
     * Analyse l'indentation de chaque ligne pour déterminer la structure hiérarchique
     */
    analyzeIndentation(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim() || line.trim().startsWith('#')) continue;
            
            const indentLevel = this.getIndentLevel(line);
            this.indentationMap.set(i, indentLevel);
        }
    }
    
    /**
     * Calcule le niveau d'indentation d'une ligne
     */
    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        if (match) {
            // Compter les espaces ou les tabulations
            const indent = match[1];
            // Supposer qu'une tabulation = 4 espaces
            return indent.replace(/\t/g, '    ').length;
        }
        return 0;
    }
    
    /**
     * Construit la hiérarchie des actions en fonction de l'indentation
     */
    buildActionHierarchy() {
        if (this.actions.length === 0) return [];
        
        this.actionHierarchy = [];
        const stack = []; // Pile pour suivre les blocs de contrôle actifs
        
        // Trier les actions par numéro de ligne pour s'assurer qu'elles sont dans le bon ordre
        this.actions.sort((a, b) => a.lineNumber - b.lineNumber);
        
        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            const currentIndent = action.indentLevel;
            
            // Vérifier si nous devons sortir de blocs en fonction de l'indentation
            while (stack.length > 0 && currentIndent <= stack[stack.length - 1].indentLevel) {
                stack.pop();
            }
            
            // Préparer l'action pour les sous-actions si c'est un bloc de contrôle
            if (action.actionType === 'Condition' || action.actionType === 'Loop' || action.actionType === 'Exception handling') {
                action.subActions = [];
            }
            
            // Ajouter l'action à la hiérarchie appropriée
            if (stack.length === 0) {
                // Ajouter à la racine si aucun bloc parent n'est actif
                this.actionHierarchy.push(action);
            } else {
                // Sinon, ajouter comme sous-action du bloc parent actif
                const parent = stack[stack.length - 1];
                parent.subActions.push(action);
            }
            
            // Si c'est un bloc de contrôle, l'ajouter à la pile pour les futures sous-actions
            if (action.actionType === 'Condition' || action.actionType === 'Loop' || action.actionType === 'Exception handling') {
                stack.push(action);
            }
        }
        
        return this.actionHierarchy;
    }

    /**
     * Prétraite le contenu du script pour combiner les instructions multi-lignes
     * @param {string[]} lines - Les lignes du script
     * @return {string[]} - Les lignes recombinées
     */
    preprocessMultilineStatements(lines) {
        const processedLines = [];
        let currentStatement = '';
        let openParentheses = 0;
        let inMultilineString = false;
        let multilineStringDelimiter = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Ignorer les lignes vides et les commentaires
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                if (currentStatement === '') {
                    processedLines.push(line);
                }
                continue;
            }
            
            // Si nous ne sommes pas déjà dans une instruction multi-ligne, vérifier si cette ligne commence une
            if (currentStatement === '') {
                // Vérifier si la ligne contient des parenthèses ouvrantes
                for (let j = 0; j < trimmedLine.length; j++) {
                    const char = trimmedLine[j];
                    if (char === '(' && !inMultilineString) {
                        openParentheses++;
                    } else if (char === ')' && !inMultilineString) {
                        openParentheses--;
                    } else if ((char === '"' || char === "'") && (j === 0 || trimmedLine[j-1] !== '\\')) {
                        if (!inMultilineString) {
                            inMultilineString = true;
                            multilineStringDelimiter = char;
                        } else if (char === multilineStringDelimiter) {
                            inMultilineString = false;
                        }
                    }
                }
                
                // Si la ligne est complète (toutes les parenthèses sont fermées), l'ajouter directement
                if (openParentheses === 0 && !inMultilineString) {
                    processedLines.push(line);
                } else {
                    // Sinon, commencer une instruction multi-ligne
                    currentStatement = line;
                }
            } else {
                // Continuer l'instruction multi-ligne
                // Analyser les parenthèses et les chaînes de caractères
                for (let j = 0; j < trimmedLine.length; j++) {
                    const char = trimmedLine[j];
                    if (char === '(' && !inMultilineString) {
                        openParentheses++;
                    } else if (char === ')' && !inMultilineString) {
                        openParentheses--;
                    } else if ((char === '"' || char === "'") && (j === 0 || trimmedLine[j-1] !== '\\')) {
                        if (!inMultilineString) {
                            inMultilineString = true;
                            multilineStringDelimiter = char;
                        } else if (char === multilineStringDelimiter) {
                            inMultilineString = false;
                        }
                    }
                }
                
                // Ajouter cette ligne à l'instruction en cours
                currentStatement += ' ' + trimmedLine;
                
                // Si toutes les parenthèses sont fermées, l'instruction est complète
                if (openParentheses === 0 && !inMultilineString) {
                    processedLines.push(currentStatement);
                    currentStatement = '';
                    inMultilineString = false;
                }
            }
        }
        
        // Si une instruction multi-ligne n'est pas terminée à la fin du fichier, l'ajouter quand même
        if (currentStatement !== '') {
            processedLines.push(currentStatement);
        }
        
        return processedLines;
    }

    /**
     * Collecte les imports et les variables du script
     */
    collectImportsAndVariables(lines) {
        this.lastImportLine = -1; // Initialiser la dernière ligne d'import
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Ignorer les lignes vides et les commentaires
            if (!line || line.startsWith('#')) {
                continue;
            }
            
            // Collecter les imports directs
            if (line.startsWith('import ') || line.startsWith('from ')) {
                this.imports.push({
                    line: i,
                    content: line,
                    type: 'direct_import'
                });
                this.lastImportLine = Math.max(this.lastImportLine, i);
                continue;
            }
            
            // Collecter les assignations liées aux imports (comme findTestObject = ObjectRepository.findTestObject)
            const importAssignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.[a-zA-Z_][a-zA-Z0-9_]*$/);
            if (importAssignmentMatch) {
                const variableName = importAssignmentMatch[1];
                const moduleName = importAssignmentMatch[2];
                
                // Vérifier si le module a été importé précédemment
                const isModuleImported = this.imports.some(imp => 
                    imp.content.includes(` ${moduleName}`) || 
                    imp.content.includes(`.${moduleName}`) ||
                    imp.content === `import ${moduleName}`
                );
                
                if (isModuleImported) {
                    this.imports.push({
                        line: i,
                        content: line,
                        type: 'import_assignment'
                    });
                    this.lastImportLine = Math.max(this.lastImportLine, i);
                    
                    // Ajouter aussi comme variable
                    this.variables[variableName] = {
                        line: i,
                        value: line.split('=')[1].trim(),
                        isImportRelated: true
                    };
                    continue;
                }
            }
            
            // Collecter les assignations de chemins de fichiers (comme file_path = ProjPath + "...")
            const pathAssignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*.+[\\\/"].+$/);
            if (pathAssignmentMatch && (line.includes('\\') || line.includes('/') || line.includes('"') || line.includes("'"))) {
                const variableName = pathAssignmentMatch[1];
                this.variables[variableName] = {
                    line: i,
                    value: line.split('=')[1].trim(),
                    isPathVariable: true
                };
                
                // Si cette assignation est proche des imports, considérer comme une initialisation liée aux imports
                if (i <= this.lastImportLine + 5) { // 5 lignes de marge après le dernier import
                    this.imports.push({
                        line: i,
                        content: line,
                        type: 'path_initialization'
                    });
                    this.lastImportLine = Math.max(this.lastImportLine, i);
                }
                continue;
            }
            
            // Collecter les autres assignations de variables
            const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
            if (assignmentMatch) {
                const variableName = assignmentMatch[1];
                const value = assignmentMatch[2];
                this.variables[variableName] = {
                    line: i,
                    value: value,
                    isImportRelated: false,
                    isPathVariable: false
                };
            }
        }
        
        // Ajouter quelques lignes de marge après le dernier import pour les initialisations
        if (this.lastImportLine >= 0) {
            this.lastImportLine += 3; // 3 lignes de marge supplémentaires
        }
        
        this.log('Imports collectés:', this.imports);
        this.log('Variables collectées:', this.variables);
        this.log('Dernière ligne d\'import ou d\'initialisation:', this.lastImportLine);
    }

    /**
     * Analyse les actions dans le script
     */
    parseActions(lines) {
        // Analyser toutes les lignes du script, en filtrant les imports plutôt qu'en les utilisant comme point de départ
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Ignorer les lignes vides et les commentaires
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // Ignorer les imports et les lignes d'initialisation associées
            if (this.isImport(i) || this.isImportRelatedInitialization(trimmedLine)) {
                continue;
            }
            
            // Calculer l'indentation de la ligne courante
            const currentIndent = this.getIndentLevel(line);
            
            // Analyser la ligne et créer l'action correspondante
            const action = this.parseLine(trimmedLine, i, lines);
            
            if (action) {
                // Ajouter le niveau d'indentation à l'action
                action.indentLevel = currentIndent;
                action.lineNumber = i + 1; // Numéro de ligne (1-indexé pour l'affichage)
                action.originalLine = line; // Conserver la ligne originale pour le débogage
                
                // Ajouter l'action à la liste
                this.actions.push(action);
            }
        }
        
        this.log('Actions analysées:', this.actions);
    }

    /**
     * Vérifie si une ligne est un import déjà traité
     */
    isImport(lineIndex) {
        return this.imports.some(imp => imp.line === lineIndex);
    }
    
    /**
     * Obtient le niveau d'indentation d'une ligne
     */
    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        if (match) {
            // Compter les espaces ou les tabulations
            const indent = match[1];
            // Supposer qu'une tabulation = 4 espaces
            return indent.replace(/\t/g, '    ').length;
        }
        return 0;
    }

    /**
     * Analyse une ligne et crée l'action correspondante
     */
    parseLine(line, lineIndex, allLines) {
        // Vérifier s'il y a une description sur la ligne précédente
        let description = '';
        if (lineIndex > 0) {
            const prevLine = allLines[lineIndex - 1].trim();
            if (prevLine.startsWith('#')) {
                description = prevLine.substring(1).trim();
            }
        }
        
        // Vérifier les structures de contrôle (if, while, for, try, etc.)
        const controlStructureAction = this.parseControlStructure(line, description);
        if (controlStructureAction) {
            return controlStructureAction;
        }
        
        // Vérifier les appels WebUI
        const webUIAction = this.parseWebUICall(line, description);
        if (webUIAction) {
            return webUIAction;
        }
        
        // Vérifier les appels CustomKeywords
        const customKeywordAction = this.parseCustomKeywordCall(line, description);
        if (customKeywordAction) {
            return customKeywordAction;
        }
        
        // Vérifier les appels de méthode génériques
        const genericMethodAction = this.parseGenericMethodCall(line, description);
        if (genericMethodAction) {
            return genericMethodAction;
        }
        
        // Vérifier les affectations simples (binary statements)
        const binaryStatementAction = this.parseBinaryStatement(line, description);
        if (binaryStatementAction) {
            return binaryStatementAction;
        }
        
        // Si aucun pattern n'a été reconnu, retourner null
        return null;
    }

    /**
     * Analyse une structure de contrôle (if, while, for, try, etc.)
     */
    parseControlStructure(line, description = '') {
        // Regex pour capturer les structures de contrôle
        const ifRegex = /^\s*if\s+(.+):/;
        const elifRegex = /^\s*elif\s+(.+):/;
        const elseRegex = /^\s*else\s*:/;
        const whileRegex = /^\s*while\s+(.+):/;
        const forRegex = /^\s*for\s+(.+)\s+in\s+(.+):/;
        const tryRegex = /^\s*try\s*:/;
        const exceptRegex = /^\s*except(?:\s+([^:]+))?:/;
        const finallyRegex = /^\s*finally\s*:/;
        
        // Vérifier chaque type de structure
        let match;
        
        // If statement
        if ((match = line.match(ifRegex))) {
            const condition = match[1].trim();
            return {
                actionType: 'Condition',
                action: 'If Statement',
                input: condition,
                description: description
            };
        }
        
        // Elif statement
        if ((match = line.match(elifRegex))) {
            const condition = match[1].trim();
            return {
                actionType: 'Condition',
                action: 'Elif Statement',
                input: condition,
                description: description
            };
        }
        
        // Else statement
        if ((match = line.match(elseRegex))) {
            return {
                actionType: 'Condition',
                action: 'Else Statement',
                input: '',
                description: description
            };
        }
        
        // While loop
        if ((match = line.match(whileRegex))) {
            const condition = match[1].trim();
            return {
                actionType: 'Loop',
                action: 'While Loop Statement',
                input: condition,
                description: description
            };
        }
        
        // For loop
        if ((match = line.match(forRegex))) {
            const variable = match[1].trim();
            const iterable = match[2].trim();
            return {
                actionType: 'Loop',
                action: 'For Loop Statement',
                input: `${variable} in ${iterable}`,
                description: description
            };
        }
        
        // Try block
        if ((match = line.match(tryRegex))) {
            return {
                actionType: 'Exception handling',
                action: 'Try Statement',
                input: '',
                description: description
            };
        }
        
        // Except block
        if ((match = line.match(exceptRegex))) {
            const exceptionType = match[1] ? match[1].trim() : 'any exception';
            return {
                actionType: 'Exception handling',
                action: 'Except Statement',
                input: exceptionType,
                description: description
            };
        }
        
        // Finally block
        if ((match = line.match(finallyRegex))) {
            return {
                actionType: 'Exception handling',
                action: 'Finally Statement',
                input: '',
                description: description
            };
        }
        
        return null;
    }

    /**
     * Analyse un appel WebUI
     */
    parseWebUICall(line, description = '') {
        // Vérifier s'il y a une description sur la ligne précédente
        // let description = '';
        
        const webUIRegex = /WebUI\.([a-zA-Z0-9_]+)\s*\((.*)\)/;
        const match = line.match(webUIRegex);
        
        if (match) {
            const action = match[1];
            const paramsString = match[2];
            
            // Analyser les paramètres
            const params = this.parseParameters(paramsString);
            
            // Vérifier s'il y a une assignation simple ou multiple
            let output = '';
            
            // Cas 1: Assignation multiple (a, b) = WebUI...
            const multipleAssignmentMatch = line.match(/^\s*\(([^)]+)\)\s*=\s*WebUI\./);
            if (multipleAssignmentMatch) {
                output = multipleAssignmentMatch[1].trim();
                this.log(`Assignation multiple détectée pour WebUI: ${output}`);
            } 
            // Cas 2: Assignation simple a = WebUI...
            else {
                const singleAssignmentMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*WebUI\./);
                if (singleAssignmentMatch) {
                    output = singleAssignmentMatch[1].trim();
                    this.log(`Assignation simple détectée pour WebUI: ${output}`);
                }
            }
            
            this.log(`WebUI analysé: Action=${action}, Inputs=${params.join(', ')}, Output=${output}`);
            
            return {
                actionType: 'WebUI',
                actionItem: 'WebUI',
                action: action,
                input: params.join('\n'),  // Séparer les paramètres par des retours à la ligne pour plus de clarté
                inputs: params,            // Garder aussi les paramètres individuels
                output: output,
                description: description
            };
        }
        
        return null;
    }

    /**
     * Analyse un appel CustomKeywords
     */
    parseCustomKeywordCall(line, description = '') {
        // Nouvelle regex pour capturer correctement les CustomKeywords selon les règles demandées
        // CustomKeywords.fill.FillFieldsValues.set('Shortname', 'KAME415507')
        const customKeywordRegex = /CustomKeywords\.([^.]+)\.([^(]+)\(([^)]*)\)/;
        const match = line.match(customKeywordRegex);
        
        if (match) {
            // Extraction selon les nouvelles règles
            const firstElement = match[1];      // fill
            const restBeforeParenthesis = match[2]; // FillFieldsValues.set
            const paramsString = match[3];      // 'Shortname', 'KAME415507'
            
            // Type d'action = CustomKeywords (la classe principale)
            const actionType = 'CustomKeywords';
            
            // Action = tout ce qui vient après le premier élément jusqu'à la parenthèse (ex: FillFieldsValues.set)
            const action = restBeforeParenthesis;
            
            // Analyser les paramètres
            const params = this.parseParameters(paramsString);
            
            // Vérifier s'il y a une assignation simple ou multiple
            let output = '';
            
            // Cas 1: Assignation multiple (a, b) = CustomKeywords...
            const multipleAssignmentMatch = line.match(/^\s*\(([^)]+)\)\s*=\s*CustomKeywords\./);
            if (multipleAssignmentMatch) {
                output = multipleAssignmentMatch[1].trim();
                this.log(`Assignation multiple détectée: ${output}`);
            } 
            // Cas 2: Assignation simple a = CustomKeywords...
            else {
                const singleAssignmentMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*CustomKeywords\./);
                if (singleAssignmentMatch) {
                    output = singleAssignmentMatch[1].trim();
                    this.log(`Assignation simple détectée: ${output}`);
                }
            }
            
            this.log(`CustomKeyword analysé: ActionType=${actionType}, Action=${action}, Inputs=${params.join(', ')}, Output=${output}`);
            
            return {
                actionType: actionType,
                actionItem: `${actionType}.${firstElement}`, // CustomKeywords.fill
                action: action,                              // FillFieldsValues.set
                input: params.join('\n'),                    // Séparer les paramètres par des retours à la ligne pour plus de clarté
                inputs: params,                              // Garder aussi les paramètres individuels
                output: output,
                description: description
            };
        }
        
        return null;
    }

    /**
     * Analyse un appel de méthode générique
     * Capture les appels comme driver.get("http://www.google.com"), time.sleep(5), etc.
     */
    parseGenericMethodCall(line, description = '') {
        // Vérifier s'il y a une description sur la ligne précédente
        // let description = '';
        
        // Regex pour capturer les appels de méthode génériques
        // Format: objet.methode(...) ou ClassName.method(...)
        const genericMethodRegex = /([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\s*\((.*)\)/;
        const match = line.match(genericMethodRegex);
        
        if (match) {
            const methodName = match[1];      // ex: driver.get, time.sleep
            const paramsString = match[2];    // ex: "http://www.google.com", 5
            
            // Vérifier que ce n'est pas un cas déjà traité par d'autres parseurs
            if (methodName.startsWith('WebUI.') || methodName.startsWith('CustomKeywords.')) {
                return null;
            }
            
            // Analyser les paramètres
            const params = this.parseParameters(paramsString);
            
            // Vérifier s'il y a une assignation simple ou multiple
            let output = '';
            
            // Cas 1: Assignation multiple (a, b) = methode...
            const multipleAssignmentMatch = line.match(/^\s*\(([^)]+)\)\s*=\s*/);
            if (multipleAssignmentMatch) {
                output = multipleAssignmentMatch[1].trim();
                this.log(`Assignation multiple détectée pour méthode générique: ${output}`);
            } 
            // Cas 2: Assignation simple a = methode...
            else {
                const singleAssignmentMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*/);
                if (singleAssignmentMatch) {
                    output = singleAssignmentMatch[1].trim();
                    this.log(`Assignation simple détectée pour méthode générique: ${output}`);
                }
            }
            
            this.log(`Méthode générique analysée: ${methodName}(${params.join(', ')}), Output=${output}`);
            
            return {
                actionType: 'Méthode',
                actionItem: 'Méthode',
                action: methodName,
                input: params.join('\n'),  // Séparer les paramètres par des retours à la ligne
                inputs: params,            // Garder aussi les paramètres individuels
                output: output,
                description: description
            };
        }
        
        // Cas spécial pour les fonctions simples comme print("message")
        const simpleFunctionRegex = /([a-zA-Z0-9_]+)\s*\((.*)\)/;
        const simpleFunctionMatch = line.match(simpleFunctionRegex);
        
        if (simpleFunctionMatch) {
            const functionName = simpleFunctionMatch[1];  // ex: print, raise
            const paramsString = simpleFunctionMatch[2];  // ex: "Test steps executed successfully!"
            
            // Analyser les paramètres
            const params = this.parseParameters(paramsString);
            
            this.log(`Fonction simple analysée: ${functionName}(${params.join(', ')})`);
            
            return {
                actionType: 'Méthode',
                actionItem: 'Méthode',
                action: functionName,
                input: params.join('\n'),
                inputs: params,
                output: '',
                description: description
            };
        }
        
        return null;
    }

    /**
     * Analyse les paramètres d'un appel de fonction
     */
    parseParameters(paramsString) {
        if (!paramsString || paramsString.trim() === '') {
            return [];
        }
        
        const params = [];
        let currentParam = '';
        let inString = false;
        let stringChar = '';
        let bracketCount = 0;
        let braceCount = 0;
        
        for (let i = 0; i < paramsString.length; i++) {
            const char = paramsString[i];
            
            if ((char === "'" || char === '"') && (i === 0 || paramsString[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            } else if (char === '(' && !inString) {
                bracketCount++;
            } else if (char === ')' && !inString) {
                bracketCount--;
            } else if (char === '{' && !inString) {
                braceCount++;
            } else if (char === '}' && !inString) {
                braceCount--;
            } else if (char === ',' && !inString && bracketCount === 0 && braceCount === 0) {
                params.push(currentParam.trim());
                currentParam = '';
                continue;
            }
            
            currentParam += char;
        }
        
        if (currentParam.trim() !== '') {
            params.push(currentParam.trim());
        }
        
        return params;
    }

    /**
     * Analyse une assignation avec un appel de fonction
     */
    parseAssignmentWithFunctionCall(line) {
        // Ignorer les assignations simples comme file_path = ProjPath + "..."
        if (line.includes('=') && !line.includes('WebUI.') && !line.includes('CustomKeywords.')) {
            // Vérifier si c'est un appel de méthode standard
            const methodCallMatch = line.match(/([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_.]+)\.([a-zA-Z0-9_]+)\s*\((.*)\)/);
            if (methodCallMatch) {
                const output = methodCallMatch[1];
                const objectName = methodCallMatch[2];
                const methodName = methodCallMatch[3];
                const paramsString = methodCallMatch[4];
                
                // Analyser les paramètres
                const params = this.parseParameters(paramsString);
                
                return {
                    actionType: 'Méthode',
                    actionItem: 'Méthode',
                    action: `${objectName}.${methodName}`,
                    input: params.join(', '),
                    output: output,
                    description: ''
                };
            }
            
            // Vérifier si c'est un appel de fonction standard
            const functionCallMatch = line.match(/([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\((.*)\)/);
            if (functionCallMatch) {
                const output = functionCallMatch[1];
                const functionName = functionCallMatch[2];
                const paramsString = functionCallMatch[3];
                
                // Analyser les paramètres
                const params = this.parseParameters(paramsString);
                
                return {
                    actionType: 'Méthode',
                    actionItem: 'Méthode',
                    action: functionName,
                    input: params.join(', '),
                    output: output,
                    description: ''
                };
            }
        }
        
        return null;
    }

    /**
     * Analyse une simple assignation
     */
    parseBinaryStatement(line, description = '') {
        // Vérifier si c'est une assignation
        if (line.includes('=')) {
            // Exclure les assignations qui sont déjà traitées par d'autres parsers
            if (!line.includes('WebUI.') && !line.includes('CustomKeywords.') && 
                !line.match(/\s*if\s+/) && !line.match(/\s*for\s+/) && !line.match(/\s*while\s+/) && 
                !line.match(/\s*try\s*:/) && !line.match(/\s*except\s+/)) {
                
                // Vérifier que ce n'est pas un appel de fonction ou de méthode
                // (ceux-ci sont traités par parseAssignmentWithFunctionCall)
                if (!line.match(/=\s*[a-zA-Z0-9_]+\s*\(/) && !line.match(/=\s*[a-zA-Z0-9_.]+\.[a-zA-Z0-9_]+\s*\(/)) {
                    
                    // Vérifier si cette variable est liée à un import ou à un chemin de fichier
                    const variableName = line.split('=')[0].trim();
                    
                    // Exclure les assignations liées aux imports et aux chemins de fichiers
                    if (this.variables[variableName] && 
                        (this.variables[variableName].isImportRelated || this.variables[variableName].isPathVariable)) {
                        this.log(`Assignation ignorée car liée à un import ou un chemin: ${line}`);
                        return null;
                    }
                    
                    // Exclure les assignations qui semblent être des chemins de fichiers
                    if (line.includes('\\') || line.includes('/') || 
                        (line.includes('"') && (line.includes('.py') || line.includes('.json') || line.includes('.xml')))) {
                        this.log(`Assignation ignorée car semble être un chemin de fichier: ${line}`);
                        return null;
                    }
                    
                    // Exclure les assignations qui semblent être des imports partiels
                    if (line.match(/=\s*[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/)) {
                        this.log(`Assignation ignorée car semble être un import partiel: ${line}`);
                        return null;
                    }
                    
                    this.log(`Binary statement détecté: ${line}`);
                    
                    return {
                        actionType: 'binary statement',
                        actionItem: 'binary statement',
                        action: '',  // Action vide comme demandé
                        input: line.trim(),  // La ligne complète comme input
                        output: '',
                        description: description
                    };
                }
            }
        }
        
        return null;
    }

    /**
     * Vérifie si une ligne est un import ou une initialisation liée à un import
     */
    isImportRelatedInitialization(line) {
        // Vérifier si c'est un import direct
        if (line.startsWith('import ') || line.startsWith('from ')) {
            return true;
        }
        
        // Vérifier si c'est une initialisation liée à un import (assignation d'un module ou d'une fonction importée)
        if (line.includes('=')) {
            // Import partiel (ex: findTestObject = ObjectRepository.findTestObject)
            if (line.match(/=\s*[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/)) {
                return true;
            }
            
            // Vérifier si la variable est déjà marquée comme liée à un import
            const variableName = line.split('=')[0].trim();
            if (this.variables[variableName] && this.variables[variableName].isImportRelated) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Vérifie si une action est valide pour l'affichage dans le tableau
     */
    isValidActionForTable(action) {
        // Une action est valide si elle a au moins un champ action non vide
        return action && action.action && action.action.trim() !== '';
    }

    /**
     * Convertit les actions analysées en format tabulaire pour l'affichage
     */
    actionsToTableFormat() {
        const tableData = [];
        
        const processAction = (action, depth = 0, parentIndex = null) => {
            // Vérifier si l'action est valide avant de l'ajouter au tableau
            if (!this.isValidActionForTable(action)) {
                console.log(`[PythonScriptAnalyzer] Action invalide ignorée:`, action);
                return; // Ignorer les actions invalides
            }
            
            const row = {
                step: tableData.length + 1,
                actionItem: action.actionItem,
                action: action.action,
                input: action.input,
                output: action.output,
                description: action.description,
                depth: depth,
                parentIndex: parentIndex
            };
            
            const rowIndex = tableData.length;
            tableData.push(row);
            
            // Traiter les sous-actions récursivement
            if (action.subActions && action.subActions.length > 0) {
                // Filtrer les sous-actions invalides
                const validSubActions = action.subActions.filter(subAction => this.isValidActionForTable(subAction));
                validSubActions.forEach(subAction => {
                    processAction(subAction, depth + 1, rowIndex);
                });
            }
        };
        
        // Filtrer les actions invalides avant de les traiter
        const validActions = this.actions.filter(action => this.isValidActionForTable(action));
        console.log(`[PythonScriptAnalyzer] Filtrage des actions pour le tableau: ${this.actions.length} actions -> ${validActions.length} actions valides`);
        
        validActions.forEach(action => {
            processAction(action);
        });
        
        console.log(`[PythonScriptAnalyzer] Tableau généré avec ${tableData.length} lignes`);
        return tableData;
    }
}

// Fonction pour extraire les actions d'un script Python
function extractActionsFromPythonScript(scriptContent) {
    if (!window.pythonScriptAnalyzer) {
        console.log('Initialisation de l\'analyseur de script Python...');
        window.pythonScriptAnalyzer = new PythonScriptAnalyzer();
    }
    return window.pythonScriptAnalyzer.analyze(scriptContent);
}

// Fonction pour vérifier si une action est valide
function isValidAction(action) {
    // Une action est valide si elle a au moins un champ action non vide
    return action && action.action && action.action.trim() !== '';
}

// Fonction pour convertir les actions en format tabulaire
function convertActionsToTableFormat(actions) {
    if (!window.pythonScriptAnalyzer) {
        console.log('Initialisation de l\'analyseur de script Python...');
        window.pythonScriptAnalyzer = new PythonScriptAnalyzer();
    }
    
    // Filtrer les actions invalides avant de les passer à l'analyseur
    const validActions = actions.filter(isValidAction);
    console.log(`[convertActionsToTableFormat] Filtrage des actions: ${actions.length} actions totales -> ${validActions.length} actions valides`);
    
    window.pythonScriptAnalyzer.actions = validActions;
    const tableFormat = window.pythonScriptAnalyzer.actionsToTableFormat();
    
    // Filtrer à nouveau le format tabulaire pour s'assurer qu'il n'y a pas d'entrées invalides
    const filteredTableFormat = tableFormat.filter(row => {
        return row && row.action && row.action.trim() !== '';
    });
    
    console.log(`[convertActionsToTableFormat] Filtrage du format tabulaire: ${tableFormat.length} lignes -> ${filteredTableFormat.length} lignes valides`);
    
    return filteredTableFormat;
}

// Rendre les fonctions accessibles globalement
window.extractActionsFromPythonScript = extractActionsFromPythonScript;
window.convertActionsToTableFormat = convertActionsToTableFormat;

// Initialiser l'analyseur de script Python immédiatement
window.pythonScriptAnalyzer = new PythonScriptAnalyzer();

// Également initialiser lorsque le document est chargé (pour s'assurer que c'est fait)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.pythonScriptAnalyzer) {
        window.pythonScriptAnalyzer = new PythonScriptAnalyzer();
    }

});
