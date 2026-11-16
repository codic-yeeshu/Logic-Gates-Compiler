"""Regenerate the vector schematic used in the report (requires reportlab)."""
from pathlib import Path
from reportlab.pdfgen import canvas

out = Path(__file__).with_name('circuit-example.pdf')
c = canvas.Canvas(str(out), pagesize=(440, 200))
c.setTitle('Worked example: out = (a AND b) OR NOT c')
c.setAuthor('Logic Lab')
c.setLineWidth(1.5)
c.setFont('Helvetica', 12)

def wire(points):
    path = c.beginPath()
    path.moveTo(*points[0])
    for point in points[1:]:
        path.lineTo(*point)
    c.drawPath(path)

for name, y in [('a', 165), ('b', 105), ('c', 35)]:
    c.drawString(12, y - 4, name)
    c.circle(37, y, 2.5, fill=1)
wire([(37, 165), (100, 165), (100, 155), (140, 155)])
wire([(37, 105), (90, 105), (90, 125), (140, 125)])
# AND: flat left side and rounded right side.
p = c.beginPath()
p.moveTo(140, 112)
p.lineTo(168, 112)
p.curveTo(205, 112, 205, 168, 168, 168)
p.lineTo(140, 168)
p.close()
c.drawPath(p, fill=0)
c.drawCentredString(166, 92, 'AND')
# NOT: triangle with output inversion bubble.
wire([(37, 35), (140, 35)])
p = c.beginPath()
p.moveTo(140, 10)
p.lineTo(140, 60)
p.lineTo(190, 35)
p.close()
c.drawPath(p, fill=0)
c.circle(195, 35, 5)
c.drawCentredString(163, 72, 'NOT')
# OR: curved input and pointed output.
p = c.beginPath()
p.moveTo(280, 70)
p.curveTo(320, 70, 341, 84, 355, 105)
p.curveTo(341, 126, 320, 140, 280, 140)
p.curveTo(297, 118, 297, 92, 280, 70)
p.close()
c.drawPath(p, fill=0)
wire([(196, 140), (240, 140), (240, 121), (290, 121)])
wire([(200, 35), (250, 35), (250, 89), (290, 89)])
c.drawCentredString(315, 52, 'OR')
wire([(355, 105), (390, 105)])
c.circle(390, 105, 2.5, fill=1)
c.drawString(398, 101, 'out')
c.showPage()
c.save()
print(out)
