class StructureNode:
    def __init__(self, name: str = "", transform_x: str = "", transform_y: str = ""):
        self.name = name
        self.transform_x = transform_x
        self.transform_y = transform_y

    def __repr__(self):
        return f"StructureNode(name={self.name}, transform_x={self.transform_x}, transform_y={self.transform_y})"
