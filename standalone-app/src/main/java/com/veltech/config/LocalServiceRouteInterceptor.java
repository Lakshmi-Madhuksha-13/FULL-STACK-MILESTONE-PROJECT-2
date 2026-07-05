package com.veltech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.support.HttpRequestWrapper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;

@Component
public class LocalServiceRouteInterceptor implements ClientHttpRequestInterceptor {

    @Value("${server.port:8080}")
    private int port;

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        URI originalUri = request.getURI();
        String host = originalUri.getHost();
        
        // Rewrite microservices host names to target the same monolith instance locally
        if ("user-service".equals(host) || "event-service".equals(host) || "booking-service".equals(host)) {
            URI newUri = UriComponentsBuilder.fromUri(originalUri)
                    .scheme("http")
                    .host("localhost")
                    .port(port)
                    .build(true)
                    .toUri();
            
            HttpRequest newRequest = new HttpRequestWrapper(request) {
                @Override
                public URI getURI() {
                    return newUri;
                }
            };
            return execution.execute(newRequest, body);
        }
        return execution.execute(request, body);
    }
}
