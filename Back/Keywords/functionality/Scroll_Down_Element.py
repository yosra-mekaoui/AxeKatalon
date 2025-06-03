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


class Scroll_Down_Element :
    @staticmethod
    def Scroll( scrollAmount,  Path,  ScreenType, maxScrollAttempts) :
        isElementVisible = False
        if (ScreenType == "Main") :
            scrollableElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@class,'x-panel-body x-panel-body-default x-panel-body-default x-scroller') and ./div[@data-ref='outerCt']]"))
            if (scrollableElement != None) :
                scrollCount = 0

                while (not isElementVisible and scrollCount < maxScrollAttempts):
                    js = DriverFactory.getWebDriver()
                    js.execute_script("arguments[0].scrollTop += " +  str(scrollAmount) + ";", scrollableElement)
                    WebUI.delay(1)
                    scrollCount=+1
                    isElementVisible = WebUI.verifyElementInViewport(findTestObject("Object Repository/GUI/Xpath", {'xpath': Path}), 5, FailureHandling.OPTIONAL)
                if not isElementVisible:
                    KeywordUtil.markFailed("Element is not visible after " + str(maxScrollAttempts) + " scroll attempts.")
            else :
                KeywordUtil.markFailed("No visible scrollable element found ")



        elif (ScreenType == "HomePage"):
            scrollableElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@id,'homepageID') and contains(@class,'x-panel-body-default x-scroller')]"))
            if (scrollableElement != None) :
                scrollCount = 0
                while (not isElementVisible  and  scrollCount < maxScrollAttempts) :
                    js = DriverFactory.getWebDriver()
                    js.execute_script("arguments[0].scrollTop += " +  str(scrollAmount) + ";", scrollableElement)
                    WebUI.delay(1)
                    scrollCount=+1
                    isElementVisible = WebUI.verifyElementInViewport(findTestObject("Object Repository/GUI/Xpath", {'xpath': Path}), 1, FailureHandling.OPTIONAL)
                if not isElementVisible:
                    KeywordUtil.markFailed("Element is not visible after " + str(maxScrollAttempts) + " scroll attempts.")
            else :
                KeywordUtil.markFailed("No visible scrollable element found ")





        elif (ScreenType == "Popon"):
            scrollableElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[(contains(@id,'fp') or contains(@id,'poponfield')) and contains(@class,'x-panel-body-default x-scroller')]"))
            if (scrollableElement != None) :
                scrollCount = 0
                while ((not isElementVisible)  and  scrollCount < maxScrollAttempts) :
                    js = DriverFactory.getWebDriver()
                    js.execute_script(f"arguments[0].scrollTop += {scrollAmount};", scrollableElement)
                    WebUI.delay(2)
                    scrollCount=scrollCount+1
                    isElementVisible = WebUI.verifyElementInViewport(findTestObject("Object Repository/GUI/Xpath", {'xpath': Path}), 1, FailureHandling.OPTIONAL)


                if (not isElementVisible) :
                    KeywordUtil.markFailed("Element is not visible after " + str(maxScrollAttempts) + " scroll attempts.")

            else :
                KeywordUtil.markFailed("No visible scrollable element found ")





        elif (ScreenType == "SearchScreen"):
            scrollableElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@id,'search') and contains(@class,'x-panel-body-default x-scroller')]"))
            if (scrollableElement != None) :
                scrollCount = 0
                while (not isElementVisible  and  scrollCount < maxScrollAttempts) :
                    js = DriverFactory.getWebDriver()
                    js.execute_script("arguments[0].scrollTop += " +  str(scrollAmount) + ";", scrollableElement)
                    WebUI.delay(1)
                    scrollCount=+1
                    isElementVisible = WebUI.verifyElementInViewport(findTestObject("Object Repository/GUI/Xpath", {'xpath': Path}), 1, FailureHandling.OPTIONAL)

                if (not isElementVisible) :
                    KeywordUtil.markFailed("Element is not visible after " + str(maxScrollAttempts) + " scroll attempts.")
            else :
                KeywordUtil.markFailed("No visible scrollable element found")





        elif (ScreenType == "Grid") :
            scrollableElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@id,'gridview') and contains(@class,'x-grid-with-row-lines')]"))
            if (scrollableElement != None) :
                scrollCount = 0
                while (not isElementVisible  and  scrollCount < maxScrollAttempts) :
                    js = DriverFactory.getWebDriver()
                    js.execute_script("arguments[0].scrollTop += " +  str(scrollAmount) + ";", scrollableElement)
                    WebUI.delay(1)
                    scrollCount=+1
                    isElementVisible = WebUI.verifyElementInViewport(findTestObject("Object Repository/GUI/Xpath", {'xpath': Path}), 1, FailureHandling.OPTIONAL)
                if (not isElementVisible) :
                    KeywordUtil.markFailed("Element is not visible after " + str(maxScrollAttempts) + " scroll attempts.")
            else :
                KeywordUtil.markFailed("No visible scrollable element found")










