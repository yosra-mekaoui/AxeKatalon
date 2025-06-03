from typing import List
from selenium.common.exceptions import NoSuchElementException

from Utils.Common import Thread
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Utils.keywordUtil import KeywordUtil
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class UploadDocBulkAttachment:
    @staticmethod
    def UploadDocBulk(upload_button_name: str, path_doc: List[str]) -> None:
        """
        Uploads multiple documents using bulk attachment upload functionality.

        Args:
            upload_button_name (str): Name identifier for the upload button
            path_doc (List[str]): List of file paths to upload
        """
        try:
            # Find the upload button test object with parameter substitution
            field_element = findTestObject(
                'Object Repository/Wizard/UploadButton_BulkAttCard_SeveralFiles',
                {'value': upload_button_name}
            )

            # Get the web element and verify existence
            web_element = WebUiCommonHelper.findWebElement(field_element, 10)

            # Process file paths into newline-separated string
            if not path_doc:
                raise ValueError("Empty file path list provided")

            final_path = '\n'.join(path_doc)
            KeywordUtil.logInfo(f'Final upload paths: {final_path}')

            # Perform the file upload
            web_element.send_keys(final_path)
            KeywordUtil.markPassed("Bulk files uploaded successfully")
            Thread.sleep(3000)

        except NoSuchElementException as e:
            error_msg = f"Upload element '{upload_button_name}' not found: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise
        except ValueError as e:
            KeywordUtil.markFailed(str(e))
            raise
        except Exception as e:
            error_msg = f"Failed to upload bulk documents: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise