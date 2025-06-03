import os
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
from flask import jsonify, request

def handle_xml_file(app):

    @app.route('/get_xml_file', methods=['POST'])
    def get_xml_file():
        #Récupère le contenu d'un fichier XML associé à un fichier Python

        try:
            data = request.get_json()
            python_file_path = data.get('python_path')
            project_path = data.get('project_path', '')
            
            if not python_file_path:
                return jsonify({
                    'success': False,
                    'message': 'Python file path is required'
                })
            
            # Construire le chemin du fichier XML
            xml_file_path = python_file_path.replace('.py', '_variables.xml')
            absolute_path = os.path.join(project_path, xml_file_path)
            
            # Vérifier si le fichier XML existe
            if os.path.exists(absolute_path):
                with open(absolute_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    
                # Parser le contenu XML pour extraire les variables
                variables = parse_xml_variables(content)
                
                return jsonify({
                    'success': True,
                    'content': content,
                    'variables': variables,
                    'path': xml_file_path
                })
            else:
                # Si le fichier n'existe pas, créer un fichier XML vide
                empty_xml = create_empty_xml_structure()
                
                # Créer les répertoires si nécessaires
                os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
                
                # Sauvegarder le fichier XML vide
                with open(absolute_path, 'w', encoding='utf-8') as file:
                    file.write(empty_xml)
                
                return jsonify({
                    'success': True,
                    'content': empty_xml,
                    'variables': [],
                    'path': xml_file_path,
                    'message': 'Created new XML file'
                })
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            })
    
    @app.route('/save_xml_file', methods=['POST'])
    def save_xml_file():
        """
        Sauvegarde le contenu d'un fichier XML
        """
        try:
            data = request.get_json()
            file_path = data.get('path')
            content = data.get('content')
            project_path = data.get('project_path', '')
            
            if not file_path or content is None:
                return jsonify({
                    'success': False,
                    'message': 'File path and content are required'
                })
            
            # Construire le chemin absolu
            absolute_path = os.path.join(project_path, file_path)
            
            # Créer les répertoires si nécessaires
            os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
            
            # Sauvegarder le contenu dans le fichier
            with open(absolute_path, 'w', encoding='utf-8') as file:
                file.write(content)
            
            return jsonify({
                'success': True,
                'message': 'XML file saved successfully'
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            })
    
    @app.route('/update_variables', methods=['POST'])
    def update_variables():
        """
        Met à jour les variables d'un fichier XML
        """
        try:
            data = request.get_json()
            file_path = data.get('path')
            variables = data.get('variables', [])
            project_path = data.get('project_path', '')
            
            if not file_path:
                return jsonify({
                    'success': False,
                    'message': 'File path is required'
                })
            
            # Construire le chemin absolu
            absolute_path = os.path.join(project_path, file_path)
            
            # Générer le contenu XML à partir des variables
            xml_content = generate_xml_content(variables)
            
            # Créer les répertoires si nécessaires
            os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
            
            # Sauvegarder le contenu dans le fichier
            with open(absolute_path, 'w', encoding='utf-8') as file:
                file.write(xml_content)
            
            return jsonify({
                'success': True,
                'message': 'Variables updated successfully',
                'content': xml_content
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            })

def parse_xml_variables(xml_content):
    variables = []
    
    try:
        root = ET.fromstring(xml_content)
        
        for variable in root.findall('.//variable'):
            variables.append({
                'name': variable.get('name', ''),
                'type': variable.get('type', 'String'),
                'defaultValue': variable.text.strip() if variable.text else '',
                'description': variable.get('description', ''),
                'masked': variable.get('masked') == 'true'
            })
    except Exception as e:
        print(f"Erreur lors du parsing XML: {str(e)}")
    
    return variables

def create_empty_xml_structure():
    return '<?xml version="1.0" encoding="UTF-8"?>\n<TestCaseVariables>\n    <!-- Les variables seront ajoutées ici -->\n</TestCaseVariables>'

def generate_xml_content(variables):
    root = ET.Element('TestCaseVariables')
    
    for variable in variables:
        var_elem = ET.SubElement(root, 'variable')
        var_elem.set('name', variable.get('name', ''))
        var_elem.set('type', variable.get('type', 'String'))
        
        if variable.get('description'):
            var_elem.set('description', variable.get('description', ''))
        
        if variable.get('masked'):
            var_elem.set('masked', 'true')
        
        var_elem.text = variable.get('defaultValue', '')
    
    # Formater le XML pour qu'il soit lisible
    rough_string = ET.tostring(root, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="    ")
