// Top Gear · Supercar Legends — lanzador nativo para macOS
// Muestra el juego HTML en una ventana propia (WebKit) y guarda la partida en disco.
import Cocoa
import WebKit
import UniformTypeIdentifiers

final class GameWindow: NSWindow {
    // Evita el pitido del sistema con teclas que la web ya ha gestionado
    override func noResponder(for eventSelector: Selector) {
        if eventSelector == #selector(NSResponder.keyDown(with:)) { return }
        super.noResponder(for: eventSelector)
    }
}

final class GameWebView: WKWebView {
    override var acceptsFirstResponder: Bool { true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate, NSWindowDelegate {
    var window: GameWindow!
    var webView: GameWebView!

    lazy var saveURL: URL = {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("TopGear Supercar Legends", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("partida.json")
    }()
    lazy var backupURL: URL = saveURL.deletingLastPathComponent().appendingPathComponent("partida.bak.json")
    var backedUp = false

    // Convierte un texto en un literal de JavaScript seguro
    func jsLiteral(_ str: String) -> String? {
        guard let json = try? JSONSerialization.data(withJSONObject: [str]), let lit = String(data: json, encoding: .utf8) else { return nil }
        return lit + "[0]"
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        let config = WKWebViewConfiguration()
        let ucc = WKUserContentController()
        ucc.add(self, name: "tgSave")
        ucc.add(self, name: "tgApp")
        var boot = "window.__TG_NATIVE = true;"
        if let data = try? Data(contentsOf: saveURL), let str = String(data: data, encoding: .utf8), let lit = jsLiteral(str) {
            boot += "window.__TG_NATIVE_SAVE = \(lit);"
        }
        if let data = try? Data(contentsOf: backupURL), let str = String(data: data, encoding: .utf8), let lit = jsLiteral(str) {
            boot += "window.__TG_NATIVE_BAK = \(lit);"
        }
        ucc.addUserScript(WKUserScript(source: boot, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = ucc
        config.mediaTypesRequiringUserActionForPlayback = []
        if #available(macOS 12.3, *) { config.preferences.isElementFullscreenEnabled = true }

        let visible = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let w = min(1440, visible.width * 0.9)
        let h = min(860, visible.height * 0.9)
        let rect = NSRect(x: 0, y: 0, width: w, height: h)
        window = GameWindow(contentRect: rect, styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Top Gear · Supercar Legends"
        window.backgroundColor = NSColor(red: 0.03, green: 0.03, blue: 0.045, alpha: 1)
        window.collectionBehavior = [.fullScreenPrimary]
        window.minSize = NSSize(width: 960, height: 600)
        window.delegate = self
        window.center()
        window.setFrameAutosaveName("TopGearMainWindow")

        webView = GameWebView(frame: rect, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.allowsMagnification = false
        webView.allowsBackForwardNavigationGestures = false
        if #available(macOS 13.3, *) { webView.isInspectable = true }
        window.contentView = webView

        if let res = Bundle.main.resourceURL {
            let dir = res.appendingPathComponent("game", isDirectory: true)
            webView.loadFileURL(dir.appendingPathComponent("index.html"), allowingReadAccessTo: dir)
        }
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(webView)
        NSApp.activate(ignoringOtherApps: true)
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? String else { return }
        if message.name == "tgSave" {
            // copia de seguridad de la partida anterior (una vez por sesión)
            if !backedUp, FileManager.default.fileExists(atPath: saveURL.path) {
                try? FileManager.default.removeItem(at: backupURL)
                try? FileManager.default.copyItem(at: saveURL, to: backupURL)
                backedUp = true
            }
            try? body.data(using: .utf8)?.write(to: saveURL, options: .atomic)
        } else if message.name == "tgApp" {
            if body.hasPrefix("export:") {
                exportSave(String(body.dropFirst(7)))
                return
            }
            switch body {
            case "import": importSave()
            case "fullscreen": window.toggleFullScreen(nil)
            case "quit": NSApp.terminate(nil)
            case "ready":
                window.makeFirstResponder(webView)
                if ProcessInfo.processInfo.environment["TG_LOG"] != nil { print("TG_READY") }
            default: break
            }
        }
    }

    // Exportar la partida a un archivo elegido por el usuario
    func exportSave(_ text: String) {
        let panel = NSSavePanel()
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        panel.nameFieldStringValue = "TopGear-partida-\(f.string(from: Date())).json"
        panel.allowedContentTypes = [.json]
        panel.beginSheetModal(for: window) { resp in
            guard resp == .OK, let url = panel.url else { return }
            try? text.data(using: .utf8)?.write(to: url, options: .atomic)
        }
    }

    // Importar una partida desde un archivo .json
    func importSave() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.json]
        panel.allowsMultipleSelection = false
        panel.beginSheetModal(for: window) { [weak self] resp in
            guard let self = self, resp == .OK, let url = panel.url,
                  let data = try? Data(contentsOf: url), let str = String(data: data, encoding: .utf8), let lit = self.jsLiteral(str) else { return }
            self.webView.evaluateJavaScript("TG.UI.importDone(TG.Save.importText(\(lit)))", completionHandler: nil)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        window.makeFirstResponder(webView)
        // Diagnóstico opcional: TG_EVAL="código js" (y TG_QUIT=1 para cerrar después)
        let env = ProcessInfo.processInfo.environment
        if let js = env["TG_EVAL"] {
            let delay = Double(env["TG_EVAL_DELAY"] ?? "") ?? 2.0
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                webView.evaluateJavaScript(js) { result, error in
                    print("TG_EVAL_RESULT \(result.map { "\($0)" } ?? "nil") \(error.map { "ERROR \($0)" } ?? "")")
                    fflush(stdout)
                    if env["TG_QUIT"] != nil {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { NSApp.terminate(nil) }
                    }
                }
            }
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    func windowDidBecomeKey(_ notification: Notification) {
        window.makeFirstResponder(webView)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    private func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem()
        main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Acerca de Top Gear", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Ocultar Top Gear", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Salir de Top Gear", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let viewItem = NSMenuItem()
        main.addItem(viewItem)
        let viewMenu = NSMenu(title: "Visualización")
        let fs = NSMenuItem(title: "Pantalla completa", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fs.keyEquivalentModifierMask = [.command, .control]
        viewMenu.addItem(fs)
        viewItem.submenu = viewMenu

        let winItem = NSMenuItem()
        main.addItem(winItem)
        let winMenu = NSMenu(title: "Ventana")
        winMenu.addItem(withTitle: "Minimizar", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        winItem.submenu = winMenu
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
