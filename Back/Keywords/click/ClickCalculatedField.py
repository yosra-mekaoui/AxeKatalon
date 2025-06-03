from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Utils.keywordUtil import KeywordUtil
from WebUI.WebUiCommonHelper import WebUiCommonHelper
# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class ClickCalculatedField:
    @staticmethod
    def select(name: str) -> None:
        """
        Clicks on a calculated field's calculation link in the UI.

        Args:
            name (str): The name of the calculated field to interact with

        Raises:
            NoSuchElementException: If any required element is not found
            Exception: For other unexpected errors
        """
        try:
            KeywordUtil.logInfo(f"Clicking on calculated field: {name}")

            # Find parent element using object repository
            field_element = findTestObject(
                "Object Repository/Custom Keywords/Fields/CalculatedField",
                {"Name": name}
            )

            # Get the WebElement instance
            field_web_element = WebUiCommonHelper.findWebElement(field_element, 0)

            # Find the calculation link within the element
            calculation_link = field_web_element.find_element(
                By.CSS_SELECTOR,
                "a[data-qtip='Calculation']"
            )

            # Perform the click action
            calculation_link.click()
            KeywordUtil.markPassed("Calculation link clicked successfully")

        except NoSuchElementException as e:
            error_msg = f"Element not found: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise
        except Exception as e:
            error_msg = f"Failed to click calculated field: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise