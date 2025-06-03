import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import FailureHandling
from Utils.keywordUtil import KeywordUtil
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil

from Keywords.util.NameValue import NameValue
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.remote.webdriver import WebDriver

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject
from WebUI.DriverFactory import DriverFactory


class DoubleClickByColumns:
    """
    Class to handle double-clicking records by column name and value.
    """

    @staticmethod
    def click(column_name: str, column_value: str):
        """
        Double-clicks a record in a table that matches the given column name and value.

        Args:
            column_name (str): The name of the column to search for.
            column_value (str): The value to match in the column.
        """
        KeywordUtil.logInfo(f"Double Click By Column {column_name}: {column_value}")
        print(f"Double Click By Column {column_name}: {column_value}")
        basic_grid = TablesUtil2.findfindFirstVisibleGrid()
        name_value = NameValue(name=column_name, value=column_value)
        logging.info(name_value)

        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])
        KeywordUtil.logInfo(f'Matching element doubleclickbycolumn: {matching_record}')

        driver: WebDriver = DriverFactory.getWebDriver()
        actions = ActionChains(driver)
        actions.double_click(matching_record).perform()

        KeywordUtil.markPassed(f"Record {matching_record} Double Clicked Successfully")
