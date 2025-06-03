import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from Utils.ByType import ByJavaMethod


class SortOrUnsortGrid:
    @staticmethod
    def sortOrUnsortGrid(column_name: str, action: str, fieldset_name: str) -> None:
        """
        Performs sorting or unsorting action on a grid column.

        Args:
            column_name (str): Name of the column to sort/unsort
            action (str): Action to perform ('Sort Ascending', 'Sort Descending', 'Unsort')
            fieldset_name (str): Name of the fieldset containing the grid

        Raises:
            NoSuchElementException: If any required element is not found
            Exception: For other unexpected errors
        """
        try:
            # Find the column header element
            column_xpath = (
                f"//fieldset[contains(@aria-label,'{fieldset_name}')]//span[contains(@class,'x-column-header-text-inner') and (text() = '{column_name}')]"
            )
            column_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f"{column_xpath}"), True)

            # Hover over the column header
            actions = ActionChains(DriverFactory.getWebDriver())
            actions.move_to_element(column_element).perform()
            time.sleep(1)

            # Click the column header trigger
            trigger_xpath = (
                f"//fieldset[contains(@aria-label,'{fieldset_name}')]//div[contains(@class,'x-column-header-trigger')]"
            )
            trigger_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f"{trigger_xpath}"), True)
            trigger_element.click()

            # Select the specified action
            action_xpath = (
                f"//span[contains(@class,'x-menu-item-text x-menu-item-text-default x-menu-item-indent') and (text() = '{action}')]"
            )
            action_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f"{action_xpath}"), True)
            action_element.click()

            KeywordUtil.markPassed(f"Successfully performed {action} on {column_name} column")

        except NoSuchElementException as e:
            error_msg = f"Element not found during {action} operation: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise
        except Exception as e:
            error_msg = f"Failed to perform {action} on {column_name}: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise