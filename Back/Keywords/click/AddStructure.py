import time
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.Commands import Commands
from Utils.ObjectRepository import ObjectRepository
from Utils.ByType import ByJavaMethod
findTestObject = ObjectRepository.findTestObject


class AddStructure:
    """
    A class to interact with a group structure by hovering over a node, clicking a plus icon, and performing a search action.
    """

    @staticmethod
    def execute(name: str) -> None:
        """
        Perform actions on a group structure node.

        Args:
            name (str): The name of the node to interact with.
        """
        try:
            # Locate the node using the provided name
            node = findTestObject("GUI/Xpath", {"xpath": ".//*[local-name() = 'text'][contains(@class,'nodeText') and text()='${name}']/..//*[@class='nodeCircle']"})
            time.sleep(2)
            WebUI.mouseOver(node)
            time.sleep(2)  # Wait for the UI to update

            # Locate the plus icon next to the node
            node_plus = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH (f".//*[name()='text' and text()='{name}']/following-sibling::*"), True
            )
            time.sleep(1)  # Wait for the UI to update

            KeywordUtil.logInfo(f"nodePlus: {node_plus}")
            node_plus.click()  # Click the plus icon
            time.sleep(1)  # Wait for the UI to update

            # Locate and click the search icon
            icon_search = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH ("//div[contains(@class,'x-form-search-trigger-default')]"), True
            )
            icon_search.click()

            # Example of calling another keyword (commented out)
            # SelectGroupingCriteria.select("Common control")

        except Exception as e:
            KeywordUtil.markFailed(f"An error occurred: {str(e)}")