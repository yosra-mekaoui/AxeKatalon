from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from Utils.ByType import ByJavaMethod


class CheckCardIsDisplayed:
    @staticmethod
    def checkCardDisplayed(card_name: str) -> bool:
        """
        Verifies if a specified card is displayed in the UI, with version-specific checks.

        Args:
            card_name (str): The name of the card to check

        Returns:
            bool: True if card is displayed, False otherwise

        Raises:
            NoSuchElementException: If the card element cannot be found
            Exception: For other unexpected errors
        """
        try:
            # Initialize element variable
            card_element = None

            # Version-specific element location
            if GlobalVariable.version == 'V9':
                card_element = Commands.findFirstVisibleElement(
                    ByJavaMethod.XPATH(f".//div[text()='{card_name}']//ancestor::div[contains(@class,'vertical-Card')]")
                )
            else:
                card_element = Commands.findFirstVisibleElement(
                    ByJavaMethod.XPATH
                    (f".//div[contains(@class,'x-title-item')]//span[text()='{card_name}']"
                    "//ancestor::div[contains(@class,'relateditem-vertical-Card')]"
                    "//div[contains(@class,'edit-relateditem')]")
                )

            # Verify visibility
            is_displayed = card_element.is_displayed()
            KeywordUtil.markPassed(f"The card {card_name} is displayed ---- {is_displayed}")

            return is_displayed

        except NoSuchElementException as e:
            error_msg = f"Card element not found: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise
        except Exception as e:
            error_msg = f"Failed to check card display: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise