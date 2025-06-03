from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI

findTestObject = ObjectRepository.findTestObject


import logging

class SelectGroupingCriteria:

    def select(currentNode):
        logging.info(f"Click on {currentNode}")

        list_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@id,'organizationalChartCombo') and contains(@class,'x-form-trigger-default x-form-arrow-trigger')]"), True)
        list_element.click()

        field_element_object = findTestObject('Custom Keywords/Fields/GroupingCriteria',{'CurrentNode':currentNode})  # Adjust the XPath as needed
        #field_element_object.click()
        WebUI.click(field_element_object)


        list_element.click()

        logging.info("Refresh successfully")
