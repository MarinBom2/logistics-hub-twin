package com.marinbom2.logisticshubtwin;

import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API 서버 앱. 루트 패키지에 둬서 common:core 의 엔티티·리포지토리·설정까지 스캔한다.
 * 설정은 common:core 의 application.yml 하나를 server·batch 가 같이 쓰고, 모듈별 값은 여기서 기본값으로 넣는다.
 */
@SpringBootApplication
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ServerApplication.class);
        app.setDefaultProperties(Map.of("spring.application.name", "logistics-hub-twin"));
        app.run(args);
    }

}
