package com.tess.service;

import com.tess.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${tess.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_CV_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/jpg"
    );

    public String storeFile(MultipartFile file, String subfolder) {
        try {
            Path uploadPath = Paths.get(uploadDir, subfolder);
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedFilename = UUID.randomUUID().toString() + extension;
            Path targetPath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return subfolder + "/" + storedFilename;
        } catch (IOException ex) {
            log.error("Failed to store file: {}", ex.getMessage());
            throw new BadRequestException("Failed to store file: " + ex.getMessage());
        }
    }

    public String storeCv(MultipartFile file) {
        if (!ALLOWED_CV_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("CV must be PDF or Word document");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new BadRequestException("CV file size must not exceed 10MB");
        }
        return storeFile(file, "cvs");
    }

    public String storeStudentId(MultipartFile file) {
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType()) &&
            !file.getContentType().equals("application/pdf")) {
            throw new BadRequestException("Student ID must be an image or PDF");
        }
        return storeFile(file, "student-ids");
    }

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete file {}: {}", filePath, ex.getMessage());
        }
    }

    public byte[] loadFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            return Files.readAllBytes(path);
        } catch (IOException ex) {
            throw new BadRequestException("File not found: " + filePath);
        }
    }
}
