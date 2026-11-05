package com.marinbom2.logisticshubtwin.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 화면 경로를 새로고침·직접 열면 React 의 index.html 을 준다 (client/src/routes.ts 와 같은 경로).
 * /api/**, /assets/**, /actuator/** 와 확장자 있는 경로는 넣지 않는다. 없는 JS 가 index.html 로 200 응답되면 MIME 오류가 난다 (md/runtime-structure.md §6).
 */
@Controller
public class SpaForwardController {

    @GetMapping({"/centers/{centerId}", "/login"})
    public String forward() {
        return "forward:/index.html";
    }
}
