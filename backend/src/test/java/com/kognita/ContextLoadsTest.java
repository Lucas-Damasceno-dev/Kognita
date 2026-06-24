package com.kognita;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ContextLoadsTest extends BaseIntegrationTest {

    @Test
    void contextLoads() {
        assertThat(postgres.isRunning()).isTrue();
    }
}
