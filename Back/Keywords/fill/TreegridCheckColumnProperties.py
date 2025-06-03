import logging
import time
from typing import List
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

from Keywords.util.NameValue import NameValue
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


class TreegridCheckColumnProperties:

    @staticmethod
    def fillGrid(parameters: List[str], def_value: str, decimal_pre: str):
        KeywordUtil.logInfo("Line is displayed")
        val = def_value
        decimal = decimal_pre

        columns = []
        nv=NameValue()
        nv.name= parameters[0]
        nv.value=parameters[1]
        columns.append(nv)

        grid_item = TablesUtil.getMatchingRecord(TablesUtil.getTreeGrid(), columns)
        record_index = grid_item.get_attribute("data-recordindex")
        number = int(record_index) + 1
        record_index1 = str(number)
        KeywordUtil.logInfo(f"index is: {record_index}")

        if grid_item:
            KeywordUtil.markPassed(f"Line with column {parameters[0]} and value {parameters[1]} exists")

        actions = ActionChains(DriverFactory.getWebDriver())
        actions.move_to_element(grid_item).perform()
        KeywordUtil.logInfo(f"Mouse overrrrr {grid_item.text}")

        icon_plus = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(f"table[data-recordindex='{record_index}'] .axe-hierarchy-cmd-btnAdd"), True)
        icon_plus.click()
        KeywordUtil.logInfo("Click Icon plus")

        button_add_pack = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//span[text()='Add Package']"), True)
        button_add_pack.click()
        KeywordUtil.logInfo("Click Icon plus")

        Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR("body")).click()

        list_of_columns = []
        if len(parameters) > 2:
            for i in range(2, len(parameters), 2):
                if i + 1 >= len(parameters):
                    break
                name_value = {'name': parameters[i], 'value': parameters[i + 1]}
                list_of_columns.append(name_value)

        TreegridCheckColumnProperties.fillNewAddedRow(int(record_index1), list_of_columns, val, decimal)

    @staticmethod
    def fillNewAddedRow(record_index: int, columns: List[dict], def_val: str, decimal_d: str):
        edit_cell_input0 = None
        for column in columns:
            column_div_xpath = f".//span[contains(@class,'x-column-header-text-inner') and text() = '{column['name']}']/../../../../.."
            column_div = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(column_div_xpath))
            KeywordUtil.logInfo(f"first {column_div.text}")

            column_div2 = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(column_div_xpath), True)
            KeywordUtil.logInfo(f"second {column_div2.text}")

            data_component_id = column_div2.get_attribute("id")

            edit_cell_input2 = Commands.findFirstVisibleElement( ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//div[@class='x-grid-cell-inner ']"))

            if column['name'].lower() == "limit type":
                KeywordUtil.logInfo(f"index {record_index} columnid {data_component_id} text {def_val}")
                click_card = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//div[@class='x-grid-cell-inner ' and text()='{def_val}']"))
                KeywordUtil.logInfo("yeeees")
                KeywordUtil.markPassed(f"The default value {def_val} is displayed ---- {click_card.is_displayed()}")

            if "numbercolumn" in data_component_id:
                KeywordUtil.logInfo(f"{column['name']} is numeric Field")

            edit_cell = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']"))

            edit_cell_class = edit_cell.get_attribute("class")
            cell_selected = "selected" in edit_cell_class

            if cell_selected:
                edit_cell.click()
            else:
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.double_click(edit_cell).perform()

            time.sleep(2)

            edit_cell_input = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//input"))

            edit_cell_input.send_keys(column['value'])

            if "gridcolumn" in edit_cell_class:
                KeywordUtil.logInfo(f"{column['name']} is combobox Field")
                field_web_element22 = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//li[1]"), True)
                field_web_element22.click()

            if column['name'].lower() == "existing limit amount":
                so = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(column_div_xpath))
                so.click()
                click_card = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//div[@class='x-grid-cell-inner ' and text()='{decimal_d}']"))
                KeywordUtil.markPassed(f"The Amount {decimal_d} is displayed with decimal decision ---- {click_card.is_displayed()}")

            time.sleep(2)
            edit_cell.send_keys(Keys.ENTER)
            edit_cell_input0 = edit_cell_input

        if edit_cell_input0:
            edit_cell_input0.send_keys(Keys.ENTER)