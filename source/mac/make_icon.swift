// Genera el icono de la app (PNG 1024x1024): swift make_icon.swift salida.png
import Cocoa

extension NSColor {
    convenience init(hex: Int, alpha: CGFloat = 1) {
        self.init(deviceRed: CGFloat((hex >> 16) & 255) / 255, green: CGFloat((hex >> 8) & 255) / 255, blue: CGFloat(hex & 255) / 255, alpha: alpha)
    }
}

let size = 1024
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon_1024.png"
guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4,
                                 hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { exit(1) }
NSGraphicsContext.saveGraphicsState()
let gctx = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.current = gctx
let ctx = gctx.cgContext
let S = CGFloat(size)
let inset: CGFloat = 100
let box = CGRect(x: inset, y: inset, width: S - inset * 2, height: S - inset * 2)
let squircle = NSBezierPath(roundedRect: box, xRadius: 186, yRadius: 186)

// sombra exterior
ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: -14), blur: 34, color: NSColor(white: 0, alpha: 0.5).cgColor)
NSColor(hex: 0x0b0d14).setFill()
squircle.fill()
ctx.restoreGState()

ctx.saveGState()
squircle.addClip()
let horizon = box.minY + box.height * 0.40
// cielo
let sky = NSGradient(colors: [NSColor(hex: 0x0a0e28), NSColor(hex: 0x3b1a5e), NSColor(hex: 0xc2456a), NSColor(hex: 0xff8a4a)],
                     atLocations: [0, 0.45, 0.8, 1], colorSpace: .deviceRGB)!
sky.draw(in: CGRect(x: box.minX, y: horizon, width: box.width, height: box.maxY - horizon), angle: -90)
// estrellas
for i in 0..<40 {
    let x = box.minX + CGFloat((i * 97) % 820)
    let y = box.maxY - CGFloat((i * 53) % 260) - 20
    NSColor(white: 1, alpha: 0.35 + CGFloat(i % 3) * 0.2).setFill()
    NSBezierPath(ovalIn: CGRect(x: x, y: y, width: 4, height: 4)).fill()
}
// sol retro con franjas
let sunC = CGPoint(x: S / 2, y: horizon + 70)
let sunR: CGFloat = 205
ctx.saveGState()
let sunPath = NSBezierPath(ovalIn: CGRect(x: sunC.x - sunR, y: sunC.y - sunR, width: sunR * 2, height: sunR * 2))
sunPath.addClip()
let sunG = NSGradient(colors: [NSColor(hex: 0xfff1a0), NSColor(hex: 0xffb347), NSColor(hex: 0xff5a5f)], atLocations: [0, 0.5, 1], colorSpace: .deviceRGB)!
sunG.draw(in: sunPath, angle: -90)
for k in 0..<6 {
    let y = sunC.y - CGFloat(k) * 26 - 10
    let hgt = CGFloat(4 + k * 3)
    NSColor(hex: 0x6a2456).setFill()
    NSBezierPath(rect: CGRect(x: sunC.x - sunR, y: y - hgt, width: sunR * 2, height: hgt)).fill()
}
ctx.restoreGState()
// resplandor
let glow = NSGradient(colors: [NSColor(hex: 0xff9a5a, alpha: 0.45), NSColor(hex: 0xff9a5a, alpha: 0)], atLocations: [0, 1], colorSpace: .deviceRGB)!
glow.draw(fromCenter: sunC, radius: 0, toCenter: sunC, radius: 420, options: [])
// montañas
func mountains(_ color: NSColor, _ base: CGFloat, _ pts: [(CGFloat, CGFloat)]) {
    let p = NSBezierPath()
    p.move(to: CGPoint(x: box.minX, y: base))
    for (x, y) in pts { p.line(to: CGPoint(x: box.minX + x * box.width, y: base + y)) }
    p.line(to: CGPoint(x: box.maxX, y: base))
    p.close()
    color.setFill()
    p.fill()
}
mountains(NSColor(hex: 0x4a2466), horizon, [(0, 60), (0.12, 140), (0.24, 70), (0.36, 170), (0.5, 90), (0.63, 190), (0.78, 80), (0.9, 150), (1, 70)])
mountains(NSColor(hex: 0x2c1646), horizon, [(0, 30), (0.1, 70), (0.22, 20), (0.34, 60), (0.46, 15), (0.6, 70), (0.74, 25), (0.88, 80), (1, 30)])
// suelo
let ground = NSGradient(colors: [NSColor(hex: 0x1c1030), NSColor(hex: 0x0e0a18)], atLocations: [0, 1], colorSpace: .deviceRGB)!
ground.draw(in: CGRect(x: box.minX, y: box.minY, width: box.width, height: horizon - box.minY), angle: -90)
// carretera en perspectiva
let vx = S / 2
func roadX(_ t: CGFloat, _ side: CGFloat, _ k: CGFloat) -> CGFloat { vx + side * (8 + (box.width * k - 8) * t) }
let bottom = box.minY
func yAt(_ t: CGFloat) -> CGFloat { horizon - (horizon - bottom) * t }
let road = NSBezierPath()
road.move(to: CGPoint(x: roadX(0, -1, 0.5), y: horizon))
road.line(to: CGPoint(x: roadX(0, 1, 0.5), y: horizon))
road.line(to: CGPoint(x: roadX(1, 1, 0.5), y: bottom))
road.line(to: CGPoint(x: roadX(1, -1, 0.5), y: bottom))
road.close()
NSColor(hex: 0x2b2e3a).setFill()
road.fill()
// pianos rojo/blanco
let n = 12
for i in 0..<n {
    let t0 = pow(CGFloat(i) / CGFloat(n), 1.8), t1 = pow(CGFloat(i + 1) / CGFloat(n), 1.8)
    for side in [-1.0, 1.0] as [CGFloat] {
        let p = NSBezierPath()
        p.move(to: CGPoint(x: roadX(t0, side, 0.5), y: yAt(t0)))
        p.line(to: CGPoint(x: roadX(t0, side, 0.58), y: yAt(t0)))
        p.line(to: CGPoint(x: roadX(t1, side, 0.58), y: yAt(t1)))
        p.line(to: CGPoint(x: roadX(t1, side, 0.5), y: yAt(t1)))
        p.close()
        (i % 2 == 0 ? NSColor(hex: 0xe8303a) : NSColor(hex: 0xf4f4f4)).setFill()
        p.fill()
    }
    if i % 2 == 0 {
        let p = NSBezierPath()
        let w0 = 3 + 16 * t0, w1 = 3 + 16 * t1
        p.move(to: CGPoint(x: vx - w0, y: yAt(t0)))
        p.line(to: CGPoint(x: vx + w0, y: yAt(t0)))
        p.line(to: CGPoint(x: vx + w1, y: yAt(t1)))
        p.line(to: CGPoint(x: vx - w1, y: yAt(t1)))
        p.close()
        NSColor(hex: 0xf4f4f4).setFill()
        p.fill()
    }
}
// logotipo
let shadow = NSShadow()
shadow.shadowColor = NSColor(white: 0, alpha: 0.55)
shadow.shadowBlurRadius = 16
shadow.shadowOffset = NSSize(width: 0, height: -6)
func draw(_ text: String, font: NSFont, color: NSColor, y: CGFloat, kern: CGFloat) {
    let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: color, .kern: kern, .shadow: shadow]
    let str = NSAttributedString(string: text, attributes: attrs)
    let sz = str.size()
    str.draw(at: CGPoint(x: (S - sz.width) / 2 + kern / 2, y: y))
}
let big = NSFont(name: "AvenirNextCondensed-HeavyItalic", size: 250) ?? NSFont.boldSystemFont(ofSize: 220)
let small = NSFont(name: "AvenirNextCondensed-HeavyItalic", size: 96) ?? NSFont.boldSystemFont(ofSize: 90)
draw("TOP", font: small, color: NSColor(hex: 0x7fcbe8), y: box.maxY - 170, kern: 26)
draw("GEAR", font: big, color: NSColor(hex: 0xf6f8fb), y: box.maxY - 420, kern: 0)
// franja de librea
func bar(_ x: CGFloat, _ w: CGFloat, _ color: NSColor) {
    let y = box.maxY - 450
    let p = NSBezierPath()
    p.move(to: CGPoint(x: x + 12, y: y + 22))
    p.line(to: CGPoint(x: x + w + 12, y: y + 22))
    p.line(to: CGPoint(x: x + w, y: y))
    p.line(to: CGPoint(x: x, y: y))
    p.close()
    color.setFill()
    p.fill()
}
bar(S / 2 - 250, 80, NSColor(hex: 0x7fcbe8))
bar(S / 2 - 150, 300, NSColor(hex: 0xff7a1a))
bar(S / 2 + 170, 80, NSColor(hex: 0x7fcbe8))
ctx.restoreGState()

// borde sutil
NSColor(white: 1, alpha: 0.12).setStroke()
squircle.lineWidth = 3
squircle.stroke()

NSGraphicsContext.restoreGraphicsState()
if let png = rep.representation(using: .png, properties: [:]) {
    try? png.write(to: URL(fileURLWithPath: out))
    print("icono: \(out)")
}
