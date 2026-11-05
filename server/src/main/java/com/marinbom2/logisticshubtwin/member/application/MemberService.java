package com.marinbom2.logisticshubtwin.member.application;

import com.marinbom2.logisticshubtwin.exception.BusinessException;
import com.marinbom2.logisticshubtwin.member.domain.Member;
import com.marinbom2.logisticshubtwin.member.domain.MemberRepository;
import com.marinbom2.logisticshubtwin.member.domain.RoleType;
import com.marinbom2.logisticshubtwin.organization.domain.Organization;
import com.marinbom2.logisticshubtwin.organization.domain.OrganizationRepository;
import com.marinbom2.logisticshubtwin.security.MemberSecurityProperties;
import com.marinbom2.logisticshubtwin.type.common.ErrorCode;
import com.marinbom2.logisticshubtwin.util.ValidationHelperUtils;
import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 가입(워크스페이스 만들기)·팀원 발급·로그아웃·조회·권한 (FR-AU-001~003, FR-OR-002). 로그인은 시큐리티 필터가 한다 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberSecurityProperties securityProperties;
    private final Clock clock;

    /**
     * FR-AU-001: 가입 = 고객사 워크스페이스 만들기. 고객사(파일럿)와 첫 관리자를 한 트랜잭션에서 만든다.
     * 회원 저장이 실패하면 고객사도 남지 않는다.
     */
    @Transactional
    public Member signUp(String organizationName, String email, String rawPassword) {
        Organization organization = organizationRepository.save(Organization.startPilot(organizationName, clock.instant()));
        Member member = create(organization.getId(), email, rawPassword, RoleType.ADMIN);
        log.info("[member] workspace created organizationId={} memberId={}", organization.getId(), member.getId());
        return member;
    }

    /** FR-OR-002: 관리자가 같은 고객사에 팀원 계정을 발급한다. 초기 비밀번호는 관리자가 전달한다 */
    @Transactional
    public Member addTeamMember(Long organizationId, String email, String rawPassword, RoleType roleType) {
        Member member = create(organizationId, email, rawPassword, roleType);
        log.info("[member] team member added organizationId={} memberId={} role={}", organizationId, member.getId(), roleType);
        return member;
    }

    @Transactional(readOnly = true)
    public List<Member> teamMembers(Long organizationId) {
        return memberRepository.findAllByOrganizationIdOrderByIdAsc(organizationId);
    }

    /** FR-AU-002: 이 계정으로 발급한 토큰을 전부 무효로 만든다 */
    @Transactional
    public void logout(Long memberId) {
        findMember(memberId).invalidateTokens();
        log.info("[member] logout memberId={}", memberId);
    }

    @Transactional(readOnly = true)
    public Member get(Long memberId) {
        return findMember(memberId);
    }

    /** FR-AU-003: 내 권한 바꾸기. security.role.self-change-allowed 가 켜진 환경(local)에서만 */
    @Transactional
    public Member changeOwnRole(Long memberId, RoleType roleType) {
        if (!securityProperties.role().selfChangeAllowed()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "이 환경에서는 권한을 직접 바꿀 수 없습니다.");
        }
        Member member = findMember(memberId);
        member.changeRole(roleType);
        log.warn("[member] self role change memberId={} role={}", memberId, roleType);
        return member;
    }

    /** 비밀번호 규칙과 이메일 중복은 가입과 팀원 발급이 같은 규칙을 쓴다 */
    private Member create(Long organizationId, String email, String rawPassword, RoleType roleType) {
        String normalized = Member.normalizeEmail(email);
        if (ValidationHelperUtils.isInValidPassword(rawPassword)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST_DATA, "비밀번호는 8~20자로, 영문과 숫자를 함께 넣어 주세요.");
        }
        if (memberRepository.existsByEmail(normalized)) {
            throw new BusinessException(ErrorCode.ALREADY_EXIST, "이미 가입된 이메일입니다.");
        }
        try {
            return memberRepository.saveAndFlush(
                    Member.create(organizationId, normalized, passwordEncoder.encode(rawPassword), roleType));
        } catch (DataIntegrityViolationException e) {
            // 같은 이메일로 동시에 가입하면 위 확인을 둘 다 통과할 수 있다. 유니크 제약이 최종 판정
            throw new BusinessException(ErrorCode.ALREADY_EXIST, "이미 가입된 이메일입니다.");
        }
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_MEMBER));
    }
}
