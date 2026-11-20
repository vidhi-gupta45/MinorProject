package com.campuscare.attachment.controller;

import com.campuscare.attachment.entity.IssueAttachment;
import com.campuscare.attachment.service.AttachmentService;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attachments")
@Tag(name = "Attachments", description = "Secure file attachment viewing and download")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final UserRepository userRepository;

    public AttachmentController(AttachmentService attachmentService, UserRepository userRepository) {
        this.attachmentService = attachmentService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Securely download or view an issue attachment image")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));

        IssueAttachment metadata = attachmentService.getAttachmentMetadata(id);
        Resource fileResource = attachmentService.getAttachmentFile(id, currentUser);

        String contentType = metadata.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalFileName() + "\"")
                .body(fileResource);
    }
}
