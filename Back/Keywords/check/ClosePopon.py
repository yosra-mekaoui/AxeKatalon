import logging
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from Utils.ByType import ByJavaMethod
class ClosePopon:
    @staticmethod
    def close():
        """
        Closes a popup window by clicking the close button.
        """
        try:
            # Locate the close button using a CSS selector
            close_button = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(".x-window .x-tool-close"), True)

            if close_button:
                # Click the close button
                close_button.click()
                print("Clicked the close button successfully")
                logging.info("Clicked the close button successfully")
                KeywordUtil.markPassed("Clicked Successfully")
            else:
                # Log failure if the close button is not found
                logging.error("Close button not found")
                KeywordUtil.markFailed("Close button not found")
                print("Close button not found")

        except NoSuchElementException:
            # Handle the case where the element is not found
            logging.error("Close button not found")
            print("Close button not found")
            KeywordUtil.markFailed("Close button not found")
        except Exception as e:
            # Handle any other exceptions
            logging.error(f"Error closing popup: {str(e)}")
            KeywordUtil.markFailed("Error closing popup")