import time

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from Utils.Common import Thread
from Utils.keywordUtil import KeywordUtil
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.Commands import Commands
from Utils.ByType import ByJavaMethod

class VerifyFieldValue:
    """
    A class to verify the value of a field on a web page.
    """

    @staticmethod
    def Check(field_name: str, field_value: str) -> None:
        """
        Verify the value of a field on the web page.

        Args:
            field_name (str): The name of the field to locate (e.g., "First Name").
            field_value (str): The expected value of the field.
        """
        try:
            # Locate the field element using XPath
            xpath = (
                f"//div[contains(@class,'axe-basic-field')]//"
                f"span[contains(@class,'x-form-item-label-text') and "
                f"(text() = '{field_name}:' or text() = '{field_name}*:' or "
                f"text() = '{field_name}' or text() = '{field_name}*')]/"
                f"ancestor::div[contains(@class,'axe-basic-field')]"
            )
            field_web_element: WebElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath), True)

            # Get the ID of the field element
            element_id = field_web_element.get_attribute("id")
            Thread.sleep(500)


            start_time = time.time()
            actual_value=None

            is_equal=False

            while (time.time() - start_time)<30 and not is_equal:
                # Locate the input element based on the ID
                if "combo" in element_id:
                    input_element = field_web_element.find_element(By.CSS_SELECTOR, "input.x-form-field")
                elif "fieldcontainer" in element_id:
                    input_element = field_web_element.find_element(By.CSS_SELECTOR, "input.x-form-text")
                elif "textarea" in element_id:
                    input_element = field_web_element.find_element(By.CSS_SELECTOR, "textarea.x-form-textarea")
                else:
                    input_element = field_web_element.find_element(By.CSS_SELECTOR, "input.x-form-text")
                # Get the value of the input element
                actual_value = input_element.get_attribute("value")
                try:
                    actual_value=float(actual_value)
                    field_value=float(actual_value)
                    is_equal = actual_value==field_value
                except ValueError:
                    is_equal = actual_value==field_value
                print(f"elapsed time fo verifying field value is :{time.time()-start_time}")




            KeywordUtil.logInfo(f"The value of {field_name} is: {actual_value}")

            # Verify the actual value matches the expected value
            WebUI.verifyEqual(actual_value, field_value)
            KeywordUtil.markPassed("Field value is as expected")

        except Exception as e:
            error_message = f"Element not found or error occurred: {str(e)}"
            KeywordUtil.markFailed(error_message)