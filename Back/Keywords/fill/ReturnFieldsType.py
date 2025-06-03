from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from WebUI.DriverFactory import DriverFactory
import time

class ReturnFieldsType:
    @staticmethod
    def set(field_name: str, field_value: str):
        """
        Fills the specified field with the given value.

        :param field_name: The name of the field to fill.
        :param field_value: The value to fill in the field.
        """
        print(f"Fill Field {field_name} with: {field_value}")

        # Locate the field element using XPath
        xpath = (
            f".//div[contains(@class,'axe-basic-field')]//span[contains(@class,'x-form-item-label-text') "
            f"and (text() = '{field_name}:' or text() = '{field_name}*:' or "
            f"text() = '{field_name}' or text() = '{field_name}*')]"
            f"/ancestor::div[contains(@class,'axe-basic-field')]"
        )
        field_web_element = ReturnFieldsType._find_first_visible_element(By.XPATH, xpath)

        if not field_web_element:
            raise NoSuchElementException(f"Field with name '{field_name}' not found.")

        # Get the ID of the field element
        element_id = field_web_element.get_attribute("id")
        print(f"Element ID: {element_id}")

        try:
            if "fieldcontainer" in element_id:
                inner_field = field_web_element.find_element(By.CSS_SELECTOR, ".axe-basic-field")
                ReturnFieldsType._set_text_value(inner_field, field_value)
                time.sleep(8)  # Consider replacing with explicit wait
            elif "combo" in element_id:
                ReturnFieldsType._set_dropdown_value(field_web_element, field_value)
            elif "textarea" in element_id:
                ReturnFieldsType._set_textarea_value(field_web_element, field_value)
            else:
                ReturnFieldsType._set_text_value(field_web_element, field_value)

            print(f"Successfully filled field {field_name}")
        except Exception as e:
            raise Exception(f"Error filling field {field_name}: {str(e)}")

    @staticmethod
    def _find_first_visible_element(by: By, value: str):
        """
        Finds the first visible element matching the given locator.

        :param by: The locator strategy (e.g., By.XPATH, By.CSS_SELECTOR).
        :param value: The value of the locator.
        :return: The first visible WebElement, or None if not found.
        """
        driver = DriverFactory.getWebDriver()
        elements = driver.find_elements(by, value)
        for element in elements:
            if element.is_displayed():
                return element
        return None

    @staticmethod
    def _set_text_value(element, value: str):
        """
        Sets the text value in an input field.

        :param element: The WebElement representing the input field.
        :param value: The value to set.
        """
        input_field = element.find_element(By.CSS_SELECTOR, "input.x-form-field.x-form-text")
        input_field.clear()
        input_field.send_keys(value)
        input_field.send_keys(Keys.TAB)

    @staticmethod
    def _set_textarea_value(element, value: str):
        """
        Sets the text value in a textarea field.

        :param element: The WebElement representing the textarea field.
        :param value: The value to set.
        """
        textarea = element.find_element(By.CSS_SELECTOR, "textarea.x-form-field.x-form-text")
        textarea.clear()
        textarea.send_keys(value)
        textarea.send_keys(Keys.TAB)

    @staticmethod
    def _set_dropdown_value(element, value: str):
        """
        Sets the value in a dropdown field.

        :param element: The WebElement representing the dropdown field.
        :param value: The value to set.
        """
        driver = DriverFactory.getWebDriver()
        input_field = element.find_element(By.CSS_SELECTOR, "input.x-form-field.x-form-text")
        input_id = input_field.get_attribute("id")

        # Find dropdown trigger elements
        trigger_id = input_id.replace("inputEl", "trigger-picker")
        trigger_bar_id = input_id.replace("inputEl", "trigger-bar")

        # Open dropdown (if needed)
        input_field.click()
        time.sleep(0.5)

        # Clear existing value using keyboard shortcut
        ActionChains(driver) \
            .key_down(Keys.CONTROL) \
            .send_keys('a') \
            .key_up(Keys.CONTROL) \
            .send_keys(Keys.BACKSPACE) \
            .perform()

        input_field.send_keys(value)
        input_field.send_keys(Keys.TAB)
        time.sleep(0.5)

# Example usage:
# ReturnFieldsType.set("FieldName", "FieldValue")