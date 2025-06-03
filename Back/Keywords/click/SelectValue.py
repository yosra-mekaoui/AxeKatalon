import logging
from selenium.webdriver.common.by import By
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Keywords.util.DropdownUtil import DropdownUtil
from Utils.ByType import ByJavaMethod


class SelectValue:
    @staticmethod
    def select(field_name: str, field_value: str):
        logging.info(f"Select Value {field_name}: {field_value}")

        # Locate the field element
        field_xpath = (".//div[contains(@class,'axe-basic-field')]//span[contains(@class,"
                       "'x-form-item-label-text') and (text() = '{0}:' or text() = '{0}*:' "
                       "or text() = '{0}' or text() = '{0}*')]/ancestor::div[contains(@class,"
                       "'axe-basic-field')]").format(field_name)

        field_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (field_xpath), True)

        field_id = field_web_element.get_attribute("id")

        if "fieldcontainer" in field_id:
            field_web_element = field_web_element.find_element(By.CSS_SELECTOR, ".axe-basic-field")

        # Set dropdown value
        DropdownUtil.setDropdownValue(field_web_element, field_value)

        logging.info("Refresh successfully")
