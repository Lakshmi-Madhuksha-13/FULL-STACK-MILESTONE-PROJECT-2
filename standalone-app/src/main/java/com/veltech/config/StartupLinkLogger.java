package com.veltech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

@Component
public class StartupLinkLogger implements ApplicationListener<ApplicationReadyEvent> {

    @Value("${server.port:8080}")
    private int port;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String localUrl = "http://localhost:" + port + "/";
        String networkIp = getNetworkIp();
        String networkUrl = "http://" + networkIp + ":" + port + "/";

        System.out.println("\n");
        System.out.println("  ===============================================================");
        System.out.println("  🚀  Technical Fest Standalone Application is ready!");
        System.out.println("  ---------------------------------------------------------------");
        System.out.println("  👉  Local Server URL:   " + localUrl);
        if (!"127.0.0.1".equals(networkIp)) {
            System.out.println("  👉  Network (Mobile):   " + networkUrl);
        }
        System.out.println("  ===============================================================\n");
    }

    private String getNetworkIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) {
                    continue;
                }
                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address) {
                        if (addr.isSiteLocalAddress()) {
                            return addr.getHostAddress();
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return "127.0.0.1";
    }
}
