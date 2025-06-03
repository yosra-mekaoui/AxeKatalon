import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.DriverFactory import DriverFactory
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.NameValue import NameValue
from Utils.keywordUtil import KeywordUtil
class VerifyElementByColumns:
    @staticmethod
    def click(column_name: str, column_value: str):
        logging.info(f"Double Click By Column {column_name}: {column_value}")
        print (f"Double Click By Column {column_name}: {column_value}")

        basic_grid = TablesUtil2.findfindFirstVisibleGrid()
        name_value = NameValue(column_name,column_value )
        name_value.name = column_name
        name_value.value = column_value
        logging.info(str(name_value))

        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])
        logging.info(f"Matching element doubleclickbycolumn {matching_record}")
        print(f"Matching element ")

        if matching_record is not None:
            logging.info(f"Matching element is displayed {matching_record}")
            print(f"atching element is displayed ")
        else:
            logging.error("Matching element not displayed or doesn't exist")
            raise Exception("Matching element not displayed or doesn't exist")

        actions = ActionChains(DriverFactory.getWebDriver())
        # actions.double_click(matching_record).perform()

        logging.info(f"Record {matching_record} Double Clicked Successfully")
        KeywordUtil.markPassed(f"{matching_record} Double Clicked Successfully")
