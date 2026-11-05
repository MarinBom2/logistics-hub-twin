package com.marinbom2.logisticshubtwin.member.domain;

import com.marinbom2.logisticshubtwin.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * 회원이자 인증 주체(UserDetails). 로그인 ID 는 이메일, 권한은 RoleType 이름.
 * 회원은 고객사(Organization) 하나에 속하고, 그 고객사의 데이터만 본다.
 * 비밀번호 해시가 있어 API 응답으로 직접 내보내지 않는다.
 */
@Getter
@Entity
@Table(name = "member", uniqueConstraints = @UniqueConstraint(name = "uk_member_email", columnNames = "email"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소속 고객사. 모든 조회의 테넌트 키다 */
    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(nullable = false, length = 100)
    private String email;

    /** PasswordEncoder 로 만든 해시 ({bcrypt}...). 원문을 넣지 않는다 */
    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 20)
    private RoleType roleType;

    /** 발급한 토큰의 버전. 올리면 그 전에 발급한 토큰이 전부 무효가 된다 */
    @Column(name = "token_version", nullable = false)
    private int tokenVersion;

    /**
     * 회원 만들기. 워크스페이스를 만든 사람은 ADMIN, 관리자가 발급한 팀원은 고른 권한으로 시작한다.
     *
     * @param encodedPassword PasswordEncoder 로 만든 해시
     */
    public static Member create(Long organizationId, String email, String encodedPassword, RoleType roleType) {
        Member member = new Member();
        member.organizationId = organizationId;
        member.email = normalizeEmail(email);
        member.password = encodedPassword;
        member.roleType = roleType;
        member.tokenVersion = 0;
        return member;
    }

    /** 가입·로그인에서 같은 규칙으로 이메일을 맞춘다 (앞뒤 공백 제거, 소문자) */
    public static String normalizeEmail(String rawEmail) {
        return rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    /** 지금까지 발급한 토큰을 전부 무효로 만든다 (로그아웃, 강제 로그아웃) */
    public void invalidateTokens() {
        this.tokenVersion++;
    }

    public boolean isCurrentTokenVersion(int version) {
        return this.tokenVersion == version;
    }

    public void changeRole(RoleType roleType) {
        this.roleType = roleType;
    }

    // ---- UserDetails ----

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(roleType.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }
}
