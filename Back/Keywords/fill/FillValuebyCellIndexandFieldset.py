from selenium.webdriver import ActionChains, Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from Utils.Common import Thread
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from selenium.common.exceptions import NoSuchElementException, TimeoutException

class FillValuebyCellIndexandFieldset :
	@staticmethod
	def fillValueCellIndex(index, fieldsetName, ColumnName,value):
		findRow = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//fieldset[contains(@aria-label,'"+fieldsetName+"')]//div[@class='x-grid-view x-grid-with-col-lines x-grid-with-row-lines x-fit-item x-grid-view-default x-unselectable x-scroller']//table[@data-recordindex='"+index+"']"))


		rowIndex = findRow.get_attribute("data-recordindex")
		KeywordUtil.logInfo("recordIndex "+rowIndex)



		findFinancialElementAction = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(" .//fieldset[contains(@aria-label,'"+fieldsetName+"')]//span[contains(@class,'x-column-header-text-inner') and text()='"+ColumnName+"']/ancestor::div[contains(@class,'x-column-header x-column-header-align')]"))


		dataActionColumnId = findFinancialElementAction.get_attribute("id")

		KeywordUtil.markPassed("idddddd  "+dataActionColumnId)

		findCell = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//table[contains(@data-recordindex,'"+rowIndex+"')]//td[contains(@class,'x-grid-cell-"+dataActionColumnId+"')]"))
		KeywordUtil.markPassed("findCell  ")


		actions = ActionChains(DriverFactory.getWebDriver())
		actions.click(findCell).perform()
		actions.double_click(findCell).perform()
		KeywordUtil.markPassed("clickkk   ")

		Thread.sleep(2000)
		editCellInput = DriverFactory.getWebDriver().find_element(By.CSS_SELECTOR, ".x-editor input")

		editCellInput.send_keys(value)
		KeywordUtil.markPassed("fillll   ")
		editCellInput.send_keys(Keys.ENTER)
		Thread.sleep(2000)

