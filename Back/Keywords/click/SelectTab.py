import logging
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.BuiltinKeywords import FailureHandling
from Utils import Common
from Utils.ObjectRepository import ObjectRepository
findTestObject = ObjectRepository.findTestObject
class SelectTab:
    def selectTab(tab_name: str):
        """
        Selects a tab by its name using a dynamic XPath.

        Args:
            tab_name (str): The name of the tab to select.

        Raises:
            Exception: If the tab is not found or the click action fails.
        """
        logging.info(f"Selecting tab: {tab_name}")

        # Define the dynamic XPath for the tab
        xpath = f"//div[contains(@class,'x-box-target')]//span[contains(@class,'x-tab-inner') and text()='{tab_name}']"

        # Click the tab directly using the dynamic XPath
        WebUI.click(findTestObject('GUI/Xpath', {'xpath': xpath}))
        #WebUI.click(findTestObject('Google', {'ElementID': xpath}))

        logging.info(f"Successfully clicked on tab: {tab_name}")
