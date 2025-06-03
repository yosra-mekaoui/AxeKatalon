import time
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.Commands import Commands
from selenium.webdriver import Remote as WebDriver
from TestCaseExecutor import GlobalVariable
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory
from WebUI.BuiltinKeywords import FailureHandling
from Utils.ObjectRepository import ObjectRepository


findTestObject = ObjectRepository.findTestObject

class ClicktoScrollRight:
    """
    A class to handle scrolling and clicking on tabs in a web application.
    Supports two versions (V7 and V9) of the application.
    """

    @staticmethod
    def Clicktoscrollright(tab_name: str) -> None:
        """
        Scroll and click on a tab in the application.

        Args:
            tab_name (str): The name of the tab to click.
        """
        try:
            if GlobalVariable.version == "V7":
                ClicktoScrollRight._handle_v7(tab_name)
            elif GlobalVariable.version == "V9":
                ClicktoScrollRight._handle_v9(tab_name)
            else:
                KeywordUtil.markFailed(f"Unsupported version: {GlobalVariable.version}")
        except Exception as e:
            KeywordUtil.markFailed(f"An error occurred: {str(e)}")

    @staticmethod
    def _handle_v7(tab_name: str) -> None:
        """
        Handle scrolling and clicking for V7 version of the application.

        Args:
            tab_name (str): The name of the tab to click.
        """
        driver: WebDriver = DriverFactory.getWebDriver()
        scroll_button = findTestObject("Object Repository/Custom Keywords/Tabs/RightScroll")
        tab_object = findTestObject("Object Repository/Custom Keywords/Tabs/TabName", {"TabName": tab_name})
        # Wait for the UI to stabilize
        time.sleep(8)

        # Check if the tab is already visible
        is_tab_visible = WebUI.verifyElementVisible(tab_object, FailureHandling.OPTIONAL)

        # Get the number of scroll buttons and use the last one
        scroll_buttons = driver.find_elements(By.XPATH, "(//div[contains(@class,'x-box-scroller x-box-scroller-right')])")
        last_scroll_button_index = len(scroll_buttons)
        last_scroll_button_xpath = f"(//div[contains(@class,'x-box-scroller x-box-scroller-right')])[{last_scroll_button_index}]"
        KeywordUtil.logInfo(f"XPath for the last scroll button: {last_scroll_button_xpath}")

        # Scroll until the tab is visible
        while not is_tab_visible:
            scroll_button_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f'{last_scroll_button_xpath}'), True)
            scroll_button_element.click()
            is_tab_visible = WebUI.verifyElementVisible(tab_object, FailureHandling.OPTIONAL)

        # Click the tab
        WebUI.click(tab_object)
        KeywordUtil.markPassed(f"Tab '{tab_name}' clicked successfully")

    @staticmethod
    def _handle_v9(tab_name: str) -> None:
        """
        Handle scrolling and clicking for V9 version of the application.

        Args:
            tab_name (str): The name of the tab to click.
        """
        tab_object_v9 = findTestObject("Tabs/TabName", {"TabName": tab_name})
        tab_object_v9_scroll = findTestObject("Tabs/tabV9sc", {"tabname": tab_name})
        # Check if the tab is visible
        is_tab_visible = WebUI.verifyElementPresent(tab_object_v9, 0, FailureHandling.OPTIONAL)
        is_tab_visible_fully = WebUI.verifyElementVisible(tab_object_v9, FailureHandling.OPTIONAL)

        if is_tab_visible and is_tab_visible_fully:
            KeywordUtil.logInfo("Tab is found and visible")
            WebUI.click(tab_object_v9)
            KeywordUtil.markPassed(f"Tab '{tab_name}' clicked successfully")
        else:
            KeywordUtil.logInfo("Starting to scroll")
            scroll_button_element = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH ("//span[@class='x-btn-icon-el x-btn-icon-el-default-small x-tab-bar-more-icon ']"), True
            )
            scroll_button_element.click()

            # Check if the tab is visible after scrolling
            is_tab_visible_after_scroll = WebUI.verifyElementPresent(tab_object_v9_scroll, 0, FailureHandling.OPTIONAL)
            if is_tab_visible_after_scroll:
                KeywordUtil.logInfo("Tab is found after scrolling")
                WebUI.click(tab_object_v9_scroll)
                KeywordUtil.markPassed(f"Tab '{tab_name}' clicked successfully")
            else:
                KeywordUtil.markFailed(f"Tab '{tab_name}' not found after scrolling")