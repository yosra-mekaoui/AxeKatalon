import os
import datetime
from Utils.keywordUtil import KeywordUtil


class CheckDownloadedfileisdeleted:
    @staticmethod
    def CheckFileisDownloaded(download_path: str, file_extension: str) -> bool:
        """
        Checks if a file with current date pattern exists in specified directory,
        deletes it if found, and returns status.

        Args:
            download_path (str): Path to directory to check
            file_extension (str): File extension to match (including dot)

        Returns:
            bool: True if file found and deleted, False otherwise
        """
        try:
            # Generate date-formatted filename
            formatted_date = datetime.datetime.now().strftime("_%d_%m_%Y")
            target_file = formatted_date + file_extension
            KeywordUtil.logInfo(f"Searching for file: {target_file}")

            # Validate directory exists
            if not os.path.isdir(download_path):
                KeywordUtil.markFailed(f"Directory not found: {download_path}")
                return False

            # Search through directory contents
            for filename in os.listdir(download_path):
                KeywordUtil.logInfo(f"Checking file: {filename}")

                if filename == target_file:
                    file_path = os.path.join(download_path, filename)
                    try:
                        os.remove(file_path)
                        KeywordUtil.markPassed(f"Deleted file: {target_file}")
                        return True
                    except OSError as e:
                        KeywordUtil.markFailed(f"Error deleting file: {str(e)}")
                        return False

            # No matching file found
            KeywordUtil.markFailed(f"File not found: {target_file}")
            return False

        except Exception as e:
            KeywordUtil.markFailed(f"Unexpected error: {str(e)}")
            return False