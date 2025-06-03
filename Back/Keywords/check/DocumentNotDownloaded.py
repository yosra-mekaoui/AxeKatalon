import os
import datetime
import logging
from Utils.keywordUtil import KeywordUtil


class DocumentNotDownloaded:

    @staticmethod
    def CheckFileisNotDownloaded(download_path: str, file_name: str, file_extension: str) -> bool:
        """
        Verify if a file does NOT exist in the specified directory.
        If the file is found, it will be deleted, and the method will return False.

        Args:
            download_path (str): Path to check for files
            file_name (str): Base name of the file without extension
            file_extension (str): File extension including dot (e.g. '.pdf')

        Returns:
            bool: True if file does NOT exist, False if file exists and was deleted
        """
        try:
            # Generate date-stamped filename
            current_date = datetime.datetime.now()
            formatted_date = current_date.strftime("_%m_%d_%Y")  # Matches Groovy's "_MM_dd_YYYY"
            date_stamped_file = f"{file_name}{formatted_date}{file_extension}"
            base_file = f"{file_name}{file_extension}"

            KeywordUtil.logInfo(f"Checking if file does NOT exist: {file_name}")
            logging.info(f"Scanning directory: {download_path}")

            # Get directory contents
            dir_contents = os.listdir(download_path)
            last_attempt = ""

            if not dir_contents:
                logging.info("Directory is empty")
                KeywordUtil.markPassed(f"No files found in {download_path}")
                return True

            for filename in dir_contents:
                logging.info(f"Checking file: {filename}")
                full_path = os.path.join(download_path, filename)

                if filename in (date_stamped_file, base_file):
                    try:
                        os.remove(full_path)
                        KeywordUtil.markFailed(
                            f"{filename} existed in {download_path} and was deleted"
                        )
                        return False
                    except Exception as delete_error:
                        error_msg = f"Failed to delete {filename}: {str(delete_error)}"
                        logging.error(error_msg)
                        KeywordUtil.markFailed(error_msg)
                        return False

                last_attempt = filename

            # If loop completes without finding the file
            success_msg = f"{date_stamped_file} or {base_file} does not exist in {download_path}"
            logging.info(success_msg)
            KeywordUtil.markPassed(success_msg)
            return True

        except Exception as e:
            error_msg = f"Error checking files: {str(e)}"
            logging.error(error_msg)
            KeywordUtil.markFailed(error_msg)
            return False