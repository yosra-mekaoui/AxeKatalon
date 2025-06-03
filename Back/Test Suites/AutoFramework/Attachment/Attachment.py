from Utils.Common import Thread
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.DriverFactory import DriverFactory


def beforeEach():
    from Keywords import CustomKeywords
    from TestCaseExecutor import EnvironmentLoader

    from TestCaseExecutor import GlobalVariable
    global_vars = EnvironmentLoader.load_global_variables('Gate demo auto Core')
    for key, value in global_vars.items():
        setattr(GlobalVariable, key, value)

    CustomKeywords.util.ExecuteUpdateQuery034.exec("delete FROM [Gate_Sel_Axe_DMS].[dbo].[Attached_Document] Where ItemId in (167171,167164) ",
                                                   'counterparty_id', 'Gate_Sel_Axe_Credit', '192.168.0.34')
    #
    # CustomKeywords.util.ExecuteUpdateQuery034.exec("delete FROM [Gate_Sel_Axe_DMS].[dbo].[Attached_Document] Where idate>'2025-03-20 15:14:09.880'",
    #                                                'counterparty_id', 'Gate_Sel_Axe_Credit', '192.168.0.34')


def afterEach():
    from Utils.Common import Thread
    from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
    from WebUI.DriverFactory import DriverFactory
    try :
        WebUI.takeFullPageScreenshot()
        Thread.sleep(2000)
        WebUI.closeBrowser()
    except Exception as e:
        DriverFactory.localWebServerStorage= None
        print("couldnt execute after tc")
    # driverX=DriverFactory.getWebDriver()
    # driverX.quit()


def afterSuite():
    print('afterSuite')
