import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from Utils.ByType import ByJavaMethod

class ClickCtrlKeyXCVByXPath:
    @staticmethod
    def click(key: str, path: str):
        """
        Performs a Ctrl + key (e.g., Ctrl+C, Ctrl+V) action on an element located by XPath.

        Args:
            key (str): The key to send (e.g., 'C', 'V').
            path (str): The XPath of the element.
        """
        try:
            # Find the first visible element using the provided XPath
            field_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(path), True)

            if field_web_element:
                # Create an ActionChains object
                field_web_element.click()
                actions = ActionChains(DriverFactory.getWebDriver())

                # Perform the Ctrl + key action
                (actions
                 .key_down(Keys.CONTROL)  # Hold down the Ctrl key
                 .send_keys(key)          # Send the specified key (e.g., 'C', 'V')
                 .key_up(Keys.CONTROL)    # Release the Ctrl key
                 .perform())              # Execute the action

                # Log success
                KeywordUtil.markPassed("Done Successfully")
            else:
                # Log failure if the element is not found
                logging.error(f"Element not found with XPath: {path}")
                KeywordUtil.markFailed(f"Element not found with XPath: {path}")
        except Exception as e:
            # Log any exceptions that occur
            logging.error(f"Error performing Ctrl + {key} action: {str(e)}")
            KeywordUtil.markFailed(f"Error performing Ctrl + {key} action: {str(e)}")