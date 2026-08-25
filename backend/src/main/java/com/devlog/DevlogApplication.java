package com.devlog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DevlogApplication {
    public static void main(String[] args) {
        SpringApplication.run(DevlogApplication.class, args);
    }
}
