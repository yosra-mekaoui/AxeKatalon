import logging
from selenium.webdriver.common.by import By

from Utils.Common import Thread
from Utils.keywordUtil import KeywordUtil
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Keywords.util.Commands import Commands
from WebUI.BuiltinKeywords import FailureHandling

from Utils.ByType import ByJavaMethod
findTestObject = ObjectRepository.findTestObject



class Expand :

    @staticmethod
    def expand( gridName, Action) :
        fieldElementObject = findTestObject("Object Repository/Custom Keywords/Grids/GridName",{'GridName':gridName})
        fieldWebElement = WebUiCommonHelper.findWebElement(fieldElementObject,0)
        if(Action=="Expand") :
            KeywordUtil.logInfo("Expand The Grid   "+gridName)
            action='true'
            fieldWebElement.click()
            Thread.sleep(5000)
            gridIsExpanded = findTestObject("Object Repository/Custom Keywords/Grids/GridNameExpand",{'GridName':gridName,'Action':action})
            if (gridIsExpanded != None) :
                KeywordUtil.logInfo("The grid "+gridName+" is expanded")

        else:
            KeywordUtil.logInfo("Collapse The Grid   "+gridName)
            fieldWebElement.click()
            action='false'
            gridIsCollapsed = findTestObject("Object Repository/Custom Keywords/Grids/GridNameExpand",{'GridName':gridName,'Action':action})
            if (gridIsCollapsed != None) :
                KeywordUtil.logInfo("The grid "+gridName+" is Collapsed")




