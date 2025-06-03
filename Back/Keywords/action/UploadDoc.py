from selenium.common.exceptions import NoSuchElementException
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class UploadDoc:
    @staticmethod
    def UploadFile(path: str):
        """
        Uploads a file using the specified upload button element.

        Args:
            path (str): The full path to the file to be uploaded.
        """
        try:
            # Find the upload button test object
            field_element = findTestObject('Object Repository/Wizard/UploadButton_BulkAttCard')
            print(f'field_element is {field_element}')
            # Find the web element and send file path
            web_element = WebUiCommonHelper.findWebElement(field_element, 0)
            web_element.send_keys(path)

            KeywordUtil.markPassed("File uploaded successfully")

        except NoSuchElementException as e:
            KeywordUtil.markFailed(f"Upload element not found: {str(e)}")
            raise
        except Exception as e:
            KeywordUtil.markFailed(f"Failed to upload file: {str(e)}")
            raise