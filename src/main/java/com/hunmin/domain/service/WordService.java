package com.hunmin.domain.service;

import com.hunmin.domain.dto.page.WordPageRequestDTO;
import com.hunmin.domain.dto.word.WordRequestDTO;
import com.hunmin.domain.dto.word.WordResponseDTO;
import com.hunmin.domain.entity.Member;
import com.hunmin.domain.entity.MemberRole;
import com.hunmin.domain.entity.Word;
import com.hunmin.domain.exception.MemberException;
import com.hunmin.domain.exception.WordException;
import com.hunmin.domain.repository.MemberRepository;
import com.hunmin.domain.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class WordService {
    private final WordRepository wordRepository;
    private final MemberRepository memberRepository;
    private Member getMember(String username) {
        Member member = memberRepository.findByEmail(username);
        if (member == null) {
            throw MemberException.NOT_FOUND.get();
        }
        return member;
    }

    // 단어 등록
    public WordResponseDTO createWord(WordRequestDTO wordRequestDTO, String username) {
        Member member = getMember(username);

        if (!member.getMemberRole().equals(MemberRole.ADMIN)){
            throw WordException.MEMBER_NOT_VALID.get();
        }
        try {
            Word word = wordRequestDTO.toEntity(member);
            Word saveWord = wordRepository.save(word);

            return new WordResponseDTO(saveWord);
        } catch (Exception e) {
            log.error("createNotice error: {}",  e.getMessage());
            throw WordException.WORD_NOT_CREATED.get();
        }
    }

    // 단어 수정
    public WordResponseDTO updateWord(WordRequestDTO wordRequestDTO, String title, String lang, String username) {
        Member member = getMember(username);

        if (!member.getMemberRole().equals(MemberRole.ADMIN)) {
            throw WordException.MEMBER_NOT_VALID.get();
        }

        // title과 lang 조합으로 단어 조회
        Word word = wordRepository.findByTitleAndLang(title, lang).orElseThrow(WordException.WORD_NOT_FOUND::get);

        try {
            // 속성 수정
            word.changeWord(wordRequestDTO.getTitle()); // 새로운 제목으로 변경
            word.changeLang(wordRequestDTO.getLang());   // 새로운 언어로 변경
            word.changeTranslation(wordRequestDTO.getTranslation()); // 새로운 번역으로 변경
            word.changeDefinition(wordRequestDTO.getDefinition()); // 새로운 정의로 변경

            wordRepository.save(word); // 업데이트 반영
            return new WordResponseDTO(word);
        } catch (Exception e) {
            log.error("updateWord error: {}", e.getMessage());
            throw WordException.WORD_NOT_UPDATED.get();
        }
    }

    // 단어 삭제
    public boolean deleteWordByTitleAndLang(String title, String lang, String username) {
        Member member = getMember(username);

        // 관리자가 아닐경우 예외 발생
        if (!member.getMemberRole().equals(MemberRole.ADMIN)) {
            throw WordException.MEMBER_NOT_VALID.get();
        }

        // title과 lang 조합으로 단어 조회

        Word word = wordRepository.findByTitleAndLang(title, lang).orElseThrow(WordException.WORD_NOT_FOUND::get);

        try {
            // 단어 삭제
            wordRepository.delete(word);
            return true;

        } catch (Exception e) {
            log.error("deleteWord error: {}", e.getMessage());
            throw WordException.WORD_NOT_DELETED.get(); // 삭제 실패 시 예외 발생
        }
    }

    // 단어 조회
    public WordResponseDTO getWordByTitleAndLang(String title, String lang) {
        // title과 lang 조합으로 단어 찾기
        Word word = wordRepository.findByTitleAndLang(title, lang).orElseThrow(WordException.WORD_NOT_FOUND::get);

        return new WordResponseDTO(word);
    }

    // 전체 단어 조회
    public Page<WordResponseDTO> getAllWords(WordPageRequestDTO wordPageRequestDTO, String lang) {
        Pageable pageable = wordPageRequestDTO.getPageable(Sort.by("title")); // 기본 정렬 기준 설정
        Page<Word> words;

        // 언어가 null이거나 비어있을 경우 모든 언어의 단어 반환
        if (lang == null || lang.isEmpty()) {
            words = wordRepository.findAll(pageable);
        } else {
            words = wordRepository.findByLang(lang, pageable); // 선택된 언어의 단어 반환
        }

        // Page<Word>를 Page<WordResponseDTO>로 변환하여 반환
        return words.map(WordResponseDTO::new);
    }
}
