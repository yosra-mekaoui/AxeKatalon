
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI

def beforeEach():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
    print("Running beforeEach hook...")

def afterEach():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
    WebUI.takeFullPageScreenshot()
    print("Running afterEach hook...")

def afterSuite():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
    from WebUI.DriverFactory import DriverFactory
    driverX = DriverFactory.getWebDriver()
    driverX.quit()
    print("Running afterSuite hook...")
