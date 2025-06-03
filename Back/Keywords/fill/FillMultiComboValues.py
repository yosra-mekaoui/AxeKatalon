import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from Utils.Commands import Commands
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory



class FillMultiComboValues:
    """
    A class to fill a multi-combo field on a web page.
    """

    @staticmethod
    def set(field_name: str, field_value: str) -> None:
        """
        Fill a multi-combo field with the specified value.

        Args:
            field_name (str): The name of the field to fill.
            field_value (str): The value to enter into the field.
        """
        KeywordUtil.logInfo(f"FillField {field_name}: {field_value}")

        try:
            # Locate the multi-combo field
            field_xpath = (
                f".//div[contains(@class,'x-field acp-multicombo')]//"
                f"span[contains(@class,'x-form-item-label-text') and "
                f"(text() = '{field_name}:' or text() = '{field_name}*:' or "
                f"text() = '{field_name}' or text() = '{field_name}*')]/"
                f"ancestor::div[contains(@class,'x-field acp-multicombo')]"
            )
            field_web_element: WebElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f'{field_xpath}'), True)

            # Locate the input element within the field
            input_element = field_web_element.find_element(By.CSS_SELECTOR, "input.x-tagfield-input-field")

            # Get the IDs of the trigger elements
            trigger_id = input_element.get_attribute("id").replace("inputEl", "trigger-picker")
            trigger_element = DriverFactory.getWebDriver().find_element(By.ID, trigger_id)

            trigger_bar_id = input_element.get_attribute("id").replace("inputEl", "trigger-bar")
            trigger_bar_element = DriverFactory.getWebDriver().find_element(By.ID, trigger_bar_id)

            # Clear the input field and enter the value
            time.sleep(0.5)  # Wait for the UI to stabilize
            input_element.clear()
            input_element.send_keys(field_value)
            input_element.send_keys(Keys.TAB)

            # Wait for the UI to update
            time.sleep(0.5)

            # Locate the body element (for demonstration purposes)
            body_element = DriverFactory.getWebDriver().find_element(By.CSS_SELECTOR, "body")
            KeywordUtil.markPassed("Field filled successfully")

        except Exception as e:
            KeywordUtil.markFailed(f"Failed to fill the field: {str(e)}")