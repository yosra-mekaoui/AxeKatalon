import logging
import time

from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException

from Utils.Common import StepFailedExceptionContinue
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
from Utils.GlobalContext import GlobalContext
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject

class Deletefilter:
    @staticmethod
    def deletefilter(filter_name: str):
        """
        Deletes a filter by name and verifies its deletion.

        Args:
            filter_name (str): The name of the filter to delete.
        """

        #try:
            # Find and click the filter button
        try:
            # Find and click the filter button
            field_element_object = findTestObject("Object Repository/Custom Keywords/Filter/button")
            field_web_element = WebUiCommonHelper.findWebElement(field_element_object, 0)
            field_web_element.click()

            # Attempt to double-click the filter by name
            try:
                field_element_object_f = findTestObject(
                    "Object Repository/Custom Keywords/Filter/filtername",
                    {"filtername": filter_name}
                )
                field_web_element_f = WebUiCommonHelper.findWebElement(field_element_object_f, 0)
                if (field_web_element_f is None):
                    KeywordUtil.markFailed(f"Filter {filter_name} was not deleted")
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.double_click(field_web_element_f).perform()
            except Exception as e:
                KeywordUtil.markFailed(f"Filter {filter_name} was not found")
                raise

            # Double-click the original field again
            actions = ActionChains(DriverFactory.getWebDriver())
            actions.double_click(field_web_element).perform()
            time.sleep(3)
        # Verify if filter is deleted
            try:
                field_element_object_v = findTestObject("Object Repository/Custom Keywords/Filter/filtername", {"filtername": filter_name})
                field_web_element_v = WebUiCommonHelper.findWebElement(field_element_object_v, 0)
                if(field_web_element_v is not None) :
                    KeywordUtil.markFailed(f"Filter {filter_name} was not deleted")

            except NoSuchElementException:
                KeywordUtil.markPassed(f"Filter {filter_name} is deleted")

        except Exception as e:
            KeywordUtil.markFailed(f"Error deleting filter: {str(e)}")
            raise



        # except Exception as e:
        #     KeywordUtil.markFailed(f"An error occurred during filter deletion: {str(e)}")
        #     raise