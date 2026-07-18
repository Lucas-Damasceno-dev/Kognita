package com.kognita.dto;

import com.kognita.model.XpTransaction;
import java.time.OffsetDateTime;
import java.util.UUID;

public record XpTransactionResponse(
    UUID id,
    Integer amount,
    String source,
    String description,
    OffsetDateTime createdAt
) {
    public static XpTransactionResponse from(XpTransaction tx) {
        return new XpTransactionResponse(
            tx.getId(),
            tx.getAmount(),
            tx.getSource(),
            tx.getDescription(),
            tx.getCreatedAt()
        );
    }
}
