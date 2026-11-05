package com.marinbom2.logisticshubtwin.util;

import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ValidationHelperUtils {

    /** 비밀번호 8~20자. 영문·숫자를 모두 넣고 특수문자는 선택 */
    private static final Pattern PASSWORD = Pattern.compile(
            "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@#$%^&+=!~*()_\\-{}\\[\\]:;\"'<>,.?/\\\\]{8,20}$");

    public static boolean isInValidPassword(String password) {
        return password == null || !PASSWORD.matcher(password).matches();
    }
}
