package com.campuscare.comment.repository;

import com.campuscare.comment.entity.CommentVisibility;
import com.campuscare.comment.entity.IssueComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueCommentRepository extends JpaRepository<IssueComment, Long> {
    List<IssueComment> findAllByIssueIdOrderByCreatedAtAsc(Long issueId);
    List<IssueComment> findAllByIssueIdAndVisibilityOrderByCreatedAtAsc(Long issueId, CommentVisibility visibility);
}
