from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.Commands import Commands
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository

findTestObject = ObjectRepository.findTestObject


class CheckElementInValue:
    """
    A class to check if an element is present or visible on a web page using either an object ID or an XPath.
    """

    @staticmethod
    def check(object_id: str, xpath: str, expected_value: str) -> None:
        """
        Check if an element is present or visible on a web page.

        Args:
            object_id (str): The object ID of the element to check.
            xpath (str): The XPath of the element to check.
            expected_value (str): The expected value of the element (not used in this method but included for compatibility).
        """
        KeywordUtil.logInfo(f"Before condition, length of object_id: {len(object_id)}")
        test_object = findTestObject(object_id)
        if len(object_id) > 0:
            KeywordUtil.logInfo("Starting Object method")
            try:
                # Locate the element using the object ID

                KeywordUtil.logInfo("Creating WebElement")

                # Verify if the element is not present
                WebUI.verifyElementNotPresent(test_object, 0)
                KeywordUtil.markPassed("Object not found")
            except Exception as e:
                KeywordUtil.logInfo("Starting catch")
                # Verify if the element is not visible
                WebUI.verifyElementNotVisible(test_object)
                KeywordUtil.markPassed("Object not found")
        else:
            KeywordUtil.logInfo("Starting XPath method")
            try:
                # Create a TestObject using the XPath
                web_element_1=Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f'{xpath}'), True)
                test_object = WebUI.convertWebElementToTestObject(web_element_1)
                KeywordUtil.logInfo("Adding property")

                # Verify if the element is not present
                WebUI.verifyElementNotPresent(test_object, 0)
                KeywordUtil.markPassed("XPath not found")
            except Exception as e:
                KeywordUtil.logInfo("Starting catch")
                # Verify if the element is not visible
                WebUI.verifyElementNotVisible(test_object)
                KeywordUtil.markPassed("XPath not found")

    @staticmethod
    def check_input_field_value(xpath: str, expected_value: str) -> None:
        """
        Check the value of an input field using JavaScript.

        Args:
            xpath (str): The XPath of the input field.
            expected_value (str): The expected value of the input field.
        """
        try:
            driver = DriverFactory.getWebDriver()
            element: WebElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f'{xpath}'), True)

            # Use JavaScript to retrieve the value of the input field
            field_value = driver.execute_script("return arguments[0].value;", element)
            KeywordUtil.logInfo(f"Field value: {field_value}")

            # Verify if the field value matches the expected value
            if field_value == expected_value:
                KeywordUtil.logInfo("Field value matches the expected value")
            else:
                KeywordUtil.markFailedAndStop(f"Field value '{field_value}' does not match expected value '{expected_value}'")
        except Exception as e:
            KeywordUtil.markFailed(f"Error checking input field value: {str(e)}")