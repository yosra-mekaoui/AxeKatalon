import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod

class FieldsetUtil:
    @staticmethod
    def getFieldsetElement(name: str = None) -> WebElement:
        """
        Finds the fieldset element based on the given name.
        If no name is provided, it finds the first visible fieldset element.

        Args:
            name (str, optional): The name of the fieldset to find. Defaults to None.

        Returns:
            WebElement: The found fieldset element.
        """
        if name is None:
            fieldset_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH( ".//fieldset[contains(@class,'x-fieldset')]//div[contains(@class,'x-fieldset-header-text')]/ancestor::fieldset"))
        else:
            fieldset_xpath = f".//fieldset[contains(@class,'x-fieldset')]//div[contains(@class,'x-fieldset-header-text') and text() = '{name}']/ancestor::fieldset"
            panel_xpath = f".//div[text() = '{name}']/ancestor::div[contains(@class,'basic-grid')]/parent::div"
            xpath = f"{fieldset_xpath} | {panel_xpath}"
            fieldset_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath))

        return fieldset_element