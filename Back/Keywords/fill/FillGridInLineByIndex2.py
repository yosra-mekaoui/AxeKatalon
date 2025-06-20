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
from selenium.webdriver.support.ui import WebDriverWait

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class FillGridInLineByIndex2:

    @staticmethod
    def fillGrid(index: str, parameters: List[str]):
        KeywordUtil.logInfo("Line is displayed")
        KeywordUtil.logInfo(f"Double Click By Index {index}")

        # Find first row element
        css_selector = f".basic-grid .x-grid-view .x-grid-item[data-recordindex=\"{index}\"] tr:nth-child(1) td:nth-child(1)"
        first_row = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(css_selector), True)

        time.sleep(2)
        WebDriverWait(DriverFactory.getWebDriver(), 10).until(
            EC.element_to_be_clickable((ByJavaMethod.CSS_SELECTOR(css_selector))))

        KeywordUtil.logInfo(f"Double Clicking {first_row.get_attribute('data-columnid')}")
        actions = ActionChains(DriverFactory.getWebDriver())
        actions.double_click(first_row).perform()

        KeywordUtil.markPassed(f"Record {str(first_row)} Double Clicked Successfully")

        list_of_columns = []
        if len(parameters) > 0:
            KeywordUtil.markPassed("Step B")
            for i in range(0, len(parameters), 2):
                if i + 1 >= len(parameters):
                    break
                KeywordUtil.markPassed(f"Step BI {i}")
                list_of_columns.append({
                    'name': parameters[i],
                    'value': parameters[i + 1]
                })

        KeywordUtil.markPassed("Step C")
        FillGridInLineByIndex2.fillNewAddedRow(index, list_of_columns)

    @staticmethod
    def fillNewAddedRow(index: str, columns: List[dict]):
        for column in columns:
            xpath = f"(.//span[contains(@class,'x-column-header-text-inner') and text() = '{column['name']}']/../../../../..)[1]"
            column_div = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath), True)

            KeywordUtil.logInfo(f"columnDiv {column_div}")
            data_component_id = column_div.get_attribute("id")
            KeywordUtil.logInfo(f"id {data_component_id}")
            KeywordUtil.markPassed("Step I")

            edit_cell_xpath = f".//table[@data-recordindex='{index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']"
            edit_cell = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(edit_cell_xpath))
            KeywordUtil.markPassed("Step II")

            time.sleep(4)
            KeywordUtil.logInfo(f"editCell {edit_cell.text}")
            edit_cell_class = edit_cell.get_attribute("class")
            KeywordUtil.logInfo(f"class {edit_cell_class}")

            cell_selected = "selected" in edit_cell_class
            if cell_selected:
                edit_cell.click()
            else:
                KeywordUtil.logInfo("else -------")
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.double_click(edit_cell).perform()

            KeywordUtil.markPassed("Step KI")

            input_xpath = f"//div[contains(@class,'grid-field')]//input[@aria-labelledby='{data_component_id}'] | //div[contains(@class,'grid-field')]//div[@aria-labelledby='{data_component_id}']"
            edit_cell_input = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(input_xpath))
            KeywordUtil.markPassed("Step KII")

            element_id = edit_cell_input.get_attribute("id")
            KeywordUtil.markPassed("Step action Y")

            actions_ii = ActionChains(DriverFactory.getWebDriver())
            actions_ii.send_keys_to_element(edit_cell_input, "").perform()
            actions_ii.move_to_element(edit_cell_input).click().perform()

            # Use key combination to select and delete existing text
            actions_ii.key_down(Keys.CONTROL).send_keys("a").key_up(Keys.CONTROL).send_keys(Keys.DELETE).perform()

            actions_ii.send_keys_to_element(edit_cell_input, column['value']).perform()
            KeywordUtil.markPassed("Step action Z")

            if "textfield" not in element_id and "datefield" not in element_id:
                field_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//li[1]"), True)
                field_element.click()

            time.sleep(2)