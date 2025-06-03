from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.DriverFactory import DriverFactory


def beforeEach():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI

    #WebUI.openBrowser("http://facebook.com")
    print("Running beforeEach hook...")

def afterEach():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI

    #WebUI.openBrowser("http://facebook.com")

    print("Running afterEach hook...")

def afterSuite():
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
    from WebUI.DriverFactory import DriverFactory

    WebUI.openBrowser("https://factorial.fr")
    driverX=DriverFactory.getWebDriver()
    driverX.quit()

    print("Running afterSuite hook...")
