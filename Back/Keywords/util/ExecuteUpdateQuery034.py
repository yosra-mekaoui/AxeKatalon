import logging
import pyodbc
from TestCaseExecutor import GlobalVariable

class ExecuteUpdateQuery034:
    @staticmethod
    def exec(query: str, column: str, db_name: str, db_server: str):
        """
        Executes an SQL UPDATE query on a SQL Server database.

        Args:
            query (str): The SQL UPDATE query to execute.
            column (str): The column name (not used in this method but kept for consistency).
            db_name (str): The name of the database.
            db_server (str): The address of the database server.
        """
        # Log the connection details
        conn_str = f'DRIVER={{SQL Server}};SERVER={db_server};DATABASE={db_name};UID={GlobalVariable.USERdb};PWD={GlobalVariable.MDPdb}'
        logging.info(f"Connecting to DB: {db_name} on {db_server}")
        logging.info(f"Connection string: {conn_str}")

        try:
            # Establish a connection to the database
            with pyodbc.connect(conn_str) as connection:
                # Create a cursor to execute the query
                with connection.cursor() as cursor:
                    # Execute the UPDATE query
                    cursor.execute(query)
                    logging.info(f"Executed query: {query}")

                    # Commit the transaction
                    connection.commit()
                    logging.info("Query executed and changes committed successfully.")

        except Exception as e:
            # Log any errors that occur
            logging.error(f"Database query failed: {e}")
            raise  # Re-raise the exception to handle it at a higher level