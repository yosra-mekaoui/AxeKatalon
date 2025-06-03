from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import os
import json
import logging
import re
import ast
from concurrent.futures import ThreadPoolExecutor
from xml_handler import handle_xml_file
import subprocess
import tempfile
import xml.dom.minidom
import xml.parsers.expat
import time
from flask import Response
import datetime
import traceback
import string
import hashlib
import sys
import time
import random

# Importer le gestionnaire Git
from git_handler import handle_git_routes

# Configuration du logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limite de 16 Mo pour les téléchargements
CORS(app)

# Initialiser les gestionnaires
handle_xml_file(app)

# Initialiser le gestionnaire Git
handle_git_routes(app)

# Variable globale pour stocker le chemin du projet actuel
CURRENT_PROJECT_PATH = None
PROJECT_EXECUTION_PATH = None  

KATALON_FOLDERS = [
    'Profiles',
    'TestCases',
    'Object Repository',
    'Test Suites',
    'Keywords',
    'report',
    'reports',
    'settings'
]
FOLDER_CONFIG = {
    'Keywords': {
        'extensions': ['.py'],
        'allow_subdirs': True,
        'readable': True
    },
    'Object Repository': {
        'extensions': ['.xml'],
        'allow_subdirs': True,
        'readable': True
    },
    'report': {
        'extensions': ['*'],
        'allow_subdirs': True,
        'readable': True,
        'show_all': True
    },
    'reports': {
        'extensions': ['.xml'],
        'allow_subdirs': False,
        'readable': False,
        'open_with': 'edge'
    },
    'TestCases': {
        'extensions': ['.py', '.xml'],
        'allow_subdirs': True,
        'readable': True
    },
    'Test Suites': {
        'extensions': ['.xml', '.py'],
        'allow_subdirs': True,
        'readable': True
    },
    'Profiles': {
        'extensions': ['.glbl'],
        'allow_subdirs': True,
        'readable': True,
        'show_all': True
    },
    'settings': {
        'extensions': ['*'],
        'allow_subdirs': True,
        'readable': True,
        'show_all': True
    }
}

# Classe pour parser un fichier Python
class PythonFileParser:
    def __init__(self):
        self.imports = []
        self.configurations = []
        self.steps = []
        self.control_structures = []
        self.original_content = None

    def preserve_imports(self, script_code):
        required_imports = [
            "import json",
            "import logging",
            "from WebUI import BuiltinKeywords",
            "from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI",
            "from WebUI.DriverFactory import DriverFactory"
        ]

        for imp in required_imports:
            if imp not in script_code:
                script_code = imp + "\n" + script_code

        return script_code

    def parse_file(self, content):
        logger.info("Début de l'analyse du fichier Python")
        try:
            # Store the original content for reference during editing
            self.original_content = content
            
            tree = ast.parse(content)

            # Extraire les imports et configurations
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    self.imports.append(content[node.lineno - 1])
                    logger.debug(f"Import trouvé: {content[node.lineno - 1]}")
                elif isinstance(node, ast.Assign):
                    line = content[node.lineno - 1]
                    if any(keyword in line for keyword in
                           ['RunConfiguration', 'findTestObject', 'file_path', 'prope', 'driver']):
                        self.configurations.append(line)
                        logger.debug(f"Configuration trouvée: {line}")
            self.extract_steps_and_control_structures(tree, content)

            logger.info(
                f"Analyse terminée: {len(self.imports)} imports, {len(self.configurations)} configs, {len(self.steps)} étapes, {len(self.control_structures)} structures de contrôle")
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du fichier: {str(e)}")
            return False

    def extract_steps_and_control_structures(self, tree, content):
        lines = content.split('\n')
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and hasattr(node.func, 'value') and hasattr(node.func.value, 'id'):
                if node.func.value.id == 'WebUI':
                    step = self.parse_webui_call(node, content)
                    if step:
                        self.steps.append(step)
                        logger.debug(f"Étape WebUI trouvée: {step}")

            elif isinstance(node, (ast.If, ast.While, ast.For, ast.Try)):
                structure = self.parse_control_structure(node, lines)
                if structure:
                    self.control_structures.append(structure)
                    self.steps.append({
                        'actionItem': 'Control Structure',
                        'action': structure['type'],
                        'params': [structure['condition']],
                        'line': structure['code'],
                        'is_control_structure': True,
                        'block_content': structure['block_content']
                    })
                    logger.debug(f"Structure de contrôle trouvée: {structure}")

    def parse_control_structure(self, node, lines):
        try:
            structure_type = type(node).__name__

            if isinstance(node, ast.If):
                condition = lines[node.lineno - 1].strip()
                structure_type = "if"
            elif isinstance(node, ast.While):
                condition = lines[node.lineno - 1].strip()
                structure_type = "while"
            elif isinstance(node, ast.For):
                condition = lines[node.lineno - 1].strip()
                structure_type = "for"
            elif isinstance(node, ast.Try):
                condition = lines[node.lineno - 1].strip()
                structure_type = "try"
            else:
                condition = ""
            start_line = node.lineno - 1
            end_line = node.end_lineno
            block_content = "\n".join(lines[start_line:end_line])

            return {
                'type': structure_type,
                'condition': condition,
                'code': condition,
                'block_content': block_content,
                'start_line': start_line,
                'end_line': end_line
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse d'une structure de contrôle: {str(e)}")
            return None

    def parse_webui_call(self, node, content):
        try:
            action = node.func.attr
            params = []

            for arg in node.args:
                if isinstance(arg, ast.Call) and isinstance(arg.func, ast.Name) and arg.func.id == 'findTestObject':
                    if arg.args and isinstance(arg.args[0], ast.Str):
                        params.append(f"findTestObject('{arg.args[0].s}')")
                elif isinstance(arg, ast.Str):
                    params.append(f"'{arg.s}'")
                elif isinstance(arg, ast.Num):
                    params.append(str(arg.n))
                else:
                    line = content[node.lineno - 1]
                    start = node.col_offset
                    end = node.end_col_offset
                    params.append(line[start:end])
            return {
                'action': action,
                'params': params,
                'line': content[node.lineno - 1].strip()
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse d'un appel WebUI: {str(e)}")
            return None

    def generate_script(self, manual_steps):
        logger.info("Début de la génération du script")
        script = ""
        for imp in self.imports:
            script += imp + "\n"
        if self.imports:
            script += "\n"
        for config in self.configurations:
            script += config + "\n"
        if self.configurations:
            script += "\n"
        for step in manual_steps:
            try:
                if not step.get('action'):
                    continue
                if step.get('is_control_structure'):
                    script += step.get('block_content', '') + "\n"
                    continue

                action = step['action']
                params = []

                if step.get('input'):
                    if 'findTestObject' in step['input']:
                        params.append(step['input'])
                    else:
                        params.append(f"'{step['input']}'")

                if step.get('output'):
                    params.append(step['output'])

                line = f"WebUI.{action}({', '.join(params)})"
                script += line + "\n"
                logger.debug(f"Ligne générée: {line}")

            except Exception as e:
                logger.error(f"Erreur lors de la génération d'une étape: {str(e)}")
                continue

        logger.info("Génération du script terminée")
        return script
        
    def edit_script_and_convert_to_manual(self, modified_script):
        """
        Prend un script Python modifié, l'analyse et le convertit en format manuel.
        Cette fonction permet de gérer les modifications de script comme:
        - Suppression d'une étape (ligne de code)
        - Modification d'une étape existante
        - Ajout d'une nouvelle étape
        
        Args:
            modified_script (str): Le contenu du script modifié
            
        Returns:
            list: Liste des étapes au format manuel
        """
        logger.info("Analyse du script modifié pour conversion en mode manuel")
        logger.info(f"Longueur du script: {len(modified_script)} caractères")
        logger.debug(f"Début du script: {modified_script[:200]}...")
        
        # S'assurer que le script contient les imports nécessaires
        if 'WebUI' not in modified_script:
            logger.info("Ajout des imports nécessaires au script")
            imports = [
                "import json",
                "import logging",
                "from WebUI import BuiltinKeywords",
                "from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI",
                "from WebUI.DriverFactory import DriverFactory"
            ]
            
            # Ajouter les imports au début du script
            modified_script = "\n".join(imports) + "\n\n" + modified_script
            logger.debug(f"Script avec imports: {modified_script[:300]}...")
        
        # Vérifier si le script est vide ou trop court
        if len(modified_script.strip()) < 10:
            logger.warning("Script trop court, ajout d'un exemple minimal")
            modified_script += "\n\nWebUI.openBrowser('')\nWebUI.navigateToUrl('https://example.com')\n"
            logger.debug(f"Script avec exemple: {modified_script}")
        
        # S'assurer que le script est syntaxiquement valide
        try:
            ast.parse(modified_script)
            logger.info("Script syntaxiquement valide")
        except SyntaxError as e:
            logger.error(f"Erreur de syntaxe dans le script: {e}")
            # Essayer de corriger les erreurs de syntaxe basiques
            modified_script = self.fix_common_syntax_errors(modified_script)
            logger.info("Tentative de correction des erreurs de syntaxe")
        
        logger.info("Prêt à analyser le script modifié")
        
        # Réinitialiser les listes pour la nouvelle analyse
        self.steps = []
        self.control_structures = []
        self.imports = []
        self.configurations = []
        
        try:
            # Analyser le script modifié
            tree = ast.parse(modified_script)
            
            # Extraire les imports et configurations
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    self.imports.append(modified_script[node.lineno - 1])
                elif isinstance(node, ast.Assign):
                    line = modified_script[node.lineno - 1]
                    if any(keyword in line for keyword in
                           ['RunConfiguration', 'findTestObject', 'file_path', 'prope', 'driver']):
                        self.configurations.append(line)
            
            # Extraire les étapes et structures de contrôle
            self.extract_steps_and_control_structures(tree, modified_script)
            
            # Convertir les étapes en format manuel
            manual_steps = []
            for step in self.steps:
                if step.get('is_control_structure'):
                    # Conserver les structures de contrôle telles quelles
                    manual_steps.append(step)
                else:
                    # Convertir les appels WebUI en étapes manuelles
                    manual_step = {
                        'action': step.get('action', ''),
                        'input': '',
                        'output': ''
                    }
                    
                    # Extraire les paramètres
                    params = step.get('params', [])
                    if params and len(params) > 0:
                        # Le premier paramètre est généralement l'input
                        input_param = params[0]
                        # Nettoyer les guillemets si présents
                        if input_param.startswith("'") and input_param.endswith("'"):
                            manual_step['input'] = input_param[1:-1]
                        elif input_param.startswith('"') and input_param.endswith('"'):
                            manual_step['input'] = input_param[1:-1]
                        else:
                            manual_step['input'] = input_param
                    
                    # S'il y a un deuxième paramètre, c'est généralement l'output
                    if params and len(params) > 1:
                        manual_step['output'] = params[1]
                    
                    manual_steps.append(manual_step)
            
            logger.info(f"Conversion terminée: {len(manual_steps)} étapes manuelles générées")
            return manual_steps
            
        except Exception as e:
            logger.error(f"Erreur lors de la conversion du script modifié: {str(e)}")
            logger.error(traceback.format_exc())
            # En cas d'erreur, retourner une liste vide ou les étapes déjà analysées
            return []
            
    def fix_common_syntax_errors(self, script):
        """
        Tente de corriger les erreurs de syntaxe basiques dans un script Python.
        
        Args:
            script (str): Le contenu du script à corriger
            
        Returns:
            str: Le script corrigé
        """
        logger.info("Correction des erreurs de syntaxe basiques")
        
        # Diviser le script en lignes
        lines = script.split('\n')
        corrected_lines = []
        
        # Variables pour suivre l'état des parenthèses, crochets, etc.
        open_parentheses = 0
        open_brackets = 0
        open_braces = 0
        
        for line in lines:
            # Ignorer les lignes vides et les commentaires
            if not line.strip() or line.strip().startswith('#'):
                corrected_lines.append(line)
                continue
                
            # Compter les parenthèses, crochets et accolades ouvertes et fermées
            open_parentheses += line.count('(') - line.count(')')
            open_brackets += line.count('[') - line.count(']')
            open_braces += line.count('{') - line.count('}')
            
            # Vérifier si la ligne se termine par un caractère qui nécessite un retour à la ligne
            if line.strip().endswith((':', ',', '+', '-', '*', '/', '=', '\\')):
                corrected_lines.append(line)
                continue
                
            # Vérifier si la ligne est une déclaration d'import, une définition de fonction/classe, etc.
            if any(line.strip().startswith(keyword) for keyword in ['import ', 'from ', 'def ', 'class ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except ', 'finally:', 'with ']):
                corrected_lines.append(line)
                continue
                
            # Vérifier si la ligne est une instruction WebUI
            if 'WebUI.' in line and not line.strip().endswith(')'):
                # Ajouter une parenthèse fermante si nécessaire
                corrected_lines.append(line + ')')
                open_parentheses -= 1
                continue
                
            # Ajouter la ligne telle quelle
            corrected_lines.append(line)
        
        # Fermer les parenthèses, crochets et accolades non fermés
        if open_parentheses > 0:
            logger.warning(f"Ajout de {open_parentheses} parenthèses fermantes manquantes")
            corrected_lines.append(')' * open_parentheses)
            
        if open_brackets > 0:
            logger.warning(f"Ajout de {open_brackets} crochets fermants manquants")
            corrected_lines.append(']' * open_brackets)
            
        if open_braces > 0:
            logger.warning(f"Ajout de {open_braces} accolades fermantes manquantes")
            corrected_lines.append('}' * open_braces)
        
        # Rejoindre les lignes corrigées
        corrected_script = '\n'.join(corrected_lines)
        
        # Essayer de parser le script corrigé pour vérifier s'il est valide
        try:
            ast.parse(corrected_script)
            logger.info("Script corrigé avec succès")
            return corrected_script
        except SyntaxError as e:
            logger.error(f"Impossible de corriger toutes les erreurs de syntaxe: {e}")
            # Retourner le script original si la correction a échoué
            return script

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/git/clone')
def git_clone_page():
    return render_template('git_clone.html')

@app.route('/open_project', methods=['POST'])
def open_project():
    try:
        global CURRENT_PROJECT_PATH, PROJECT_EXECUTION_PATH
        data = request.get_json()
        project_path = data.get('path')

        logger.info(f"Ouverture du projet: {project_path}")

        if not project_path:
            logger.error("Project path is required")
            return jsonify({
                'success': False,
                'message': 'Project path is required'
            })

        # Convertir le chemin en chemin absolu, quelle que soit sa forme d'origine
        project_path = os.path.abspath(project_path)
        logger.info(f"Chemin absolu résolu: {project_path}")

        # Vérifier simplement si le chemin existe et est un répertoire
        if os.path.exists(project_path) and os.path.isdir(project_path):
            # Mettre à jour les chemins globaux
            CURRENT_PROJECT_PATH = project_path
            PROJECT_EXECUTION_PATH = project_path
            logger.info(f"Projet trouvé au chemin: {project_path}")
        else:
            logger.error(f"Le chemin du projet n'existe pas: {project_path}")
            return jsonify({
                'success': False,
                'message': f"Le chemin du projet n'existe pas: {project_path}"
            })

        # Vérifier si le projet a la structure d'un projet Katalon
        has_katalon_structure = False
        for folder in KATALON_FOLDERS:
            folder_path = os.path.join(project_path, folder)
            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                has_katalon_structure = True
                break

        if not has_katalon_structure:
            logger.warning(f"Le projet ne semble pas avoir la structure d'un projet Katalon: {project_path}")
            # Créer les dossiers manquants
            for folder in KATALON_FOLDERS:
                folder_path = os.path.join(project_path, folder)
                if not os.path.exists(folder_path):
                    os.makedirs(folder_path, exist_ok=True)
                    logger.info(f"Dossier créé: {folder_path}")

        # Journaliser le chemin final du projet
        logger.info(f"Projet ouvert avec succès: {project_path}")
        logger.info(f"CURRENT_PROJECT_PATH = {CURRENT_PROJECT_PATH}")
        logger.info(f"PROJECT_EXECUTION_PATH = {PROJECT_EXECUTION_PATH}")

        # Préparer la structure de base du projet pour le frontend
        base_structure = []
        for folder in KATALON_FOLDERS:
            folder_path = os.path.join(project_path, folder)
            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                has_children = len(os.listdir(folder_path)) > 0
                folder_info = {
                    'name': folder,
                    'type': 'directory',
                    'path': folder,
                    'has_children': has_children,
                    'children': []
                }
                base_structure.append(folder_info)

        # Retourner la structure complète attendue par le frontend
        return jsonify({
            'success': True,
            'message': 'Projet ouvert avec succès',
            'project': {
                'name': os.path.basename(project_path),
                'path': project_path,
                'children': base_structure
            }
        })
    except Exception as e:
        logger.error(f"Erreur lors de l'ouverture du projet: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/open_file', methods=['POST'])
def open_file():
    try:
        global CURRENT_PROJECT_PATH
        data = request.get_json()
        file_path = data.get('path')
        project_path = data.get('project_path', '')

        # Donner la priorité au chemin du projet global sur celui fourni dans la requête
        if CURRENT_PROJECT_PATH:
            # Si un chemin est fourni dans la requête mais qu'il est différent du chemin global, utiliser le chemin global
            if project_path and project_path != CURRENT_PROJECT_PATH:
                logger.info(f"Remplacement du chemin fourni ({project_path}) par le chemin global ({CURRENT_PROJECT_PATH}) pour l'ouverture du fichier")
            project_path = CURRENT_PROJECT_PATH
            logger.info(f"Utilisation du chemin de projet global pour l'ouverture du fichier: {project_path}")
        elif not project_path:
            logger.warning("Aucun chemin de projet fourni pour l'ouverture du fichier")

        if not file_path:
            return jsonify({
                'success': False,
                'message': 'File path is required'
            })
        absolute_path = os.path.join(project_path, file_path)

        if not os.path.exists(absolute_path):
            return jsonify({
                'success': False,
                'message': f'File not found: {absolute_path}'
            })

        with open(absolute_path, 'r', encoding='utf-8') as file:
            content = file.read()
        logger.debug(f"Contenu du fichier: {content[:200]}...")

        parsed_content = []
        if content and absolute_path.endswith('.py'):
            try:
                parser = PythonFileParser()
                success = parser.parse_file(content)

                if success:
                    for step in parser.steps:
                        step_data = {}
                        if step.get('is_control_structure'):
                            step_data = {
                                'actionItem': 'Control Structure',
                                'action': step['action'],
                                'input': step['params'][0] if step['params'] else '',
                                'output': '',
                                'description': f"Structure de contrôle: {step['action']}",
                                'is_control_structure': True,
                                'block_content': step.get('block_content', '')
                            }
                        else:
                            params = step.get('params', [])
                            input_param = params[0] if params else ''
                            output_param = params[1] if len(params) > 1 else ''

                            step_data = {
                                'actionItem': 'WebUI Action',
                                'action': step.get('action', ''),
                                'input': input_param,
                                'output': output_param,
                                'description': f"Execute {step.get('action', '')} with parameters: {', '.join(params)}"
                            }

                        parsed_content.append(step_data)
                else:
                    logger.warning("Le parsing avancé a échoué, utilisation d'une méthode simplifiée")
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if not line or line.startswith('#') or line.startswith('import ') or line.startswith('from '):
                            continue

                        if line.startswith('if ') or line.startswith('while ') or line.startswith(
                                'for ') or line.startswith('try:'):
                            structure_type = 'if' if line.startswith('if ') else 'while' if line.startswith(
                                'while ') else 'for' if line.startswith('for ') else 'try'
                            parsed_content.append({
                                'actionItem': 'Control Structure',
                                'action': structure_type,
                                'input': line,
                                'output': '',
                                'description': f"Structure de contrôle: {structure_type}",
                                'is_control_structure': True,
                                'block_content': line
                            })
                        elif 'WebUI.' in line:
                            # Extraire l'action WebUI
                            match = re.search(r'WebUI\.(\w+)\((.*)\)', line)
                            if match:
                                action = match.group(1)
                                params = match.group(2).split(',')
                                input_param = params[0].strip() if params else ''
                                output_param = params[1].strip() if len(params) > 1 else ''

                                parsed_content.append({
                                    'actionItem': 'WebUI Action',
                                    'action': action,
                                    'input': input_param.strip('"\''),
                                    'output': output_param,
                                    'description': f"Execute {action} with parameters: {', '.join(params)}"
                                })

                logger.info(f"Fichier Python parsé avec succès: {len(parsed_content)} étapes trouvées")
            except Exception as e:
                logger.error(f"Erreur lors du parsing du fichier Python: {str(e)}")
                parsed_content = []

        return jsonify({
            'success': True,
            'content': content,
            'parsed_content': parsed_content
        })

    except Exception as e:
        logger.error(f"Erreur lors de l'ouverture du fichier: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

# Route pour charger le contenu d'un dossier spécifique
@app.route('/load_folder', methods=['POST'])
def load_folder():
    try:
        global CURRENT_PROJECT_PATH
        data = request.get_json()
        project_path = data.get('project_path')
        folder_path = data.get('folder_path')

        logger.info(f"Chargement du dossier: {folder_path} dans le projet: {project_path}")
        
        # Donner la priorité au chemin du projet global sur celui fourni dans la requête
        if CURRENT_PROJECT_PATH:
            # Si un chemin est fourni dans la requête mais qu'il est différent du chemin global, utiliser le chemin global
            if project_path and project_path != CURRENT_PROJECT_PATH:
                logger.info(f"Remplacement du chemin fourni ({project_path}) par le chemin global ({CURRENT_PROJECT_PATH}) pour le chargement du dossier")
            project_path = CURRENT_PROJECT_PATH
            logger.info(f"Utilisation du chemin de projet global pour le chargement du dossier: {project_path}")
        elif not project_path:
            logger.error("Project path is required")
            return jsonify({
                'success': False,
                'message': 'Project path is required'
            })
        
        if not folder_path:
            logger.error("Folder path is required")
            return jsonify({
                'success': False,
                'message': 'Folder path is required'
            })
        # Chemin complet du dossier
        full_folder_path = os.path.join(project_path, folder_path)
        logger.info(f"Chemin complet du dossier: {full_folder_path}")

        if not os.path.exists(full_folder_path):
            logger.error(f"Le dossier {full_folder_path} n'existe pas")
            # Essayer avec un chemin alternatif si le chemin original ne fonctionne pas
            alternative_paths = [
                # Essayer avec le chemin relatif
                os.path.join(os.path.dirname(os.path.abspath(__file__)), folder_path),
                # Essayer avec un chemin absolu direct
                folder_path if os.path.isabs(folder_path) else None
            ]
            for alt_path in alternative_paths:
                if alt_path and os.path.exists(alt_path) and os.path.isdir(alt_path):
                    logger.info(f"Utilisation du chemin alternatif: {alt_path}")
                    full_folder_path = alt_path
                    break
            else:
                return jsonify({
                    'success': False,
                    'message': f"Le dossier {folder_path} n'existe pas"
                })
        if not os.path.isdir(full_folder_path):
            logger.error(f"Le chemin {full_folder_path} n'est pas un dossier")
            return jsonify({
                'success': False,
                'message': f"Le chemin {folder_path} n'est pas un dossier"
            })
        # Utiliser ThreadPoolExecutor pour paralléliser la lecture des fichiers
        folder_contents = []
        def process_item(item):
            item_path = os.path.join(full_folder_path, item)
            rel_path = os.path.join(folder_path, item)

            if os.path.isdir(item_path):
                return {
                    'name': item,
                    'type': 'directory',
                    'path': rel_path,
                    'has_children': len(os.listdir(item_path)) > 0,
                    'children': []  # Les enfants seront chargés à la demande
                }
            else:
                return {
                    'name': item,
                    'type': 'file',
                    'path': rel_path
                }

        try:
            items = os.listdir(full_folder_path)
            logger.info(f"Contenu du dossier {full_folder_path}: {len(items)} éléments")
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du dossier {full_folder_path}: {str(e)}")
            return jsonify({
                'success': False,
                'message': f"Erreur lors de la lecture du dossier: {str(e)}"
            })

        # Filtrer les dossiers cachés et les fichiers selon les règles
        top_level_folder = folder_path.split('/')[0] if '/' in folder_path else folder_path
        top_level_folder = top_level_folder.split('\\')[0] if '\\' in top_level_folder else top_level_folder

        filtered_items = []
        for item in items:
            if item.startswith('.'):
                continue

            item_path = os.path.join(full_folder_path, item)
            if os.path.isfile(item_path):
                # Vérifier les extensions autorisées pour ce dossier
                if top_level_folder in FOLDER_CONFIG:
                    config = FOLDER_CONFIG[top_level_folder]
                    extensions = config.get('extensions', [])

                    if config.get('show_all', False):
                        filtered_items.append(item)
                    elif extensions and extensions[0] == '*':
                        filtered_items.append(item)
                    elif any(item.endswith(ext) for ext in extensions):
                        filtered_items.append(item)
                else:
                    filtered_items.append(item)
            else:
                if top_level_folder in FOLDER_CONFIG:
                    config = FOLDER_CONFIG[top_level_folder]
                    if config.get('allow_subdirs', False):
                        filtered_items.append(item)
                else:
                    filtered_items.append(item)

        with ThreadPoolExecutor(max_workers=10) as executor:
            folder_contents = list(executor.map(process_item, filtered_items))

        logger.info(f"Contenu du dossier {folder_path} chargé avec succès: {len(folder_contents)} éléments")
        return jsonify({
            'success': True,
            'folder_path': folder_path,
            'contents': folder_contents
        })
    except Exception as e:
        logger.error(f"Erreur lors du chargement du dossier: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/save_file', methods=['POST'])
def save_file():
    try:
        global CURRENT_PROJECT_PATH
        data = request.get_json()
        file_path = data.get('path')
        content = data.get('content')
        project_path = data.get('project_path', '')

        # Donner la priorité au chemin du projet global sur celui fourni dans la requête
        if CURRENT_PROJECT_PATH:
            # Si un chemin est fourni dans la requête mais qu'il est différent du chemin global, utiliser le chemin global
            if project_path and project_path != CURRENT_PROJECT_PATH:
                logger.info(f"Remplacement du chemin fourni ({project_path}) par le chemin global ({CURRENT_PROJECT_PATH}) pour la sauvegarde du fichier")
            project_path = CURRENT_PROJECT_PATH
            logger.info(f"Utilisation du chemin de projet global pour la sauvegarde du fichier: {project_path}")
        elif not project_path:
            logger.warning("Aucun chemin de projet fourni pour la sauvegarde du fichier")

        if not file_path or content is None:
            return jsonify({
                'success': False,
                'message': 'File path and content are required'
            })
        file_path = file_path.replace('pythonProjectSeleniumV4/pythonProjectSeleniumV4/', '')
        absolute_path = os.path.join(project_path, file_path)

        directory = os.path.dirname(absolute_path)
        if not os.path.exists(directory):
            try:
                os.makedirs(directory)
                logger.info(f"Dossier créé: {directory}")
            except Exception as e:
                logger.error(f"Erreur lors de la création du dossier {directory}: {str(e)}")
                return jsonify({
                    'success': False,
                    'message': f"Erreur lors de la création du dossier: {str(e)}"
                })
        if absolute_path.endswith('.py'):
            if not content.strip().startswith('def test():'):
                steps = []
                try:
                    parsed_steps = json.loads(content)
                    for step in parsed_steps:
                        action = step.get('action', '')
                        target = step.get('target', '')
                        value = step.get('value', '')
                        if value:
                            steps.append(f'    {action}("{target}", "{value}")')
                        else:
                            steps.append(f'    {action}("{target}")')
                except json.JSONDecodeError:
                    steps = [content]

                content = 'def test():\n' + '\n'.join(steps)
        try:
            with open(absolute_path, 'w', encoding='utf-8') as file:
                file.write(content)
            logger.info(f"Fichier sauvegardé avec succès: {absolute_path}")
        except Exception as e:
            logger.error(f"Erreur lors de l'écriture du fichier {absolute_path}: {str(e)}")
            return jsonify({
                'success': False,
                'message': f"Erreur lors de l'écriture du fichier: {str(e)}"
            })

        return jsonify({
            'success': True,
            'message': 'File saved successfully'
        })
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/save_py_file', methods=['POST'])
def save_py_file():
    try:
        data = request.get_json()
        file_path = data.get('path')
        content = data.get('content')
        if not file_path or content is None:
            return jsonify({
                'success': False,
                'message': 'File path and content are required'
            })
        file_path = file_path.replace('\\', '/')
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'message': f'File not found: {file_path}'
            })
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)

        logger.info(f"Fichier Python sauvegardé avec succès: {file_path}")
        return jsonify({
            'success': True,
            'message': 'Python file saved successfully'
        })
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier Python: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/format_python', methods=['POST'])
def format_python():
    try:
        data = request.get_json()
        code = data.get('code', '')

        if not code:
            return jsonify({
                'success': False,
                'error': 'Aucun code fourni'
            })
        try:
            with tempfile.NamedTemporaryFile(suffix='.py', delete=False, mode='w', encoding='utf-8') as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(code)

            result = subprocess.run(
                ['black', '--line-length=100', '--fast', temp_file_path],
                capture_output=True,
                text=True
            )
            with open(temp_file_path, 'r', encoding='utf-8') as formatted_file:
                formatted_code = formatted_file.read()
            os.unlink(temp_file_path)
            if result.returncode == 0:
                logger.info("Code Python formaté avec succès")
                return jsonify({
                    'success': True,
                    'formatted_code': formatted_code
                })
            else:
                logger.warning(f"Erreur lors du formatage avec black: {result.stderr}")
                return jsonify({
                    'success': False,
                    'error': f"Erreur de formatage: {result.stderr}",
                    'formatted_code': code  # Retourner le code original
                })
        except FileNotFoundError:
            logger.warning("Black n'est pas installé, tentative d'installation...")
            try:
                subprocess.run(['pip', 'install', 'black'], check=True)
                logger.info("Black installé avec succès, nouvelle tentative de formatage...")
                return format_python()
            except Exception as install_error:
                logger.error(f"Impossible d'installer black: {str(install_error)}")
                return jsonify({
                    'success': False,
                    'error': f"Black n'est pas disponible: {str(install_error)}",
                    'formatted_code': code
                })

    except Exception as e:
        logger.error(f"Erreur lors du formatage du code Python: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'formatted_code': code
        })

@app.route('/format_xml', methods=['POST'])
def format_xml():
    try:
        data = request.get_json()
        xml_content = data.get('code', '')

        if not xml_content:
            return jsonify({
                'success': False,
                'error': 'Aucun contenu XML fourni',
                'formatted_code': xml_content
            })

        try:
            dom = xml.dom.minidom.parseString(xml_content)
            formatted_xml = dom.toprettyxml(indent='  ')

            lines = formatted_xml.split('\n')
            cleaned_lines = [line for line in lines if line.strip()]
            formatted_xml = '\n'.join(cleaned_lines)

            logger.info("XML formaté avec succès")
            return jsonify({
                'success': True,
                'formatted_code': formatted_xml
            })
        except xml.parsers.expat.ExpatError as xml_error:
            logger.warning(f"Erreur lors du formatage XML: {str(xml_error)}")
            return jsonify({
                'success': False,
                'error': f"XML invalide: {str(xml_error)}",
                'formatted_code': xml_content
            })
    except Exception as e:
        logger.error(f"Erreur lors du formatage XML: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'formatted_code': xml_content
        })

@app.route('/check_file_exists', methods=['POST'])
def check_file_exists():
    try:
        data = request.json
        file_path = data.get('path', '')
        project_path = data.get('project_path', '')
        if not os.path.isabs(file_path) and project_path:
            file_path = os.path.join(project_path, file_path)
        exists = os.path.isfile(file_path)

        return jsonify({
            'success': True,
            'exists': exists,
            'path': file_path
        })
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de l'existence du fichier: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Erreur lors de la vérification de l'existence du fichier: {str(e)}",
            'exists': False
        })

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    try:
        project_path = request.args.get('project_path')

        if not project_path:
            return jsonify({
                'success': False,
                'error': 'Chemin du projet non spécifié',
                'profiles': []
            })
        profiles_path = os.path.join(project_path, 'Profiles')
        if not os.path.isdir(profiles_path):
            return jsonify({
                'success': False,
                'error': 'Dossier Profiles non trouvé',
                'profiles': []
            })
        profiles = []
        for root, dirs, files in os.walk(profiles_path):
            for file in files:
                if file.endswith('.glbl'):
                    profile_name = os.path.splitext(file)[0]
                    profiles.append(profile_name)
        if 'default' in profiles:
            profiles.remove('default')
            profiles.insert(0, 'default')
        else:
            profiles.insert(0, 'default')
        return jsonify({
            'success': True,
            'profiles': profiles
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des profils: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'profiles': []
        })

@app.route('/api/profile_content', methods=['GET'])
def get_profile_content():
    try:
        project_path = request.args.get('project_path', '')
        profile_name = request.args.get('profile_name', '')
        
        if not project_path or not profile_name:
            return jsonify({
                'success': False,
                'error': 'Chemin du projet et nom du profil requis',
                'variables': []
            })

        profile_path = os.path.join(project_path, 'Profiles', f"{profile_name}.glbl")
        
        if not os.path.isfile(profile_path):
            return jsonify({
                'success': False,
                'error': f'Fichier de profil {profile_name}.glbl non trouvé',
                'variables': []
            })
        
        with open(profile_path, 'r', encoding='utf-8') as file:
            content = file.read()

        variables = []
        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(content)
            
            for var in root.findall('.//GlobalVariableEntity'):
                name = var.find('name').text if var.find('name') is not None else ''
                value = var.find('initValue').text if var.find('initValue') is not None else ''
                description = var.find('description').text if var.find('description') is not None else ''
                
                variables.append({
                    'name': name,
                    'value': value,
                    'description': description
                })
        except Exception as xml_error:
            logger.error(f"Erreur lors de l'analyse du fichier XML: {str(xml_error)}")
            return jsonify({
                'success': False,
                'error': f"Erreur lors de l'analyse du fichier XML: {str(xml_error)}",
                'variables': []
            })
        
        return jsonify({
            'success': True,
            'variables': variables
        })
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du contenu du profil: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'variables': []
        })


@app.route('/api/execute_test_case', methods=['POST'])
def execute_test_case():
    try:
        global CURRENT_PROJECT_PATH
        data = request.json
        project_path = data.get('projectPath')
        test_case_path = data.get('testCasePath')
        profile_name = data.get('profileName')

        logger.info(
            f"Exécution du test case - Données reçues: projectPath={project_path}, testCasePath={test_case_path}, profileName={profile_name}")

        # Donner la priorité au chemin du projet global sur celui fourni dans la requête
        if CURRENT_PROJECT_PATH:
            # Si un chemin est fourni dans la requête mais qu'il est différent du chemin global, utiliser le chemin global
            if project_path and project_path != CURRENT_PROJECT_PATH:
                logger.info(
                    f"Remplacement du chemin fourni ({project_path}) par le chemin global ({CURRENT_PROJECT_PATH})")
            project_path = CURRENT_PROJECT_PATH
            logger.info(f"Utilisation du chemin de projet global: {project_path}")
        elif not project_path:
            return jsonify({'error': 'Chemin du projet requis'}), 400

        if not test_case_path:
            return jsonify({'error': 'Chemin du test case requis'}), 400

        # Vérifier si le chemin du projet existe
        if not os.path.exists(project_path):
            logger.error(f"Chemin du projet non trouvé: {project_path}")

            # Vérifier si c'est un chemin relatif ou un nom de dossier simple
            if not os.path.isabs(project_path):
                # Essayer de résoudre le chemin relatif
                user_home = os.path.expanduser('~')
                possible_paths = [
                    os.path.join(user_home, "Desktop", project_path),
                    os.path.join(user_home, "Downloads", project_path)
                ]

                # Ajouter le chemin du projet actuel comme possibilité
                if CURRENT_PROJECT_PATH:
                    possible_paths.append(os.path.join(CURRENT_PROJECT_PATH, project_path))

                for path in possible_paths:
                    logger.info(f"Essai du chemin: {path}")
                    if os.path.exists(path):
                        project_path = path
                        logger.info(f"Chemin du projet résolu: {project_path}")
                        break
                else:
                    return jsonify({
                                       'error': f'Chemin du projet non trouvé: {project_path}. Essayez d\'ouvrir le projet à nouveau.'}), 404
            else:
                # C'est un chemin absolu qui n'existe pas
                return jsonify({'error': f'Chemin du projet non trouvé: {project_path}'}), 404

        # Vérifier si le test case existe
        # Si le chemin du test case n'est pas absolu, le construire à partir du chemin du projet
        if not os.path.isabs(test_case_path):
            # Essayer de construire le chemin complet
            test_case_path_full = os.path.join(project_path, test_case_path)
            logger.info(f"Chemin relatif détecté, construction du chemin complet: {test_case_path_full}")
            test_case_path = test_case_path_full

        # Vérifier si le test case existe maintenant
        if not os.path.exists(test_case_path):
            # Essayer de résoudre le chemin en supposant qu'il manque peut-être le préfixe "TestCases/"
            if "TestCases" in test_case_path and not os.path.exists(test_case_path):
                # Extraire la partie après "TestCases"
                test_case_rel_path = test_case_path.split("TestCases" + os.sep, 1)[-1]
                test_case_path_alt = os.path.join(project_path, "TestCases", test_case_rel_path)
                logger.info(f"Essai avec un chemin alternatif: {test_case_path_alt}")

                if os.path.exists(test_case_path_alt):
                    test_case_path = test_case_path_alt
                    logger.info(f"Chemin du test case résolu: {test_case_path}")
                else:
                    return jsonify({'error': f'Chemin du test case non trouvé: {test_case_path}'}), 404
            else:
                return jsonify({'error': f'Chemin du test case non trouvé: {test_case_path}'}), 404

        # Obtenir le chemin relatif uniquement à partir du dossier TestCases
        rel_test_case_path = test_case_path.split('TestCases' + os.sep, 1)[-1]
        rel_test_case_path = rel_test_case_path.replace('\\', '/').replace('.py', '')
        test_case_id = rel_test_case_path

        logger.info(f"Chemin relatif du test case: {test_case_id}")

        # Créer le dossier report s'il n'existe pas
        report_dir = os.path.join(project_path, 'report')
        if not os.path.exists(report_dir):
            os.makedirs(report_dir)
            logger.info(f"Dossier report créé: {report_dir}")

        # Créer ou vider le fichier log pour ce test case
        log_file_path = os.path.join(report_dir, f"{test_case_id.split('/')[-1]}.log")
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write(f"=== DÉMARRAGE DU TEST CASE: {test_case_id} ===\n")
            f.write(f"Date et heure: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Profil utilisé: {profile_name}\n")
            f.write(f"Chemin du projet: {project_path}\n")
            f.write("=== INITIALISATION ===\n")

        logger.info(f"Fichier log créé: {log_file_path}")

        # Au lieu de créer un script bootstrap personnalisé, utiliser directement le TestCaseExecutorLauncher.py
        # en le modifiant légèrement pour utiliser le test case et le profil spécifiés
        launcher_path = os.path.join(project_path, 'TestCaseExecutorLauncher.py')
        if not os.path.exists(launcher_path):
            error_msg = 'Fichier TestCaseExecutorLauncher.py non trouvé'
            # Écrire l'erreur dans le fichier log
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write(f"ERROR: {error_msg}\n")
                f.write("=== TEST CASE FAILED ===\n")
            return jsonify({'error': error_msg}), 404

        # Lire le contenu du fichier TestCaseExecutorLauncher.py original
        with open(launcher_path, 'r', encoding='utf-8') as file:
            launcher_content = file.read()

        # Créer une copie temporaire du launcher
        temp_launcher_path = os.path.join(project_path, 'temp_launcher.py')

        # Remplacer le test case et le profil dans le launcher
        test_case_pattern = r"test_case_result\s*=\s*executor\.execute_test_case\(['\"]([^'\"]+)['\"]\)"
        if re.search(test_case_pattern, launcher_content):
            modified_content = re.sub(
                test_case_pattern,
                f"test_case_result = executor.execute_test_case('{test_case_id}')",
                launcher_content
            )
        else:
            modified_content = launcher_content

        # Remplacer le profil si spécifié
        profile_pattern = r"global_vars\s*=\s*EnvironmentLoader\.load_global_variables\(['\"]([^'\"]+)['\"]\)"
        if re.search(profile_pattern, modified_content) and profile_name:
            modified_content = re.sub(
                profile_pattern,
                f"global_vars = EnvironmentLoader.load_global_variables('{profile_name}')",
                modified_content
            )

        # Ajouter du code pour écrire dans le fichier log
        log_code = f"""
# Ajouter du code pour écrire dans le fichier log
import os
import datetime
import traceback
import sys

log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'report', '{test_case_id.split('/')[-1]}.log')

def write_to_log(message):
    with open(log_file_path, 'a', encoding='utf-8') as f:
        timestamp = datetime.datetime.now().strftime('%H:%M:%S')
        f.write(f"[{{timestamp}}] {{message}}\\n")

# Ajouter le chemin du projet au PYTHONPATH
project_path = os.path.dirname(os.path.abspath(__file__))
if project_path not in sys.path:
    sys.path.insert(0, project_path)
    write_to_log(f"Ajout du chemin du projet au PYTHONPATH: {{project_path}}")

# Écrire un message au début de l'exécution
write_to_log("Démarrage de l'exécution du test case")

# Rediriger les sorties standard et d'erreur vers le fichier log
class LogRedirector:
    def __init__(self, log_file_path):
        self.log_file_path = log_file_path
        self.terminal = sys.stdout

    def write(self, message):
        self.terminal.write(message)
        if message.strip():
            with open(self.log_file_path, 'a', encoding='utf-8') as f:
                f.write(message)

    def flush(self):
        self.terminal.flush()

sys.stdout = LogRedirector(log_file_path)
sys.stderr = LogRedirector(log_file_path)

# Capturer les exceptions et les écrire dans le log
try:
"""

        # Ajouter un bloc try/except autour du code principal
        modified_content = log_code + "\n".join(["    " + line for line in modified_content.split("\n")])
        modified_content += """
except Exception as e:
    error_message = f"ERREUR: {str(e)}"
    write_to_log(error_message)
    write_to_log(traceback.format_exc())
    write_to_log("=== TEST CASE FAILED ===")
    sys.exit(1)

# Écrire un message à la fin de l'exécution
write_to_log("=== TEST CASE COMPLETED ===")
"""

        # Écrire le contenu modifié dans le fichier temporaire
        with open(temp_launcher_path, 'w', encoding='utf-8') as file:
            file.write(modified_content)

        try:
            # Écrire dans le log que nous allons exécuter le test
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write("Exécution du test case avec Python 3.12...\n")

            # Exécuter le fichier temporaire avec Python 3.12
            python312_path = r'C:\Program Files\Python312\python.exe'

            # Initialiser python_args avec une valeur par défaut
            python_args = [temp_launcher_path]

            # Vérifier si Python 3.12 existe
            if not os.path.exists(python312_path):
                # Chercher Python 3.12 dans d'autres emplacements courants
                possible_paths = [
                    r'C:\Python312\python.exe',
                    r'C:\Program Files\Python312\python.exe',
                    r'C:\Program Files (x86)\Python312\python.exe',
                    os.path.join(os.path.expanduser("~"), "AppData", "Local", "Programs", "Python", "Python312",
                                 "python.exe")
                ]

                for path in possible_paths:
                    if os.path.exists(path):
                        python312_path = path
                        logger.info(f"Python 3.12 trouvé: {python312_path}")
                        break
                else:
                    # Si Python 3.12 n'est pas trouvé, utiliser 'py -3.12' qui utilise le launcher Python
                    python312_path = 'py'
                    python_args = ['-3.12', temp_launcher_path]
                    logger.info("Python 3.12 non trouvé, utilisation du launcher Python avec -3.12")

            # Construire la commande
            cmd = [python312_path] + python_args

            logger.info(f"Exécution du test case avec la commande: {' '.join(cmd)}")

            # Écrire la commande dans le log
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write(f"Commande: {' '.join(cmd)}\n")

            # Exécuter le fichier temporaire
            process = subprocess.Popen(
                cmd,
                cwd=project_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            stdout, stderr = process.communicate()

            # Journaliser la sortie pour le débogage
            logger.info(f"Sortie standard: {stdout}")
            logger.info(f"Erreur standard: {stderr}")

            # Écrire la sortie dans le fichier log
            with open(log_file_path, 'a', encoding='utf-8') as f:
                if stdout:
                    f.write("\n=== SORTIE STANDARD ===\n")
                    f.write(stdout)
                if stderr:
                    f.write("\n=== ERREUR STANDARD ===\n")
                    f.write(stderr)

                # Écrire le statut final
                if process.returncode == 0:
                    f.write("\n=== TEST CASE COMPLETED ===\n")
                else:
                    f.write("\n=== TEST CASE FAILED ===\n")

            # Vérifier si l'exécution a réussi
            if process.returncode == 0:
                return jsonify({
                    'success': True,
                    'output': stdout,
                    'error': stderr
                })
            else:
                # Construire un message d'erreur plus détaillé
                error_message = f"Échec de l'exécution du test (code {process.returncode}).\n"
                if stderr:
                    error_message += f"Erreur: {stderr}\n"
                if stdout:
                    error_message += f"Sortie: {stdout}"

                return jsonify({
                    'success': False,
                    'output': stdout,
                    'error': error_message
                })
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution du test: {str(e)}")

            # Écrire l'erreur dans le fichier log
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write(f"\nERROR: {str(e)}\n")
                f.write(traceback.format_exc())
                f.write("\n=== TEST CASE FAILED ===\n")

            return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Erreur générale: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stream_logs', methods=['GET'])
def stream_logs():
    """
    Streame le contenu du fichier log d'un test case en temps réel.
    Utilise un générateur pour envoyer les nouvelles lignes au fur et à mesure qu'elles sont ajoutées.
    """
    global CURRENT_PROJECT_PATH
    project_path = request.args.get('project_path')
    test_case_name = request.args.get('test_case_name')

    # Donner la priorité au chemin du projet global sur celui fourni dans la requête
    if CURRENT_PROJECT_PATH:
        # Si un chemin est fourni dans la requête mais qu'il est différent du chemin global, utiliser le chemin global
        if project_path and project_path != CURRENT_PROJECT_PATH:
            logger.info(
                f"Remplacement du chemin fourni ({project_path}) par le chemin global ({CURRENT_PROJECT_PATH}) pour le streaming des logs")
        project_path = CURRENT_PROJECT_PATH
        logger.info(f"Utilisation du chemin de projet global pour le streaming des logs: {project_path}")
    elif not project_path:
        return jsonify({'error': 'Chemin du projet requis'}), 400

    if not test_case_name:
        return jsonify({'error': 'Nom du test case requis'}), 400

    # Construire le chemin du fichier log
    log_file_path = os.path.join(project_path, 'report', f"{test_case_name}.log")
    logger.info(f"Streaming des logs depuis: {log_file_path}")

    # Vérifier si le dossier report existe, sinon le créer
    report_dir = os.path.join(project_path, 'report')
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)
        logger.info(f"Dossier report créé: {report_dir}")

    # Créer un fichier log vide s'il n'existe pas
    if not os.path.exists(log_file_path):
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write("Démarrage du streaming des logs...\n")
        logger.info(f"Fichier log créé: {log_file_path}")

    def generate():
        """Générateur qui lit le fichier log et envoie les nouvelles lignes."""
        # Position dans le fichier
        position = 0

        # Envoyer un message initial
        yield f"data: {json.dumps({'content': 'Initialisation du streaming des logs...\n'})}\n\n"

        # Boucle jusqu'à ce que le test soit terminé
        while True:
            try:
                # Vérifier si le fichier existe
                if not os.path.exists(log_file_path):
                    logger.error(f"Fichier log non trouvé: {log_file_path}")
                    yield f"data: {json.dumps({'error': 'Fichier log non trouvé'})}\n\n"
                    break

                # Ouvrir le fichier et se positionner
                with open(log_file_path, 'r', encoding='utf-8') as f:
                    f.seek(position)
                    new_data = f.read()
                    position = f.tell()

                # S'il y a de nouvelles données, les envoyer
                if new_data:
                    logger.info(f"Nouvelles données lues: {len(new_data)} caractères")
                    yield f"data: {json.dumps({'content': new_data})}\n\n"

                # Vérifier si le test est terminé (rechercher des marqueurs de fin)
                if "TEST CASE COMPLETED" in new_data or "TEST CASE FAILED" in new_data:
                    logger.info("Marqueur de fin détecté, arrêt du streaming")
                    yield f"data: {json.dumps({'status': 'completed'})}\n\n"
                    break

                # Attendre un peu avant de vérifier à nouveau
                time.sleep(0.5)

            except Exception as e:
                logger.error(f"Erreur lors du streaming des logs: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break

    # Retourner un flux d'événements SSE (Server-Sent Events)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/get_full_path', methods=['POST'])
def get_full_path():
    """
    Récupère le chemin complet d'un dossier à partir de son nom.
    Cette route est utilisée par le client pour obtenir le chemin absolu d'un dossier sélectionné.
    """
    try:
        data = request.get_json()
        directory_name = data.get('directory_name')
        
        if not directory_name:
            logger.error("Nom du dossier manquant dans la requête")
            return jsonify({
                'success': False,
                'message': 'Nom du dossier requis'
            }), 400
        
        logger.info(f"Récupération du chemin complet pour le dossier: {directory_name}")
        
        # Vérifier si le nom du dossier contient déjà un chemin absolu
        if os.path.isabs(directory_name):
            logger.info(f"Le nom du dossier est déjà un chemin absolu: {directory_name}")
            return jsonify({
                'success': True,
                'full_path': directory_name
            })
        
        # Essayer de trouver le dossier dans différents emplacements
        possible_locations = []
        
        # Ajouter tous les lecteurs disponibles (Windows)
        import string
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            if os.path.exists(drive):
                possible_locations.append(drive)
                
                # Ajouter les chemins Users pour chaque lecteur
                users_path = os.path.join(drive, "Users")
                if os.path.exists(users_path):
                    # Ajouter tous les utilisateurs
                    try:
                        for user in os.listdir(users_path):
                            user_path = os.path.join(users_path, user)
                            if os.path.isdir(user_path):
                                # Ajouter le chemin de l'utilisateur
                                possible_locations.append(user_path)
                                # Ajouter Desktop et Downloads pour cet utilisateur
                                desktop_path = os.path.join(user_path, "Desktop")
                                downloads_path = os.path.join(user_path, "Downloads")
                                if os.path.exists(desktop_path):
                                    possible_locations.append(desktop_path)
                                if os.path.exists(downloads_path):
                                    possible_locations.append(downloads_path)
                    except Exception as e:
                        logger.error(f"Erreur lors de la lecture du dossier Users: {str(e)}")
        
        # Ajouter les emplacements standards
        possible_locations.extend([
            os.getcwd(),  # Répertoire courant
            os.path.expanduser('~'),  # Répertoire utilisateur
            os.path.join(os.path.expanduser('~'), 'Desktop'),  # Bureau
            os.path.join(os.path.expanduser('~'), 'Downloads'),  # Téléchargements
        ])
        
        logger.info(f"Recherche dans {len(possible_locations)} emplacements possibles")
        
        # Chercher le dossier dans les emplacements possibles
        for location in possible_locations:
            full_path = os.path.join(location, directory_name)
            logger.debug(f"Vérification du chemin: {full_path}")
            if os.path.exists(full_path) and os.path.isdir(full_path):
                logger.info(f"Dossier trouvé: {full_path}")
                return jsonify({
                    'success': True,
                    'full_path': full_path
                })
        
        # Si le dossier n'est pas trouvé, essayer de construire un chemin absolu
        # à partir du nom du dossier (pour les cas où le nom contient déjà un chemin partiel)
        for drive_letter in string.ascii_uppercase:
            if directory_name.startswith(f"{drive_letter}:"):
                # Le nom contient déjà une lettre de lecteur, considérer comme un chemin absolu
                logger.info(f"Utilisation du chemin avec lettre de lecteur: {directory_name}")
                return jsonify({
                    'success': True,
                    'full_path': directory_name
                })
        
        # Essayer de construire un chemin absolu en utilisant des informations du client
        # Vérifier si le nom du dossier contient un nom d'utilisateur
        if "Users" in directory_name:
            parts = directory_name.split(os.path.sep)
            if "Users" in parts:
                users_index = parts.index("Users")
                if users_index + 1 < len(parts):  # S'assurer qu'il y a un nom d'utilisateur après "Users"
                    username = parts[users_index + 1]
                    # Construire un chemin absolu
                    for drive_letter in string.ascii_uppercase:
                        drive = f"{drive_letter}:\\"
                        if os.path.exists(drive):
                            potential_path = os.path.join(drive, "Users", username)
                            if os.path.exists(potential_path):
                                # Reconstruire le chemin complet
                                full_path = os.path.join(drive, *parts[users_index:])
                                logger.info(f"Chemin reconstruit à partir du nom d'utilisateur: {full_path}")
                                if os.path.exists(full_path) and os.path.isdir(full_path):
                                    return jsonify({
                                        'success': True,
                                        'full_path': full_path
                                    })
        
        # Permettre à l'utilisateur de spécifier manuellement le chemin complet
        # Cela est utile lorsque le serveur ne peut pas déterminer automatiquement le chemin
        logger.warning(f"Impossible de trouver le chemin complet pour: {directory_name}")
        return jsonify({
            'success': True,  # On renvoie success=True pour éviter l'erreur côté client
            'full_path': directory_name,  # On renvoie le nom du dossier tel quel
            'message': f"Chemin non trouvé automatiquement, utilisation du nom fourni: {directory_name}"
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du chemin complet: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/get_user_info', methods=['GET'])
def get_user_info():
    """
    Récupère les informations de l'utilisateur actuel.
    Cette route est utilisée par le client pour obtenir le nom d'utilisateur actuel.
    """
    try:
        # Récupérer le nom d'utilisateur à partir du chemin d'accès
        user_home = os.path.expanduser('~')
        username = os.path.basename(user_home)
        
        logger.info(f"Récupération des informations de l'utilisateur: {username}")
        
        # Récupérer les informations supplémentaires si nécessaire
        user_info = {
            'username': username,
            'home_directory': user_home,
            'desktop_directory': os.path.join(user_home, 'Desktop'),
            'downloads_directory': os.path.join(user_home, 'Downloads')
        }
        
        return jsonify({
            'success': True,
            'user_info': user_info
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des informations utilisateur: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/check_paths', methods=['POST'])
def check_paths():
    """
    Vérifie une liste de chemins possibles et retourne le premier chemin valide.
    Cette route est utilisée par le client pour déterminer le chemin complet d'un dossier.
    """
    try:
        data = request.get_json()
        paths = data.get('paths', [])
        
        if not paths:
            logger.error("Aucun chemin fourni dans la requête")
            return jsonify({
                'success': False,
                'message': 'Aucun chemin fourni'
            }), 400
        
        logger.info(f"Vérification de {len(paths)} chemins possibles")
        
        # Vérifier chaque chemin et retourner le premier valide
        for path in paths:
            logger.debug(f"Vérification du chemin: {path}")
            if os.path.exists(path) and os.path.isdir(path):
                logger.info(f"Chemin valide trouvé: {path}")
                return jsonify({
                    'success': True,
                    'valid_path': path
                })
        
        # Si aucun chemin n'est valide, essayer de construire un chemin à partir des informations fournies
        for path in paths:
            # Vérifier si le chemin contient un nom d'utilisateur
            if "Users" in path:
                parts = path.split(os.path.sep)
                if "Users" in parts:
                    users_index = parts.index("Users")
                    if users_index + 1 < len(parts):  # S'assurer qu'il y a un nom d'utilisateur après "Users"
                        username = parts[users_index + 1]
                        # Construire un chemin absolu
                        for drive_letter in string.ascii_uppercase:
                            drive = f"{drive_letter}:\\"
                            if os.path.exists(drive):
                                potential_path = os.path.join(drive, "Users", username)
                                if os.path.exists(potential_path):
                                    # Reconstruire le chemin complet
                                    reconstructed_path = os.path.join(drive, *parts[users_index:])
                                    logger.info(f"Chemin reconstruit à partir du nom d'utilisateur: {reconstructed_path}")
                                    if os.path.exists(reconstructed_path) and os.path.isdir(reconstructed_path):
                                        return jsonify({
                                            'success': True,
                                            'valid_path': reconstructed_path
                                        })
        
        # Si aucun chemin n'est valide, essayer de chercher le dossier dans les emplacements courants
        folder_name = os.path.basename(paths[0]) if paths else ""
        if folder_name:
            # Rechercher dans tous les lecteurs et tous les profils utilisateurs
            for drive_letter in string.ascii_uppercase:
                drive = f"{drive_letter}:\\"
                if os.path.exists(drive):
                    # Vérifier à la racine du lecteur
                    root_path = os.path.join(drive, folder_name)
                    if os.path.exists(root_path) and os.path.isdir(root_path):
                        logger.info(f"Dossier trouvé à la racine du lecteur: {root_path}")
                        return jsonify({
                            'success': True,
                            'valid_path': root_path
                        })
                    
                    # Vérifier dans les dossiers utilisateurs
                    users_path = os.path.join(drive, "Users")
                    if os.path.exists(users_path):
                        try:
                            for user in os.listdir(users_path):
                                user_path = os.path.join(users_path, user)
                                if os.path.isdir(user_path):
                                    # Vérifier dans les emplacements courants pour cet utilisateur
                                    locations = [
                                        "Desktop",
                                        "Downloads",
                                        "Documents",
                                        "PycharmProjects",
                                        "IdeaProjects",
                                        "Projects"
                                    ]
                                    
                                    for location in locations:
                                        location_path = os.path.join(user_path, location)
                                        if os.path.exists(location_path):
                                            folder_path = os.path.join(location_path, folder_name)
                                            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                                                logger.info(f"Dossier trouvé: {folder_path}")
                                                return jsonify({
                                                    'success': True,
                                                    'valid_path': folder_path
                                                })
                        except Exception as e:
                            logger.error(f"Erreur lors de la lecture du dossier Users: {str(e)}")
        
        # Si aucun chemin n'est valide, retourner une erreur
        logger.warning(f"Aucun chemin valide trouvé parmi les {len(paths)} chemins fournis")
        return jsonify({
            'success': False,
            'message': 'Aucun chemin valide trouvé'
        })
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des chemins: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/create-folder', methods=['POST'])
def create_folder():
    """
    Crée un dossier sur le disque à l'endroit indiqué (relatif au projet courant)
    Body attendu : {"parent": "TestCases", "name": "NouveauDossier"}
    """
    global CURRENT_PROJECT_PATH
    data = request.json
    parent = data.get('parent')
    name = data.get('name')
    if not CURRENT_PROJECT_PATH or not parent or not name:
        return jsonify({'success': False, 'message': 'Paramètres manquants'}), 400
    parent_path = os.path.join(CURRENT_PROJECT_PATH, parent)
    target_path = os.path.join(parent_path, name)
    try:
        os.makedirs(target_path, exist_ok=False)
        return jsonify({'success': True, 'path': target_path})
    except FileExistsError:
        return jsonify({'success': False, 'message': 'Le dossier existe déjà.'}), 409
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/create-file', methods=['POST'])
def create_file():
    """
    Crée un fichier sur le disque à l'endroit indiqué (relatif au projet courant)
    Body attendu : {"parent": "TestCases", "name": "NouveauTestCase.py"}
    """
    global CURRENT_PROJECT_PATH
    data = request.get_json()
    parent = data.get('parent')
    name = data.get('name')
    xml_for_test_case = data.get('xmlForTestCase', False)
    if not CURRENT_PROJECT_PATH or not parent or not name:
        return jsonify({'success': False, 'message': 'Paramètres manquants'}), 400
    parent_path = os.path.join(CURRENT_PROJECT_PATH, parent)
    target_path = os.path.join(parent_path, name)
    try:
        if os.path.exists(target_path):
            return jsonify({'success': False, 'message': 'Le fichier existe déjà.'}), 409
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        if xml_for_test_case and name.endswith('.xml'):
            # Squelette XML par défaut pour les variables de test case
            xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n<TestCaseVariables>\n    <!-- Les variables seront ajoutées ici -->\n</TestCaseVariables>'
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(xml_content)
        else:
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write('')
        return jsonify({'success': True, 'path': target_path})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/create-profile', methods=['POST'])
def create_profile():
    global CURRENT_PROJECT_PATH
    data = request.get_json()
    parent = data.get('parent', '')
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'Nom du profil manquant'}), 400
    project_path = CURRENT_PROJECT_PATH
    if not project_path:
        return jsonify({'success': False, 'message': 'Projet non sélectionné'}), 400
    # Déterminer le chemin du dossier Profiles
    profiles_dir = os.path.join(project_path, 'Profiles')
    if parent and os.path.basename(parent) != 'Profiles':
        # Si l'utilisateur cible un sous-dossier, on le prend en compte
        profiles_dir = os.path.join(project_path, parent)
    if not os.path.isdir(profiles_dir):
        os.makedirs(profiles_dir, exist_ok=True)
    profile_path = os.path.join(profiles_dir, f"{name}.glbl")
    if os.path.exists(profile_path):
        return jsonify({'success': False, 'message': 'Un profil avec ce nom existe déjà.'}), 409
    # Créer un fichier de profil minimal
    with open(profile_path, 'w', encoding='utf-8') as f:
        f.write(f"# Execution Profile\nname={name}\n")
    return jsonify({'success': True, 'message': 'Profil créé', 'profile': name})

@app.route('/api/rename-item', methods=['POST'])
def rename_item():
    global CURRENT_PROJECT_PATH
    data = request.get_json()
    path = data.get('path', '')
    new_name = data.get('newName', '').strip()
    old_name = data.get('oldName', '').strip()
    if not path or not new_name or not old_name:
        return jsonify({'success': False, 'message': 'Paramètres manquants'}), 400
    
    try:
        # Construire les chemins absolus correctement
        abs_path = os.path.join(CURRENT_PROJECT_PATH, path)
        
        # Vérifier si le chemin est un fichier ou un dossier
        if os.path.isfile(abs_path):
            # Si c'est un fichier, on renomme le fichier lui-même
            parent_dir = os.path.dirname(abs_path)
            old_full_path = abs_path
            new_full_path = os.path.join(parent_dir, new_name)
        else:
            # Si c'est un dossier, on renomme le fichier à l'intérieur
            old_full_path = os.path.join(abs_path, old_name)
            new_full_path = os.path.join(abs_path, new_name)
        
        logger.info(f"Renommage: {old_full_path} -> {new_full_path}")
        
        # Vérifier si le nouveau chemin existe déjà
        if os.path.exists(new_full_path):
            return jsonify({'success': False, 'message': 'Un fichier/dossier avec ce nom existe déjà.'}), 409
        
        # Renommer le fichier/dossier principal
        os.rename(old_full_path, new_full_path)
        
        # Si c'est un fichier Python, vérifier et renommer le XML associé
        if old_name.endswith('.py'):
            xml_old_name = old_name.replace('.py', '_variables.xml')
            xml_new_name = new_name.replace('.py', '_variables.xml')
            
            # Le XML est dans le même dossier que le fichier Python
            xml_old_path = os.path.join(abs_path, xml_old_name)
            xml_new_path = os.path.join(abs_path, xml_new_name)
            
            logger.info(f"Vérification du XML associé: {xml_old_path}")
            
            # Si le XML associé existe, le renommer aussi
            if os.path.exists(xml_old_path):
                logger.info(f"Renommage du XML: {xml_old_path} -> {xml_new_path}")
                os.rename(xml_old_path, xml_new_path)
                logger.info(f"Fichier XML associé renommé avec succès")
        
        return jsonify({'success': True, 'message': 'Renommage réussi'})
    except Exception as e:
        logger.error(f"Erreur lors du renommage: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/delete-item', methods=['POST'])
def delete_item():
    global CURRENT_PROJECT_PATH
    data = request.get_json()
    path = data.get('path', '')
    name = data.get('name', '')
    if not path or not name:
        return jsonify({'success': False, 'message': 'Paramètres manquants'}), 400
    abs_path = os.path.join(CURRENT_PROJECT_PATH, path)
    try:
        if os.path.isdir(abs_path):
            import shutil
            shutil.rmtree(abs_path)
        else:
            os.remove(abs_path)
        return jsonify({'success': True, 'message': 'Suppression réussie'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/get-current-project', methods=['GET'])
def get_current_project():
    """
    Retourne le chemin du projet actuellement ouvert.
    Cette route est utilisée par le client pour obtenir le chemin absolu du projet courant.
    """
    global CURRENT_PROJECT_PATH
    
    logger.info(f"Récupération du chemin du projet actuel: {CURRENT_PROJECT_PATH}")
    
    if not CURRENT_PROJECT_PATH:
        return jsonify({
            'success': False,
            'message': 'Aucun projet n\'est actuellement ouvert.'
        }), 404
    
    return jsonify({
        'success': True,
        'project_path': CURRENT_PROJECT_PATH
    })

@app.route('/api/check-folder-exists', methods=['POST'])
def check_folder_exists():
    """
    Vérifie si un dossier existe dans le projet actuel.
    Body attendu : {"path": "TestCases"}
    """
    global CURRENT_PROJECT_PATH
    data = request.get_json()
    path = data.get('path', '')
    if not CURRENT_PROJECT_PATH or not path:
        return jsonify({'success': False, 'message': 'Paramètres manquants', 'exists': False}), 400
    
    # Construire le chemin absolu
    target_path = os.path.join(CURRENT_PROJECT_PATH, path)
    logger.info(f"Vérification de l'existence du dossier: {target_path}")
    
    # Vérifier si le dossier existe
    exists = os.path.exists(target_path) and os.path.isdir(target_path)
    
    return jsonify({
        'success': True,
        'exists': exists,
        'path': target_path
    })

@app.route('/api/script-to-manual', methods=['POST'])
def script_to_manual():
    """
    Endpoint pour convertir un script Python modifié en format manuel.
    Prend le contenu du script modifié et retourne les étapes au format manuel.
    """
    try:
        logger.info("Reçu une requête de conversion script-to-manual")
        data = request.get_json()
        if not data:
            logger.error("Aucune donnée JSON reçue")
            return jsonify({'success': False, 'message': 'Aucune donnée reçue'}), 400
            
        if 'script' not in data:
            logger.error("Clé 'script' manquante dans les données JSON")
            return jsonify({'success': False, 'message': 'Contenu du script manquant'}), 400
            
        script_content = data.get('script', '')
        logger.info(f"Reçu un script de {len(script_content)} caractères")
        
        if not script_content or script_content.strip() == '':
            logger.error("Le contenu du script est vide")
            return jsonify({'success': False, 'message': 'Le contenu du script est vide'}), 400
        
        # Créer une instance du parser et analyser le script modifié
        logger.info("Création d'une instance de PythonFileParser")
        parser = PythonFileParser()
        logger.info("Appel de la méthode edit_script_and_convert_to_manual")
        manual_steps = parser.edit_script_and_convert_to_manual(script_content)
        
        return jsonify({
            'success': True, 
            'message': 'Conversion réussie',
            'manual_steps': manual_steps
        })
    except Exception as e:
        logger.error(f"Erreur lors de la conversion du script en mode manuel: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5033)
