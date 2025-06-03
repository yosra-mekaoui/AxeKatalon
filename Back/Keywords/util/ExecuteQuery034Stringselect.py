import logging
import pyodbc
from TestCaseExecutor import GlobalVariable
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI


class ExecuteQuery034Stringselect:
    @staticmethod
    def exec(query: str, column: str, db_name: str, db_server: str) -> str:
        """
        Executes an SQL query and retrieves a string value from a specified column.

        :param query: SQL query to execute
        :param column: Column name to extract the result from
        :param db_name: Database name
        :param db_server: Database server address
        :return: Retrieved string value or an empty string if no result
        """

        logging.info(f"Connecting to DB: {db_name} on {db_server}")

        # Load credentials
        user_db = GlobalVariable.USERdb
        password_db = GlobalVariable.MDPdb

        conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={db_server};DATABASE={db_name};UID={user_db};PWD={password_db}'
        print(f"Connection String: {conn_str}")
        print(f"Executing Query: {query}")

        try:
            with pyodbc.connect(conn_str) as connection:
                with connection.cursor() as cursor:
                    noCount = """ SET NOCOUNT OFF; """
                    try:
                        cursor.execute(noCount + query)
                        rows = None
                        while cursor.nextset():
                            try:
                                rows = cursor.fetchone()
                            except Exception as e:
                                print("Skipping non rs message: {}".format(e))

                        if rows == None:
                            cursor.execute(query)
                            row = cursor.fetchone()
                            if row:
                                result_value = str(row[0])
                                return result_value
                        else:
                            result_value = str(rows[0])
                            return result_value
                    except Exception as e:
                        print(f"First execution failed: {e}, retrying without NOCOUNT setting.")

        except Exception as e:
            logging.error(f"Database query failed: {e}")
            return ""
