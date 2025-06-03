
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from Utils.ByType import ByJavaMethod



class CheckCardIsDisplayedrelated :
    @staticmethod
    def checkCardDisplayed( cardName) :
        clickcard = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//*[text()='"+cardName+"']"))
        if (GlobalVariable.version=='V9') :
            clickcard = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[text()='"+cardName+"']//ancestor::div[contains(@class,'relateditem-Card') or contains(@class,'relateditem-vertical-Card')]"))
        else:
            clickcard = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,'x-title-item')]//span[text() = '"+cardName+"']//ancestor::div[contains(@class,'relateditem-vertical-Card')]//div[contains(@class,'edit-relateditem')]"))
        clickcard.is_displayed()
        KeywordUtil.markPassed("The card "+cardName+" is displayed----"+clickcard.is_displayed())
