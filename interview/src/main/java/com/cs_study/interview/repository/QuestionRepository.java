package com.cs_study.interview.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.cs_study.interview.entity.QuestionEntity;

public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
	
	@Query(value = """
            SELECT
                q.id AS questionId,
                q.question AS questionText,
                q.category_id AS categoryId,
                c.name AS categoryName,
                q.add_date AS addDate,
                a.id AS answerId,
                a.answer AS myAnswer
            FROM question q
            LEFT JOIN category c ON c.id = q.category_id
            LEFT JOIN answer a ON a.question_id = q.id AND a.user_id = :userId
            ORDER BY q.id
            """, nativeQuery = true)
    List<QuestionManageRow> findForManageByUserId(long userId);
	
	Optional<QuestionEntity> findFirstByQuestionOrderByIdAsc(String question);
	
	@Query("""
            select q.question
            from QuestionEntity q
            where q.id in :ids
            order by q.id
            """)
    List<String> findQuestionsByIdsOrdered(List<Long> ids);
}
