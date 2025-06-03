from typing import List, Optional
from dataclasses import dataclass
from Keywords.util.NameValue import NameValue

@dataclass
class WizardSummaryMessage:
    """
    Represents a wizard summary message with its details.

    Attributes:
        text (Optional[str]): The main text of the message
        main_value (Optional[str]): The primary value associated with the message
        details (List[NameValue]): List of key-value pairs for additional details
    """
    text: Optional[str] = None
    main_value: Optional[str] = None
    details: List[NameValue] = None

    def __post_init__(self):
        """Initialize the details list if not provided."""
        if self.details is None:
            self.details = []