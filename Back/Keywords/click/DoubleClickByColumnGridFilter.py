import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil
from WebUI.DriverFactory import DriverFactory
from Keywords.util.NameValue import NameValue


class DoubleClickByColumnGridFilter:
    @staticmethod
    def click( column_name: str, column_value: str):
        logging.info(f"Double Click By Column {column_name}: {column_value}")

        basic_grid = TablesUtil2.findfindFirstVisibleGridWithFilter()
        name_value = NameValue(name=column_name, value=column_value)
        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])

        logging.info(f"Matching element doubleclickbycolumn {matching_record}")

        actions = ActionChains(DriverFactory.getWebDriver())
        actions.double_click(matching_record).perform()
        logging.info(f"Record {matching_record} Double Clicked Successfully")