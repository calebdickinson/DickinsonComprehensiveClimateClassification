"""
Dickinson Climate Classification - winter zone pattern overlay (raw 0-8)
==========================================================================
Works directly on the layer's raw winter-zone values (0-8), the
output of dickinson_winter_1981_2010 -> Polygonize. The zone -> pattern
mapping is applied here directly via rule filter expressions.

zone value -> letter -> pattern:
    0 -> Y -> diag2
    1 -> G -> diag1
    2 -> F -> none
    3 -> E -> cross
    4 -> D -> dots
    5 -> C -> diag2
    6 -> B -> diag1
    7 -> A -> none
    8 -> Z -> cross
(9 = X, 10 = H excluded -- unused in this dataset)

Run in QGIS Python Console with the layer selected as the active
layer in the Layers panel.
"""

from qgis.core import (
    QgsRuleBasedRenderer, QgsSymbol,
    QgsLinePatternFillSymbolLayer, QgsPointPatternFillSymbolLayer,
    QgsSimpleFillSymbolLayer, QgsSimpleLineSymbolLayer, QgsSimpleMarkerSymbolLayer
)
from qgis.PyQt.QtCore import Qt
from qgis.PyQt.QtGui import QColor
from qgis.utils import iface

# ---- layer / field ------------------------------------------------------
layer = iface.activeLayer()
if layer is None:
    raise RuntimeError("Select the winter-zone layer in the Layers panel first.")

field_names = [f.name() for f in layer.fields()]
FIELD_NAME = None
for candidate in ("DN", "classIndex", "DN_1"):
    if candidate in field_names:
        FIELD_NAME = candidate
        break

if FIELD_NAME is None:
    raise RuntimeError(
        f"Couldn't find a DN/classIndex field on layer '{layer.name()}'. "
        f"Fields found: {field_names}. Set FIELD_NAME manually below and re-run."
    )

print(f"Using field '{FIELD_NAME}' on layer '{layer.name()}'")

# ---- appearance -----------------------------------------------------------
PATTERN_SPACING = 2.0        # mm between hatch lines
PATTERN_LINE_WIDTH = 0.25    # mm hatch line width
DOT_SPACING = 2.5            # mm between dots
DOT_SIZE = 1.0               # mm dot diameter
PATTERN_COLOR = QColor(0, 0, 0, 102)   # black at 40% opacity (255 * 0.4 = 102)

# pattern -> which raw zone values get it
PATTERN_VALUES = {
    'cross':  [3, 8],   # E, Z
    'diag1':  [1, 6],   # G, B
    'diag2':  [0, 5],   # Y, C
    'dots':   [4],      # D
    # 2 (F), 7 (A) intentionally excluded -> no pattern
}


def make_transparent_fill_symbol():
    sym = QgsSymbol.defaultSymbol(layer.geometryType())
    fill = QgsSimpleFillSymbolLayer()
    fill.setBrushStyle(Qt.NoBrush)
    fill.setStrokeStyle(Qt.NoPen)
    sym.changeSymbolLayer(0, fill)
    return sym


def add_line_pattern(sym, angle):
    lp = QgsLinePatternFillSymbolLayer()
    lp.setLineAngle(angle)
    lp.setDistance(PATTERN_SPACING)
    sub_line = QgsSimpleLineSymbolLayer(PATTERN_COLOR, PATTERN_LINE_WIDTH)
    lp.subSymbol().changeSymbolLayer(0, sub_line)
    sym.appendSymbolLayer(lp)


def add_dot_pattern(sym):
    pp = QgsPointPatternFillSymbolLayer()
    pp.setDistanceX(DOT_SPACING)
    pp.setDistanceY(DOT_SPACING)
    marker = QgsSimpleMarkerSymbolLayer()
    marker.setColor(PATTERN_COLOR)
    marker.setStrokeStyle(Qt.NoPen)
    marker.setSize(DOT_SIZE)
    pp.subSymbol().changeSymbolLayer(0, marker)
    sym.appendSymbolLayer(pp)


def build_symbol(pattern_type):
    sym = make_transparent_fill_symbol()
    if pattern_type == 'cross':
        add_line_pattern(sym, 45)
        add_line_pattern(sym, 135)
    elif pattern_type == 'diag1':
        add_line_pattern(sym, 45)
    elif pattern_type == 'diag2':
        add_line_pattern(sym, 135)
    elif pattern_type == 'dots':
        add_dot_pattern(sym)
    return sym


# ---- build rule-based renderer --------------------------------------------
root_rule = QgsRuleBasedRenderer.Rule(None)

for pattern_type, values in PATTERN_VALUES.items():
    sym = build_symbol(pattern_type)
    rule = QgsRuleBasedRenderer.Rule(sym)
    value_list = ", ".join(str(v) for v in values)
    rule.setLabel(f"{value_list} ({pattern_type})")
    rule.setFilterExpression(f'"{FIELD_NAME}" IN ({value_list})')
    root_rule.appendChild(rule)

else_sym = make_transparent_fill_symbol()
else_rule = QgsRuleBasedRenderer.Rule(else_sym)
else_rule.setLabel("no pattern (F=2, A=7, unmatched)")
else_rule.setIsElse(True)
root_rule.appendChild(else_rule)

renderer = QgsRuleBasedRenderer(root_rule)
layer.setRenderer(renderer)
layer.triggerRepaint()

print("Pattern overlay applied to layer:", layer.name())
print("Make sure this layer sits ABOVE the paletted dickinson_climate_1981_2010 raster.")