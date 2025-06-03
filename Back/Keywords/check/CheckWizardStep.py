import logging
import time

from selenium.webdriver.common.by import By

from TestCaseExecutor import GlobalVariable
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


class CheckWizardStep:

    @staticmethod

    def check( wizardStepName) :
        if(GlobalVariable.version =='V9') :
            start_time = time.time()
            stepText=''

            is_equal=False

            while (time.time() - start_time)<30 and not is_equal:
                KeywordUtil.logInfo("Refreshing")



                currentStep = findTestObject("Object Repository/Custom Keywords/Wizard/CurrentWizardStep2")
                #currentStepWebElement = WebUiCommonHelper.findWebElement(currentStep,0)
                stepText = WebUI.getText(currentStep)
                #stepText =WebUI.getText(currentStepWebElement)

                is_equal =stepText==wizardStepName
                print(f"checking step time elapsed is :{time.time() - start_time}")

                print("Current Wizard Step is "+stepText)
            if (is_equal) :
                KeywordUtil.markPassed("Current Wizard Step is "+stepText)
            else :
                KeywordUtil.markFailed("Current Wizard Step is "+stepText)
        else :
            start_time = time.time()
            stepText=''

            is_equal=False

            while (time.time() - start_time)<30 and not is_equal:
                KeywordUtil.logInfo("Refreshing")

                currentStep = findTestObject("Object Repository/Custom Keywords/Wizard/CurrentWizardStep")
                currentStepWebElement = WebUiCommonHelper.findWebElement(currentStep,0)
                stepText = currentStepWebElement.findElement(ByJavaMethod.CSS_SELECTOR(".step-display")).text


                is_equal =stepText==wizardStepName
                print(f"checking step time elapsed is :{time.time() - start_time}")

                print("Current Wizard Step is "+stepText)
            if (is_equal) :
                KeywordUtil.markPassed("Current Wizard Step is "+stepText)
            else :
                KeywordUtil.markFailed("Current Wizard Step is "+stepText)
