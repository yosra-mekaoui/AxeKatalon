import logging
import time
from typing import List
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
from WebUI.DriverFactory import DriverFactory
from Utils.ByType import ByJavaMethod
from Keywords.util.TablesUtil import TablesUtil
from selenium.webdriver.support.ui import WebDriverWait

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class FillTreeGrid:

    @staticmethod
    def fillGrid(parameters: List[str]):
        KeywordUtil.logInfo("Line is displayed")

        columns = []
        nv = {'name': parameters[0], 'value': parameters[1]}
        columns.append(nv)

        grid_item = TablesUtil.getMatchingRecord(TablesUtil.getTreeGrid(), columns)
        record_index = grid_item.get_attribute("data-recordindex")
        if grid_item:
            KeywordUtil.markPassed(f"Line with column {parameters[0]} and value {parameters[1]} exists")

        actions = ActionChains(DriverFactory.getWebDriver())
        actions.move_to_element(grid_item).perform()
        KeywordUtil.logInfo("Mouse overrrrr")

        icon_plus = Commands.findFirstVisibleElement(
            ByJavaMethod.CSS_SELECTOR(f"table[data-recordindex='{record_index}'] .axe-hierarchy-cmd-btnAdd"), True)
        icon_plus.click()
        KeywordUtil.logInfo("ClickIconnnnn")

        Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR("body")).click()

        list_of_columns = []
        if len(parameters) > 2:
            for i in range(2, len(parameters), 2):
                if i + 1 >= len(parameters):
                    break
                name_value = {'name': parameters[i], 'value': parameters[i + 1]}
                list_of_columns.append(name_value)

        FillTreeGrid.fillNewAddedRow(int(record_index) + 1, list_of_columns)

    @staticmethod
    def fillNewAddedRow(record_index: int, columns: List[dict]):
        for column in columns:
            column_div_xpath = f".//span[contains(@class,'x-column-header-text-inner') and text() = '{column['name']}']/../../../../.."
            column_div = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(column_div_xpath))
            column_div2 = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(column_div_xpath), True)

            KeywordUtil.logInfo(f"columnDiv {column_div2}")
            data_component_id = column_div2.get_attribute("id")
            KeywordUtil.logInfo(f"idddd {data_component_id}")

            edit_cell_xpath = f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']"
            edit_cell = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(edit_cell_xpath))
            KeywordUtil.logInfo(f"editCell {edit_cell}")

            edit_cell_class = edit_cell.get_attribute("class")
            cell_selected = "selected" in edit_cell_class

            if cell_selected:
                edit_cell.click()
            else:
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.double_click(edit_cell).perform()

            time.sleep(2)
            edit_cell_input_xpath = f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//input"
            edit_cell_input = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(edit_cell_input_xpath))
            edit_cell_input.send_keys(column['value'])
            time.sleep(2)