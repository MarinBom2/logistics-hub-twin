package com.marinbom2.logisticshubtwin.member.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    /** 로그인·인증 주체 조회 */
    Optional<Member> findByEmail(String email);

    /** 가입 중복 확인. 이메일은 고객사를 넘어 전체에서 유일하다 (로그인 ID) */
    boolean existsByEmail(String email);

    /** 같은 고객사의 팀원 목록 */
    List<Member> findAllByOrganizationIdOrderByIdAsc(Long organizationId);
}
