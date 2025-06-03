import openpyxl
from typing import List, Union
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
import ProjectPathManager

class GetPassword_fromExcel:
    @staticmethod
    def execute(user: str) -> Union[List[str], bool]:
        """
        Retrieves user credentials from an Excel file based on environment profile.

        Args:
            user (str): The username to search for in the Excel sheet

        Returns:
            Union[List[str], bool]: List containing [username, password] or False if not found
        """

        file_path = ProjectPathManager.ProjPath +'/externalFiles/Users.xlsx'
        try:


            # Load the workbook and select sheet based on profile
            workbook = openpyxl.load_workbook(file_path, read_only=True)

            # Determine sheet index based on profile
            sheet_index = 0 if GlobalVariable.Profil == "demo" else 1
            sheet = workbook.worksheets[sheet_index]

            # Search first row for matching user
            first_row = sheet[1]  # Rows are 1-indexed in openpyxl
            for cell in first_row:
                if cell.value and str(cell.value).strip().lower() == user.lower():
                    username_col = cell.column
                    username = cell.value

                    # Get password from next row (row 2)
                    password_row = 2
                    password_cell = sheet.cell(row=password_row, column=username_col)

                    if password_cell.value:
                        password = str(password_cell.value)
                        credentials = [username, password]
                        KeywordUtil.logInfo(f"User credentials found: {credentials}")
                        return credentials

            KeywordUtil.logInfo("User not found in Excel sheet")
            return False

        except FileNotFoundError:
            error_msg = f"Excel file not found at: {file_path}"
            KeywordUtil.markFailed(error_msg)
            return False
        except Exception as e:
            error_msg = f"Error reading Excel file: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            return False