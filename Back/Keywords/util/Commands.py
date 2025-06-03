import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.remote.webdriver import WebDriver
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
#from WebUI.KeywordUtil import logInfo  # Utility function for logging
#from WebUI import DriverFactory
from WebUI.DriverFactory import DriverFactory
import time
from Utils.ByType import ByJavaMethod


class Commands:
    @staticmethod
    def findFirstVisibleElement(selector: ByJavaMethod, reverse_list =None ) :
        """
        Finds the first visible and enabled element matching the given selector.

        Args:
            selector (By): The selector to locate the elements.
            reverse_list (bool, optional): Whether to reverse the list of elements. Defaults to False.

        Returns:
            WebElement: The first visible and enabled element.

        Raises:
            NullPointerException: If no visible and enabled element is found within the timeout.
        """
        selectorT, selectorV = selector

        if reverse_list is None :
            reverse_list = False
        start_time = time.time()
        web_driver = DriverFactory.getWebDriver()


        while not Commands.isTimeout(start_time):
            elements = web_driver.find_elements(selectorT, selectorV)
            if reverse_list:
                elements = list(reversed(elements))

            SosElement = None
            for element in elements:
                logging.info(f"Checking element: {element}")
                logging.info(f"Displayed: {element.is_displayed()}, Enabled: {element.is_enabled()}")

                if element.is_displayed() and element.is_enabled():
                    if element.get_attribute('aria-disabled')=='true':
                        SosElement=element
                    else:
                        return element

            if SosElement is not None :
                return SosElement


        raise Exception(f"Cannot find element by {selector}")

    @staticmethod
    def isTimeout(start_time: float) -> bool:
        """
        Checks if the operation has timed out.
        Args:
            start_time (float): The start time of the operation.
        Returns:
            bool: True if the timeout has been reached, False otherwise.
        """
        current_time = time.time()
        difference = current_time - start_time
        if difference > 30:  # 30 seconds timeout
            return True
        return False

    @staticmethod
    def loopOnElement(element: WebElement) -> bool:
        """
        Checks if the element is displayed and enabled.

        Args:
            element (WebElement): The element to check.

        Returns:
            bool: True if the element is displayed and enabled, False otherwise.
        """
        return element.is_displayed() and element.is_enabled()



