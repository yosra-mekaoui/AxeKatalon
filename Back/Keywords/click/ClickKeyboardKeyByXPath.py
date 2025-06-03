import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from Utils.ByType import ByJavaMethod

class ClickKeyboardKeyByXPath:
    @staticmethod
    def click(path: str, key: str):
        """
        Performs a keyboard key action (e.g., DELETE, ENTER) on an element located by XPath.

        Args:
            path (str): The XPath of the element.
            key (str): The key to send (e.g., Keys.DELETE, Keys.ENTER).
        """
        try:
            # Find the first visible element using the provided XPath
            field_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(path), True)

            if field_web_element:
                # Create an ActionChains object
                actions = ActionChains(DriverFactory.getWebDriver())

                # Perform the keyboard key action
                (actions
                 .click(field_web_element)  # Click the element
                 .send_keys(key)            # Send the specified key (e.g., DELETE, ENTER)
                 .perform())                # Execute the action

                # Log success
                KeywordUtil.markPassed(f"Key '{key}' action performed successfully")
            else:
                # Log failure if the element is not found
                logging.error(f"Element not found with XPath: {path}")
                KeywordUtil.markFailed(f"Element not found with XPath: {path}")
        except Exception as e:
            # Log any exceptions that occur
            logging.error(f"Error performing key '{key}' action: {str(e)}")
            KeywordUtil.markFailed(f"Error performing key '{key}' action: {str(e)}")