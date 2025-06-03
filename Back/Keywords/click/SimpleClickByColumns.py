import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.NameValue import NameValue

class SimpleClickByColumns:
    @staticmethod
    def simplclick(column_name: str, column_value: str):
        logging.info(f"Click By Column {column_name}:{column_value}")

        basic_grid = TablesUtil2.findfindFirstVisibleGrid()
        name_value = NameValue(name=column_name, value=column_value)
        name_value.name = column_name
        name_value.value = column_value

        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])
        logging.info(f"Matching element clickbycolumn {matching_record}")

        actions = ActionChains(DriverFactory.getWebDriver())
        actions.click(matching_record).perform()
        logging.info(f"Record {matching_record} Clicked Successfully")
