// Gestionnaire de conversion Python
class PythonConverter {
    constructor() {
        this.imports = new Set();
        this.configurations = [];
        this.controlStructures = [];
        this.originalScript = '';
        this.debug = true;
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[PythonConverter] ${message}`);
            if (data) {
                console.log(data);
            }
        }
    }

    scriptToManual(scriptContent) {
        this.log('Starting scriptToManual conversion');
        this.log('Original script content:', scriptContent);
        
        // Utiliser le nouvel analyseur de script Python
        if (window.extractActionsFromPythonScript) {
            console.log('Nouvel analyseur de script Python détecté, utilisation en cours...');
            try {
                const actions = window.extractActionsFromPythonScript(scriptContent);
                console.log('Actions extraites avec le nouvel analyseur:', actions);
                const tableFormat = window.convertActionsToTableFormat(actions);
                console.log('Format tabulaire généré:', tableFormat);
                
                // Convertir le format tabulaire en étapes manuelles
                const steps = this.convertTableFormatToManualSteps(tableFormat);
                
                this.log('Final manual steps from new analyzer:', steps);
                return steps;
            } catch (error) {
                console.error('Erreur lors de l\'utilisation du nouvel analyseur:', error);
                console.log('Retour à l\'ancienne méthode...');
            }
        } else {
            console.log('Nouvel analyseur de script Python non disponible, utilisation de l\'ancienne méthode...');
        }
        
        // Fallback à l'ancienne méthode si le nouvel analyseur n'est pas disponible ou a échoué
        // Sauvegarder le script original
        this.originalScript = scriptContent;
        
        // Sauvegarder les imports et configurations
        this.extractImportsAndConfig(scriptContent);
        this.log('Extracted imports:', Array.from(this.imports));
        this.log('Extracted configurations:', this.configurations);
        
        // Extraire les structures de contrôle
        this.extractControlStructures(scriptContent);
        this.log('Extracted control structures:', this.controlStructures);
        
        // Extraire les étapes manuelles
        const steps = [];
        const lines = scriptContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Ignorer les lignes vides, les commentaires et les imports/configurations
            if (!line || line.startsWith('#') || this.isImportOrConfig(line)) {
                continue;
            }
            
            // Vérifier si cette ligne fait partie d'une structure de contrôle
            const controlStructure = this.findControlStructureForLine(i, lines);
            if (controlStructure) {
                this.log('Line is part of control structure:', { line, controlStructure });
                
                // Ajouter la structure de contrôle comme une étape
                steps.push({
                    is_control_structure: true,
                    actionItem: 'Control Structure',
                    action: controlStructure.type,
                    input: controlStructure.condition,
                    output: '',
                    description: `Structure de contrôle: ${controlStructure.type}`,
                    block_content: controlStructure.blockContent
                });
                
                // Avancer jusqu'à la fin de la structure de contrôle
                i = controlStructure.endLine;
                continue;
            }
            
            // Analyser la ligne pour extraire l'action
            const actionInfo = this.parseActionLine(line);
            if (actionInfo) {
                this.log('Parsed action:', actionInfo);
                // Ajouter l'information sur la ligne originale
                actionInfo.original_line = i;
                steps.push(actionInfo);
            } else {
                this.log('Failed to parse line:', line);
            }
        }
        
        this.log('Final manual steps:', steps);
        return steps;
    }

    /**
     * Vérifie si une étape est valide pour l'affichage dans le tableau manuel
     */
    isValidStep(step) {
        // Une étape est valide si elle a au moins un champ action non vide
        return step && step.action && step.action.trim() !== '';
    }
    
    /**
     * Convertit le format tabulaire en étapes manuelles pour l'affichage
     */
    convertTableFormatToManualSteps(tableFormat) {
        if (!tableFormat || !Array.isArray(tableFormat)) {
            console.error('[PythonConverter] Format tabulaire invalide:', tableFormat);
            return [];
        }
        
        console.log(`[PythonConverter] Conversion du format tabulaire: ${tableFormat.length} lignes`);
        
        // Filtrer les lignes invalides du format tabulaire
        const validRows = tableFormat.filter(row => {
            return row && row.action && row.action.trim() !== '';
        });
        
        console.log(`[PythonConverter] Lignes valides après filtrage: ${validRows.length}/${tableFormat.length}`);
        
        const steps = [];
        
        // Convertir chaque ligne valide du tableau en étape manuelle
        validRows.forEach(row => {
            const step = {
                actionItem: row.actionItem,
                action: row.action,
                input: row.input,
                output: row.output,
                description: row.description
            };
            
            // Si c'est une structure de contrôle, ajouter les propriétés spécifiques
            if (row.actionItem === 'Condition' || row.actionItem === 'Loop' || row.actionItem === 'Exception handling') {
                step.is_control_structure = true;
                // Note: le contenu du bloc n'est pas disponible dans ce format,
                // mais ce n'est pas grave car nous n'utilisons pas cette propriété pour l'affichage
            }
            
            // Vérifier une dernière fois que l'étape est valide avant de l'ajouter
            if (this.isValidStep(step)) {
                steps.push(step);
            }
        });
        
        console.log(`[PythonConverter] Étapes manuelles générées: ${steps.length}`);
        return steps;
    }

    manualToScript(steps) {
        this.log('Starting manualToScript conversion');
        this.log('Input steps:', steps);
        
        // Si nous avons le script original et que nous n'avons supprimé aucune étape,
        // nous pouvons simplement retourner le script original
        if (this.originalScript && steps.length === this.countActionsInOriginalScript()) {
            this.log('Using original script as no steps were removed');
            return this.originalScript;
        }
        
        // Sinon, reconstruire le script en préservant la structure
        let script = '';
        
        // Ajouter les imports sauvegardés
        this.imports.forEach(importLine => {
            script += importLine + '\n';
        });
        this.log('Added imports to script');
        
        // Ajouter une ligne vide après les imports
        if (this.imports.size > 0) {
            script += '\n';
        }
        
        // Ajouter les configurations sauvegardées
        this.configurations.forEach(configLine => {
            script += configLine + '\n';
        });
        this.log('Added configurations to script');
        
        // Ajouter une ligne vide après les configurations
        if (this.configurations.length > 0) {
            script += '\n';
        }

        // Convertir chaque étape en code Python
        steps.forEach((step, index) => {
            this.log(`Converting step ${index + 1}:`, step);
            
            // Traiter les structures de contrôle
            if (step.is_control_structure) {
                this.log('Adding control structure:', step);
                script += step.block_content + '\n';
                return;
            }
            
            // Traiter les actions normales
            if (step.action) {
                const pythonCode = this.convertStepToCode(step);
                if (pythonCode) {
                    script += pythonCode + '\n';
                    this.log('Generated Python code:', pythonCode);
                } else {
                    this.log('Failed to convert step to code:', step);
                }
            }
        });
        
        this.log('Final script:', script);
        return script;
    }

    countActionsInOriginalScript() {
        let count = 0;
        
        // Compter les structures de contrôle
        count += this.controlStructures.length;
        
        // Compter les appels WebUI
        const lines = this.originalScript.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') || this.isImportOrConfig(trimmedLine)) {
                continue;
            }
            
            // Vérifier si cette ligne est déjà comptée comme partie d'une structure de contrôle
            let isInControlStructure = false;
            for (const structure of this.controlStructures) {
                if (lines.indexOf(line) >= structure.startLine && lines.indexOf(line) <= structure.endLine) {
                    isInControlStructure = true;
                    break;
                }
            }
            
            if (!isInControlStructure && (trimmedLine.includes('WebUI.') || trimmedLine.startsWith('print('))) {
                count++;
            }
        }
        
        this.log('Counted actions in original script:', count);
        return count;
    }

    extractControlStructures(scriptContent) {
        this.log('Starting control structure extraction');
        
        const lines = scriptContent.split('\n');
        this.controlStructures = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Détecter les structures de contrôle
            if (line.startsWith('if ') || line.startsWith('while ') || 
                line.startsWith('for ') || line.startsWith('try:')) {
                
                const type = line.startsWith('if ') ? 'if' : 
                            line.startsWith('while ') ? 'while' : 
                            line.startsWith('for ') ? 'for' : 'try';
                
                // Trouver la fin de la structure de contrôle
                const indentLevel = this.getIndentLevel(lines[i]);
                let endLine = i;
                
                for (let j = i + 1; j < lines.length; j++) {
                    const currentIndent = this.getIndentLevel(lines[j]);
                    const currentLine = lines[j].trim();
                    
                    if (currentLine && currentIndent <= indentLevel && 
                        !currentLine.startsWith('elif ') && 
                        !currentLine.startsWith('else:') && 
                        !currentLine.startsWith('except ') && 
                        !currentLine.startsWith('finally:')) {
                        endLine = j - 1;
                        break;
                    }
                    
                    if (j === lines.length - 1) {
                        endLine = j;
                        break;
                    }
                }
                
                // Extraire le contenu du bloc
                const blockContent = lines.slice(i, endLine + 1).join('\n');
                
                this.controlStructures.push({
                    type: type,
                    condition: line,
                    startLine: i,
                    endLine: endLine,
                    blockContent: blockContent
                });
                
                this.log('Found control structure:', {
                    type: type,
                    startLine: i,
                    endLine: endLine
                });
            }
        }
    }

    findControlStructureForLine(lineIndex, lines) {
        for (const structure of this.controlStructures) {
            if (lineIndex >= structure.startLine && lineIndex <= structure.endLine) {
                return structure;
            }
        }
        return null;
    }

    isImportOrConfig(line) {
        const isImport = this.imports.has(line);
        const isConfig = this.configurations.includes(line);
        if (isImport || isConfig) {
            this.log('Line is import/config:', { line, isImport, isConfig });
        }
        return isImport || isConfig;
    }

    extractImportsAndConfig(scriptContent) {
        this.log('Starting import/config extraction');
        
        const lines = scriptContent.split('\n');
        this.imports.clear();
        this.configurations = [];
        
        let isConfig = false;
        let configBlock = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Capturer les imports
            if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) {
                this.log('Found import:', line);
                this.imports.add(line);
                continue;
            }
            
            // Capturer les configurations (assignations de variables, findTestObject, etc.)
            if (trimmedLine.includes('=') && 
                (trimmedLine.includes('findTestObject') || 
                 trimmedLine.includes('RunConfiguration') || 
                 trimmedLine.includes('file_path'))) {
                this.log('Found start of config block:', line);
                isConfig = true;
                configBlock = line;
            }
            
            // Sauvegarder les lignes de configuration
            if (isConfig && trimmedLine) {
                this.configurations.push(line);
                
                // Détecter la fin de la configuration
                if (trimmedLine.endsWith(')') || trimmedLine.endsWith('"}') || trimmedLine.endsWith('"')) {
                    this.log('Found end of config block:', configBlock);
                    isConfig = false;
                    configBlock = '';
                }
            }
        }
    }

    parseActionLine(line) {
        this.log('Parsing action line:', line);
        
        // Regex pour capturer les appels de fonction WebUI et autres commandes
        const webUIRegex = /WebUI\.([a-zA-Z0-9_]+)\s*\((.*)\)/;
        const printRegex = /print\((.*)\)/;
        const match = line.match(webUIRegex) || line.match(printRegex);
        
        if (match) {
            const action = match[1] || 'print';
            const params = match[2] || '';
            
            this.log('Matched action:', { action, params });
            
            // Extraire les paramètres
            const paramList = this.parseParameters(params);
            
            const actionInfo = {
                actionItem: 'WebUI Action',
                action: action,
                input: paramList.input,
                output: paramList.output,
                description: `Execute ${action} with parameters: ${params}`
            };
            
            this.log('Created action info:', actionInfo);
            return actionInfo;
        }
        
        this.log('No action match found');
        return null;
    }

    parseParameters(paramsString) {
        this.log('Parsing parameters:', paramsString);
        
        const params = paramsString.split(',').map(p => p.trim());
        let input = '';
        let output = '';
        
        params.forEach(param => {
            if (param.includes('findTestObject')) {
                input = param;
                this.log('Found findTestObject parameter:', input);
            } else if (param.includes('FailureHandling')) {
                output = param;
                this.log('Found FailureHandling parameter:', output);
            } else if (!input && (param.startsWith('"') || param.startsWith("'"))) {
                input = param.replace(/['"]/g, '');
                this.log('Found string parameter:', input);
            }
        });
        
        return { input, output };
    }

    convertStepToCode(step) {
        this.log('Converting step to code:', step);
        
        if (!step.action) {
            this.log('No action found in step');
            return null;
        }
        
        // Construire l'appel de fonction
        if (step.action === 'print') {
            const code = `print(${step.input || '"' + step.description + '"'})`;
            this.log('Generated print code:', code);
            return code;
        }
        
        // Construire l'appel WebUI
        let code = `WebUI.${step.action}(`;
        
        // Ajouter les paramètres
        const params = [];
        if (step.input) {
            if (step.input.includes('findTestObject')) {
                params.push(step.input);
            } else {
                params.push(`"${step.input}"`);
            }
        }
        
        if (step.output) {
            params.push(step.output);
        }
        
        code += params.join(', ');
        code += ')';
        
        this.log('Generated WebUI code:', code);
        return code;
    }

    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }
}

// Initialiser le convertisseur Python
document.addEventListener('DOMContentLoaded', () => {
    window.pythonConverter = new PythonConverter();
});
