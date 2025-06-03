import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from TestCaseExecutor import GlobalVariable
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.WebUiCommonHelper import WebUiCommonHelper

findTestObject = ObjectRepository.findTestObject
class AttachDocument:

    @staticmethod
    def attach(fileValue):
        fieldElement = findTestObject('Object Repository/Custom Keywords/Attachment/AttachDocumentFieldElement')
        we = WebUiCommonHelper.findWebElement(fieldElement, 10)
        field_element_id = we.get_attribute("id")
        js_script = (
            f"$('#{field_element_id}-trigger-filebutton').attr('style','width:200px !important');"
            f"$('#{field_element_id}-button').attr('style','width:200px !important');"
            f"$('#{field_element_id}-button-fileInputEl').attr('style',"
            f"'visibility: visible; overflow: visible; text-indent: 0; opacity: 1');"
            f"$('#{field_element_id}-inputEl').val('{fileValue}');"
        )
        fi = findTestObject("Object Repository/Custom Keywords/Attachment/FileUploadFieldID", {'fieldID':field_element_id})
        WebUI.sendKeys(fi, fileValue)



    @staticmethod
    def attach1(file_value: str):
        """
        Attaches a document by manipulating the file upload field using JavaScript.

        :param driver: Selenium WebDriver instance
        :param file_value: The file path to be uploaded
        """
        logging.info("Locating the attachment field element.")
        driver = DriverFactory.getWebDriver()
        try:
            field_element = driver.find_element(By.XPATH, "//input[@type='file']")
            field_element_id = field_element.get_attribute("id")

            js_script = (
                f"$('#{field_element_id}-trigger-filebutton').attr('style','width:200px !important');"
                f"$('#{field_element_id}-button').attr('style','width:200px !important');"
                f"$('#{field_element_id}-button-fileInputEl').attr('style',"
                f"'visibility: visible; overflow: visible; text-indent: 0; opacity: 1');"
                f"$('#{field_element_id}-inputEl').val('{file_value}');"
            )

            logging.info(f"Executing JavaScript: {js_script}")
            driver.execute_script(js_script)

            # Send file path directly to input field
            field_element.send_keys(file_value)
            logging.info("File attached successfully.")

        except Exception as e:
            logging.error(f"Failed to attach document: {e}")
