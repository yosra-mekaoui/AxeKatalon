import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from Utils.ObjectRepository import ObjectRepository


findTestObject = ObjectRepository.findTestObject

class DeletefilterV2optionalOrNot:
    @staticmethod
    def deletefilter( Filtername: str, Optional: bool):
        try:
            # Locate the button to open filters
            fieldElementObject = findTestObject("Object Repository/Custom Keywords/Filter/button")
            field_web_element = WebUiCommonHelper.findWebElement(fieldElementObject,3)
            field_web_element.click()

            try:
                # Locate filter by name

                fieldElementObjectF = findTestObject("Object Repository/Custom Keywords/Filter/filtername",{'filtername':Filtername})

                field_web_element_f = WebUiCommonHelper.findWebElement(fieldElementObjectF, 3)

                # Double-click to delete filter
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.click(field_web_element_f).perform()

            except NoSuchElementException:
                if not Optional:
                    logging.error(f"Filter '{Filtername}' was not found.")
                    raise Exception(f"Filter '{Filtername}' was not found.")
                else:
                    logging.info(f"Filter '{Filtername}' was not found, but it's optional.")

            # Perform double-click action again
            actions = ActionChains(DriverFactory.getWebDriver())
            actions.click(field_web_element).perform()

            try:
                # Check if filter is still present
                fieldElementObjectV = findTestObject("Object Repository/Custom Keywords/Filter/filtername",
                                                     {'filtername': Filtername})

                field_web_element_V = WebUiCommonHelper.findWebElement(fieldElementObjectV, 3)
                logging.error(f"Filter '{Filtername}' was not deleted.")
                raise Exception(f"Filter '{Filtername}' was not deleted.")

            except NoSuchElementException:
                logging.info(f"Filter '{Filtername}' is deleted successfully.")

        except Exception as e:
            logging.error(f"Error during filter deletion: {e}")
