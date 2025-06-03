import logging

from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from Utils.Common import Thread
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import FailureHandling
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class ClickElement:

    def click(path: str, css: str = ""):
        """
        Clicks an element using either a CSS selector or an XPath.

        Args:
            path (str): The XPath of the element to click.
            css (str, optional): The CSS selector of the element to click. Defaults to "".
        """
        try:
            if css:
                # Find the element using CSS selector
                element = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(css),True)
                logging.info(f"Found element using CSS selector: {css}")
            else:
                # Find the element using XPath
                element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(path),True)
                logging.info(f"Found element using XPath: {path}")

            driver = DriverFactory.getWebDriver()
            #driver.execute_script("arguments[0].scrollIntoView();", element)


            # action = ActionChains(driver).scroll_to_element(element)
            # action.perform()
            driver.execute_script("arguments[0].scrollIntoView(false);", element)  # Scroll to the bottom of the element

            # Check if the element is visible in the viewport
            # is_in_viewport = driver.execute_script("""
            # var elem = arguments[0];
            # var rect = elem.getBoundingClientRect();
            # return (
            #     rect.top >= 0 &&
            #     rect.left >= 0 &&
            #     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            #     rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            # );
            # """, element)
            #
            # # If the element is not in the viewport, scroll into view
            # if not is_in_viewport:
            #     driver.execute_script("arguments[0].scrollIntoView(false);", element)



            Thread.sleep(500)
            #driver.execute_script("arguments[0].click();", element)
            actions = ActionChains(driver)
            actions.move_to_element(element).click().perform()

            #element.click()
            Thread.sleep(500)
            # elementHead= Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[@id='tabpanelMain_header']"),True)
            # driver.execute_script("arguments[0].scrollIntoView();", elementHead)
            # driver.execute_script("window.scrollBy(0, -50);")


            # Click the element

            logging.info("Clicked the element successfully.")

            # Mark the step as passed
            KeywordUtil.markPassed("Clicked Successfully")

        except Exception as e:
            logging.error(f"Failed to click the element. Error: {str(e)}")
