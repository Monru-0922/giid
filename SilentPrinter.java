import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.util.*;
import java.nio.file.Files;

public class SilentPrinter {
    // 統一設定路徑，避免下載不到
    private static final String DOWNLOAD_PATH = "/Users/zhangmengru/Desktop/goodmodel/downloads";
    private static List<String> currentSessionFiles = Collections.synchronizedList(new ArrayList<>());

    public static void main(String[] args) throws IOException {
        // 確保目錄存在
        File dir = new File(DOWNLOAD_PATH);
        if (!dir.exists()) dir.mkdirs();

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // 1. 處理存檔 (已移除自動列印)
        server.createContext("/print", new PrintHandler());
        
        // 2. 讓手機下載照片
        server.createContext("/downloads/", new DownloadHandler());
        
        // 3. 公佈欄
        server.createContext("/list", exchange -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String response = String.join(",", currentSessionFiles);
            exchange.sendResponseHeaders(200, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });

        // 4. 清除清單
        server.createContext("/clear", exchange -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            currentSessionFiles.clear();
            String response = "Cleared";
            exchange.sendResponseHeaders(200, response.length());
            exchange.getResponseBody().write(response.getBytes());
            exchange.getResponseBody().close();
        });

        server.setExecutor(null);
        server.start();
        System.out.println("✅ 伺服器啟動！目前存檔路徑: " + DOWNLOAD_PATH);
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

                // 取得 ID (例如 ?id=123)
                String query = exchange.getRequestURI().getQuery();
                String userId = (query != null && query.contains("id=")) ? query.split("id=")[1] : String.valueOf(System.currentTimeMillis());
                
                String fileName = "photo_" + userId + "_" + System.currentTimeMillis() + ".jpg";
                File targetFile = new File(DOWNLOAD_PATH, fileName);
                Files.write(targetFile.toPath(), imageBytes);

                if (currentSessionFiles.size() >= 4) currentSessionFiles.remove(0);
                currentSessionFiles.add(fileName);

                // --- 這裡絕對不要呼叫 printImage(img) ---
                
                exchange.sendResponseHeaders(200, fileName.length());
                exchange.getResponseBody().write(fileName.getBytes());
                exchange.getResponseBody().close();
                System.out.println("💾 已存檔 (未列印): " + fileName);
            } catch (Exception e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, 0);
            }
        }
    }

    static class DownloadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String path = exchange.getRequestURI().getPath();
            String fileName = path.substring(path.lastIndexOf("/") + 1);
            
            // 修正：使用統一的 DOWNLOAD_PATH 讀取檔案
            File file = new File(DOWNLOAD_PATH, fileName);
            
            if (file.exists()) {
                exchange.getResponseHeaders().add("Content-Type", "image/jpeg");
                exchange.sendResponseHeaders(200, file.length());
                Files.copy(file.toPath(), exchange.getResponseBody());
            } else {
                exchange.sendResponseHeaders(404, 0);
                System.out.println("❌ 找不到檔案: " + file.getAbsolutePath());
            }
            exchange.close();
        }
    }
}