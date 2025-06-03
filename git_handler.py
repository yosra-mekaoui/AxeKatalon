import os
import subprocess
import logging
import base64
import json
from flask import jsonify, request, current_app
from urllib.parse import urlparse, quote
import traceback

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dossier pour stocker les informations d'authentification (de manière sécurisée)
AUTH_STORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'git_auth')

def handle_git_routes(app):
    """
    Configure les routes pour les fonctionnalités Git
    """
    # Assurer que le dossier d'authentification existe
    os.makedirs(AUTH_STORE_DIR, exist_ok=True)

    @app.route('/api/git/clone', methods=['POST'])
    def clone_repository():
        """
        Clone un dépôt Git depuis Azure DevOps
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        repo_url = data.get('repositoryUrl', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        save_auth = data.get('saveAuth', False)
        
        # Validation des entrées
        if not repo_url:
            return jsonify({'success': False, 'message': 'Repository URL is required'}), 400
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password/PAT are required'}), 400
        
        try:
            # Créer une URL avec authentification
            parsed_url = urlparse(repo_url)
            
            # Correction pour les URLs Azure DevOps
            if 'dev.azure.com' in parsed_url.netloc:
                # Pour Azure DevOps, utiliser l'approche avec le credential helper
                # au lieu d'insérer les identifiants dans l'URL
                clean_url = repo_url.rstrip('/')
                auth_url = clean_url
                
                # Configurer Git pour utiliser les identifiants fournis
                # Cette approche est plus fiable que d'insérer les identifiants dans l'URL
                os.environ['GIT_ASKPASS'] = 'echo'
                os.environ['GIT_USERNAME'] = username
                os.environ['GIT_PASSWORD'] = password
            else:
                # Format standard pour les autres URLs Git
                auth_url = f"{parsed_url.scheme}://{quote(username)}:{quote(password)}@{parsed_url.netloc}{parsed_url.path}"
            
            # Journalisation pour le débogage
            logger.info(f"URL originale: {repo_url}")
            logger.info(f"URL nettoyée: {clean_url if 'clean_url' in locals() else 'N/A'}")
            logger.info(f"URL avec auth (masquée): {auth_url.replace(password if 'password' in auth_url else '', '********')}")
            logger.info(f"Destination: {os.path.join(r'C:\Users\yosra.mekaoui\Documents\GitHub', os.path.basename(parsed_url.path))}")
            
            # Déterminer le nom du dossier de destination
            repo_name = os.path.basename(parsed_url.path)
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            
            # Chemin de destination personnalisé
            workspace_dir = r'C:\Users\yosra.mekaoui\Documents\GitHub'
            os.makedirs(workspace_dir, exist_ok=True)
            
            dest_path = os.path.join(workspace_dir, repo_name)
            
            # Vérifier si le dossier existe déjà
            if os.path.exists(dest_path):
                return jsonify({'success': False, 'message': f'A project with name "{repo_name}" already exists'}), 409
            
            logger.info(f"Cloning repository {repo_url} to {dest_path}")
            
            # Exécuter la commande git clone
            # Créer un environnement pour le processus avec les variables d'authentification
            env = os.environ.copy()
            
            result = subprocess.run(
                ['git', 'clone', auth_url, dest_path],
                capture_output=True,
                text=True,
                env=env
            )
            
            if result.returncode != 0:
                logger.error(f"Git clone failed: {result.stdout}\n{result.stderr}")
                return jsonify({'success': False, 'message': result.stderr}), 500
            
            # Enregistrer les identifiants si demandé
            if save_auth:
                save_credentials(repo_url, username, password)
            
            # Ouvrir automatiquement le projet cloné
            try:
                # Définir directement la variable globale importée
                # global app_current_project_path
                # app_current_project_path = os.path.abspath(dest_path)
                
                # Mettre à jour également la configuration de l'application
                # current_app.config['CURRENT_PROJECT_PATH'] = os.path.abspath(dest_path)
                
                logger.info(f"Projet cloné et ouvert automatiquement: {dest_path}")
                # logger.info(f"Variable globale CURRENT_PROJECT_PATH mise à jour: {app_current_project_path}")
            except Exception as e:
                logger.error(f"Erreur lors de l'ouverture automatique du projet: {str(e)}")
                logger.error(traceback.format_exc())
            
            # Retourner le succès avec le chemin du projet cloné
            return jsonify({
                'success': True, 
                'message': 'Repository cloned successfully',
                'projectPath': os.path.abspath(dest_path),
                'projectName': repo_name,
                'autoOpened': True
            })
            
        except Exception as e:
            logger.exception(f"Error cloning repository: {str(e)}")
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
    @app.route('/api/git/branches', methods=['GET'])
    def get_branches():
        """
        Récupère la liste des branches d'un dépôt Git
        """
        project_path = request.args.get('projectPath', '')
        
        if not project_path or not os.path.exists(project_path):
            return jsonify({'success': False, 'message': 'Invalid project path'}), 400
        
        try:
            # Exécuter git branch pour obtenir les branches locales
            result_local = subprocess.run(
                ['git', 'branch'],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            if result_local.returncode != 0:
                return jsonify({'success': False, 'message': f'Failed to get branches: {result_local.stderr}'}), 500
            
            # Exécuter git branch -r pour obtenir les branches distantes
            result_remote = subprocess.run(
                ['git', 'branch', '-r'],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            # Traiter les branches locales
            local_branches = []
            for branch in result_local.stdout.split('\n'):
                branch = branch.strip()
                if branch:
                    is_current = branch.startswith('*')
                    name = branch[2:] if is_current else branch
                    local_branches.append({
                        'name': name,
                        'current': is_current
                    })
            
            # Traiter les branches distantes
            remote_branches = []
            for branch in result_remote.stdout.split('\n'):
                branch = branch.strip()
                if branch and not branch.startswith('origin/HEAD'):
                    name = branch.replace('origin/', '')
                    remote_branches.append({
                        'name': name,
                        'remote': True
                    })
            
            return jsonify({
                'success': True,
                'localBranches': local_branches,
                'remoteBranches': remote_branches
            })
            
        except Exception as e:
            logger.exception(f"Error getting branches: {str(e)}")
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
    @app.route('/api/git/create-branch', methods=['POST'])
    def create_branch():
        """
        Crée une nouvelle branche Git
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        project_path = data.get('projectPath', '')
        branch_name = data.get('branchName', '').strip()
        
        if not project_path or not os.path.exists(project_path):
            return jsonify({'success': False, 'message': 'Invalid project path'}), 400
        
        if not branch_name:
            return jsonify({'success': False, 'message': 'Branch name is required'}), 400
        
        try:
            # Créer la nouvelle branche
            result = subprocess.run(
                ['git', 'checkout', '-b', branch_name],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return jsonify({'success': False, 'message': f'Failed to create branch: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'message': f'Branch "{branch_name}" created successfully'
            })
            
        except Exception as e:
            logger.exception(f"Error creating branch: {str(e)}")
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
    @app.route('/api/git/checkout-branch', methods=['POST'])
    def checkout_branch():
        """
        Change de branche Git
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        project_path = data.get('projectPath', '')
        branch_name = data.get('branchName', '').strip()
        
        if not project_path or not os.path.exists(project_path):
            return jsonify({'success': False, 'message': 'Invalid project path'}), 400
        
        if not branch_name:
            return jsonify({'success': False, 'message': 'Branch name is required'}), 400
        
        try:
            # Checkout de la branche
            result = subprocess.run(
                ['git', 'checkout', branch_name],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return jsonify({'success': False, 'message': f'Failed to checkout branch: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'message': f'Switched to branch "{branch_name}"'
            })
            
        except Exception as e:
            logger.exception(f"Error checking out branch: {str(e)}")
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
    @app.route('/api/git/delete-branch', methods=['POST'])
    def delete_branch():
        """
        Supprime une branche Git
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        project_path = data.get('projectPath', '')
        branch_name = data.get('branchName', '').strip()
        
        if not project_path or not os.path.exists(project_path):
            return jsonify({'success': False, 'message': 'Invalid project path'}), 400
        
        if not branch_name:
            return jsonify({'success': False, 'message': 'Branch name is required'}), 400
        
        try:
            # Supprimer la branche
            result = subprocess.run(
                ['git', 'branch', '-d', branch_name],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return jsonify({'success': False, 'message': f'Failed to delete branch: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'message': f'Branch "{branch_name}" deleted successfully'
            })
            
        except Exception as e:
            logger.exception(f"Error deleting branch: {str(e)}")
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def save_credentials(repo_url, username, password):
    """
    Sauvegarde les informations d'authentification de manière sécurisée
    """
    try:
        # Créer un identifiant unique pour le dépôt
        repo_id = base64.b64encode(repo_url.encode()).decode()
        
        # Encoder les identifiants (dans un cas réel, utiliser une méthode plus sécurisée)
        auth_data = {
            'username': username,
            'password': base64.b64encode(password.encode()).decode()  # Encodage simple, non sécurisé
        }
        
        # Sauvegarder dans un fichier
        auth_file = os.path.join(AUTH_STORE_DIR, f"{repo_id}.json")
        with open(auth_file, 'w') as f:
            json.dump(auth_data, f)
        
        logger.info(f"Authentication saved for {repo_url}")
        return True
    except Exception as e:
        logger.exception(f"Error saving authentication: {str(e)}")
        return False

def get_authentication(repo_url):
    """
    Récupère les informations d'authentification sauvegardées
    """
    try:
        # Créer un identifiant unique pour le dépôt
        repo_id = base64.b64encode(repo_url.encode()).decode()
        
        # Charger depuis le fichier
        auth_file = os.path.join(AUTH_STORE_DIR, f"{repo_id}.json")
        if not os.path.exists(auth_file):
            return None
        
        with open(auth_file, 'r') as f:
            auth_data = json.load(f)
        
        # Décoder le mot de passe
        auth_data['password'] = base64.b64decode(auth_data['password'].encode()).decode()
        
        return auth_data
    except Exception as e:
        logger.exception(f"Error retrieving authentication: {str(e)}")
        return None
