import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.awt.*;
import java.awt.print.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.util.*;
import java.util.List;
import java.nio.file.Files;
import javax.print.PrintService;
import javax.print.PrintServiceLookup;

public class SilentPrinter {
    // 建立一個清單來記住最近的四張照片檔名
    private static List<String> currentSessionFiles = Collections.synchronizedList(new ArrayList<>());

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // 1. 處理列印與存檔
        server.createContext("/print", new PrintHandler());
        
        // 2. 讓手機下載照片檔案
        server.createContext("/downloads/", new DownloadHandler());
        
        // 3. 【新增】公佈欄：告訴手機現在有哪些照片
        server.createContext("/list", exchange -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String response = String.join(",", currentSessionFiles);
            exchange.sendResponseHeaders(200, response.length());
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
            System.out.println("📋 已提供清單給手機: " + response);
        });

        // 4. 【新增】清除清單：結束體驗時呼叫
        server.createContext("/clear", exchange -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            currentSessionFiles.clear();
            String response = "Cleared";
            exchange.sendResponseHeaders(200, response.length());
            exchange.getResponseBody().write(response.getBytes());
            exchange.getResponseBody().close();
            System.out.println("🧹 清單已重置");
        });

        server.setExecutor(null);
        server.start();
        System.out.println("✅ 離線照片伺服器已啟動！");
    }

    static class PrintHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes());
                String base64Data = body.substring(body.indexOf(",") + 1);
                byte[] imageBytes = Base64.getDecoder().decode(base64Data);

                String fileName = "photo_" + System.currentTimeMillis() + ".jpg";
                File dir = new File("downloads");
                if (!dir.exists()) dir.mkdir();
                Files.write(new File(dir, fileName).toPath(), imageBytes);

                // 【關鍵】存入清單，如果超過四張就刪掉最舊的
                if (currentSessionFiles.size() >= 4) currentSessionFiles.remove(0);
                currentSessionFiles.add(fileName);

                BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageBytes));
                if (img != null) printImage(img);
                
                exchange.sendResponseHeaders(200, fileName.length());
                exchange.getResponseBody().write(fileName.getBytes());
                exchange.getResponseBody().close();
                System.out.println("💾 存檔並加入清單: " + fileName);
            } catch (Exception e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, 0);
            }
        }
    }

    // --- 保留原本的 printImage 和 DownloadHandler ---
    private static void printImage(BufferedImage img) {
        PrinterJob job = PrinterJob.getPrinterJob();
        PageFormat pf = job.defaultPage();
        Paper paper = new Paper();
        paper.setSize(288, 432); 
        paper.setImageableArea(0, 0, 288, 432); 
        pf.setPaper(paper);
        pf.setOrientation(PageFormat.PORTRAIT);
        job.setPrintable((Graphics g, PageFormat format, int pageIndex) -> {
            if (pageIndex > 0) return Printable.NO_SUCH_PAGE;
            Graphics2D g2d = (Graphics2D) g;
            g2d.translate(format.getImageableX(), format.getImageableY());
            g2d.drawImage(img, 0, 0, (int)format.getWidth(), (int)format.getHeight(), null);
            return Printable.PAGE_EXISTS;
        }, pf);
        try {
            PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
            for (PrintService s : services) {
                if (s.getName().toLowerCase().contains("g3030")) { job.setPrintService(s); break; }
            }
            job.print();
        } catch (PrinterException e) { System.err.println(e.getMessage()); }
    }

    static class DownloadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String path = exchange.getRequestURI().getPath();
            String fileName = path.substring(path.lastIndexOf("/") + 1);
            File file = new File("downloads", fileName);
            if (file.exists()) {
                exchange.getResponseHeaders().add("Content-Type", "image/jpeg");
                exchange.sendResponseHeaders(200, file.length());
                Files.copy(file.toPath(), exchange.getResponseBody());
            } else { exchange.sendResponseHeaders(404, 0); }
            exchange.close();
        }
    }
}