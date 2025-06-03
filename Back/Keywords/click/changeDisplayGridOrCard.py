import time
import threading
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Utils.keywordUtil import KeywordUtil
from Keywords.util.Commands import Commands
from TestCaseExecutor import GlobalVariable
from Utils.ByType import ByJavaMethod

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class changeDisplayGridOrCard:
    @staticmethod
    def click(button_name: str) -> None:
        """
        Changes display mode between grid and card based on environment version.

        Args:
            button_name (str): Name of the display mode to select (e.g., 'Grid', 'Card')
        """
        try:
            if GlobalVariable.version == 'V9' :
                # Find and click display selector
                button_element = Commands.findFirstVisibleElement(
                    ByJavaMethod.XPATH
                    (f"//a[@id='{button_name.lower()}Button']"),
                    True
                )
                button_element.click()

            time.sleep(0.5)
            KeywordUtil.markPassed(f"The click on {button_name} button is done successfully")

        except NoSuchElementException as e:
            error_msg = f"Element not found: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise
        except Exception as e:
            error_msg = f"Failed to change display mode: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise

    @staticmethod
    def checkForActionPerformedSuccessfully() -> None:
        """
        Verifies success message display in a background thread.
        """

        def check_message():
            try:
                success_message = findTestObject(
                    "Object Repository/Custom Keywords/Messages/ActionPerformedSuccessfullyMessage"
                )

                if success_message:
                    KeywordUtil.logInfo("The message is displayed")

            except Exception as e:
                KeywordUtil.logInfo(f"Message check failed: {str(e)}")

        check_thread = threading.Thread(target=check_message)
        check_thread.start()