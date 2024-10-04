package com.hunmin.domain.dto.word;

import com.hunmin.domain.entity.Word;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
public class WordRequestDTO {

    private Long wordId;

    @NotNull
    private Long memberId;

    @NotEmpty(message = "명칭은 필수 입력값입니다.")
    private String title;

    @NotEmpty(message = "번역은 필수 입력값입니다.")
    private String translation;

    @NotEmpty(message = "정의는 필수 입력값입니다.")
    private String definition;

    @NotEmpty(message = "언어는 필수 입력값입니다.")
    private String lang;

    public Word toEntity() {
        return Word.builder()
                .wordId(wordId)
                .title(title)
                .translation(translation)
                .definition(definition)
                .lang(lang)
                .build();
    }
}