package com.hunmin.domain.repository;

import com.hunmin.domain.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardRepository extends JpaRepository<Board, Long> {
    //회원 별 작성글 목록 조회
    @Query("SELECT b FROM Board b WHERE b.member.memberId = :memberId")
    Page<Board> findByMemberId(@Param("memberId") Long memberId, Pageable pageable);
}