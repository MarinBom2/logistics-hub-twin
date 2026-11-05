package com.marinbom2.logisticshubtwin;

import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 배치 앱. 루트 패키지에 둬서 common:core 의 엔티티·리포지토리·설정까지 스캔한다.
 * 배치 작업(이벤트 이력 보관 기간 정리, 시간대별 KPI 집계)은 com.marinbom2.logisticshubtwin.batch.* 아래에 둔다.
 * 설정은 common:core 의 application.yml 을 같이 쓰고, 모듈별 값은 여기서 기본값으로 넣는다.
 */
@SpringBootApplication
public class BatchApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BatchApplication.class);
        app.setDefaultProperties(Map.of(
                "spring.application.name", "logistics-hub-twin-batch",
                // 배치 메타 테이블(BATCH_*)을 없으면 만든다. 웹 서버는 띄우지 않는다
                "spring.batch.jdbc.initialize-schema", "always",
                "spring.main.web-application-type", "none"));
        app.run(args);
    }

}
