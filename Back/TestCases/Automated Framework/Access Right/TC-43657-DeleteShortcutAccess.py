import json
import logging
import WebUI.WKeywords.closeWindowUrl
from Keywords import click
from Keywords import CustomKeywords
from ProjectPathManager import ProjPath

from Utils.keywordUtil import KeywordUtil
from Keywords.util import Commands
from Utils.Common import RunConfiguration, Thread
from WebUI import BuiltinKeywords
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.BuiltinKeywords import FailureHandling
import time
import selenium
from Utils.ObjectRepository import ObjectRepository
import Utils.ObjectRepository
from WebUI.DriverFactory import DriverFactory

from TestCaseExecutor import GlobalVariable
from WebUI.WebUiCommonHelper import WebUiCommonHelper
file_path = ProjPath + r"\settings\executionProperties.json"
import re
import os
from datetime import datetime
import random
from selenium.webdriver import Keys
findTestObject = ObjectRepository.findTestObject
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
WebUI.callTestCase('Login/LoginEnv', {'Login' : '', 'PWD' : ''}, FailureHandling.STOP_ON_FAILURE)

WebUI.maximizeWindow()

CustomKeywords.functionality.NavigateToByPath.navigateTo('Configuration,Administration,Access Management,Users,Edit',
False)

WebUI.setText(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Name'}), 'wissal')

WebUI.sendKeys(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Name'}), Keys.ENTER)

CustomKeywords.click.DoubleClickByIndex.click(0)

WebUI.click(findTestObject('Wave2/XPath', {'path' : '//span[text()=\'Profile\']'}))

if (WebUI.verifyElementNotPresent(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'BOD\']/ancestor::tr[@class=\'  x-grid-row\']/child::td[contains(@class,\'x-grid-cell \')][2]'}),
0, FailureHandling.OPTIONAL)):
	CustomKeywords.click.ClickElement.click('(//span[text()=\' Profile Shortname\'])[1]', '')

	while WebUI.verifyElementNotVisible(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'BOD\']'}), FailureHandling.OPTIONAL):
		CustomKeywords.click.ClickElement.click('(//a[@data-qtip=\'Next Page\'])[3]', '')

	CustomKeywords.click.ClickElement.click('//div[text()=\'BOD\']', '')

	CustomKeywords.click.ClickElement.click('//span[@class=\'x-btn-icon-el x-btn-icon-el-default-toolbar-small x-fa fa-angle-right \']',
	'')

	CustomKeywords.click.ClickElement.click('//span[@class=\'x-btn-icon-el x-btn-icon-el-default-toolbar-small x-fa fa-floppy-o \']',
	'')

	WebUI.verifyElementVisible(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'BOD\']/ancestor::tr[@class=\'  x-grid-row\']/child::td[contains(@class,\'x-grid-cell \')][2]'}))

CustomKeywords.functionality.NavigateToByPath.navigateTo('Configuration,Administration,Access Management,Profiles',
False)

WebUI.setText(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Profile name'}), 'Board of Directors')

WebUI.sendKeys(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Profile name'}), Keys.ENTER)

CustomKeywords.click.DoubleClickByIndex.click(0)

WebUI.click(findTestObject('Wave2/XPath', {'path' : '//div[@class=\'x-action-col-icon x-action-col-0  x-fa fa-eye\']'}))

CustomKeywords.click.ClickButton.click('Check All')

CustomKeywords.click.ClickButton.click('Save')

WebUI.setText(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Screen Reference Name'}), 'Consumer_accessright')

WebUI.sendKeys(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Screen Reference Name'}), Keys.chord(
Keys.ENTER))

WebUI.click(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'Consumer_accessright\']'}))

CustomKeywords.click.ClickButton.click('Check All')

CustomKeywords.click.ClickButton.click('Save')

WebUI.click(findTestObject('Access_Right/Delete_right', {'FieldName' : 'New main data item'}))

CustomKeywords.click.ClickButton.click('Save')

CustomKeywords.functionality.NavigateToByScreen.navigate('Search_Retail_Access')

CustomKeywords.fill.FillFieldsValues.set('Shortname', 'KAME415507')

CustomKeywords.click.ClickButton.click('Search')

CustomKeywords.click.DoubleClickByIndex.click(0)

while WebUI.verifyElementPresent(findTestObject('Objects-With-Variables/basicGrid', {'GridValue' : 'TestQA'}), 0, FailureHandling.OPTIONAL):
	CustomKeywords.click.ClickOnDeleteIconByColumn.click('Address', 'TestQA')

	CustomKeywords.click.ClickButton.click('Yes')

	WebUI.verifyElementNotPresent(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'TestQA\']'}), 0)

CustomKeywords.click.ClickButtonAddNew.click('Add Row')

CustomKeywords.fill.FillFieldsValues.set('Address', 'TestQA')

CustomKeywords.fill.FillFieldsValues.set('Type', 'Home')

CustomKeywords.click.ClickButton.click('Save')

CustomKeywords.click.ClickButton.click('Save')

WebUI.verifyElementVisible(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'TestQA\']'}), FailureHandling.STOP_ON_FAILURE)

WebUI.callTestCase('Wave1 (Auto Env)/Smoke/Homepage/TC-37831-Home_Logout', {}, FailureHandling.STOP_ON_FAILURE)
user='wissal.maaroufi'
(username, userpassword)=CustomKeywords.functionality.GetPassword_fromExcel.execute(user)

CustomKeywords.functionality.Login.login(username, userpassword)

CustomKeywords.functionality.NavigateToByScreen.navigate('Search_Retail_Access')

CustomKeywords.fill.FillFieldsValues.set('Shortname', 'KAME415507')

CustomKeywords.click.ClickButton.click('Search')

CustomKeywords.click.DoubleClickByIndex.click(0)

CustomKeywords.click.ClickDeleteKeyByXPath.click('//div[text()=\'TestQA\']')

WebUI.verifyElementNotPresent(findTestObject('Wave2/XPath', {'path' : '//span[contains(@id,\'button\') and text()=\'Yes\']'}),
0)

CustomKeywords.functionality.Logout.logout()

CustomKeywords.functionality.Login.login(GlobalVariable.Username, GlobalVariable.Password)

CustomKeywords.functionality.NavigateToByPath.navigateTo('Configuration,Administration,Access Management,Profiles',
False)

WebUI.setText(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Profile name'}), 'Board of Directors')

WebUI.sendKeys(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Profile name'}), Keys.ENTER)

CustomKeywords.click.DoubleClickByIndex.click(0)

WebUI.click(findTestObject('Wave2/XPath', {'path' : '//div[@class=\'x-action-col-icon x-action-col-0  x-fa fa-eye\']'}))

WebUI.setText(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Screen Reference Name'}), 'Consumer_accessright')

WebUI.sendKeys(findTestObject('Epic Grid/Input_filter_Related_Grid', {'ColumnName' : 'Screen Reference Name'}), Keys.chord(
Keys.ENTER))

WebUI.click(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'Consumer_accessright\']'}))

CustomKeywords.click.ClickButton.click('Check All')

CustomKeywords.click.ClickButton.click('Save')

CustomKeywords.functionality.NavigateToByScreen.navigate('Search_Retail_Access')

CustomKeywords.fill.FillFieldsValues.set('Shortname', 'KAME415507')

CustomKeywords.click.ClickButton.click('Search')

CustomKeywords.click.DoubleClickByIndex.click(0)

CustomKeywords.click.ClickOnDeleteIconByColumn.click('Address', 'TestQA')

CustomKeywords.click.ClickButton.click('Yes')

WebUI.verifyElementNotPresent(findTestObject('Wave2/XPath', {'path' : '//div[text()=\'TestQA\']'}), 0)