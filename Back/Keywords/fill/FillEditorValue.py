from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from WebUI.DriverFactory import DriverFactory
from selenium.common.exceptions import NoSuchElementException, TimeoutException


class FillEditorValue:
    @staticmethod
    def set(field_name: str, text: str):

        try:
            # Locate the iframe element
            iframe_xpath = f"//span[text()='{field_name}:']/ancestor::fieldset[contains(@class, 'x-fieldset')]//iframe[@class='x-htmleditor-iframe']"
            iframe_element = WebDriverWait(DriverFactory.getWebDriver(), 10).until(
                EC.presence_of_element_located((By.XPATH, iframe_xpath)))

            # Switch to the iframe
            DriverFactory.getWebDriver().switch_to.frame(iframe_element)

            # Locate the body element inside the iframe and send the text
            body_element = DriverFactory.getWebDriver().find_element(By.XPATH, ".//body")
            body_element.send_keys(text)

            # Switch back to the default content
            DriverFactory.getWebDriver().switch_to.default_content()

            print(f"Successfully filled editor field {field_name} with text: {text}")
        except NoSuchElementException:
            raise NoSuchElementException(f"Editor field with name '{field_name}' not found.")
        except TimeoutException:
            raise TimeoutException(f"Timeout while waiting for editor field with name '{field_name}'.")
        except Exception as e:
            raise Exception(f"Error filling editor field {field_name}: {str(e)}")

# Example usage:
# FillEditorValue.set("Description", "This is a sample description.")