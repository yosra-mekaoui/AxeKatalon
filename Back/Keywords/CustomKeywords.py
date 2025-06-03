# Import keyword classes from the package structure
from Keywords.click.Expand import Expand
from Keywords.click.closeTab import CloseTab
from Keywords.click.clickElement import ClickElement
from Keywords.click.clickButton import ClickButton
from Keywords.click.SelectTab import SelectTab
from Keywords.click.ClickButtonAddNew import ClickButtonAddNew
from Keywords.click.DoubleClickByColumns import DoubleClickByColumns
from Keywords.click.closeTab import  CloseTab
from Keywords.click.DoubleClickByIndex import DoubleClickByIndex
from Keywords.click.DeleteByIndex import DeleteByIndex
from Keywords.click.DoubleClickElementbyXpath import DoubleClickElementByXpath
from Keywords.click.ClickCtrlKeyXCVByXPath import ClickCtrlKeyXCVByXPath
from Keywords.click.ClickDeleteKeyByXPath import ClickDeleteKeyByXPath
from Keywords.click.ClickKeyboardKeyByXPath import ClickKeyboardKeyByXPath
from Keywords.click.AddStructure import AddStructure
from Keywords.click.ClicktoScrollRight import ClicktoScrollRight
from Keywords.click.ClickCalculatedField import ClickCalculatedField
from Keywords.click.changeDisplayGridOrCard import changeDisplayGridOrCard
from Keywords.click.closeTab import CloseTab
from Keywords.click.clickElement import ClickElement
from Keywords.click.clickButton import ClickButton
from Keywords.click.SelectTab import SelectTab
from Keywords.click.ClickButtonAddNew import ClickButtonAddNew
from Keywords.click.DoubleClickByColumns import DoubleClickByColumns
from Keywords.click.closeTab import  CloseTab
from Keywords.click.DoubleClickByIndex import DoubleClickByIndex
from Keywords.click.DeleteByIndex import DeleteByIndex
from Keywords.click.DoubleClickElementbyXpath import DoubleClickElementByXpath
from Keywords.click.ClickOnDeleteIconByColumn import ClickOnDeleteIconByColumn
from Keywords.click.SelectValue import SelectValue
from Keywords.click.SimpleClickByColumns import SimpleClickByColumns
from Keywords.click.VerifyElementByColumns import VerifyElementByColumns
from Keywords.click.DragAndDropElem2Elembytext import DragAndDropElem2Elembytext
from Keywords.click.DragAndDropParent import DragAndDropParent
from Keywords.click.SelectGroupingCriteria import SelectGroupingCriteria
from Keywords.click.DragAndDropTrash import DragAndDropTrash
from Keywords.click.ClickOnDeleteIconByColumn2 import  ClickOnDeleteIconByColumn2
from Keywords.click.ClickOnDuplicateIconByColumn import ClickOnDuplicateIconByColumn
from Keywords.click.DoubleClickByColumnGridFilter import DoubleClickByColumnGridFilter
from Keywords.click.ScrollUpOrDownUntil import ScrollUpOrDownUntil
from Keywords.click.DragAndDropTrashOR import DragAndDropTrashOR
from Keywords.click.DoubleClickElementbyXpath import DoubleClickElementByXpath
from Keywords.click.Expand import Expand




from Keywords.fill.FillFieldsValues import FillFieldsValues
from Keywords.fill.FillEditorValue import FillEditorValue
from Keywords.fill.ReturnFieldsType import ReturnFieldsType
from Keywords.fill.EditTreeGridInline import EditTreeGridInline
from Keywords.fill.FillGridInLineByIndex import FillGridInLineByIndex
from Keywords.fill.FillGridInLineByIndex2 import FillGridInLineByIndex2
from Keywords.fill.FillTreeGrid import FillTreeGrid
from Keywords.fill.TreegridCheckColumnProperties import TreegridCheckColumnProperties
from Keywords.fill.FillMultiComboValues import FillMultiComboValues
from Keywords.fill.FillFieldsValues import FillFieldsValues
from Keywords.fill.FillEditorValue import FillEditorValue
from Keywords.fill.ReturnFieldsType import ReturnFieldsType
from Keywords.fill.EditTreeGridInline import EditTreeGridInline
from Keywords.fill.FillGridInLineByIndex import FillGridInLineByIndex
from Keywords.fill.FillGridInLineByIndex2 import FillGridInLineByIndex2
from Keywords.fill.FillTreeGrid import FillTreeGrid
from Keywords.fill.FillValuebyCellIndexandFieldset import FillValuebyCellIndexandFieldset

from Keywords.fill.TreegridCheckColumnProperties import TreegridCheckColumnProperties


from Keywords.functionality.Login import Login
from Keywords.functionality.Logout import Logout
from Keywords.functionality.NavigateToByScreen import NavigateToByScreen
from Keywords.functionality.NavigateToByPath import NavigateToByPath
from Keywords.functionality.GetPassword_fromExcel import GetPassword_fromExcel
from Keywords.functionality.Login import Login
from Keywords.functionality.Logout import Logout
from Keywords.functionality.NavigateToByScreen import NavigateToByScreen
from Keywords.functionality.NavigateToByPath import NavigateToByPath
from Keywords.functionality.Scroll_Down_Element import Scroll_Down_Element

from Keywords.util.Commands import Commands
from Keywords.util.FieldsetUtil import FieldsetUtil
from Keywords.util.NameValue import NameValue
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.ExecuteQuery034 import ExecuteQuery034
from Keywords.util.ExecuteQuery034Stringselect import ExecuteQuery034Stringselect
from Keywords.util.ExecuteUpdateQuery034 import ExecuteUpdateQuery034
from Keywords.util.ExecuteQuery034Strin import ExecuteQuery034Strin
from Keywords.util.ExecuteQuery034workflow import ExecuteQuery034workflow
from Keywords.util.SetTCPrioritieX import SetTCPrioritieX
from Keywords.util.ClickIcondeleteLevel import ClickIcondeleteLevel
from Keywords.util.ClickIconAddPlus import ClickIconAddPlus
from Keywords.util.Commands import Commands
from Keywords.util.FieldsetUtil import FieldsetUtil
from Keywords.util.NameValue import NameValue
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.DropdownUtil import DropdownUtil
from Keywords.util.StructureNode import StructureNode
from Keywords.util.GroupStructureUtil import GroupStructureUtil
from Keywords.util.WizardSummaryMessage import WizardSummaryMessage
from Keywords.util.GetConstantIDFromDB import GetConstantIDFromDB
from Keywords.util.UnzipSel import UnzipSel




from Keywords.action.Deletefilter import Deletefilter
from Keywords.action.UploadDoc import UploadDoc
from Keywords.action.UploadDocBulkAttachment import UploadDocBulkAttachment
from Keywords.action.SortOrUnsortGrid import SortOrUnsortGrid
from Keywords.action.DeletefilterV2optionalOrNot import DeletefilterV2optionalOrNot
from Keywords.action.AttachDocument import AttachDocument


from Keywords.check.VerifyMultiComboValue import VerifyMultiComboValue
from Keywords.check.ClosePopon import  ClosePopon
from Keywords.check.DocumentisDownloaded import DocumentisDownloaded
from Keywords.check.DocumentNotDownloaded import DocumentNotDownloaded
from Keywords.check.VerifyFieldValue import VerifyFieldValue
from Keywords.check.CheckElementInValue import CheckElementInValue
from Keywords.check.CheckDownloadedfileisdeleted import CheckDownloadedfileisdeleted
from Keywords.check.CheckCardIsDisplayed import CheckCardIsDisplayed
from Keywords.check.LineIsDisplayed import LineIsDisplayed
from Keywords.check.CheckColorHourglassDisplayed import CheckColorHourglassDisplayed
from Keywords.check.MsgIsDisplayed import MsgIsDisplayed
from Keywords.check.CheckWizardStep import CheckWizardStep
from Keywords.check.VerifyElementInExcelFile import VerifyElementInExcelFile
from Keywords.check.CheckCardIsDisplayedrelated import CheckCardIsDisplayedrelated





# Create a hierarchical structure similar to the Java package structure.



class click:
    CloseTab = CloseTab
    ClickElement = ClickElement
    ClickButton = ClickButton
    SelectTab = SelectTab
    ClickButtonAddNew = ClickButtonAddNew
    DoubleClickByColumns = DoubleClickByColumns
    DoubleClickByIndex = DoubleClickByIndex
    DeleteByIndex = DeleteByIndex
    DoubleClickElementByXpath = DoubleClickElementByXpath
    ClickCtrlKeyXCVByXPath = ClickCtrlKeyXCVByXPath
    ClickDeleteKeyByXPath = ClickDeleteKeyByXPath
    ClickKeyboardKeyByXPath = ClickKeyboardKeyByXPath
    AddStructure=AddStructure
    ClicktoScrollRight=ClicktoScrollRight
    ClickCalculatedField=ClickCalculatedField
    changeDisplayGridOrCard=changeDisplayGridOrCard
    CloseTab = CloseTab
    ClickElement = ClickElement
    ClickButton = ClickButton
    SelectTab = SelectTab
    ClickButtonAddNew = ClickButtonAddNew
    DoubleClickByColumns = DoubleClickByColumns
    DoubleClickByIndex = DoubleClickByIndex
    DeleteByIndex = DeleteByIndex
    DoubleClickElementByXpath = DoubleClickElementByXpath
    ClickOnDeleteIconByColumn = ClickOnDeleteIconByColumn
    SelectValue = SelectValue
    SimpleClickByColumns = SimpleClickByColumns
    VerifyElementByColumns = VerifyElementByColumns
    DragAndDropElem2Elembytext = DragAndDropElem2Elembytext
    DragAndDropParent = DragAndDropParent
    SelectGroupingCriteria = SelectGroupingCriteria
    DragAndDropTrash = DragAndDropTrash
    ClickOnDeleteIconByColumn2 = ClickOnDeleteIconByColumn2
    ClickOnDuplicateIconByColumn = ClickOnDuplicateIconByColumn
    DoubleClickByColumnGridFilter = DoubleClickByColumnGridFilter
    ScrollUpOrDownUntil = ScrollUpOrDownUntil
    DragAndDropTrashOR = DragAndDropTrashOR
    DoubleClickElementbyXpath=DoubleClickElementByXpath
    Expand=Expand


class fill:
    FillFieldsValues=FillFieldsValues
    FillEditorValue=FillEditorValue
    ReturnFieldsType=ReturnFieldsType
    EditTreeGridInline=EditTreeGridInline
    FillGridInLineByIndex=FillGridInLineByIndex
    FillGridInLineByIndex2=FillGridInLineByIndex2
    FillTreeGrid=FillTreeGrid
    TreegridCheckColumnProperties=TreegridCheckColumnProperties
    FillMultiComboValues = FillMultiComboValues
    FillFieldsValues=FillFieldsValues
    FillEditorValue=FillEditorValue
    ReturnFieldsType=ReturnFieldsType
    EditTreeGridInline=EditTreeGridInline
    FillGridInLineByIndex=FillGridInLineByIndex
    FillGridInLineByIndex2=FillGridInLineByIndex2
    FillTreeGrid=FillTreeGrid
    TreegridCheckColumnProperties=TreegridCheckColumnProperties
    FillValuebyCellIndexandFieldset=FillValuebyCellIndexandFieldset



class functionality:
    Login = Login
    Logout = Logout
    NavigateToByScreen = NavigateToByScreen
    NavigateToByPath = NavigateToByPath
    GetPassword_fromExcel = GetPassword_fromExcel
    Scroll_Down_Element=Scroll_Down_Element


class action:
    Deletefilter=Deletefilter
    UploadDoc=UploadDoc
    UploadDocBulkAttachment=UploadDocBulkAttachment
    SortOrUnsortGrid=SortOrUnsortGrid
    DeletefilterV2optionalOrNot = DeletefilterV2optionalOrNot
    AttachDocument = AttachDocument



class util:
    Commands = Commands
    FieldsetUtil = FieldsetUtil
    NameValue = NameValue
    TablesUtil =TablesUtil
    TablesUtil2 = TablesUtil2
    ExecuteQuery034 = ExecuteQuery034
    ExecuteQuery034Stringselect = ExecuteQuery034Stringselect
    ExecuteUpdateQuery034 = ExecuteUpdateQuery034
    ExecuteQuery034Strin = ExecuteQuery034Strin
    ExecuteQuery034workflow = ExecuteQuery034workflow
    SetTCPrioritieX = SetTCPrioritieX
    ClickIcondeleteLevel=ClickIcondeleteLevel
    ClickIconAddPlus=ClickIconAddPlus
    Commands = Commands
    FieldsetUtil = FieldsetUtil
    NameValue = NameValue
    TablesUtil =TablesUtil
    TablesUtil2 = TablesUtil2
    DropdownUtil = DropdownUtil
    StructureNode = StructureNode
    GroupStructureUtil = GroupStructureUtil
    WizardSummaryMessage=WizardSummaryMessage
    GetConstantIDFromDB = GetConstantIDFromDB
    UnzipSel =UnzipSel




class check:
    VerifyMultiComboValue = VerifyMultiComboValue
    ClosePopon = ClosePopon
    DocumentisDownloaded=DocumentisDownloaded
    DocumentNotDownloaded=DocumentNotDownloaded
    VerifyFieldValue=VerifyFieldValue
    CheckElementInValue=CheckElementInValue
    CheckDownloadedfileisdeleted=CheckDownloadedfileisdeleted
    CheckCardIsDisplayed=CheckCardIsDisplayed
    LineIsDisplayed=LineIsDisplayed
    CheckColorHourglassDisplayed=CheckColorHourglassDisplayed
    MsgIsDisplayed=MsgIsDisplayed
    CheckWizardStep=CheckWizardStep
    VerifyElementInExcelFile=VerifyElementInExcelFile
    CheckCardIsDisplayedrelated=CheckCardIsDisplayedrelated