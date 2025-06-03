import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Initialisation du navigateur
driver = webdriver.Chrome()
driver.maximize_window()

# Accéder à la page de connexion
driver.get("https://example.com/login")

# Fonction pour se connecter
def login(username, password):
    # Remplir le formulaire de connexion
    driver.find_element(By.ID, "username").send_keys(username)
    driver.find_element(By.ID, "password").send_keys(password)
    
    # Cliquer sur le bouton de connexion
    driver.find_element(By.ID, "login-button").click()

# Se connecter avec les identifiants
login("testuser", "password123")

# Vérifier si la connexion a réussi
if "dashboard" in driver.current_url:
    print("Connexion réussie!")
    
    # Tester différentes fonctionnalités
    try:
        # Rechercher un produit
        search_box = driver.find_element(By.ID, "search")
        search_box.clear()
        search_box.send_keys("smartphone")
        search_box.submit()
        
        # Attendre que les résultats de recherche apparaissent
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "product-list"))
        )
        
        # Compter le nombre de résultats
        products = driver.find_elements(By.CLASS_NAME, "product-item")
        product_count = len(products)
        
        if product_count > 0:
            print(f"Trouvé {product_count} produits")
            
            # Cliquer sur le premier produit
            first_product = products[0]
            first_product.click()
            
            # Ajouter au panier
            add_to_cart = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "add-to-cart"))
            )
            add_to_cart.click()
            
            # Vérifier le panier
            cart_count = driver.find_element(By.ID, "cart-count").text
            if int(cart_count) > 0:
                print(f"Produit ajouté au panier. Total: {cart_count}")
                
                # Aller au panier
                driver.find_element(By.ID, "cart-link").click()
                
                # Procéder au paiement
                checkout_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.ID, "checkout"))
                )
                
                # Vérifier si l'utilisateur est éligible à une remise
                price_element = driver.find_element(By.ID, "total-price")
                total_price = float(price_element.text.replace("$", ""))
                
                if total_price > 100:
                    # Appliquer un code de réduction
                    discount_input = driver.find_element(By.ID, "discount-code")
                    discount_input.send_keys("SAVE20")
                    driver.find_element(By.ID, "apply-discount").click()
                    
                    # Vérifier si la remise a été appliquée
                    WebDriverWait(driver, 3).until(
                        EC.text_to_be_present_in_element((By.ID, "discount-applied"), "Discount applied")
                    )
                    
                    print("Remise appliquée avec succès")
                
                # Finaliser la commande
                checkout_button.click()
            else:
                print("Échec de l'ajout au panier")
        else:
            print("Aucun produit trouvé")
            
    except Exception as e:
        print(f"Erreur lors du test: {str(e)}")
        
else:
    print("Échec de la connexion")

# Fermer le navigateur
time.sleep(2)
driver.quit()
