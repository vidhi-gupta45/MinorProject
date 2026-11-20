package com.campuscare.attachment.service;

import com.campuscare.attachment.entity.AttachmentType;
import com.campuscare.attachment.entity.IssueAttachment;
import com.campuscare.attachment.repository.IssueAttachmentRepository;
import com.campuscare.common.exception.AccessDeniedCustomException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.entity.Issue;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AttachmentService {

    private final StorageService storageService;
    private final IssueAttachmentRepository attachmentRepository;

    public AttachmentService(StorageService storageService, IssueAttachmentRepository attachmentRepository) {
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
    }

    @Transactional
    public IssueAttachment uploadAttachment(Issue issue, User uploader, MultipartFile file, AttachmentType type) {
        String subDirectory = "issues/" + issue.getId();
        String storageKey = storageService.storeFile(file, subDirectory);

        IssueAttachment attachment = new IssueAttachment(
                issue,
                uploader,
                storageKey,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                type
        );

        return attachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public Resource getAttachmentFile(Long attachmentId, User currentUser) {
        IssueAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        Issue issue = attachment.getIssue();

        // Enforce access control
        boolean isReporter = issue.getReporter().getId().equals(currentUser.getId());
        boolean isAssignee = issue.getAssignedTo() != null && issue.getAssignedTo().getId().equals(currentUser.getId());
        boolean isHod = currentUser.getRole() == Role.ROLE_HOD &&
                currentUser.getDepartment() != null &&
                currentUser.getDepartment().getId().equals(issue.getDepartment().getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;

        if (!isReporter && !isAssignee && !isHod && !isAdmin) {
            throw new AccessDeniedCustomException("You do not have permission to view or download this attachment");
        }

        return storageService.loadFileAsResource(attachment.getStorageKey());
    }

    @Transactional(readOnly = true)
    public IssueAttachment getAttachmentMetadata(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));
    }
}
